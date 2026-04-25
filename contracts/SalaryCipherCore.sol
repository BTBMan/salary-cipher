// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {FHE, ebool, euint128, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/* Interfaces ****/
import {ICompanyRegistry} from "./interfaces/ICompanyRegistry.sol";
import {ISalaryCipherCore} from "./interfaces/ISalaryCipherCore.sol";

/* Libraries *****/
import {DateTimeLib} from "solady/src/utils/DateTimeLib.sol";

/**
 * @title SalaryCipherCore
 * @author BTBMan
 * @notice This is a Salary Cipher Core contract
 * @dev This contract is used to manage the encryption and decryption of salary data
 */
contract SalaryCipherCore is ISalaryCipherCore, ZamaEthereumConfig {
    using DateTimeLib for uint256;

    // Used for prorated settlement based on a 30-day payroll month.
    uint128 private constant PAYROLL_PERIOD_SECONDS = 30 days;
    // Temporary fixed threshold used by audit finalization.
    uint128 private constant GAP_THRESHOLD_MULTIPLE = 3;

    // Deployment-time admin used for one-off system configuration.
    address public immutable admin;
    // External registry used for all company and role checks.
    ICompanyRegistry public immutable companyRegistry;
    // Contract allowed to request encrypted salary condition checks.
    address public salaryProofAddress;

    // Encrypted bookkeeping balance maintained per company.
    mapping(uint256 companyId => euint128 balance) public companyBalance;
    // Encrypted monthly salary stored per company member.
    mapping(uint256 companyId => mapping(address account => euint128 salary))
        public monthlySalary;
    // Encrypted accumulated payout waiting to be claimed by each member.
    mapping(uint256 companyId => mapping(address account => euint128 payout))
        public pendingPayout;
    // Company-level payroll schedule config.
    mapping(uint256 companyId => PayrollConfig config) public payrollConfigs;
    // Plain payout destination chosen by each member.
    mapping(uint256 companyId => mapping(address account => address wallet))
        public receivingWallet;
    // Last payroll execution timestamp for a company.
    mapping(uint256 companyId => uint64 paidAt) public lastPayrollTime;
    // Employment start date used for termination settlement.
    mapping(uint256 companyId => mapping(address account => uint64 date))
        public startDate;
    // Next audit id to assign for each company.
    mapping(uint256 companyId => uint256 auditId) public nextAuditId;
    // Stored audit snapshot indexed by company and audit id.
    mapping(uint256 companyId => mapping(uint256 auditId => AuditReport report))
        public auditReports;

    // Internal encrypted maximum salary cached for audit finalization.
    mapping(uint256 companyId => mapping(uint256 auditId => euint128 salary))
        private auditMaxSalary;
    // Internal encrypted minimum salary cached for audit finalization.
    mapping(uint256 companyId => mapping(uint256 auditId => euint128 salary))
        private auditMinSalary;

    /// @notice Restricts execution to the company owner.
    modifier onlyOwner(uint256 companyId) {
        _requireOwner(companyId, msg.sender);
        _;
    }

    /// @notice Restricts execution to the company owner or HR members.
    modifier onlyOwnerOrHR(uint256 companyId) {
        _requireOwnerOrHR(companyId, msg.sender);
        _;
    }

    /// @notice Restricts execution to any active company member.
    modifier onlyMember(uint256 companyId) {
        _requireMember(companyId, msg.sender);
        _;
    }

    /// @notice Restricts execution to the configured SalaryProof contract.
    modifier onlySalaryProof() {
        if (msg.sender != salaryProofAddress) {
            revert SalaryCipherCore__OnlySalaryProof();
        }
        _;
    }

    /// @notice Restricts execution to the deployment-time admin.
    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert SalaryCipherCore__OnlyAdmin();
        }
        _;
    }

    /**
     * @notice Creates the core contract and binds it to a company registry.
     * @param companyRegistryAddress The deployed CompanyRegistry contract address.
     */
    constructor(address companyRegistryAddress) {
        if (companyRegistryAddress == address(0)) {
            revert SalaryCipherCore__InvalidAddress();
        }

        companyRegistry = ICompanyRegistry(companyRegistryAddress);
        admin = msg.sender;
    }

    /// @inheritdoc ISalaryCipherCore
    function deposit(
        uint256 companyId,
        uint256 amount
    ) external onlyOwner(companyId) {
        _requireCompanyExists(companyId);

        companyBalance[companyId] = FHE.add(
            companyBalance[companyId],
            uint128(amount)
        );
        _grantBalanceAccess(companyId);

        emit Deposited(companyId, amount);
    }

    /// @inheritdoc ISalaryCipherCore
    function withdraw(
        uint256 companyId,
        uint256 amount
    ) external onlyOwner(companyId) {
        _requireCompanyExists(companyId);

        ebool canWithdraw = FHE.gt(companyBalance[companyId], uint128(amount));

        euint128 nextBalance = FHE.select(
            canWithdraw,
            FHE.sub(companyBalance[companyId], uint128(amount)),
            companyBalance[companyId]
        );
        companyBalance[companyId] = nextBalance;

        _grantBalanceAccess(companyId);

        emit Withdrawn(companyId, amount);
    }

    /// @inheritdoc ISalaryCipherCore
    function getBalance(
        uint256 companyId
    ) external onlyOwnerOrHR(companyId) returns (euint128) {
        _requireCompanyExists(companyId);

        euint128 balance = companyBalance[companyId];
        FHE.allowThis(balance);
        FHE.allow(balance, msg.sender);

        return balance;
    }

    /// @inheritdoc ISalaryCipherCore
    function setSalary(
        uint256 companyId,
        address employee,
        externalEuint128 encryptedSalary,
        bytes calldata inputProof
    ) external onlyOwnerOrHR(companyId) {
        _requireActiveEmployee(companyId, employee);

        euint128 salary = FHE.fromExternal(encryptedSalary, inputProof);
        monthlySalary[companyId][employee] = salary;

        if (startDate[companyId][employee] == 0) {
            startDate[companyId][employee] = _blockTimestamp();
        }

        _grantSalaryAccess(companyId, employee);

        emit SalarySet(companyId, employee);
    }

    /// @inheritdoc ISalaryCipherCore
    function setPayrollConfig(
        uint256 companyId,
        uint8 dayOfMonth,
        uint64 nextPayrollTime
    ) external onlyOwner(companyId) {
        _requireCompanyExists(companyId);
        if (dayOfMonth == 0 || dayOfMonth > 31 || nextPayrollTime == 0) {
            revert SalaryCipherCore__InvalidPayrollConfig();
        }

        payrollConfigs[companyId] = PayrollConfig({
            dayOfMonth: dayOfMonth,
            nextPayrollTime: nextPayrollTime,
            initialized: true
        });
    }

    /// @inheritdoc ISalaryCipherCore
    function setReceivingWallet(
        uint256 companyId,
        address walletAddress
    ) external onlyMember(companyId) {
        if (walletAddress == address(0)) {
            revert SalaryCipherCore__InvalidAddress();
        }

        receivingWallet[companyId][msg.sender] = walletAddress;

        emit ReceivingWalletSet(companyId, msg.sender, walletAddress);
    }

    /// @inheritdoc ISalaryCipherCore
    function executePayroll(uint256 companyId) external onlyOwner(companyId) {
        _requireCompanyExists(companyId);
        PayrollConfig memory payrollConfig = payrollConfigs[companyId];
        if (!payrollConfig.initialized) {
            revert SalaryCipherCore__PayrollConfigNotSet();
        }

        address[] memory employees = companyRegistry.getEmployees(companyId);
        uint256 count;

        uint64 payrollTimestamp = _blockTimestamp();
        if (payrollTimestamp < payrollConfig.nextPayrollTime) {
            revert SalaryCipherCore__PayrollNotDue();
        }

        // Pagination is intentionally skipped for now; all eligible members are processed.
        for (uint256 i = 0; i < employees.length; i++) {
            address employee = employees[i];
            // Only HR and employees are eligible for payroll.
            if (
                !_isPayrollEligible(companyId, employee) ||
                !FHE.isInitialized(monthlySalary[companyId][employee])
            ) {
                continue;
            }

            euint128 salary = _calculateProratedPayout(
                companyId,
                employee,
                payrollTimestamp
            );
            pendingPayout[companyId][employee] = FHE.add(
                pendingPayout[companyId][employee],
                salary
            );
            companyBalance[companyId] = FHE.sub(
                companyBalance[companyId],
                salary
            );

            _grantPendingPayoutAccess(companyId, employee);
            count++;
        }

        lastPayrollTime[companyId] = payrollConfig.nextPayrollTime;
        payrollConfigs[companyId].nextPayrollTime = _nextPayrollTime(
            payrollConfig.nextPayrollTime,
            payrollConfig.dayOfMonth
        );
        _grantBalanceAccess(companyId);

        emit PayrollExecuted(companyId, count);
    }

    /// @inheritdoc ISalaryCipherCore
    function claimPayout(uint256 companyId) external onlyMember(companyId) {
        if (receivingWallet[companyId][msg.sender] == address(0)) {
            revert SalaryCipherCore__ReceivingWalletNotSet();
        }

        // This version only clears the encrypted ledger entry. Real token transfer is deferred.
        pendingPayout[companyId][msg.sender] = FHE.asEuint128(0);
        _grantPendingPayoutAccess(companyId, msg.sender);

        emit PayoutClaimed(companyId, msg.sender);
    }

    /// @inheritdoc ISalaryCipherCore
    function terminateEmployee(
        uint256 companyId,
        address employee
    ) external onlyOwnerOrHR(companyId) {
        _requireActiveEmployee(companyId, employee);

        uint64 terminationTimestamp = _blockTimestamp();
        // Termination payout only covers the interval that has not yet been settled
        // by the latest company-wide payroll run.
        euint128 terminationPayout = _calculateProratedPayout(
            companyId,
            employee,
            terminationTimestamp
        );

        pendingPayout[companyId][employee] = FHE.add(
            pendingPayout[companyId][employee],
            terminationPayout
        );
        monthlySalary[companyId][employee] = FHE.asEuint128(0);
        startDate[companyId][employee] = 0;

        _grantPendingPayoutAccess(companyId, employee);
        _grantSalaryAccess(companyId, employee);

        companyRegistry.removeEmployee(companyId, employee);

        emit EmployeeTerminated(companyId, employee);
    }

    /// @inheritdoc ISalaryCipherCore
    function generateAudit(
        uint256 companyId
    ) external onlyOwnerOrHR(companyId) returns (uint256 auditId) {
        _requireCompanyExists(companyId);

        address[] memory employees = companyRegistry.getEmployees(companyId);
        euint128 totalSalarySum = FHE.asEuint128(0);
        euint128 maxSalary = FHE.asEuint128(0);
        euint128 minSalary = FHE.asEuint128(0);
        bool initialized;
        uint256 headcount;

        // Pagination is intentionally skipped for now; the full active member set is scanned.
        for (uint256 i = 0; i < employees.length; i++) {
            address employee = employees[i];
            // Only HR and employees are eligible for audit.
            if (!_isPayrollEligible(companyId, employee)) {
                continue;
            }

            euint128 salary = monthlySalary[companyId][employee];
            totalSalarySum = FHE.add(totalSalarySum, salary);

            if (!initialized) {
                maxSalary = salary;
                minSalary = salary;
                initialized = true;
            } else {
                maxSalary = FHE.select(
                    FHE.ge(salary, maxSalary),
                    salary,
                    maxSalary
                );
                minSalary = FHE.select(
                    FHE.le(salary, minSalary),
                    salary,
                    minSalary
                );
            }

            headcount++;
        }

        auditId = ++nextAuditId[companyId];
        auditReports[companyId][auditId] = AuditReport({
            timestamp: _blockTimestamp(),
            totalSalarySum: totalSalarySum,
            headcount: headcount,
            gapWithinThreshold: FHE.asEbool(false)
        });
        auditMaxSalary[companyId][auditId] = maxSalary;
        auditMinSalary[companyId][auditId] = minSalary;

        FHE.allowThis(auditReports[companyId][auditId].totalSalarySum);
        FHE.allowThis(auditMaxSalary[companyId][auditId]);
        FHE.allowThis(auditMinSalary[companyId][auditId]);
        FHE.allowThis(auditReports[companyId][auditId].gapWithinThreshold);
        FHE.allow(
            auditReports[companyId][auditId].totalSalarySum,
            _companyOwner(companyId)
        );

        emit AuditGenerated(companyId, auditId);
    }

    /// @inheritdoc ISalaryCipherCore
    function finalizeAudit(
        uint256 companyId,
        uint256 auditId
    ) external onlyOwnerOrHR(companyId) returns (ebool) {
        AuditReport storage report = auditReports[companyId][auditId];
        if (report.timestamp == 0) {
            revert SalaryCipherCore__AuditDoesNotExist();
        }

        // Current hackathon rule: highest salary must stay within 3x of the minimum salary.
        if (report.headcount <= 1) {
            report.gapWithinThreshold = FHE.asEbool(true);
        } else {
            report.gapWithinThreshold = FHE.le(
                auditMaxSalary[companyId][auditId],
                FHE.mul(
                    auditMinSalary[companyId][auditId],
                    GAP_THRESHOLD_MULTIPLE
                )
            );
        }

        FHE.allowThis(report.gapWithinThreshold);
        _grantAuditGapAccess(companyId, report.gapWithinThreshold);

        emit AuditFinalized(companyId, auditId);

        return report.gapWithinThreshold;
    }

    /// @inheritdoc ISalaryCipherCore
    function verifySalaryCondition(
        uint256 companyId,
        address employee,
        ConditionType conditionType,
        euint128 threshold
    ) external onlySalaryProof returns (ebool) {
        _requireActiveEmployee(companyId, employee);
        if (!FHE.isInitialized(monthlySalary[companyId][employee])) {
            revert SalaryCipherCore__SalaryNotSet();
        }

        ebool result;
        if (conditionType == ConditionType.GTE) {
            result = FHE.ge(monthlySalary[companyId][employee], threshold);
        } else if (conditionType == ConditionType.LTE) {
            result = FHE.le(monthlySalary[companyId][employee], threshold);
        } else {
            result = FHE.eq(monthlySalary[companyId][employee], threshold);
        }

        FHE.allowThis(result);
        FHE.allow(result, salaryProofAddress);

        return result;
    }

    /// @inheritdoc ISalaryCipherCore
    function setSalaryProofAddress(address salaryProof) external onlyAdmin {
        if (salaryProof == address(0)) {
            revert SalaryCipherCore__InvalidAddress();
        }

        salaryProofAddress = salaryProof;

        emit SalaryProofAddressSet(salaryProof);
    }

    /// @dev Uses the registry getter as the single source of company existence validation.
    function _requireCompanyExists(uint256 companyId) private view {
        companyRegistry.getEmployeeCount(companyId);
    }

    /// @dev Reverts unless the account is the company owner.
    function _requireOwner(uint256 companyId, address account) private view {
        _requireCompanyExists(companyId);
        if (
            companyRegistry.getRole(companyId, account) !=
            ICompanyRegistry.Role.Owner
        ) {
            revert SalaryCipherCore__Unauthorized();
        }
    }

    /// @dev Reverts unless the account is owner or HR.
    function _requireOwnerOrHR(
        uint256 companyId,
        address account
    ) private view {
        _requireCompanyExists(companyId);
        ICompanyRegistry.Role role = companyRegistry.getRole(
            companyId,
            account
        );
        if (
            role != ICompanyRegistry.Role.Owner &&
            role != ICompanyRegistry.Role.HR
        ) {
            revert SalaryCipherCore__Unauthorized();
        }
    }

    /// @dev Reverts unless the account is any active member of the company.
    function _requireMember(uint256 companyId, address account) private view {
        _requireCompanyExists(companyId);
        if (
            companyRegistry.getRole(companyId, account) ==
            ICompanyRegistry.Role.None
        ) {
            revert SalaryCipherCore__Unauthorized();
        }
    }

    /// @dev Reverts unless the account is an active non-owner employee entry.
    function _requireActiveEmployee(
        uint256 companyId,
        address employee
    ) private view {
        _requireCompanyExists(companyId);
        ICompanyRegistry.Role role = companyRegistry.getRole(
            companyId,
            employee
        );
        if (
            role == ICompanyRegistry.Role.None ||
            role == ICompanyRegistry.Role.Owner
        ) {
            revert SalaryCipherCore__Unauthorized();
        }
    }

    /// @dev Returns whether an address should participate in payroll and audit loops.
    function _isPayrollEligible(
        uint256 companyId,
        address employee
    ) private view returns (bool) {
        ICompanyRegistry.Role role = companyRegistry.getRole(
            companyId,
            employee
        );
        return
            role == ICompanyRegistry.Role.HR ||
            role == ICompanyRegistry.Role.Employee;
    }

    /// @dev Calculates the unsettled salary portion between the employee settlement start and period end.
    function _calculateProratedPayout(
        uint256 companyId,
        address employee,
        uint64 periodEnd
    ) private returns (euint128) {
        uint64 periodStart = _settlementStart(companyId, employee);
        if (periodEnd <= periodStart) {
            return FHE.asEuint128(0);
        }

        uint128 elapsedSeconds = uint128(periodEnd - periodStart);
        return
            FHE.div(
                FHE.mul(monthlySalary[companyId][employee], elapsedSeconds),
                PAYROLL_PERIOD_SECONDS
            );
    }

    /// @dev Uses the later timestamp between employee start and the company-wide last payroll.
    function _settlementStart(
        uint256 companyId,
        address employee
    ) private view returns (uint64) {
        uint64 employeeStartDate = startDate[companyId][employee];
        uint64 companyLastPayrollTime = lastPayrollTime[companyId];
        return
            employeeStartDate > companyLastPayrollTime
                ? employeeStartDate
                : companyLastPayrollTime;
    }

    /// @dev Refreshes FHE access for the encrypted company balance.
    function _grantBalanceAccess(uint256 companyId) private {
        FHE.allowThis(companyBalance[companyId]);
        _grantManagerAccess(companyId, companyBalance[companyId]);
    }

    /// @dev Refreshes FHE access for one employee salary handle.
    function _grantSalaryAccess(uint256 companyId, address employee) private {
        FHE.allowThis(monthlySalary[companyId][employee]);
        FHE.allow(monthlySalary[companyId][employee], employee);
        _grantManagerAccess(companyId, monthlySalary[companyId][employee]);
        if (salaryProofAddress != address(0)) {
            FHE.allow(monthlySalary[companyId][employee], salaryProofAddress);
        }
    }

    /// @dev Refreshes FHE access for one employee pending payout handle.
    function _grantPendingPayoutAccess(
        uint256 companyId,
        address employee
    ) private {
        FHE.allowThis(pendingPayout[companyId][employee]);
        FHE.allow(pendingPayout[companyId][employee], employee);
        _grantManagerAccess(companyId, pendingPayout[companyId][employee]);
    }

    /// @dev Grants one encrypted handle to all current managers in the company.
    function _grantManagerAccess(uint256 companyId, euint128 value) private {
        address[] memory employees = companyRegistry.getEmployees(companyId);
        for (uint256 i = 0; i < employees.length; i++) {
            address employee = employees[i];
            ICompanyRegistry.Role role = companyRegistry.getRole(
                companyId,
                employee
            );
            if (
                role == ICompanyRegistry.Role.Owner ||
                role == ICompanyRegistry.Role.HR
            ) {
                FHE.allow(value, employee);
            }
        }
    }

    /// @dev Grants one encrypted boolean handle to all current managers in the company.
    function _grantAuditGapAccess(uint256 companyId, ebool value) private {
        address[] memory employees = companyRegistry.getEmployees(companyId);
        for (uint256 i = 0; i < employees.length; i++) {
            address employee = employees[i];
            ICompanyRegistry.Role role = companyRegistry.getRole(
                companyId,
                employee
            );
            if (
                role == ICompanyRegistry.Role.Owner ||
                role == ICompanyRegistry.Role.HR
            ) {
                FHE.allow(value, employee);
            }
        }
    }

    /// @dev Resolves the current owner address from the registry member list.
    function _companyOwner(uint256 companyId) private view returns (address) {
        ICompanyRegistry.Company memory companyInfo = companyRegistry
            .getCompany(companyId);

        if (companyInfo.owner == address(0)) {
            revert SalaryCipherCore__Unauthorized();
        }

        return companyInfo.owner;
    }

    /// @dev Returns the current block timestamp in the compact type used by this contract.
    function _blockTimestamp() private view returns (uint64) {
        return uint64(block.timestamp);
    }

    /// @dev Advances payroll to the next configured calendar month day, clamped to month end when needed.
    function _nextPayrollTime(
        uint64 currentPayrollTime,
        uint8 dayOfMonth
    ) private pure returns (uint64) {
        uint256 nextMonthTimestamp = uint256(currentPayrollTime).addMonths(1);
        (
            uint256 year,
            uint256 month,
            ,
            uint256 hour,
            uint256 minute,
            uint256 second
        ) = DateTimeLib.timestampToDateTime(nextMonthTimestamp);
        uint256 lastDayOfMonth = DateTimeLib.daysInMonth(year, month);
        uint256 targetDay = dayOfMonth > lastDayOfMonth
            ? lastDayOfMonth
            : dayOfMonth;

        return uint64(
            DateTimeLib.dateTimeToTimestamp(
                year,
                month,
                targetDay,
                hour,
                minute,
                second
            )
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {FHE, ebool, euint64, euint128, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/* Interfaces ****/
import {ICompanyRegistry} from "./interfaces/ICompanyRegistry.sol";
import {ISalaryCipherCore} from "./interfaces/ISalaryCipherCore.sol";
import {ICompanyTreasuryVault} from "./interfaces/ICompanyTreasuryVault.sol";

/* Libraries *****/
import {DateTimeLib} from "solady/src/utils/DateTimeLib.sol";

/**
 * @title SalaryCipherCore
 * @author BTBMan
 * @notice Coordinates payroll calculations, confidential salary storage, and audit generation.
 * @dev Real fund custody lives in CompanyTreasuryVault; this contract only computes due payroll amounts.
 */
contract SalaryCipherCore is ISalaryCipherCore, ZamaEthereumConfig {
    using DateTimeLib for uint256;

    struct PayrollExecutionPlan {
        address treasuryVault;
        uint64 nextPayrollDateToSettle;
        uint64 targetPayrollDate;
    }

    // Date-based payroll calculations operate on whole UTC days.
    uint64 private constant DAY_SECONDS = 1 days;
    // Temporary fixed threshold used by audit finalization.
    uint128 private constant GAP_THRESHOLD_MULTIPLE = 3;

    // Deployment-time admin used for one-off system configuration.
    address public immutable admin;
    // External registry used for all company and role checks.
    ICompanyRegistry public immutable companyRegistry;
    // Contract allowed to request encrypted salary condition checks.
    address public salaryProofAddress;

    // Encrypted monthly salary stored per company member.
    mapping(uint256 companyId => mapping(address account => euint128 salary))
        public monthlySalary;
    // Last payroll execution timestamp for a company.
    mapping(uint256 companyId => uint64 paidAt) public lastPayrollTime;
    // Employment start date used for payroll and termination settlement.
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
            // Payroll eligibility starts from the employee's registry join time,
            // not from the moment their encrypted salary is configured.
            startDate[companyId][employee] = companyRegistry
                .getEmployee(companyId, employee)
                .addedAt;
        }

        _grantSalaryAccess(companyId, employee);

        emit SalarySet(companyId, employee);
    }

    /// @inheritdoc ISalaryCipherCore
    function executePayroll(uint256 companyId) external onlyOwnerOrHR(companyId) {
        _executePayroll(companyId, false);
    }

    /// @inheritdoc ISalaryCipherCore
    function executePayrollNow(uint256 companyId) external onlyOwnerOrHR(companyId) {
        _executePayroll(companyId, true);
    }

    /// @dev Executes due payroll, or the next scheduled payroll when allowEarly is enabled.
    function _executePayroll(uint256 companyId, bool allowEarly) private {
        _requireCompanyExists(companyId);

        ICompanyRegistry.PayrollConfig memory payrollConfig = companyRegistry
            .getPayrollConfig(companyId);
        if (!payrollConfig.initialized) {
            revert SalaryCipherCore__PayrollConfigNotSet();
        }

        PayrollExecutionPlan memory plan = _buildPayrollExecutionPlan(
            companyId,
            payrollConfig.dayOfMonth,
            allowEarly
        );

        address[] memory employees = companyRegistry.getEmployees(companyId);
        uint256 count;
        // Pagination is intentionally skipped for now; all eligible members are processed.
        for (uint256 i = 0; i < employees.length; i++) {
            if (
                _processPayrollEmployee(
                    companyId,
                    employees[i],
                    payrollConfig.dayOfMonth,
                    plan
                )
            ) {
                count++;
            }
        }

        lastPayrollTime[companyId] = plan.targetPayrollDate;

        emit PayrollExecuted(companyId, count);
    }

    /// @dev Builds the payroll date range that should be settled for a normal or early execution.
    function _buildPayrollExecutionPlan(
        uint256 companyId,
        uint8 dayOfMonth,
        bool allowEarly
    ) private view returns (PayrollExecutionPlan memory plan) {
        plan.treasuryVault = companyRegistry.getTreasuryVault(companyId);
        if (plan.treasuryVault == address(0)) {
            revert SalaryCipherCore__TreasuryVaultNotSet();
        }

        uint64 currentTimestamp = _blockTimestamp();
        uint64 currentMonthPayrollDate = _payrollDateForReferenceMonth(
            dayOfMonth,
            currentTimestamp
        );
        uint64 latestDuePayrollDate = currentTimestamp >=
            currentMonthPayrollDate
            ? currentMonthPayrollDate
            : _previousPayrollDate(
                currentMonthPayrollDate,
                dayOfMonth
        );
        uint64 previousPaidAt = lastPayrollTime[companyId];
        if (previousPaidAt == 0) {
            // The first payroll target is the first configured payroll date on
            // or after company creation, so late first execution can catch up
            // every scheduled payroll instead of skipping old dates.
            plan.nextPayrollDateToSettle = _firstPayrollDateOnOrAfterCompanyStart(
                companyId,
                dayOfMonth
            );
        } else {
            plan.nextPayrollDateToSettle = _nextPayrollDate(
                previousPaidAt,
                dayOfMonth
            );
        }

        plan.targetPayrollDate = latestDuePayrollDate;
        if (plan.nextPayrollDateToSettle > latestDuePayrollDate) {
            if (!allowEarly) {
                revert SalaryCipherCore__PayrollNotDue();
            }

            // Manual early execution can only pull forward the nearest unpaid
            // scheduled payroll date. The salary period still remains the
            // previous complete calendar month for that scheduled date.
            uint64 earliestUpcomingPayrollDate = currentTimestamp <
                currentMonthPayrollDate
                ? currentMonthPayrollDate
                : _nextPayrollDate(currentMonthPayrollDate, dayOfMonth);
            if (plan.nextPayrollDateToSettle > earliestUpcomingPayrollDate) {
                revert SalaryCipherCore__PayrollNotDue();
            }

            (, uint64 periodEnd) = _previousCalendarMonthRange(
                plan.nextPayrollDateToSettle
            );
            if (_floorToDay(currentTimestamp) <= periodEnd) {
                revert SalaryCipherCore__PayrollNotDue();
            }

            plan.targetPayrollDate = plan.nextPayrollDateToSettle;
        }
    }

    /// @dev Returns the first configured payroll date on or after the company creation day.
    function _firstPayrollDateOnOrAfterCompanyStart(
        uint256 companyId,
        uint8 dayOfMonth
    ) private view returns (uint64) {
        uint64 companyStartDay = _floorToDay(
            companyRegistry.getCompany(companyId).createdAt
        );
        uint64 candidatePayrollDate = _payrollDateForReferenceMonth(
            dayOfMonth,
            companyStartDay
        );
        if (candidatePayrollDate < companyStartDay) {
            return _nextPayrollDate(candidatePayrollDate, dayOfMonth);
        }
        return candidatePayrollDate;
    }

    /// @dev Calculates and transfers one employee payout, returning whether a transfer was attempted.
    function _processPayrollEmployee(
        uint256 companyId,
        address employee,
        uint8 dayOfMonth,
        PayrollExecutionPlan memory plan
    ) private returns (bool) {
        // Only HR and employees with initialized salaries are eligible for payroll.
        if (
            !_isPayrollEligible(companyId, employee) ||
            !FHE.isInitialized(monthlySalary[companyId][employee])
        ) {
            return false;
        }

        euint128 payout = _calculatePayrollCatchUpPayout(
            companyId,
            employee,
            plan.nextPayrollDateToSettle,
            plan.targetPayrollDate,
            dayOfMonth
        );

        _transferPayroll(companyId, plan.treasuryVault, employee, payout);
        return true;
    }

    /// @inheritdoc ISalaryCipherCore
    function terminateEmployee(
        uint256 companyId,
        address employee
    ) external onlyOwnerOrHR(companyId) {
        _requireActiveEmployee(companyId, employee);
        if (!FHE.isInitialized(monthlySalary[companyId][employee])) {
            revert SalaryCipherCore__SalaryNotSet();
        }

        ICompanyRegistry.PayrollConfig memory payrollConfig = companyRegistry
            .getPayrollConfig(companyId);
        if (!payrollConfig.initialized) {
            revert SalaryCipherCore__PayrollConfigNotSet();
        }

        address treasuryVault = companyRegistry.getTreasuryVault(companyId);
        if (treasuryVault == address(0)) {
            revert SalaryCipherCore__TreasuryVaultNotSet();
        }

        // Termination settlement walks each still-unpaid payroll period and avoids
        // paying any interval that the company-wide payroll already covered.
        euint128 terminationPayout = _calculateTerminationPayout(
            companyId,
            employee,
            payrollConfig.dayOfMonth,
            _floorToDay(_blockTimestamp())
        );

        _transferPayroll(
            companyId,
            treasuryVault,
            employee,
            terminationPayout
        );

        monthlySalary[companyId][employee] = FHE.asEuint128(0);
        startDate[companyId][employee] = 0;

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

    /// @dev Sums all due scheduled payrolls, where each payroll date settles the previous complete calendar month.
    function _calculatePayrollCatchUpPayout(
        uint256 companyId,
        address employee,
        uint64 nextPayrollDateToSettle,
        uint64 latestDuePayrollDate,
        uint8 dayOfMonth
    ) private returns (euint128 totalPayout) {
        totalPayout = FHE.asEuint128(0);

        uint64 payrollDate = nextPayrollDateToSettle;
        while (payrollDate <= latestDuePayrollDate) {
            // Example: a May 15 payroll settles Apr 1 through Apr 30.
            (uint64 periodStart, uint64 periodEnd) = _previousCalendarMonthRange(
                payrollDate
            );

            totalPayout = FHE.add(
                totalPayout,
                _calculatePeriodPayout(companyId, employee, periodStart, periodEnd)
            );

            payrollDate = _nextPayrollDate(payrollDate, dayOfMonth);
        }
    }

    /// @dev Settles the unpaid interval up to the termination day, splitting across natural payroll periods when needed.
    function _calculateTerminationPayout(
        uint256 companyId,
        address employee,
        uint8 dayOfMonth,
        uint64 terminationDay
    ) private returns (euint128 totalPayout) {
        uint64 employeeStartDay = _floorToDay(startDate[companyId][employee]);
        uint64 cursor = employeeStartDay;
        uint64 companyLastPaidAt = lastPayrollTime[companyId];

        if (companyLastPaidAt != 0 && companyLastPaidAt > cursor) {
            cursor = companyLastPaidAt;
        }
        if (cursor > terminationDay) {
            return FHE.asEuint128(0);
        }

        totalPayout = FHE.asEuint128(0);
        while (cursor <= terminationDay) {
            uint64 periodStart = _periodStartForDate(dayOfMonth, cursor);
            uint64 periodEnd = _nextPayrollDate(periodStart, dayOfMonth) -
                DAY_SECONDS;
            uint64 intervalStart = cursor > periodStart ? cursor : periodStart;
            uint64 intervalEnd = terminationDay < periodEnd
                ? terminationDay
                : periodEnd;

            totalPayout = FHE.add(
                totalPayout,
                _calculateIntervalPayout(
                    companyId,
                    employee,
                    periodStart,
                    periodEnd,
                    intervalStart,
                    intervalEnd
                )
            );

            if (intervalEnd == type(uint64).max) {
                break;
            }
            cursor = intervalEnd + DAY_SECONDS;
        }
    }

    /// @dev Calculates one payroll-period payout using full salary for full coverage and day-based proration otherwise.
    function _calculatePeriodPayout(
        uint256 companyId,
        address employee,
        uint64 periodStart,
        uint64 periodEnd
    ) private returns (euint128) {
        uint64 employeeStartDay = _floorToDay(startDate[companyId][employee]);
        if (employeeStartDay > periodEnd) {
            return FHE.asEuint128(0);
        }

        uint64 intervalStart = employeeStartDay > periodStart
            ? employeeStartDay
            : periodStart;
        return
            _calculateIntervalPayout(
                companyId,
                employee,
                periodStart,
                periodEnd,
                intervalStart,
                periodEnd
            );
    }

    /// @dev Converts one covered interval inside a payroll period into either full salary or an actual-day prorated salary.
    function _calculateIntervalPayout(
        uint256 companyId,
        address employee,
        uint64 periodStart,
        uint64 periodEnd,
        uint64 intervalStart,
        uint64 intervalEnd
    ) private returns (euint128) {
        if (intervalStart > intervalEnd) {
            return FHE.asEuint128(0);
        }
        if (intervalStart == periodStart && intervalEnd == periodEnd) {
            return monthlySalary[companyId][employee];
        }

        uint128 workedDays = _inclusiveDayCount(intervalStart, intervalEnd);
        uint128 totalDays = _inclusiveDayCount(periodStart, periodEnd);
        return
            FHE.div(
                FHE.mul(monthlySalary[companyId][employee], workedDays),
                totalDays
            );
    }

    /// @dev Routes one computed encrypted payroll amount to the company's treasury vault and employee payout wallet.
    function _transferPayroll(
        uint256 companyId,
        address treasuryVault,
        address employee,
        euint128 payout
    ) private {
        address payoutWallet = companyRegistry.getPayoutWallet(
            companyId,
            employee
        );
        if (payoutWallet == address(0)) {
            revert SalaryCipherCore__InvalidAddress();
        }

        // OpenZeppelin ERC7984 uses euint64 transfer amounts, so the core narrows the payroll handle at the vault boundary.
        euint64 transferAmount = FHE.asEuint64(payout);
        FHE.allow(transferAmount, treasuryVault);
        ICompanyTreasuryVault(treasuryVault).payrollTransfer(
            payoutWallet,
            transferAmount
        );
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

    /// @dev Resolves the current owner address from the registry company record.
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

    /// @dev Floors any timestamp to 00:00:00 UTC of the same day.
    function _floorToDay(uint64 timestamp) private pure returns (uint64) {
        return timestamp - (timestamp % DAY_SECONDS);
    }

    /// @dev Returns the inclusive number of UTC days between two day-aligned timestamps.
    function _inclusiveDayCount(
        uint64 startDay,
        uint64 endDay
    ) private pure returns (uint128) {
        return uint128(((endDay - startDay) / DAY_SECONDS) + 1);
    }

    /// @dev Returns the latest payroll date that is already due at the given timestamp.
    function _latestPayrollDate(
        uint8 dayOfMonth,
        uint64 referenceTimestamp
    ) private pure returns (uint64) {
        uint64 currentMonthPayrollDate = _payrollDateForReferenceMonth(
            dayOfMonth,
            referenceTimestamp
        );
        if (referenceTimestamp >= currentMonthPayrollDate) {
            return currentMonthPayrollDate;
        }
        return _previousPayrollDate(currentMonthPayrollDate, dayOfMonth);
    }

    /// @dev Returns the configured payroll date in the same UTC month as the supplied timestamp.
    function _payrollDateForReferenceMonth(
        uint8 dayOfMonth,
        uint64 referenceTimestamp
    ) private pure returns (uint64) {
        (uint256 year, uint256 month, , , , ) = DateTimeLib.timestampToDateTime(
            referenceTimestamp
        );
        return _payrollDateForMonth(year, month, dayOfMonth);
    }

    /// @dev Returns the payroll period start that contains the given reference day.
    function _periodStartForDate(
        uint8 dayOfMonth,
        uint64 referenceDay
    ) private pure returns (uint64) {
        return _latestPayrollDate(dayOfMonth, referenceDay);
    }

    /// @dev Returns the payroll timestamp for a specific month, clamped to month end when the day exceeds that month length.
    function _payrollDateForMonth(
        uint256 year,
        uint256 month,
        uint8 dayOfMonth
    ) private pure returns (uint64) {
        uint256 lastDayOfMonth = DateTimeLib.daysInMonth(year, month);
        uint256 targetDay = dayOfMonth > lastDayOfMonth
            ? lastDayOfMonth
            : dayOfMonth;

        return uint64(DateTimeLib.dateToTimestamp(year, month, targetDay));
    }

    /// @dev Returns the complete calendar month settled by a scheduled payroll date.
    function _previousCalendarMonthRange(
        uint64 payrollDate
    ) private pure returns (uint64 periodStart, uint64 periodEnd) {
        (uint256 year, uint256 month, , , , ) = DateTimeLib.timestampToDateTime(
            payrollDate
        );
        if (month == 1) {
            year -= 1;
            month = 12;
        } else {
            month -= 1;
        }

        periodStart = uint64(DateTimeLib.dateToTimestamp(year, month, 1));
        periodEnd = uint64(
            DateTimeLib.dateToTimestamp(
                year,
                month,
                DateTimeLib.daysInMonth(year, month)
            )
        );
    }

    /// @dev Returns the previous configured payroll day before the supplied payroll date.
    function _previousPayrollDate(
        uint64 currentPayrollDate,
        uint8 dayOfMonth
    ) private pure returns (uint64) {
        (uint256 year, uint256 month, , , , ) = DateTimeLib.timestampToDateTime(
            currentPayrollDate
        );
        if (month == 1) {
            year -= 1;
            month = 12;
        } else {
            month -= 1;
        }
        return _payrollDateForMonth(year, month, dayOfMonth);
    }

    /// @dev Returns the next configured payroll day after the supplied payroll date.
    function _nextPayrollDate(
        uint64 currentPayrollDate,
        uint8 dayOfMonth
    ) private pure returns (uint64) {
        uint256 nextMonthTimestamp = uint256(currentPayrollDate).addMonths(1);
        (uint256 year, uint256 month, , , , ) = DateTimeLib.timestampToDateTime(
            nextMonthTimestamp
        );
        return _payrollDateForMonth(year, month, dayOfMonth);
    }
}

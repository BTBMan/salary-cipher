// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {ebool, euint128, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";

/* Events ********/

/* Errors ********/

/* Interfaces ****/

/* Libraries *****/

interface ISalaryCipherCore {
    ////////////////////////////////////
    // Type declarations              //
    ////////////////////////////////////
    /// @notice Supported salary comparison modes exposed to SalaryProof.
    enum ConditionType {
        GTE,
        LTE,
        EQ
    }

    /// @notice Cached audit result for a company snapshot.
    struct AuditReport {
        // The timestamp of the audit report
        uint64 timestamp;
        // The total salary sum of the audited employees
        euint128 totalSalarySum;
        // The headcount of the audited employees
        uint256 headcount;
        // The gap within the threshold of the audited employees
        ebool gapWithinThreshold;
    }

    ////////////////////////////////////
    // State variables                //
    ////////////////////////////////////

    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////
    /// @notice Emitted when company funds are added to the encrypted balance ledger.
    event Deposited(uint256 indexed companyId, uint256 amount);
    /// @notice Emitted when company funds are removed from the encrypted balance ledger.
    event Withdrawn(uint256 indexed companyId, uint256 amount);
    /// @notice Emitted when an employee salary handle is updated.
    event SalarySet(uint256 indexed companyId, address indexed employee);
    /// @notice Emitted when a member updates the wallet used for payout claims.
    event ReceivingWalletSet(
        uint256 indexed companyId,
        address indexed employee,
        address indexed wallet
    );
    /// @notice Emitted when payroll processing moves salaries into pending payouts.
    event PayrollExecuted(uint256 indexed companyId, uint256 count);
    /// @notice Emitted when a member clears their pending payout balance.
    event PayoutClaimed(uint256 indexed companyId, address indexed employee);
    /// @notice Emitted when an employee is settled and removed from the company registry.
    event EmployeeTerminated(
        uint256 indexed companyId,
        address indexed employee
    );
    /// @notice Emitted when an audit snapshot is created.
    event AuditGenerated(uint256 indexed companyId, uint256 indexed auditId);
    /// @notice Emitted when an audit conclusion is finalized.
    event AuditFinalized(uint256 indexed companyId, uint256 indexed auditId);
    /// @notice Emitted when the authorized SalaryProof contract is configured.
    event SalaryProofAddressSet(address indexed salaryProof);

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////
    error SalaryCipherCore__Unauthorized();
    error SalaryCipherCore__OnlyAdmin();
    error SalaryCipherCore__OnlySalaryProof();
    error SalaryCipherCore__InvalidAddress();
    error SalaryCipherCore__ReceivingWalletNotSet();
    error SalaryCipherCore__SalaryNotSet();
    error SalaryCipherCore__AuditDoesNotExist();
    error SalaryCipherCore__InsufficientBalance();
    error SalaryCipherCore__PayrollConfigNotSet();
    error SalaryCipherCore__PayrollNotDue();

    ////////////////////////////////////
    // Modifiers                      //
    ////////////////////////////////////

    ////////////////////////////////////
    // Receive & Fallback             //
    ////////////////////////////////////

    ////////////////////////////////////
    // Functions                      //
    ////////////////////////////////////
    /// @notice Adds plain company funds into the encrypted company balance ledger.
    function deposit(uint256 companyId, uint256 amount) external;

    /// @notice Removes plain company funds from the encrypted company balance ledger.
    function withdraw(uint256 companyId, uint256 amount) external;

    /// @notice Returns the encrypted company balance handle for an authorized manager.
    function getBalance(uint256 companyId) external returns (euint128);

    /// @notice Stores an employee's encrypted monthly salary and refreshes FHE access.
    function setSalary(
        uint256 companyId,
        address employee,
        externalEuint128 encryptedSalary,
        bytes calldata inputProof
    ) external;

    /// @notice Sets the plain wallet that will receive future payout claims.
    function setReceivingWallet(
        uint256 companyId,
        address walletAddress
    ) external;

    /// @notice Executes payroll for the company and moves salary into pending payouts.
    function executePayroll(uint256 companyId) external;

    /// @notice Clears the caller's pending payout after a claim.
    function claimPayout(uint256 companyId) external;

    /// @notice Settles an employee, zeros salary state, and removes them from the registry.
    function terminateEmployee(uint256 companyId, address employee) external;

    /// @notice Creates an audit snapshot over the current company salary state.
    function generateAudit(
        uint256 companyId
    ) external returns (uint256 auditId);

    /// @notice Finalizes an audit by computing whether the salary gap stays under threshold.
    function finalizeAudit(
        uint256 companyId,
        uint256 auditId
    ) external returns (ebool);

    /// @notice Compares an employee salary against an encrypted threshold for SalaryProof.
    function verifySalaryCondition(
        uint256 companyId,
        address employee,
        ConditionType conditionType,
        euint128 threshold
    ) external returns (ebool);

    /// @notice Sets the contract allowed to request salary condition checks.
    function setSalaryProofAddress(address salaryProof) external;

    ////////////////////////////////////
    // Getter functions               //
    ////////////////////////////////////
}

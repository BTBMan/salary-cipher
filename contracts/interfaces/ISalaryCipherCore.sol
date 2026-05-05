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
    /// @notice Emitted when an employee salary handle is updated.
    event SalarySet(uint256 indexed companyId, address indexed employee);
    /// @notice Emitted when payroll processing executes immediate confidential transfers.
    event PayrollExecuted(uint256 indexed companyId, uint256 count);
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
    /// @notice Emitted when the authorized SalaryNegotiation contract is configured.
    event SalaryNegotiationAddressSet(address indexed salaryNegotiation);

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////
    error SalaryCipherCore__Unauthorized();
    error SalaryCipherCore__OnlyAdmin();
    error SalaryCipherCore__OnlySalaryProof();
    error SalaryCipherCore__OnlySalaryNegotiation();
    error SalaryCipherCore__InvalidAddress();
    error SalaryCipherCore__SalaryNotSet();
    error SalaryCipherCore__AuditDoesNotExist();
    error SalaryCipherCore__PayrollConfigNotSet();
    error SalaryCipherCore__PayrollNotDue();
    error SalaryCipherCore__TreasuryVaultNotSet();

    ////////////////////////////////////
    // Modifiers                      //
    ////////////////////////////////////

    ////////////////////////////////////
    // Receive & Fallback             //
    ////////////////////////////////////

    ////////////////////////////////////
    // Functions                      //
    ////////////////////////////////////
    /// @notice Stores an employee's encrypted monthly salary and refreshes FHE access.
    function setSalary(
        uint256 companyId,
        address employee,
        externalEuint128 encryptedSalary,
        bytes calldata inputProof
    ) external;

    /// @notice Stores a matched salary adjustment produced by SalaryNegotiation.
    function setNegotiatedSalary(
        uint256 companyId,
        address employee,
        euint128 negotiatedSalary
    ) external;

    /// @notice Executes payroll for the company and immediately transfers confidential salary funds.
    function executePayroll(uint256 companyId) external;

    /// @notice Executes the next unpaid payroll date immediately, even when the configured payroll day has not arrived.
    function executePayrollNow(uint256 companyId) external;

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

    /// @notice Sets the contract allowed to apply encrypted salary negotiation results.
    function setSalaryNegotiationAddress(address salaryNegotiation) external;

    ////////////////////////////////////
    // Getter functions               //
    ////////////////////////////////////
}

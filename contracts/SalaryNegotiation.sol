// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {FHE, ebool, euint128, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/* Events ********/

/* Errors ********/

/* Interfaces ****/
import {ICompanyRegistry} from "./interfaces/ICompanyRegistry.sol";
import {ISalaryCipherCore} from "./interfaces/ISalaryCipherCore.sol";
import {ISalaryNegotiation} from "./interfaces/ISalaryNegotiation.sol";

/* Libraries *****/

/**
 * @title SalaryNegotiation
 * @author BTBMan
 * @notice Manages encrypted salary adjustment negotiations for existing employees.
 * @dev Match results stay encrypted; the public status only records that the comparison was computed.
 */
contract SalaryNegotiation is ISalaryNegotiation, ZamaEthereumConfig {
    ////////////////////////////////////
    // State variables                //
    ////////////////////////////////////
    // Registry used as the source of company membership and owner permissions.
    ICompanyRegistry public immutable companyRegistry;
    // Payroll core that stores the official encrypted monthly salary.
    ISalaryCipherCore public immutable salaryCipherCore;
    // Next negotiation id to assign. Zero is reserved as the "none" sentinel.
    uint256 public nextNegotiationId;

    // Public negotiation metadata indexed by id.
    mapping(uint256 negotiationId => Negotiation negotiation)
        public negotiations;
    // Encrypted round data indexed by negotiation id and round number.
    mapping(uint256 negotiationId => mapping(uint256 round => NegotiationRound data))
        private negotiationRounds;
    // Historical negotiation ids for a company employee.
    mapping(uint256 companyId => mapping(address employee => uint256[] ids))
        private negotiationHistory;
    // Active negotiation id for one employee. Zero means no active negotiation.
    mapping(uint256 companyId => mapping(address employee => uint256 id))
        public activeNegotiationId;

    ////////////////////////////////////
    // Modifiers                      //
    ////////////////////////////////////
    /// @notice Restricts execution to the company owner.
    modifier onlyOwner(uint256 companyId) {
        _requireOwner(companyId, msg.sender);
        _;
    }

    /**
     * @notice Binds the negotiation contract to the platform registry and payroll core.
     * @param companyRegistryAddress The deployed CompanyRegistry address.
     * @param salaryCipherCoreAddress The deployed SalaryCipherCore address.
     */
    constructor(
        address companyRegistryAddress,
        address salaryCipherCoreAddress
    ) {
        if (
            companyRegistryAddress == address(0) ||
            salaryCipherCoreAddress == address(0)
        ) {
            revert SalaryNegotiation__InvalidAddress();
        }

        companyRegistry = ICompanyRegistry(companyRegistryAddress);
        salaryCipherCore = ISalaryCipherCore(salaryCipherCoreAddress);
        nextNegotiationId = 1;
    }

    ////////////////////////////////////
    // Receive & Fallback             //
    ////////////////////////////////////

    ////////////////////////////////////
    // Functions                      //
    ////////////////////////////////////
    /**
     * @notice Creates a salary adjustment negotiation for an existing employee.
     * @dev Owner can create for any HR/employee; HR/employee can only create for self.
     * @param companyId The company namespace.
     * @param employee The existing employee whose salary is being adjusted.
     */
    function createNegotiation(
        uint256 companyId,
        address employee
    ) external returns (uint256 negotiationId) {
        _requireNegotiableEmployee(companyId, employee);
        if (msg.sender != employee) {
            _requireOwner(companyId, msg.sender);
        }
        if (activeNegotiationId[companyId][employee] != 0) {
            revert SalaryNegotiation__ActiveNegotiationExists();
        }

        negotiationId = nextNegotiationId++;
        uint64 timestamp = _blockTimestamp();

        negotiations[negotiationId] = Negotiation({
            companyId: companyId,
            employee: employee,
            initiator: msg.sender,
            currentRound: 1,
            status: Status.Open,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        negotiationRounds[negotiationId][1].createdAt = timestamp;
        negotiationHistory[companyId][employee].push(negotiationId);
        activeNegotiationId[companyId][employee] = negotiationId;

        emit NegotiationCreated(negotiationId, companyId, employee, msg.sender);
    }

    /**
     * @notice Submits the owner's encrypted salary offer for the current round.
     * @param negotiationId The negotiation id.
     * @param encryptedOffer External encrypted salary offer handle.
     * @param inputProof FHE input proof for encryptedOffer.
     */
    function submitEmployerOffer(
        uint256 negotiationId,
        externalEuint128 encryptedOffer,
        bytes calldata inputProof
    ) external {
        Negotiation storage negotiation = _requireExistingNegotiation(
            negotiationId
        );
        _requireOwner(negotiation.companyId, msg.sender);
        _requireSubmittableStatus(negotiation.status);

        NegotiationRound storage round = negotiationRounds[negotiationId][
            negotiation.currentRound
        ];
        if (round.hasEmployerOffer) {
            revert SalaryNegotiation__OfferAlreadySubmitted();
        }

        round.employerOffer = FHE.fromExternal(encryptedOffer, inputProof);
        round.hasEmployerOffer = true;
        FHE.allowThis(round.employerOffer);

        _refreshSubmissionStatus(negotiation, round);

        emit EmployerOfferSubmitted(negotiationId, negotiation.currentRound);
    }

    /**
     * @notice Submits the employee's encrypted salary ask for the current round.
     * @param negotiationId The negotiation id.
     * @param encryptedAsk External encrypted salary ask handle.
     * @param inputProof FHE input proof for encryptedAsk.
     */
    function submitEmployeeAsk(
        uint256 negotiationId,
        externalEuint128 encryptedAsk,
        bytes calldata inputProof
    ) external {
        Negotiation storage negotiation = _requireExistingNegotiation(
            negotiationId
        );
        if (msg.sender != negotiation.employee) {
            revert SalaryNegotiation__Unauthorized();
        }
        _requireSubmittableStatus(negotiation.status);

        NegotiationRound storage round = negotiationRounds[negotiationId][
            negotiation.currentRound
        ];
        if (round.hasEmployeeAsk) {
            revert SalaryNegotiation__AskAlreadySubmitted();
        }

        round.employeeAsk = FHE.fromExternal(encryptedAsk, inputProof);
        round.hasEmployeeAsk = true;
        FHE.allowThis(round.employeeAsk);

        _refreshSubmissionStatus(negotiation, round);

        emit EmployeeAskSubmitted(negotiationId, negotiation.currentRound);
    }

    /**
     * @notice Computes the encrypted match result for the current round.
     * @dev The boolean result stays encrypted; public status becomes Computed.
     * @param negotiationId The negotiation id.
     */
    function computeMatch(uint256 negotiationId) external returns (ebool) {
        Negotiation storage negotiation = _requireExistingNegotiation(
            negotiationId
        );
        if (negotiation.status != Status.ReadyToMatch) {
            revert SalaryNegotiation__InvalidStatus();
        }

        NegotiationRound storage round = negotiationRounds[negotiationId][
            negotiation.currentRound
        ];
        // Normalize the comparison into an initialized encrypted boolean.
        // The mock fhEVM may encode a false comparison as an uninitialized
        // handle; select() forces both true and false outcomes into decryptable handles.
        round.matched = FHE.select(
            FHE.le(round.employeeAsk, round.employerOffer),
            FHE.asEbool(true),
            FHE.asEbool(false)
        );
        round.finalSalary = round.employerOffer;
        round.resolvedAt = _blockTimestamp();

        FHE.allowThis(round.matched);
        FHE.allow(round.matched, _companyOwner(negotiation.companyId));
        FHE.allow(round.matched, negotiation.employee);
        FHE.allowThis(round.finalSalary);
        FHE.allow(round.finalSalary, _companyOwner(negotiation.companyId));
        FHE.allow(round.finalSalary, negotiation.employee);
        FHE.allow(round.finalSalary, address(salaryCipherCore));

        negotiation.status = Status.Computed;
        negotiation.updatedAt = round.resolvedAt;

        emit MatchComputed(negotiationId, negotiation.currentRound);

        return round.matched;
    }

    /**
     * @notice Applies the computed employer offer as the employee's official salary.
     * @dev Frontend should only enable this after the owner decrypts matched=true.
     * @param negotiationId The negotiation id.
     */
    function applyMatchedSalary(
        uint256 negotiationId
    ) external returns (euint128) {
        Negotiation storage negotiation = _requireExistingNegotiation(
            negotiationId
        );
        _requireOwner(negotiation.companyId, msg.sender);
        if (negotiation.status != Status.Computed) {
            revert SalaryNegotiation__InvalidStatus();
        }

        NegotiationRound storage round = negotiationRounds[negotiationId][
            negotiation.currentRound
        ];
        salaryCipherCore.setNegotiatedSalary(
            negotiation.companyId,
            negotiation.employee,
            round.finalSalary
        );

        negotiation.status = Status.Applied;
        negotiation.updatedAt = _blockTimestamp();
        activeNegotiationId[negotiation.companyId][negotiation.employee] = 0;

        emit NegotiatedSalaryApplied(
            negotiationId,
            negotiation.companyId,
            negotiation.employee
        );

        return round.finalSalary;
    }

    /**
     * @notice Starts a new encrypted round after a computed result.
     * @dev The contract cannot know Match / No Match without public decryption,
     * so the UI should only expose this action after users decrypt No Match.
     * @param negotiationId The negotiation id.
     */
    function newRound(
        uint256 negotiationId
    ) external returns (uint256 roundId) {
        Negotiation storage negotiation = _requireExistingNegotiation(
            negotiationId
        );
        if (
            msg.sender != negotiation.employee &&
            !_isOwner(negotiation.companyId, msg.sender)
        ) {
            revert SalaryNegotiation__Unauthorized();
        }
        if (negotiation.status != Status.Computed) {
            revert SalaryNegotiation__InvalidStatus();
        }

        roundId = negotiation.currentRound + 1;
        negotiation.currentRound = roundId;
        negotiation.status = Status.Open;
        negotiation.updatedAt = _blockTimestamp();
        negotiationRounds[negotiationId][roundId].createdAt = negotiation
            .updatedAt;

        emit NewRoundStarted(negotiationId, roundId);
    }

    /**
     * @notice Cancels an active negotiation before the salary is applied.
     * @dev Owner can cancel any active negotiation; employee can cancel only self-initiated negotiations.
     * @param negotiationId The negotiation id.
     */
    function cancelNegotiation(uint256 negotiationId) external {
        Negotiation storage negotiation = _requireExistingNegotiation(
            negotiationId
        );
        if (negotiation.status == Status.Applied) {
            revert SalaryNegotiation__InvalidStatus();
        }
        if (
            !_isOwner(negotiation.companyId, msg.sender) &&
            (msg.sender != negotiation.employee ||
                msg.sender != negotiation.initiator)
        ) {
            revert SalaryNegotiation__Unauthorized();
        }

        negotiation.status = Status.Cancelled;
        negotiation.updatedAt = _blockTimestamp();
        activeNegotiationId[negotiation.companyId][negotiation.employee] = 0;

        emit NegotiationCancelled(negotiationId);
    }

    ////////////////////////////////////
    // Getter functions               //
    ////////////////////////////////////
    /// @notice Returns encrypted data for one negotiation round.
    function getNegotiationRound(
        uint256 negotiationId,
        uint256 roundId
    ) external view returns (NegotiationRound memory) {
        _requireExistingNegotiation(negotiationId);
        return negotiationRounds[negotiationId][roundId];
    }

    /// @notice Returns all negotiation ids for one employee in a company.
    function getNegotiationHistory(
        uint256 companyId,
        address employee
    ) external view returns (uint256[] memory) {
        return negotiationHistory[companyId][employee];
    }

    /// @dev Reverts unless the negotiation exists and returns its storage pointer.
    function _requireExistingNegotiation(
        uint256 negotiationId
    ) private view returns (Negotiation storage negotiation) {
        negotiation = negotiations[negotiationId];
        if (negotiation.companyId == 0) {
            revert SalaryNegotiation__NegotiationDoesNotExist();
        }
    }

    /// @dev Reverts unless the status can still accept encrypted offer submissions.
    function _requireSubmittableStatus(Status status) private pure {
        if (
            status != Status.Open &&
            status != Status.WaitingEmployerOffer &&
            status != Status.WaitingEmployeeAsk
        ) {
            revert SalaryNegotiation__InvalidStatus();
        }
    }

    /// @dev Updates the public waiting state after one encrypted side submits.
    function _refreshSubmissionStatus(
        Negotiation storage negotiation,
        NegotiationRound storage round
    ) private {
        if (round.hasEmployerOffer && round.hasEmployeeAsk) {
            negotiation.status = Status.ReadyToMatch;
        } else if (round.hasEmployerOffer) {
            negotiation.status = Status.WaitingEmployeeAsk;
        } else {
            negotiation.status = Status.WaitingEmployerOffer;
        }
        negotiation.updatedAt = _blockTimestamp();
    }

    /// @dev Reverts unless employee is an active non-owner member eligible for salary adjustment.
    function _requireNegotiableEmployee(
        uint256 companyId,
        address employee
    ) private view {
        if (employee == address(0)) {
            revert SalaryNegotiation__InvalidEmployee();
        }

        ICompanyRegistry.Role role = companyRegistry.getRole(
            companyId,
            employee
        );
        if (
            role != ICompanyRegistry.Role.HR &&
            role != ICompanyRegistry.Role.Employee
        ) {
            revert SalaryNegotiation__InvalidEmployee();
        }
    }

    /// @dev Reverts unless account is the company owner.
    function _requireOwner(uint256 companyId, address account) private view {
        if (!_isOwner(companyId, account)) {
            revert SalaryNegotiation__Unauthorized();
        }
    }

    /// @dev Returns whether account is the company owner according to CompanyRegistry.
    function _isOwner(
        uint256 companyId,
        address account
    ) private view returns (bool) {
        return
            companyRegistry.getRole(companyId, account) ==
            ICompanyRegistry.Role.Owner;
    }

    /// @dev Returns the company owner address from the registry company record.
    function _companyOwner(uint256 companyId) private view returns (address) {
        ICompanyRegistry.Company memory companyInfo = companyRegistry
            .getCompany(companyId);
        if (companyInfo.owner == address(0)) {
            revert SalaryNegotiation__Unauthorized();
        }

        return companyInfo.owner;
    }

    /// @dev Returns the current block timestamp in the compact type used by storage.
    function _blockTimestamp() private view returns (uint64) {
        return uint64(block.timestamp);
    }
}

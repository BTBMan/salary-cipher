// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {ebool, euint128} from "@fhevm/solidity/lib/FHE.sol";

interface ISalaryNegotiation {
    ////////////////////////////////////
    // Type declarations              //
    ////////////////////////////////////
    /// @notice Public lifecycle state for one negotiation.
    enum Status {
        Open,
        WaitingEmployerOffer,
        WaitingEmployeeAsk,
        ReadyToMatch,
        Computed,
        Applied,
        Cancelled
    }

    /// @notice Plain metadata for one employee salary adjustment negotiation.
    struct Negotiation {
        // Company namespace this negotiation belongs to.
        uint256 companyId;
        // Existing HR or employee whose salary is being adjusted.
        address employee;
        // Account that created the negotiation.
        address initiator;
        // Current round number, starting from 1.
        uint256 currentRound;
        // Public lifecycle state. Match / No Match is encrypted in the round.
        Status status;
        // Creation timestamp.
        uint64 createdAt;
        // Last update timestamp.
        uint64 updatedAt;
    }

    /// @notice Encrypted offer data for one negotiation round.
    struct NegotiationRound {
        // Company's encrypted salary offer for this round.
        euint128 employerOffer;
        // Employee's encrypted salary ask for this round.
        euint128 employeeAsk;
        // Salary that can be applied if the decrypted match result is true.
        euint128 finalSalary;
        // Encrypted result of employeeAsk <= employerOffer.
        ebool matched;
        // Whether the company offer has been submitted in this round.
        bool hasEmployerOffer;
        // Whether the employee ask has been submitted in this round.
        bool hasEmployeeAsk;
        // Round creation timestamp.
        uint64 createdAt;
        // Comparison timestamp.
        uint64 resolvedAt;
    }

    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////
    /// @notice Emitted when a salary adjustment negotiation is created.
    event NegotiationCreated(
        uint256 indexed negotiationId,
        uint256 indexed companyId,
        address indexed employee,
        address initiator
    );
    /// @notice Emitted when the owner submits the encrypted company offer.
    event EmployerOfferSubmitted(
        uint256 indexed negotiationId,
        uint256 indexed round
    );
    /// @notice Emitted when the employee submits the encrypted salary ask.
    event EmployeeAskSubmitted(
        uint256 indexed negotiationId,
        uint256 indexed round
    );
    /// @notice Emitted after the encrypted match comparison is computed.
    event MatchComputed(uint256 indexed negotiationId, uint256 indexed round);
    /// @notice Emitted when the owner applies the computed salary offer to payroll core.
    event NegotiatedSalaryApplied(
        uint256 indexed negotiationId,
        uint256 indexed companyId,
        address indexed employee
    );
    /// @notice Emitted when a new encrypted negotiation round starts.
    event NewRoundStarted(uint256 indexed negotiationId, uint256 indexed round);
    /// @notice Emitted when an active negotiation is cancelled.
    event NegotiationCancelled(uint256 indexed negotiationId);

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////
    error SalaryNegotiation__InvalidAddress();
    error SalaryNegotiation__Unauthorized();
    error SalaryNegotiation__InvalidEmployee();
    error SalaryNegotiation__ActiveNegotiationExists();
    error SalaryNegotiation__NegotiationDoesNotExist();
    error SalaryNegotiation__InvalidStatus();
    error SalaryNegotiation__OfferAlreadySubmitted();
    error SalaryNegotiation__AskAlreadySubmitted();
}

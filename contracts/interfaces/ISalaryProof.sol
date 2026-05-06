// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {ebool} from "@fhevm/solidity/lib/FHE.sol";

interface ISalaryProof {
    ////////////////////////////////////
    // Type declarations              //
    ////////////////////////////////////
    /// @notice Fixed proof types supported by the current product version.
    enum ProofType {
        MONTHLY_GTE,
        MONTHLY_BETWEEN,
        EMPLOYMENT_DURATION_GTE
    }

    /// @notice Public proof metadata plus encrypted verification result.
    struct Proof {
        // Company namespace associated with this proof.
        uint256 companyId;
        // Employee account that owns this proof.
        address employee;
        // Fixed proof type selected by the employee.
        ProofType proofType;
        // Encrypted boolean result. Authorized viewers can decrypt it off-chain through Zama.
        ebool result;
        // Timestamp when the proof was generated.
        uint64 createdAt;
        // Timestamp after which the proof should no longer be accepted.
        uint64 expiresAt;
        // Whether the employee has revoked this proof.
        bool revoked;
        // Whether this proof has already been minted as an NFT credential.
        bool minted;
        // ERC721 token id minted for this proof. Zero means no NFT.
        uint256 tokenId;
    }

    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////
    /// @notice Emitted when an employee generates a salary proof.
    event ProofGenerated(
        uint256 indexed proofId,
        uint256 indexed companyId,
        address indexed employee,
        ProofType proofType,
        uint64 expiresAt
    );
    /// @notice Emitted when an employee authorizes a verifier to decrypt the proof result.
    event VerifierAuthorized(uint256 indexed proofId, address indexed verifier);
    /// @notice Emitted when an employee revokes a proof.
    event ProofRevoked(uint256 indexed proofId);
    /// @notice Emitted when a proof is minted as an NFT credential.
    event ProofNFTMinted(uint256 indexed proofId, uint256 indexed tokenId);

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////
    error SalaryProof__InvalidAddress();
    error SalaryProof__InvalidProofType();
    error SalaryProof__InvalidValidity();
    error SalaryProof__InvalidDuration();
    error SalaryProof__ProofDoesNotExist();
    error SalaryProof__Unauthorized();
    error SalaryProof__ProofExpired();
    error SalaryProof__ProofRevoked();
    error SalaryProof__ProofAlreadyMinted();
    error SalaryProof__InvalidTokenURI();
}

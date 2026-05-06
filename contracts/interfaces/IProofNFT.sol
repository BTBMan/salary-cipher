// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/

interface IProofNFT {
    ////////////////////////////////////
    // Type declarations              //
    ////////////////////////////////////

    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////
    /// @notice Emitted when the authorized SalaryProof minter is configured.
    event SalaryProofContractUpdated(address indexed salaryProofContract);
    /// @notice Emitted when a proof is minted as an ERC721 credential.
    event ProofNFTMinted(
        uint256 indexed proofId,
        uint256 indexed tokenId,
        address indexed to,
        string tokenURI
    );

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////
    error ProofNFT__InvalidAddress();
    error ProofNFT__InvalidTokenURI();
    error ProofNFT__OnlySalaryProof();
    error ProofNFT__ProofAlreadyMinted();
}

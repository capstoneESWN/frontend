// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DIDRegistry {
    mapping(address => string) private didDocuments;

    function registerDID(string memory didDocument) public {
        didDocuments[msg.sender] = didDocument;
    }

    function getDID(address user) public view returns (string memory) {
        return didDocuments[user];
    }
}

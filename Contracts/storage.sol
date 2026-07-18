// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocumentStorage {
    struct Document {
        uint256 timestamp;
        address publisher;
    }

    mapping(string => Document) public documents;

    event DocumentPublished(string indexed hash, uint256 timestamp, address indexed publisher);

    function publishDocument(string memory _hash) public {
        require(documents[_hash].timestamp == 0, "Document already published");
        
        documents[_hash] = Document({
            timestamp: block.timestamp,
            publisher: msg.sender
        });

        emit DocumentPublished(_hash, block.timestamp, msg.sender);
    }

    function verifyDocument(string memory _hash) public view returns (uint256 timestamp, address publisher) {
        Document memory doc = documents[_hash];
        return (doc.timestamp, doc.publisher);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BudgetLedger
 * @notice Immutable, tamper-evident registry for budget allocation records.
 *
 * The BudgetChain backend anchors each budget allocation by writing its
 * SHA-256 content hash to this contract. Any mutation of the source record
 * changes the hash, so `verify` returns `exists = false` for a record that no
 * longer matches the on-chain hash — providing cryptographic accountability
 * for the government financial workflow.
 */
contract BudgetLedger {
    struct Record {
        bytes32 contentHash;
        address anchoredBy;
        uint256 anchoredAt;
        uint256 blockNumber;
    }

    /// Contract owner (backend deployer / anchoring key).
    address private _owner;

    /// Mapping from content hash to its anchored record.
    mapping(bytes32 => Record) private _records;

    /// Total number of hashes anchored on this ledger.
    uint256 private _recordCount;

    /// Emitted when a content hash is anchored.
    event Recorded(bytes32 indexed contentHash, address indexed anchoredBy, uint256 blockNumber, uint256 timestamp);

    error HashAlreadyRecorded(bytes32 contentHash);
    error HashNotRecorded(bytes32 contentHash);
    error NotOwner();

    constructor() {
        _owner = msg.sender;
    }

    /**
     * @notice Return the owner address authorized to anchor records.
     */
    function owner() external view returns (address) {
        return _owner;
    }

    /**
     * @notice Anchor a content hash on the ledger. Reverts if called by non-owner or if already recorded.
     * @param contentHash 32-byte hash (e.g. SHA-256) of the budget allocation record
     * @return recordIndex The total number of records after anchoring
     */
    function record(bytes32 contentHash) external returns (uint256 recordIndex) {
        if (msg.sender != _owner) {
            revert NotOwner();
        }

        if (_records[contentHash].anchoredAt != 0) {
            revert HashAlreadyRecorded(contentHash);
        }

        _records[contentHash] = Record({
            contentHash: contentHash,
            anchoredBy: msg.sender,
            anchoredAt: block.timestamp,
            blockNumber: block.number
        });
        _recordCount += 1;

        emit Recorded(contentHash, msg.sender, block.number, block.timestamp);
        return _recordCount;
    }

    /**
     * @notice Verify whether a content hash is anchored on the ledger.
     * @param contentHash 32-byte hash to check
     * @return exists Whether the hash exists on the ledger
     * @return anchoredBy Address that anchored the hash
     * @return anchoredAt Unix timestamp the hash was anchored
     * @return blockNumber Block number the hash was anchored in
     */
    function verify(bytes32 contentHash)
        external
        view
        returns (bool exists, address anchoredBy, uint256 anchoredAt, uint256 blockNumber)
    {
        Record storage rec = _records[contentHash];
        return (rec.anchoredAt != 0, rec.anchoredBy, rec.anchoredAt, rec.blockNumber);
    }

    /**
     * @notice Fetch the full anchored record for a content hash.
     * @param contentHash 32-byte hash to look up
     * @return rec The anchored record (all zeroes if not present)
     */
    function getRecord(bytes32 contentHash) external view returns (Record memory rec) {
        return _records[contentHash];
    }

    /**
     * @notice Return the total number of anchored hashes.
     */
    function recordCount() external view returns (uint256) {
        return _recordCount;
    }
}

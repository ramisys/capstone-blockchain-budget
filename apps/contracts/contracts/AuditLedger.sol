// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AuditLedger
 * @notice Immutable, tamper-evident registry for audit / status-change events.
 *
 * The BudgetChain backend anchors every persisted audit log entry by writing
 * its SHA-256 event hash (of a canonical payload that includes a UUID and a
 * timestamp) to this contract. Because identical actions can never produce the
 * same payload twice, the `eventHash` is effectively unique, so re-anchoring
 * the same event reverts with `EventAlreadyRecorded` (guarding the crash-window
 * where the database write failed but the on-chain write succeeded).
 *
 * This is a separate ledger from `BudgetLedger` on purpose: that contract holds
 * the content integrity of financial records, while this one holds immutable
 * activity/status events.
 */
contract AuditLedger {
    struct AuditEvent {
        bytes32 eventHash;
        string category;
        address anchoredBy;
        uint256 anchoredAt;
        uint256 blockNumber;
    }

    /// Contract owner (backend deployer / anchoring key).
    address private _owner;

    /// Mapping from event hash to its anchored record.
    mapping(bytes32 => AuditEvent) private _events;

    /// Number of events anchored per category.
    mapping(string => uint256) private _categoryCounts;

    /// Total number of events anchored on this ledger.
    uint256 private _eventCount;

    /// Emitted when an audit event is anchored.
    event EventRecorded(
        bytes32 indexed eventHash,
        string indexed category,
        address indexed anchoredBy,
        uint256 blockNumber,
        uint256 timestamp
    );

    error EventAlreadyRecorded(bytes32 eventHash);
    error InvalidCategory();
    error NotOwner();

    constructor() {
        _owner = msg.sender;
    }

    /**
     * @notice Return the owner address authorized to anchor events.
     */
    function owner() external view returns (address) {
        return _owner;
    }

    /**
     * @notice Anchor an audit event on the ledger. Reverts if called by a
     * non-owner, if the category is empty, or if the event hash is already
     * recorded.
     * @param eventHash 32-byte hash (e.g. SHA-256) of the canonical audit payload
     * @param category  Non-empty category describing the event (e.g. the audit action)
     * @return eventCountAfter The total number of events after anchoring
     */
    function recordEvent(bytes32 eventHash, string calldata category)
        external
        returns (uint256 eventCountAfter)
    {
        if (msg.sender != _owner) {
            revert NotOwner();
        }
        if (bytes(category).length == 0) {
            revert InvalidCategory();
        }
        if (_events[eventHash].anchoredAt != 0) {
            revert EventAlreadyRecorded(eventHash);
        }

        _events[eventHash] = AuditEvent({
            eventHash: eventHash,
            category: category,
            anchoredBy: msg.sender,
            anchoredAt: block.timestamp,
            blockNumber: block.number
        });
        _categoryCounts[category] += 1;
        _eventCount += 1;

        emit EventRecorded(eventHash, category, msg.sender, block.number, block.timestamp);
        return _eventCount;
    }

    /**
     * @notice Verify whether an event hash is anchored on the ledger.
     * @param eventHash 32-byte hash to check
     * @return exists Whether the event exists on the ledger
     * @return category Category the event was anchored under
     * @return anchoredBy Address that anchored the event
     * @return anchoredAt Unix timestamp the event was anchored
     * @return blockNumber Block number the event was anchored in
     */
    function verifyEvent(bytes32 eventHash)
        external
        view
        returns (
            bool exists,
            string memory category,
            address anchoredBy,
            uint256 anchoredAt,
            uint256 blockNumber
        )
    {
        AuditEvent storage ev = _events[eventHash];
        return (ev.anchoredAt != 0, ev.category, ev.anchoredBy, ev.anchoredAt, ev.blockNumber);
    }

    /**
     * @notice Fetch the full anchored record for an event hash.
     * @dev Named `getAuditEvent` (not `getEvent`) to avoid colliding with the
     * ethers.js `Contract.getEvent` fragment-lookup helper.
     * @param eventHash 32-byte hash to look up
     * @return ev The anchored event (empty if not present)
     */
    function getAuditEvent(bytes32 eventHash) external view returns (AuditEvent memory ev) {
        return _events[eventHash];
    }

    /**
     * @notice Return how many events have been anchored under a given category.
     * @param category Category to count
     * @return count Number of events anchored for that category
     */
    function eventCount(string calldata category) external view returns (uint256 count) {
        return _categoryCounts[category];
    }

    /**
     * @notice Return the total number of anchored events.
     */
    function totalEvents() external view returns (uint256) {
        return _eventCount;
    }
}

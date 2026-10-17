// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MediTrace - Pharmaceutical Authenticity & Batch Recall Registry
 * @notice A decentralized system for drug authenticity verification and batch recall management.
 * @dev Designed for CSE4444: Blockchain Technology (Assignment 2).
 *      Compatible with Remix IDE (Solidity 0.8.20 / 0.8.26), Ganache, and Sepolia Testnet.
 */
contract MediTrace {
    // =========================================================================
    // ENUMS & STRUCTS
    // =========================================================================

    enum BatchStatus {
        Active,         // Valid and safe for distribution/consumption (0)
        Recalled,       // Flagged as defective/compromised by manufacturer or regulator (1)
        Discontinued    // Deliberately retired by manufacturer (2)
    }

    struct MedicineBatch {
        string batchId;              // Unique identifier (e.g., "LOT-2026-001")
        string medicineName;         // Commercial drug name (e.g., "Amoxicillin 500mg")
        string brandName;            // Manufacturer brand or laboratory name
        address manufacturer;        // Address of the authorized manufacturer
        uint256 mfgTimestamp;        // Block timestamp when registered
        uint256 expiryTimestamp;     // Expiration timestamp (UNIX seconds)
        uint256 unitCount;           // Quantity of units in batch
        string complianceCertHash;   // IPFS CID or SHA256 checksum of lab QC certificate
        BatchStatus status;          // Current lifecycle status (Active / Recalled / Discontinued)
        string recallReason;         // Public recall reason (empty if not recalled)
        uint256 recalledTimestamp;   // Timestamp when recalled (0 if not recalled)
        address recalledBy;          // Address of party who initiated the recall
    }

    // =========================================================================
    // STATE VARIABLES
    // =========================================================================

    /// @notice Contract deployer (Health Regulatory Authority / Admin)
    address public immutable owner;

    /// @notice Counter for total registered batches
    uint256 public totalBatchesCount;

    /// @notice Counter for total recalled batches
    uint256 public totalRecallsCount;

    /// @notice Mapping from manufacturer wallet address to authorization status
    mapping(address => bool) public isManufacturer;

    /// @notice Mapping from manufacturer address to registered corporate/entity name
    mapping(address => string) public manufacturerNames;

    /// @notice Mapping from batchId string to MedicineBatch record
    mapping(string => MedicineBatch) private batches;

    /// @notice Fast lookup to check if a batchId has already been registered
    mapping(string => bool) private batchExistsMap;

    /// @notice Array of all registered batch IDs for enumeration and UI ledger display
    string[] private allBatchIds;

    // =========================================================================
    // EVENTS
    // =========================================================================

    event ManufacturerAuthorized(address indexed manufacturer, string name, uint256 timestamp);
    event ManufacturerRevoked(address indexed manufacturer, uint256 timestamp);
    event BatchRegistered(
        string indexed batchId,
        string medicineName,
        string brandName,
        address indexed manufacturer,
        uint256 expiryTimestamp,
        uint256 unitCount,
        uint256 timestamp
    );
    event BatchRecalled(
        string indexed batchId,
        address indexed recalledBy,
        string reason,
        uint256 timestamp
    );
    event BatchStatusUpdated(
        string indexed batchId,
        BatchStatus oldStatus,
        BatchStatus newStatus,
        uint256 timestamp
    );

    // =========================================================================
    // CUSTOM ERRORS (Gas-efficient validation)
    // =========================================================================

    error OnlyOwnerAllowed();
    error OnlyManufacturerAllowed();
    error NotAuthorizedToRecall();
    error InvalidAddress();
    error EmptyStringNotAllowed(string fieldName);
    error BatchAlreadyExists(string batchId);
    error BatchNotFound(string batchId);
    error ExpiryMustBeInFuture(uint256 providedExpiry, uint256 currentTimestamp);
    error InvalidUnitCount();
    error BatchAlreadyRecalled(string batchId);
    error ManufacturerAlreadyAuthorized(address manufacturer);
    error ManufacturerNotAuthorized(address manufacturer);

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    /// @dev Restricts execution to the regulatory authority (contract deployer)
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert OnlyOwnerAllowed();
        }
        _;
    }

    /// @dev Restricts execution to active authorized pharmaceutical manufacturers
    modifier onlyManufacturer() {
        if (!isManufacturer[msg.sender]) {
            revert OnlyManufacturerAllowed();
        }
        _;
    }

    /// @dev Ensures the batch exists on-chain before executing
    modifier batchMustExist(string calldata _batchId) {
        if (!batchExistsMap[_batchId]) {
            revert BatchNotFound(_batchId);
        }
        _;
    }

    /// @dev Ensures the batch does not already exist on-chain to prevent overwriting
    modifier batchMustNotExist(string calldata _batchId) {
        if (batchExistsMap[_batchId]) {
            revert BatchAlreadyExists(_batchId);
        }
        _;
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    /**
     * @notice Initializes the contract and sets the deployer as the Regulatory Authority
     */
    constructor() {
        owner = msg.sender;
    }

    // =========================================================================
    // REGULATOR / ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Authorizes a pharmaceutical manufacturer to register medicine batches
     * @param _manufacturer Address of the pharmaceutical company
     * @param _name Registered corporate/entity name
     */
    function authorizeManufacturer(
        address _manufacturer,
        string calldata _name
    ) external onlyOwner {
        if (_manufacturer == address(0)) revert InvalidAddress();
        if (isManufacturer[_manufacturer]) revert ManufacturerAlreadyAuthorized(_manufacturer);
        if (bytes(_name).length == 0) revert EmptyStringNotAllowed("Manufacturer Name");

        isManufacturer[_manufacturer] = true;
        manufacturerNames[_manufacturer] = _name;

        emit ManufacturerAuthorized(_manufacturer, _name, block.timestamp);
    }

    /**
     * @notice Revokes a manufacturer's authorization to prevent future batch registrations
     * @param _manufacturer Address of the manufacturer to revoke
     */
    function revokeManufacturer(address _manufacturer) external onlyOwner {
        if (_manufacturer == address(0)) revert InvalidAddress();
        if (!isManufacturer[_manufacturer]) revert ManufacturerNotAuthorized(_manufacturer);

        isManufacturer[_manufacturer] = false;

        emit ManufacturerRevoked(_manufacturer, block.timestamp);
    }

    // =========================================================================
    // MANUFACTURER FUNCTIONS
    // =========================================================================

    /**
     * @notice Registers a new production batch of medicine on the blockchain
     * @param _batchId Unique batch identifier (e.g. "LOT-2026-001")
     * @param _medicineName Drug generic or commercial name (e.g. "Paracetamol 500mg")
     * @param _brandName Brand or laboratory trade name (e.g. "Panadol")
     * @param _expiryTimestamp Expiry UNIX timestamp in seconds (must be in the future)
     * @param _unitCount Number of dosage units produced in this batch
     * @param _complianceCertHash Cryptographic or IPFS hash of the laboratory QA certificate
     */
    function registerBatch(
        string calldata _batchId,
        string calldata _medicineName,
        string calldata _brandName,
        uint256 _expiryTimestamp,
        uint256 _unitCount,
        string calldata _complianceCertHash
    ) external onlyManufacturer batchMustNotExist(_batchId) {
        if (bytes(_batchId).length == 0) revert EmptyStringNotAllowed("Batch ID");
        if (bytes(_medicineName).length == 0) revert EmptyStringNotAllowed("Medicine Name");
        if (bytes(_brandName).length == 0) revert EmptyStringNotAllowed("Brand Name");
        if (_expiryTimestamp <= block.timestamp) {
            revert ExpiryMustBeInFuture(_expiryTimestamp, block.timestamp);
        }
        if (_unitCount == 0) revert InvalidUnitCount();

        batches[_batchId] = MedicineBatch({
            batchId: _batchId,
            medicineName: _medicineName,
            brandName: _brandName,
            manufacturer: msg.sender,
            mfgTimestamp: block.timestamp,
            expiryTimestamp: _expiryTimestamp,
            unitCount: _unitCount,
            complianceCertHash: _complianceCertHash,
            status: BatchStatus.Active,
            recallReason: "",
            recalledTimestamp: 0,
            recalledBy: address(0)
        });

        batchExistsMap[_batchId] = true;
        allBatchIds.push(_batchId);
        totalBatchesCount += 1;

        emit BatchRegistered(
            _batchId,
            _medicineName,
            _brandName,
            msg.sender,
            _expiryTimestamp,
            _unitCount,
            block.timestamp
        );
    }

    // =========================================================================
    // RECALL MANAGEMENT FUNCTIONS
    // =========================================================================

    /**
     * @notice Flags a batch as recalled if contamination or safety issues are discovered
     * @dev Accessible only by the regulatory authority (owner) OR the manufacturer that created the batch
     * @param _batchId The unique batch identifier
     * @param _reason Clear justification for the recall action
     */
    function recallBatch(
        string calldata _batchId,
        string calldata _reason
    ) external batchMustExist(_batchId) {
        if (bytes(_reason).length == 0) revert EmptyStringNotAllowed("Recall Reason");

        MedicineBatch storage batch = batches[_batchId];

        // Access control: Only regulator (owner) OR the producing manufacturer can recall
        if (msg.sender != owner && msg.sender != batch.manufacturer) {
            revert NotAuthorizedToRecall();
        }

        if (batch.status == BatchStatus.Recalled) {
            revert BatchAlreadyRecalled(_batchId);
        }

        BatchStatus oldStatus = batch.status;
        batch.status = BatchStatus.Recalled;
        batch.recallReason = _reason;
        batch.recalledTimestamp = block.timestamp;
        batch.recalledBy = msg.sender;

        totalRecallsCount += 1;

        emit BatchRecalled(_batchId, msg.sender, _reason, block.timestamp);
        emit BatchStatusUpdated(_batchId, oldStatus, BatchStatus.Recalled, block.timestamp);
    }

    // =========================================================================
    // PUBLIC VIEW / VERIFICATION FUNCTIONS (Gas-Free)
    // =========================================================================

    /**
     * @notice Performs a complete public authenticity & safety verification of any medicine batch
     * @param _batchId The batch identifier to query
     * @return batch The complete MedicineBatch record
     * @return isAuthentic True if batch exists in this immutable registry
     * @return isExpired True if current block.timestamp is greater than or equal to expiryTimestamp
     * @return isRecalled True if batch status is Recalled
     * @return manufacturerName The official registered name of the manufacturer
     */
    function verifyBatch(string calldata _batchId)
        external
        view
        batchMustExist(_batchId)
        returns (
            MedicineBatch memory batch,
            bool isAuthentic,
            bool isExpired,
            bool isRecalled,
            string memory manufacturerName
        )
    {
        batch = batches[_batchId];
        isAuthentic = true;
        isExpired = block.timestamp >= batch.expiryTimestamp;
        isRecalled = (batch.status == BatchStatus.Recalled);
        manufacturerName = manufacturerNames[batch.manufacturer];
    }

    /**
     * @notice Checks if a batch identifier has been registered on-chain
     * @param _batchId The batch identifier to check
     * @return exists True if the batch exists, false otherwise
     */
    function doesBatchExist(string calldata _batchId) external view returns (bool exists) {
        return batchExistsMap[_batchId];
    }

    /**
     * @notice Retrieves the full list of registered batch IDs
     * @return Array of all batch ID strings
     */
    function getAllBatchIds() external view returns (string[] memory) {
        return allBatchIds;
    }

    /**
     * @notice Returns batch details by batchId
     * @param _batchId The unique batch identifier
     */
    function getBatch(string calldata _batchId)
        external
        view
        batchMustExist(_batchId)
        returns (MedicineBatch memory)
    {
        return batches[_batchId];
    }

    /**
     * @notice Returns system-wide statistics for dashboard overview
     */
    function getSystemStats()
        external
        view
        returns (
            uint256 totalBatches,
            uint256 totalRecalls,
            address regulatoryAuthority
        )
    {
        return (totalBatchesCount, totalRecallsCount, owner);
    }
}

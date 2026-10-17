/**
 * MediTrace Contract Configuration
 * 
 * IMPORTANT:
 * 1. Deploy the contract using Remix IDE (with Ganache or Sepolia testnet).
 * 2. Copy your deployed contract address and replace CONTRACT_ADDRESS below.
 * 3. The CONTRACT_ABI below matches contracts/MediTrace.sol (Solidity 0.8.20).
 */

const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // <-- PLACEHOLDER: Paste your deployed address here

const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "batchId", "type": "string" }
    ],
    "name": "BatchAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "batchId", "type": "string" }
    ],
    "name": "BatchAlreadyRecalled",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "batchId", "type": "string" }
    ],
    "name": "BatchNotFound",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "fieldName", "type": "string" }
    ],
    "name": "EmptyStringNotAllowed",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "providedExpiry", "type": "uint256" },
      { "internalType": "uint256", "name": "currentTimestamp", "type": "uint256" }
    ],
    "name": "ExpiryMustBeInFuture",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidUnitCount",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "manufacturer", "type": "address" }
    ],
    "name": "ManufacturerAlreadyAuthorized",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "manufacturer", "type": "address" }
    ],
    "name": "ManufacturerNotAuthorized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAuthorizedToRecall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyManufacturerAllowed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyOwnerAllowed",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "batchId", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "recalledBy", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "reason", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "BatchRecalled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "batchId", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "medicineName", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "brandName", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "manufacturer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "expiryTimestamp", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "unitCount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "BatchRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "batchId", "type": "string" },
      { "indexed": false, "internalType": "enum MediTrace.BatchStatus", "name": "oldStatus", "type": "uint8" },
      { "indexed": false, "internalType": "enum MediTrace.BatchStatus", "name": "newStatus", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "BatchStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "manufacturer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "ManufacturerAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "manufacturer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "ManufacturerRevoked",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_manufacturer", "type": "address" },
      { "internalType": "string", "name": "_name", "type": "string" }
    ],
    "name": "authorizeManufacturer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_batchId", "type": "string" }
    ],
    "name": "doesBatchExist",
    "outputs": [
      { "internalType": "bool", "name": "exists", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllBatchIds",
    "outputs": [
      { "internalType": "string[]", "name": "", "type": "string[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_batchId", "type": "string" }
    ],
    "name": "getBatch",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "batchId", "type": "string" },
          { "internalType": "string", "name": "medicineName", "type": "string" },
          { "internalType": "string", "name": "brandName", "type": "string" },
          { "internalType": "address", "name": "manufacturer", "type": "address" },
          { "internalType": "uint256", "name": "mfgTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "expiryTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "unitCount", "type": "uint256" },
          { "internalType": "string", "name": "complianceCertHash", "type": "string" },
          { "internalType": "enum MediTrace.BatchStatus", "name": "status", "type": "uint8" },
          { "internalType": "string", "name": "recallReason", "type": "string" },
          { "internalType": "uint256", "name": "recalledTimestamp", "type": "uint256" },
          { "internalType": "address", "name": "recalledBy", "type": "address" }
        ],
        "internalType": "struct MediTrace.MedicineBatch",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSystemStats",
    "outputs": [
      { "internalType": "uint256", "name": "totalBatches", "type": "uint256" },
      { "internalType": "uint256", "name": "totalRecalls", "type": "uint256" },
      { "internalType": "address", "name": "regulatoryAuthority", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "isManufacturer",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "manufacturerNames",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_batchId", "type": "string" },
      { "internalType": "string", "name": "_reason", "type": "string" }
    ],
    "name": "recallBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_batchId", "type": "string" },
      { "internalType": "string", "name": "_medicineName", "type": "string" },
      { "internalType": "string", "name": "_brandName", "type": "string" },
      { "internalType": "uint256", "name": "_expiryTimestamp", "type": "uint256" },
      { "internalType": "uint256", "name": "_unitCount", "type": "uint256" },
      { "internalType": "string", "name": "_complianceCertHash", "type": "string" }
    ],
    "name": "registerBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_manufacturer", "type": "address" }
    ],
    "name": "revokeManufacturer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalBatchesCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRecallsCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_batchId", "type": "string" }
    ],
    "name": "verifyBatch",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "batchId", "type": "string" },
          { "internalType": "string", "name": "medicineName", "type": "string" },
          { "internalType": "string", "name": "brandName", "type": "string" },
          { "internalType": "address", "name": "manufacturer", "type": "address" },
          { "internalType": "uint256", "name": "mfgTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "expiryTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "unitCount", "type": "uint256" },
          { "internalType": "string", "name": "complianceCertHash", "type": "string" },
          { "internalType": "enum MediTrace.BatchStatus", "name": "status", "type": "uint8" },
          { "internalType": "string", "name": "recallReason", "type": "string" },
          { "internalType": "uint256", "name": "recalledTimestamp", "type": "uint256" },
          { "internalType": "address", "name": "recalledBy", "type": "address" }
        ],
        "internalType": "struct MediTrace.MedicineBatch",
        "name": "batch",
        "type": "tuple"
      },
      { "internalType": "bool", "name": "isAuthentic", "type": "bool" },
      { "internalType": "bool", "name": "isExpired", "type": "bool" },
      { "internalType": "bool", "name": "isRecalled", "type": "bool" },
      { "internalType": "string", "name": "manufacturerName", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Export for browser script usage
window.CONTRACT_CONFIG = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI
};

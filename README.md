# MediTrace: Decentralized Pharmaceutical Provenance & Batch Recall Registry

**Course**: CSE4444 — Blockchain Technology  
**Assignment**: Assignment 2  
**EVM Target**: Ethereum (Remix VM / Ganache Localhost / Sepolia Testnet)  
**Solidity Version**: `^0.8.20`  
**Frontend Stack**: HTML5, Vanilla CSS3, JavaScript (ES6+), Ethers.js (v6)

---

## 1. Problem Description & Real-World Motivation

The World Health Organization (WHO) estimates that **over 10% of medical products in low- and middle-income countries are substandard or falsified**, leading to hundreds of thousands of preventable deaths and billions of dollars in economic damages annually. 

Traditional pharmaceutical supply chain registries suffer from three fatal weaknesses:
1. **Centralized Points of Failure**: Regulatory databases are centrally hosted and vulnerable to insider tampering, data loss, and bribery.
2. **Fragmented & Delayed Drug Recalls**: When a contaminated or defective drug batch is identified, recall notices take days or weeks to propagate down to local pharmacies and clinics, resulting in patients consuming toxic medications.
3. **No Direct Public Verifiability**: Patients, pharmacies, and field clinics have no reliable, fee-free mechanism to independently verify whether a drug packet in their hands is authentic, expired, or officially recalled.

### The MediTrace Solution
**MediTrace** resolves this crisis using the Ethereum blockchain:
* **Decentralized Authorization**: A Health Regulatory Authority (contract owner) issues verifiable on-chain production credentials to accredited pharmaceutical manufacturers.
* **Tamper-Proof Batch Minting**: Authorized manufacturers commit production batches on-chain with unique Batch IDs, drug descriptions, expiration timestamps, unit counts, and cryptographic hashes (IPFS CID / SHA-256) of laboratory quality assurance certificates.
* **Instant Emergency Recalls**: If contamination or quality defects are discovered, the regulatory authority or the originating manufacturer can trigger an instantaneous public recall. The batch status immediately reflects as `Recalled` across the entire network.
* **Zero-Gas Public Verification**: Any patient, pharmacist, or hospital can scan or input a Batch ID into the web portal to receive instantaneous, gas-free verification of authenticity, shelf-life validity, and recall status.

---

## 2. Repository Structure

```text
blockchain-assignment/
├── contracts/
│   └── MediTrace.sol               # Core Solidity smart contract (0.8.20)
├── frontend/
│   ├── index.html                  # Semantic user interface & tabbed portals
│   ├── style.css                   # Responsive styling with healthcare theme
│   ├── app.js                      # MetaMask integration, Ethers.js logic, role handling
│   └── contractConfig.js           # Contract ABI and deployed address placeholder
├── test/
│   ├── MediTrace.test.js           # Automated Hardhat test suite (27 unit tests)
│   └── Manual_Remix_Test_Cases.md  # Step-by-step Remix test matrix with blank observed results
├── hardhat.config.js               # Hardhat compilation and test configuration
├── package.json                    # Project dependencies and npm scripts
├── .gitignore                      # Prevents committing node_modules, cache, and private keys
└── README.md                       # Complete documentation, setup guide, and viva prep
```

---

## 3. Deployment Information & Placeholders

> **Note for Evaluator / Student**: Fill in these placeholders after deploying to Remix IDE (Ganache or Sepolia):

| Parameter | Value / Placeholder |
| :--- | :--- |
| **Deployed Network** | `[ e.g., Sepolia Testnet / Ganache Localhost ]` |
| **Network Chain ID** | `[ e.g., 11155111 (Sepolia) / 1337 (Ganache) ]` |
| **Deployed Contract Address** | `[ e.g., 0x0000000000000000000000000000000000000000 ]` |
| **Deployer (Regulator) Address** | `[ e.g., 0x... ]` |
| **Deployment Transaction Hash** | `[ e.g., 0x... ]` |
| **Block Explorer Link (if Sepolia)** | `[ e.g., https://sepolia.etherscan.io/address/0x... ]` |

---

## 4. Remix IDE Deployment Guide

### Prerequisites
* Web browser (Chrome, Brave, or Firefox)
* [MetaMask Extension](https://metamask.io/) installed
* Remix IDE: [https://remix.ethereum.org](https://remix.ethereum.org)

### Step 4.1: Import Contract to Remix
1. Open [Remix IDE](https://remix.ethereum.org).
2. In the **File Explorer** tab, open the `contracts/` directory.
3. Click the **Create New File** icon and name it `MediTrace.sol`.
4. Copy and paste the entire code from [`contracts/MediTrace.sol`](contracts/MediTrace.sol) into the editor.

### Step 4.2: Exact Compiler Configuration
In the **Solidity Compiler** tab (3rd icon on the left bar):
* **Compiler Version**: Select `0.8.20+commit.a1b79de6` (or `0.8.26`).
* **Language**: `Solidity`
* **EVM Version**: `default` (or `paris` / `shanghai` / `cancun`).
* **Enable Optimization**: Checked (`200` runs) or unchecked.
* Click **Compile MediTrace.sol**. A green checkmark will appear.

### Step 4.3: Deployment Options

#### Option A: Deploying via Ganache (Local RPC)
1. Launch Ganache GUI (default RPC: `http://127.0.0.1:7545`) or Ganache CLI (`http://127.0.0.1:8545`).
2. In Remix, go to the **Deploy & Run Transactions** tab.
3. In the **ENVIRONMENT** dropdown, select **Dev - Ganache Provider** (or **Custom - External Http Provider** with URL `http://127.0.0.1:7545`).
4. Select `MediTrace - contracts/MediTrace.sol` from the **CONTRACT** dropdown.
5. **Constructor Arguments**: Leave empty (the constructor requires no arguments).
6. Click the orange **Deploy** button.
7. Copy the deployed contract address from the bottom of the left sidebar.

#### Option B: Deploying via Sepolia Testnet (MetaMask)
1. In MetaMask, switch network to **Sepolia** (ensure you have test ETH from [Google Cloud Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)).
2. In Remix **Deploy & Run Transactions** tab, set **ENVIRONMENT** to **Injected Provider - MetaMask**.
3. Approve the connection in the MetaMask popup.
4. Select `MediTrace - contracts/MediTrace.sol` in the **CONTRACT** dropdown.
5. **Constructor Arguments**: None (leave empty).
6. Click **Deploy** and confirm the transaction in MetaMask.
7. Once mined, copy the deployed contract address and transaction hash.

### Step 4.4: Link Contract to Frontend
Open [`frontend/contractConfig.js`](frontend/contractConfig.js) in your code editor and replace the placeholder:
```javascript
const CONTRACT_ADDRESS = "0xYOUR_COPIED_DEPLOYED_ADDRESS_HERE";
```

---

## 5. Local Setup & Execution Steps

### 5.1 Install Dependencies
Open a terminal in the root directory:
```powershell
npm install
```

### 5.2 Run Automated Tests
Execute the 27-test Hardhat suite:
```powershell
npm test
```
*Expected Output*: `27 passing` (valid, invalid, boundary, and access-control assertions).

### 5.3 Launch the Web Frontend
Start the local web server:
```powershell
npm start
```
Open your browser and navigate to:
🌐 **`http://localhost:3000`**

---

## 6. MetaMask Setup & Interaction Guide

1. **Connect MetaMask**: Click **Connect MetaMask** in the top-right header. Approve account selection.
2. **Role Detection**:
   * If connected with the **Deployer Account**, the badge displays **Regulator / Admin**.
   * If connected with an account approved via `authorizeManufacturer()`, the badge displays **Manufacturer (Company Name)**.
   * Any other wallet displays **Public Consumer**.
3. **Register a Medicine Batch** (Manufacturer Portal):
   * Switch to an authorized manufacturer wallet in MetaMask.
   * Go to the **Manufacturer Portal** tab.
   * Enter Batch ID (e.g. `LOT-2026-001`), Medicine Name (`Amoxicillin 500mg`), Brand (`Amoxil`), Units (`50000`), Expiry Date (future date), and Lab Certificate Hash (`QmZtmD2...`).
   * Click **Sign & Register Batch On-Chain** and confirm the MetaMask transaction.
4. **Verify Batch Authenticity** (Public Portal):
   * Go to the **Verify Medicine** tab.
   * Enter `LOT-2026-001` and click **Verify Batch**.
   * Instant green badge: `GENUINE & SAFE TO CONSUME` with complete manufacturer credentials and timestamps.
5. **Emergency Recall Notice** (Regulator Portal):
   * Connect with the deployer/owner wallet.
   * Go to **Regulatory Authority** tab -> **Emergency Batch Recall**.
   * Enter the Batch ID and official recall justification (e.g., `Packaging seal defect discovered in sample QA`).
   * Click **Issue Public On-Chain Recall** and confirm in MetaMask.
   * Search the batch again in the **Verify Medicine** tab: it immediately renders a red alert: `DANGER: RECALLED MEDICINE - DO NOT CONSUME`.

---

## 7. Test Case Execution Table

> **Instructions**: Below is the test matrix covering Valid, Invalid, and Unauthorised inputs. Execute these in Remix IDE or the frontend, and fill in your observations in the **Observed Result** column.

### 7.1 Valid Inputs

| Test ID | Function Under Test | Caller Account Role | Input Values | Expected Result | Observed Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-VAL-01** | `constructor` | Account 0 (Deployer) | None | Contract deploys. `owner` set to Account 0. | `[ Fill after test ]` |
| **TC-VAL-02** | `authorizeManufacturer` | Account 0 (Owner) | `_manufacturer`: Account 1<br>`_name`: `"Pfizer Pharma"` | Tx succeeds. `ManufacturerAuthorized` emitted. `isManufacturer` = `true`. | `[ Fill after test ]` |
| **TC-VAL-03** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `"LOT-2026-001"`<br>`_medicineName`: `"Amoxicillin 500mg"`<br>`_brandName`: `"Amoxil"`<br>`_expiryTimestamp`: `1893456000`<br>`_unitCount`: `50000`<br>`_complianceCertHash`: `"QmSampleCertHash123"` | Tx succeeds. `BatchRegistered` emitted. Total batches increments to `1`. | `[ Fill after test ]` |
| **TC-VAL-04** | `verifyBatch` | Any Public Account | `_batchId`: `"LOT-2026-001"` | Returns batch record: `isAuthentic = true`, `isExpired = false`, `isRecalled = false`. Gas = 0. | `[ Fill after test ]` |
| **TC-VAL-05** | `recallBatch` | Account 1 (Originating Mfr) | `_batchId`: `"LOT-2026-001"`<br>`_reason`: `"Packaging seal defect"` | Tx succeeds. `BatchRecalled` and `BatchStatusUpdated` emitted. Status becomes `1` (Recalled). | `[ Fill after test ]` |
| **TC-VAL-06** | `verifyBatch` (Post-Recall) | Any Public Account | `_batchId`: `"LOT-2026-001"` | Returns `isRecalled = true`, `status = 1`, and public recall reason. | `[ Fill after test ]` |
| **TC-VAL-07** | `revokeManufacturer` | Account 0 (Owner) | `_manufacturer`: Account 1 | Tx succeeds. `ManufacturerRevoked` emitted. `isManufacturer` becomes `false`. | `[ Fill after test ]` |

### 7.2 Invalid Inputs & Boundary Cases

| Test ID | Function Under Test | Caller Account Role | Input Values | Expected Result | Observed Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-INV-01** | `authorizeManufacturer` | Account 0 (Owner) | `_manufacturer`: `0x000...000`<br>`_name`: `"Null Corp"` | Reverts with custom error `InvalidAddress()`. | `[ Fill after test ]` |
| **TC-INV-02** | `authorizeManufacturer` | Account 0 (Owner) | `_manufacturer`: Account 2<br>`_name`: `""` (Empty string) | Reverts with custom error `EmptyStringNotAllowed("Manufacturer Name")`. | `[ Fill after test ]` |
| **TC-INV-03** | `authorizeManufacturer` | Account 0 (Owner) | `_manufacturer`: Account 1 (Already authorized)<br>`_name`: `"Duplicate"` | Reverts with custom error `ManufacturerAlreadyAuthorized(...)`. | `[ Fill after test ]` |
| **TC-INV-04** | `revokeManufacturer` | Account 0 (Owner) | `_manufacturer`: Account 3 (Never authorized) | Reverts with custom error `ManufacturerNotAuthorized(...)`. | `[ Fill after test ]` |
| **TC-INV-05** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `"LOT-EXP"`<br>`_expiryTimestamp`: `1600000000` (Past timestamp) | Reverts with custom error `ExpiryMustBeInFuture(...)`. | `[ Fill after test ]` |
| **TC-INV-06** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `"LOT-ZERO"`<br>`_unitCount`: `0` | Reverts with custom error `InvalidUnitCount()`. | `[ Fill after test ]` |
| **TC-INV-07** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `""` (Empty string) | Reverts with custom error `EmptyStringNotAllowed("Batch ID")`. | `[ Fill after test ]` |
| **TC-INV-08** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `"LOT-2026-001"` (Duplicate batch ID) | Reverts with custom error `BatchAlreadyExists("LOT-2026-001")`. | `[ Fill after test ]` |
| **TC-INV-09** | `recallBatch` | Account 0 (Owner) | `_batchId`: `"NON_EXISTENT"`<br>`_reason`: `"Defect"` | Reverts with custom error `BatchNotFound("NON_EXISTENT")`. | `[ Fill after test ]` |
| **TC-INV-10** | `recallBatch` | Account 0 (Owner) | `_batchId`: `"LOT-2026-001"`<br>`_reason`: `""` (Empty string) | Reverts with custom error `EmptyStringNotAllowed("Recall Reason")`. | `[ Fill after test ]` |
| **TC-INV-11** | `verifyBatch` | Any Account | `_batchId`: `"DOES_NOT_EXIST"` | Reverts with custom error `BatchNotFound("DOES_NOT_EXIST")`. | `[ Fill after test ]` |

### 7.3 Unauthorised Inputs & Access Control

| Test ID | Function Under Test | Caller Account Role | Input Values | Expected Result | Observed Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-UNAUTH-01** | `authorizeManufacturer` | Account 3 (Non-owner) | `_manufacturer`: Account 2<br>`_name`: `"Unauthorized"` | Reverts with custom error `OnlyOwnerAllowed()`. | `[ Fill after test ]` |
| **TC-UNAUTH-02** | `revokeManufacturer` | Account 3 (Non-owner) | `_manufacturer`: Account 1 | Reverts with custom error `OnlyOwnerAllowed()`. | `[ Fill after test ]` |
| **TC-UNAUTH-03** | `registerBatch` | Account 3 (Unapproved) | `_batchId`: `"LOT-UNAUTH"` | Reverts with custom error `OnlyManufacturerAllowed()`. | `[ Fill after test ]` |
| **TC-UNAUTH-04** | `registerBatch` | Account 1 (After revocation) | `_batchId`: `"LOT-REVOKED"` | Reverts with custom error `OnlyManufacturerAllowed()`. | `[ Fill after test ]` |
| **TC-UNAUTH-05** | `recallBatch` | Account 2 (Competitor/Third Party) | `_batchId`: `"LOT-2026-001"`<br>`_reason`: `"Malicious recall"` | Reverts with custom error `NotAuthorizedToRecall()`. | `[ Fill after test ]` |

---

## 8. Assignment Screenshot Checklist

Capture the following 6 screenshots as required by Assignment 2 (Page 2):

- [ ] **Screenshot 1: Smart Contract Compilation**  
  *In Remix IDE, showing the Solidity Compiler tab with compiler version `0.8.20`, green compilation checkmark, and contract dropdown.*
- [ ] **Screenshot 2: Smart Contract Deployment**  
  *In Remix IDE, showing the transaction terminal confirming successful deployment, deployed contract address, and initial gas used.*
- [ ] **Screenshot 3: MetaMask Wallet Connection**  
  *In the web browser, showing the MediTrace frontend connected to MetaMask with account address and network badge displayed.*
- [ ] **Screenshot 4: Successful Transaction**  
  *MetaMask transaction confirmation popup or the green toast notification showing the confirmed transaction hash and block number.*
- [ ] **Screenshot 5: Failed Transaction (Input Validation / Unauthorized)**  
  *Remix terminal or web frontend displaying a transaction revert (e.g. `OnlyManufacturerAllowed()` or `ExpiryMustBeInFuture()`).*
- [ ] **Screenshot 6: Blockchain Data Displayed Through UI**  
  *The frontend Verification Portal displaying verified medicine batch details (green authentic badge) or the live On-Chain Ledger table.*

---

## 9. Viva Voce Preparation & Technical Q&A

### Q1: What makes your DApp original compared to standard classroom examples?
**Answer**: Unlike basic voting, simple storage, or standard ERC-20 token examples, MediTrace solves a critical healthcare crisis: counterfeit pharmaceuticals and delayed drug recalls. It features asymmetric multi-role access control (Regulators vs. Licensed Manufacturers vs. Public Consumers), time-sensitive expiration logic, on-chain cryptographic certificate anchoring, and emergency state transitions (`Active` -> `Recalled`).

### Q2: How does the frontend communicate with the Ethereum blockchain?
**Answer**: MediTrace uses **Ethers.js v6**:
1. It initializes a `BrowserProvider` that connects to the `window.ethereum` API injected by MetaMask.
2. For read-only operations (like `verifyBatch` and `getSystemStats`), it invokes contract methods through the provider without gas or user signatures.
3. For state-changing operations (like `registerBatch` and `recallBatch`), it requests a `Signer` from MetaMask, prompts the user for signature, broadcasts the signed transaction to Ethereum nodes, and awaits mining confirmation via `tx.wait()`.

### Q3: How does the contract prevent reentrancy attacks?
**Answer**: MediTrace maintains state records and does not perform any external calls that transfer Ether or call untrusted contract addresses. Reentrancy occurs when an external contract hijacks execution flow before state changes are resolved; because MediTrace makes no external contract calls and holds no Ether balances, it is mathematically immune to reentrancy vectors.

### Q4: Why did you use Custom Errors instead of `require(..., "string")`?
**Answer**: Solidity 0.8.4+ introduced custom errors (e.g. `revert OnlyOwnerAllowed()`). Custom errors encode as 4-byte selectors (`bytes4`), whereas `require` with error strings stores and transfers lengthy ASCII strings, costing substantially more gas upon deployment and execution. Custom errors drastically reduce transaction gas costs while maintaining exact error specificity.

### Q5: How are expiration dates and timestamps validated securely?
**Answer**: During registration, `_expiryTimestamp` is validated against `block.timestamp` (`if (_expiryTimestamp <= block.timestamp) revert ExpiryMustBeInFuture()`). When a batch is queried via `verifyBatch()`, the view function dynamically computes `isExpired = (block.timestamp >= batch.expiryTimestamp)`. This ensures expiration status is always evaluated dynamically against the current block header without needing continuous manual updates.

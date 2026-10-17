# MediTrace — Manual Remix Test Cases Table

This document provides a comprehensive test suite designed to be executed directly inside **Remix IDE** (using the `Remix VM` or `Ganache / Injected Provider`).

The test suite covers **Valid**, **Invalid**, and **Unauthorised** input vectors across all smart contract functions.

> **Instructions for the Student**:  
> In Remix IDE, select the designated caller account from the **ACCOUNT** dropdown, input the parameters into the specified function button, click the button, and note the transaction output in the Remix terminal. Record your observation in the **Observed Result** column.

---

## 1. Valid Input Test Cases

| Test ID | Function Under Test | Caller Account Role | Input Parameters | Expected Result | Observed Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-VAL-01** | `constructor` | Account 0 (Deployer) | None | Contract successfully deploys. `owner` is set to Account 0 address. | |
| **TC-VAL-02** | `authorizeManufacturer` | Account 0 (Owner) | `_manufacturer`: `Account 1 address`<br>`_name`: `"Pfizer Pharma"` | Transaction succeeds. `ManufacturerAuthorized` event emitted. `isManufacturer(Account 1)` becomes `true`. | |
| **TC-VAL-03** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `"LOT-2026-001"`<br>`_medicineName`: `"Amoxicillin 500mg"`<br>`_brandName`: `"Amoxil"`<br>`_expiryTimestamp`: `1893456000` (Year 2030)<br>`_unitCount`: `50000`<br>`_complianceCertHash`: `"QmSampleIPFSCertificateHash123"` | Transaction succeeds. `BatchRegistered` event emitted. `totalBatchesCount` increments to `1`. | |
| **TC-VAL-04** | `verifyBatch` | Account 4 (Any Public / Consumer) | `_batchId`: `"LOT-2026-001"` | Returns batch tuple with `isAuthentic = true`, `isExpired = false`, `isRecalled = false`, and `manufacturerName = "Pfizer Pharma"`. Free view call (0 gas). | |
| **TC-VAL-05** | `recallBatch` | Account 1 (Originating Mfr) | `_batchId`: `"LOT-2026-001"`<br>`_reason`: `"Packaging seal imperfection detected"` | Transaction succeeds. `BatchRecalled` and `BatchStatusUpdated` events emitted. `status` changes to `1` (Recalled). | |
| **TC-VAL-06** | `verifyBatch` (Post-Recall) | Account 4 (Public) | `_batchId`: `"LOT-2026-001"` | Returns `isRecalled = true`, `status = 1`, and `recallReason = "Packaging seal imperfection detected"`. | |
| **TC-VAL-07** | `revokeManufacturer` | Account 0 (Owner) | `_manufacturer`: `Account 1 address` | Transaction succeeds. `ManufacturerRevoked` event emitted. `isManufacturer(Account 1)` becomes `false`. | |
| **TC-VAL-08** | `getAllBatchIds` | Any Account | None | Returns string array containing `["LOT-2026-001"]`. | |
| **TC-VAL-09** | `getSystemStats` | Any Account | None | Returns `totalBatches = 1`, `totalRecalls = 1`, and `regulatoryAuthority = Account 0 address`. | |

---

## 2. Invalid Input & Boundary Test Cases

| Test ID | Function Under Test | Caller Account Role | Input Parameters | Expected Result | Observed Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-INV-01** | `authorizeManufacturer` | Account 0 (Owner) | `_manufacturer`: `0x0000000000000000000000000000000000000000`<br>`_name`: `"Pharma Corp"` | Transaction reverts with custom error `InvalidAddress()`. | |
| **TC-INV-02** | `authorizeManufacturer` | Account 0 (Owner) | `_manufacturer`: `Account 2 address`<br>`_name`: `""` (Empty string) | Transaction reverts with custom error `EmptyStringNotAllowed("Manufacturer Name")`. | |
| **TC-INV-03** | `authorizeManufacturer` | Account 0 (Owner) | `_manufacturer`: `Account 1 address` (Already authorized)<br>`_name`: `"Duplicate Corp"` | Transaction reverts with custom error `ManufacturerAlreadyAuthorized(...)`. | |
| **TC-INV-04** | `revokeManufacturer` | Account 0 (Owner) | `_manufacturer`: `Account 3 address` (Never authorized) | Transaction reverts with custom error `ManufacturerNotAuthorized(...)`. | |
| **TC-INV-05** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `"LOT-2026-EXP"`<br>`_expiryTimestamp`: `1600000000` (Past timestamp)<br>Other fields valid | Transaction reverts with custom error `ExpiryMustBeInFuture(...)`. | |
| **TC-INV-06** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `"LOT-2026-ZERO"`<br>`_unitCount`: `0`<br>Other fields valid | Transaction reverts with custom error `InvalidUnitCount()`. | |
| **TC-INV-07** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `""` (Empty string)<br>Other fields valid | Transaction reverts with custom error `EmptyStringNotAllowed("Batch ID")`. | |
| **TC-INV-08** | `registerBatch` | Account 1 (Auth Mfr) | `_batchId`: `"LOT-2026-001"` (Duplicate batch ID)<br>Other fields valid | Transaction reverts with custom error `BatchAlreadyExists("LOT-2026-001")`. | |
| **TC-INV-09** | `recallBatch` | Account 0 (Owner) | `_batchId`: `"NON_EXISTENT_BATCH"`<br>`_reason`: `"Contamination"` | Transaction reverts with custom error `BatchNotFound("NON_EXISTENT_BATCH")`. | |
| **TC-INV-10** | `recallBatch` | Account 0 (Owner) | `_batchId`: `"LOT-2026-001"`<br>`_reason`: `""` (Empty string) | Transaction reverts with custom error `EmptyStringNotAllowed("Recall Reason")`. | |
| **TC-INV-11** | `recallBatch` | Account 0 (Owner) | `_batchId`: `"LOT-2026-001"` (Already recalled batch)<br>`_reason`: `"Second recall attempt"` | Transaction reverts with custom error `BatchAlreadyRecalled("LOT-2026-001")`. | |
| **TC-INV-12** | `verifyBatch` | Account 4 (Public) | `_batchId`: `"UNKNOWN_BATCH_999"` | Call reverts with custom error `BatchNotFound("UNKNOWN_BATCH_999")`. | |

---

## 3. Unauthorised Input & Access Control Test Cases

| Test ID | Function Under Test | Caller Account Role | Input Parameters | Expected Result | Observed Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-UNAUTH-01** | `authorizeManufacturer` | Account 3 (Random / Non-owner) | `_manufacturer`: `Account 2 address`<br>`_name`: `"Unauthorized Co"` | Transaction reverts with custom error `OnlyOwnerAllowed()`. Authorization rejected. | |
| **TC-UNAUTH-02** | `revokeManufacturer` | Account 3 (Non-owner) | `_manufacturer`: `Account 1 address` | Transaction reverts with custom error `OnlyOwnerAllowed()`. Revocation rejected. | |
| **TC-UNAUTH-03** | `registerBatch` | Account 3 (Unauthorized account) | `_batchId`: `"LOT-FAKE-01"`<br>Other fields valid | Transaction reverts with custom error `OnlyManufacturerAllowed()`. Counterfeit registration blocked. | |
| **TC-UNAUTH-04** | `registerBatch` | Account 1 (After revocation) | `_batchId`: `"LOT-REVOKED-01"`<br>Other fields valid | Transaction reverts with custom error `OnlyManufacturerAllowed()`. Revoked entity blocked. | |
| **TC-UNAUTH-05** | `recallBatch` | Account 2 (Different manufacturer / competitor) | `_batchId`: `"LOT-2026-001"`<br>`_reason`: `"Malicious sabotage recall"` | Transaction reverts with custom error `NotAuthorizedToRecall()`. Only owner or originating manufacturer can recall. | |
| **TC-UNAUTH-06** | `recallBatch` | Account 3 (Random Public account) | `_batchId`: `"LOT-2026-001"`<br>`_reason`: `"Unauthorized user recall"` | Transaction reverts with custom error `NotAuthorizedToRecall()`. | |

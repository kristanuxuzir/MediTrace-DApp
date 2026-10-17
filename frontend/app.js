/**
 * MediTrace Frontend Application Logic
 * Integrates Ethereum blockchain & MetaMask via Ethers.js v6
 * Handles wallet connection, role detection, transactions, and event updates.
 */

// Global State
let provider = null;
let signer = null;
let userAddress = null;
let currentNetwork = null;
let mediTraceContract = null;
let isOwner = false;
let isMfr = false;

// DOM Elements
const connectWalletBtn = document.getElementById("connectWalletBtn");
const networkNameEl = document.getElementById("networkName");
const networkBadgeEl = document.getElementById("networkBadge");
const accountAddressEl = document.getElementById("accountAddress");
const roleBadgeEl = document.getElementById("roleBadge");
const configNoticeEl = document.getElementById("configNotice");

// System Stats
const statTotalBatchesEl = document.getElementById("statTotalBatches");
const statTotalRecallsEl = document.getElementById("statTotalRecalls");
const statOwnerAddressEl = document.getElementById("statOwnerAddress");
const statContractAddressEl = document.getElementById("statContractAddress");

// Status Toast
const txStatusBox = document.getElementById("txStatusBox");
const txStatusIcon = document.getElementById("txStatusIcon");
const txStatusTitle = document.getElementById("txStatusTitle");
const txStatusMessage = document.getElementById("txStatusMessage");
const txStatusHash = document.getElementById("txStatusHash");
const closeTxStatusBtn = document.getElementById("closeTxStatusBtn");

// Forms & Inputs
const verifyBatchIdInput = document.getElementById("verifyBatchIdInput");
const verifyBatchBtn = document.getElementById("verifyBatchBtn");
const verificationResultEl = document.getElementById("verificationResult");

const registerBatchForm = document.getElementById("registerBatchForm");
const mfrAccessNoticeEl = document.getElementById("mfrAccessNotice");
const authorizeMfrForm = document.getElementById("authorizeMfrForm");
const revokeMfrForm = document.getElementById("revokeMfrForm");
const recallBatchForm = document.getElementById("recallBatchForm");
const refreshLedgerBtn = document.getElementById("refreshLedgerBtn");
const ledgerTableBody = document.getElementById("ledgerTableBody");

// Tab Navigation
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanes = document.querySelectorAll(".tab-pane");

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  checkContractConfig();
  setupEventListeners();

  // Auto-connect if already authorized in MetaMask
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts && accounts.length > 0) {
        connectWallet();
      }
    });

    // Handle account and chain changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", () => window.location.reload());
  } else {
    showToast("error", "MetaMask Missing", "Please install MetaMask browser extension to use this application.");
  }
});

// Tab Switching
function setupTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add("active");
    });
  });
}

// Check if deployed contract address is set
function checkContractConfig() {
  const cfg = window.CONTRACT_CONFIG;
  const isPlaceholder = !cfg || !cfg.address || cfg.address === "0x0000000000000000000000000000000000000000";
  
  if (isPlaceholder) {
    configNoticeEl.classList.remove("hidden");
    statContractAddressEl.textContent = "0x000... (Placeholder)";
  } else {
    configNoticeEl.classList.add("hidden");
    statContractAddressEl.textContent = truncateAddress(cfg.address);
    statContractAddressEl.title = cfg.address;
  }
}

// Setup Action Event Listeners
function setupEventListeners() {
  connectWalletBtn.addEventListener("click", connectWallet);
  closeTxStatusBtn.addEventListener("click", () => txStatusBox.classList.add("hidden"));
  verifyBatchBtn.addEventListener("click", handleVerifyBatch);
  registerBatchForm.addEventListener("submit", handleRegisterBatch);
  authorizeMfrForm.addEventListener("submit", handleAuthorizeManufacturer);
  revokeMfrForm.addEventListener("submit", handleRevokeManufacturer);
  recallBatchForm.addEventListener("submit", handleRecallBatch);
  refreshLedgerBtn.addEventListener("click", loadOnChainLedger);

  // Set minimum date for expiry datepicker to tomorrow
  const expiryInput = document.getElementById("expiryDate");
  if (expiryInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expiryInput.min = tomorrow.toISOString().split("T")[0];
  }
}

// Connect MetaMask
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask is not installed. Please install MetaMask to interact with the Ethereum blockchain.");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    
    if (accounts.length === 0) {
      showToast("error", "Connection Failed", "No Ethereum accounts found.");
      return;
    }

    userAddress = accounts[0];
    signer = await provider.getSigner();
    currentNetwork = await provider.getNetwork();

    // Update UI Header
    accountAddressEl.textContent = truncateAddress(userAddress);
    accountAddressEl.title = userAddress;
    connectWalletBtn.textContent = "Connected";
    connectWalletBtn.classList.remove("btn-primary");
    connectWalletBtn.classList.add("btn-secondary");

    // Network name & Chain ID
    const chainId = Number(currentNetwork.chainId);
    const networkDisplayName = getNetworkName(chainId);
    networkNameEl.textContent = `${networkDisplayName} (${chainId})`;
    networkBadgeEl.querySelector(".status-dot").classList.remove("disconnected");
    networkBadgeEl.querySelector(".status-dot").classList.add("connected");

    // Initialize Contract Instance
    initContract();

    // Load blockchain state
    await refreshAccountRole();
    await loadSystemStats();
    await loadOnChainLedger();

    showToast("success", "Wallet Connected", `Connected as ${truncateAddress(userAddress)}`);
  } catch (err) {
    console.error("MetaMask connection error:", err);
    showToast("error", "Connection Error", err.message || "Failed to connect to MetaMask.");
  }
}

// Initialize Contract with Signer
function initContract() {
  const cfg = window.CONTRACT_CONFIG;
  if (!cfg || !cfg.address || cfg.address === "0x0000000000000000000000000000000000000000") {
    mediTraceContract = null;
    return;
  }

  try {
    mediTraceContract = new ethers.Contract(cfg.address, cfg.abi, signer || provider);
  } catch (e) {
    console.error("Failed to initialize contract instance:", e);
  }
}

// Refresh User Role (Regulator / Manufacturer / Public)
async function refreshAccountRole() {
  if (!mediTraceContract || !userAddress) return;

  try {
    const ownerAddress = await mediTraceContract.owner();
    isOwner = (ownerAddress.toLowerCase() === userAddress.toLowerCase());
    isMfr = await mediTraceContract.isManufacturer(userAddress);

    roleBadgeEl.classList.remove("hidden", "regulator", "manufacturer");

    if (isOwner) {
      roleBadgeEl.textContent = "Regulator / Admin";
      roleBadgeEl.classList.add("regulator");
    } else if (isMfr) {
      const mfrName = await mediTraceContract.manufacturerNames(userAddress);
      roleBadgeEl.textContent = `Manufacturer (${mfrName || "Verified"})`;
      roleBadgeEl.classList.add("manufacturer");
    } else {
      roleBadgeEl.textContent = "Public Consumer";
    }

    // Toggle Manufacturer form notice
    if (mfrAccessNoticeEl) {
      if (isMfr || isOwner) {
        mfrAccessNoticeEl.classList.add("hidden");
      } else {
        mfrAccessNoticeEl.classList.remove("hidden");
      }
    }
  } catch (err) {
    console.warn("Could not determine user role (is contract deployed?):", err);
  }
}

// Load System Summary Stats
async function loadSystemStats() {
  if (!mediTraceContract) return;

  try {
    const stats = await mediTraceContract.getSystemStats();
    statTotalBatchesEl.textContent = stats.totalBatches.toString();
    statTotalRecallsEl.textContent = stats.totalRecalls.toString();
    statOwnerAddressEl.textContent = truncateAddress(stats.regulatoryAuthority);
    statOwnerAddressEl.title = stats.regulatoryAuthority;
  } catch (err) {
    console.warn("Failed to load platform stats:", err);
  }
}

// Public Medicine Verification
async function handleVerifyBatch() {
  const batchId = verifyBatchIdInput.value.trim();
  if (!batchId) {
    alert("Please enter a valid Batch ID to search.");
    return;
  }

  if (!mediTraceContract) {
    showToast("error", "Contract Not Configured", "Please deploy the contract and update frontend/contractConfig.js.");
    return;
  }

  try {
    showToast("info", "Querying Blockchain", `Looking up Batch ID: ${batchId}...`);
    
    // Check existence first
    const exists = await mediTraceContract.doesBatchExist(batchId);
    if (!exists) {
      renderVerificationNotFound(batchId);
      showToast("error", "Batch Not Found", `No registration record exists for "${batchId}".`);
      return;
    }

    // Call verifyBatch view function (Zero Gas)
    const result = await mediTraceContract.verifyBatch(batchId);
    const batch = result.batch;
    const isAuthentic = result.isAuthentic;
    const isExpired = result.isExpired;
    const isRecalled = result.isRecalled;
    const mfrName = result.manufacturerName;

    renderVerificationResult({
      batchId: batch.batchId,
      medicineName: batch.medicineName,
      brandName: batch.brandName,
      manufacturer: batch.manufacturer,
      manufacturerName: mfrName,
      mfgTimestamp: Number(batch.mfgTimestamp),
      expiryTimestamp: Number(batch.expiryTimestamp),
      unitCount: batch.unitCount.toString(),
      complianceCertHash: batch.complianceCertHash,
      status: Number(batch.status),
      recallReason: batch.recallReason,
      recalledTimestamp: Number(batch.recalledTimestamp),
      recalledBy: batch.recalledBy,
      isAuthentic,
      isExpired,
      isRecalled
    });

    showToast("success", "Verification Complete", `Data retrieved successfully for ${batchId}`);
  } catch (err) {
    console.error("Verification error:", err);
    parseContractError(err, "Batch verification failed");
  }
}

// Render Verification Result in DOM
function renderVerificationResult(data) {
  verificationResultEl.classList.remove("hidden");

  let statusClass = "authentic";
  let statusIcon = "✅";
  let statusTitle = "GENUINE & SAFE TO CONSUME";
  let statusDesc = "This pharmaceutical batch is authentically registered on Ethereum by an authorized manufacturer.";

  if (data.isRecalled) {
    statusClass = "recalled";
    statusIcon = "🚨";
    statusTitle = "DANGER: RECALLED MEDICINE";
    statusDesc = "DO NOT CONSUME OR DISPENSE. This batch has been officially recalled due to safety or quality concerns.";
  } else if (data.isExpired) {
    statusClass = "expired";
    statusIcon = "⚠️";
    statusTitle = "EXPIRED MEDICINE";
    statusDesc = "This medicine batch has passed its certified expiration date. Do not consume.";
  }

  const mfgDate = new Date(data.mfgTimestamp * 1000).toLocaleDateString();
  const expDate = new Date(data.expiryTimestamp * 1000).toLocaleDateString();

  let recallSectionHtml = "";
  if (data.isRecalled) {
    const recallDate = new Date(data.recalledTimestamp * 1000).toLocaleString();
    recallSectionHtml = `
      <div class="recall-banner">
        <strong>⚠️ Recall Notice Details:</strong><br>
        <strong>Reason:</strong> ${escapeHtml(data.recallReason)}<br>
        <strong>Issued On:</strong> ${recallDate} by <code>${data.recalledBy}</code>
      </div>
    `;
  }

  verificationResultEl.innerHTML = `
    <div class="verify-badge-header ${statusClass}">
      <div class="verify-badge-icon">${statusIcon}</div>
      <div>
        <div class="verify-badge-title">${statusTitle}</div>
        <div class="verify-badge-desc">${statusDesc}</div>
      </div>
    </div>

    ${recallSectionHtml}

    <div class="verify-details-grid">
      <div class="verify-item">
        <span class="verify-label">Batch ID</span>
        <span class="verify-val">${escapeHtml(data.batchId)}</span>
      </div>
      <div class="verify-item">
        <span class="verify-label">Medicine Generic Name</span>
        <span class="verify-val">${escapeHtml(data.medicineName)}</span>
      </div>
      <div class="verify-item">
        <span class="verify-label">Brand / Trade Name</span>
        <span class="verify-val">${escapeHtml(data.brandName)}</span>
      </div>
      <div class="verify-item">
        <span class="verify-label">Licensed Manufacturer</span>
        <span class="verify-val">${escapeHtml(data.manufacturerName || "Authorized")} (${truncateAddress(data.manufacturer)})</span>
      </div>
      <div class="verify-item">
        <span class="verify-label">Manufacturing Date</span>
        <span class="verify-val">${mfgDate}</span>
      </div>
      <div class="verify-item">
        <span class="verify-label">Expiration Date</span>
        <span class="verify-val">${expDate}</span>
      </div>
      <div class="verify-item">
        <span class="verify-label">Batch Size</span>
        <span class="verify-val">${Number(data.unitCount).toLocaleString()} Units</span>
      </div>
      <div class="verify-item">
        <span class="verify-label">QC Lab Certificate Hash</span>
        <span class="verify-val" style="font-family:monospace;font-size:0.8rem;">${escapeHtml(data.complianceCertHash)}</span>
      </div>
    </div>
  `;
}

function renderVerificationNotFound(batchId) {
  verificationResultEl.classList.remove("hidden");
  verificationResultEl.innerHTML = `
    <div class="verify-badge-header recalled">
      <div class="verify-badge-icon">❌</div>
      <div>
        <div class="verify-badge-title">UNVERIFIED / POTENTIAL COUNTERFEIT</div>
        <div class="verify-badge-desc">
          Batch ID "<strong>${escapeHtml(batchId)}</strong>" was not found in the official blockchain registry.
          Exercise extreme caution: this product may be counterfeit or unregistered.
        </div>
      </div>
    </div>
  `;
}

// Manufacturer: Register Batch Transaction
async function handleRegisterBatch(e) {
  e.preventDefault();
  if (!ensureConnected()) return;

  const batchId = document.getElementById("batchId").value.trim();
  const medicineName = document.getElementById("medicineName").value.trim();
  const brandName = document.getElementById("brandName").value.trim();
  const unitCount = document.getElementById("unitCount").value.trim();
  const expiryDateVal = document.getElementById("expiryDate").value;
  const certHash = document.getElementById("complianceCertHash").value.trim();

  const expiryTimestamp = Math.floor(new Date(expiryDateVal + "T23:59:59").getTime() / 1000);
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (expiryTimestamp <= currentTimestamp) {
    alert("Expiration date must be in the future!");
    return;
  }

  try {
    showToast("info", "MetaMask Prompt", "Please confirm the transaction in MetaMask to register the batch.");
    const tx = await mediTraceContract.registerBatch(
      batchId,
      medicineName,
      brandName,
      expiryTimestamp,
      BigInt(unitCount),
      certHash
    );

    showToast("info", "Transaction Submitted", `Transaction broadcasted to network. Hash: ${tx.hash}`, tx.hash);
    const receipt = await tx.wait();

    showToast("success", "Batch Registered!", `Batch ${batchId} successfully registered on-chain. Block: ${receipt.blockNumber}`, tx.hash);
    registerBatchForm.reset();
    
    // Refresh ledger & stats
    await loadSystemStats();
    await loadOnChainLedger();
  } catch (err) {
    console.error("Register batch error:", err);
    parseContractError(err, "Failed to register batch");
  }
}

// Regulator: Authorize Manufacturer
async function handleAuthorizeManufacturer(e) {
  e.preventDefault();
  if (!ensureConnected()) return;

  const mfrAddress = document.getElementById("authMfrAddress").value.trim();
  const mfrName = document.getElementById("authMfrName").value.trim();

  if (!ethers.isAddress(mfrAddress)) {
    alert("Please enter a valid Ethereum address (0x...)");
    return;
  }

  try {
    showToast("info", "MetaMask Prompt", "Please confirm authorization transaction in MetaMask...");
    const tx = await mediTraceContract.authorizeManufacturer(mfrAddress, mfrName);

    showToast("info", "Transaction Submitted", "Authorizing manufacturer on-chain...", tx.hash);
    await tx.wait();

    showToast("success", "Manufacturer Authorized", `Successfully authorized ${mfrName} (${truncateAddress(mfrAddress)})`, tx.hash);
    authorizeMfrForm.reset();
    await refreshAccountRole();
  } catch (err) {
    console.error("Authorize error:", err);
    parseContractError(err, "Authorization failed");
  }
}

// Regulator: Revoke Manufacturer
async function handleRevokeManufacturer(e) {
  e.preventDefault();
  if (!ensureConnected()) return;

  const mfrAddress = document.getElementById("revokeMfrAddress").value.trim();

  if (!ethers.isAddress(mfrAddress)) {
    alert("Please enter a valid Ethereum address (0x...)");
    return;
  }

  if (!confirm(`Are you sure you want to revoke batch registration rights for ${mfrAddress}?`)) {
    return;
  }

  try {
    showToast("info", "MetaMask Prompt", "Confirm revocation transaction in MetaMask...");
    const tx = await mediTraceContract.revokeManufacturer(mfrAddress);

    showToast("info", "Transaction Submitted", "Revoking manufacturer on-chain...", tx.hash);
    await tx.wait();

    showToast("success", "Manufacturer Revoked", `Revoked authorization for ${truncateAddress(mfrAddress)}`, tx.hash);
    revokeMfrForm.reset();
    await refreshAccountRole();
  } catch (err) {
    console.error("Revoke error:", err);
    parseContractError(err, "Revocation failed");
  }
}

// Regulator or Manufacturer: Recall Batch
async function handleRecallBatch(e) {
  e.preventDefault();
  if (!ensureConnected()) return;

  const batchId = document.getElementById("recallBatchId").value.trim();
  const reason = document.getElementById("recallReason").value.trim();

  if (!confirm(`WARNING: You are about to issue a public on-chain RECALL for batch ${batchId}. This action is permanent. Proceed?`)) {
    return;
  }

  try {
    showToast("info", "MetaMask Prompt", "Confirm recall notice transaction in MetaMask...");
    const tx = await mediTraceContract.recallBatch(batchId, reason);

    showToast("info", "Transaction Submitted", `Publishing recall for batch ${batchId}...`, tx.hash);
    await tx.wait();

    showToast("success", "Recall Issued!", `Emergency recall notice published for batch ${batchId}.`, tx.hash);
    recallBatchForm.reset();
    
    await loadSystemStats();
    await loadOnChainLedger();
  } catch (err) {
    console.error("Recall error:", err);
    parseContractError(err, "Recall submission failed");
  }
}

// Load Full On-Chain Ledger
async function loadOnChainLedger() {
  if (!mediTraceContract) {
    ledgerTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Contract not connected. Please deploy and configure contract address.</td></tr>`;
    return;
  }

  try {
    ledgerTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Loading on-chain ledger...</td></tr>`;
    const batchIds = await mediTraceContract.getAllBatchIds();

    if (!batchIds || batchIds.length === 0) {
      ledgerTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No medicine batches registered yet.</td></tr>`;
      return;
    }

    let rowsHtml = "";
    // Loop through batch IDs and fetch details
    for (let i = batchIds.length - 1; i >= 0; i--) {
      const bId = batchIds[i];
      try {
        const batch = await mediTraceContract.getBatch(bId);
        const mfrName = await mediTraceContract.manufacturerNames(batch.manufacturer);
        const isExpired = (Date.now() / 1000) >= Number(batch.expiryTimestamp);
        const isRecalled = Number(batch.status) === 1;

        let statusBadge = `<span class="status-tag active">Active</span>`;
        if (isRecalled) {
          statusBadge = `<span class="status-tag recalled">Recalled</span>`;
        } else if (isExpired) {
          statusBadge = `<span class="status-tag expired">Expired</span>`;
        }

        const expFormatted = new Date(Number(batch.expiryTimestamp) * 1000).toLocaleDateString();

        rowsHtml += `
          <tr>
            <td><strong>${escapeHtml(batch.batchId)}</strong></td>
            <td>${escapeHtml(batch.medicineName)}</td>
            <td>${escapeHtml(batch.brandName)}</td>
            <td>${escapeHtml(mfrName || "Authorized")} <small class="text-muted">(${truncateAddress(batch.manufacturer)})</small></td>
            <td>${expFormatted}</td>
            <td>${Number(batch.unitCount).toLocaleString()}</td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn btn-secondary" style="padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="quickVerify('${escapeHtml(batch.batchId)}')">
                Verify
              </button>
            </td>
          </tr>
        `;
      } catch (innerErr) {
        console.warn(`Could not fetch details for batch ${bId}:`, innerErr);
      }
    }

    ledgerTableBody.innerHTML = rowsHtml || `<tr><td colspan="8" class="text-center text-muted">No records retrieved.</td></tr>`;
  } catch (err) {
    console.error("Ledger fetch error:", err);
    ledgerTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error loading on-chain ledger: ${err.message}</td></tr>`;
  }
}

// Quick Verify helper from table
window.quickVerify = function(bId) {
  // Switch to verify tab
  const verifyTabBtn = document.querySelector('[data-tab="tab-verify"]');
  if (verifyTabBtn) verifyTabBtn.click();
  verifyBatchIdInput.value = bId;
  handleVerifyBatch();
};

// Error Parsing Helper for Reverts and MetaMask Rejections
function parseContractError(err, fallbackTitle) {
  let message = err.message || "An unknown error occurred.";

  // User rejected transaction in MetaMask
  if (err.code === 4001 || (err.info && err.info.error && err.info.error.code === 4001)) {
    showToast("error", "Transaction Cancelled", "You declined the transaction signature in MetaMask.");
    return;
  }

  // Custom Solidity Errors
  if (message.includes("OnlyOwnerAllowed")) {
    message = "Unauthorized: Only the Regulatory Authority (contract owner) can perform this action.";
  } else if (message.includes("OnlyManufacturerAllowed")) {
    message = "Unauthorized: Only an approved pharmaceutical manufacturer can register batches.";
  } else if (message.includes("NotAuthorizedToRecall")) {
    message = "Unauthorized: Only the Regulatory Authority or the originating manufacturer can recall this batch.";
  } else if (message.includes("BatchAlreadyExists")) {
    message = "Duplicate Batch: A batch with this unique ID is already registered.";
  } else if (message.includes("BatchNotFound")) {
    message = "Not Found: No batch matches this identifier on-chain.";
  } else if (message.includes("ExpiryMustBeInFuture")) {
    message = "Validation Error: Medicine expiration date must be in the future.";
  } else if (message.includes("InvalidUnitCount")) {
    message = "Validation Error: Batch quantity must be greater than zero.";
  } else if (message.includes("BatchAlreadyRecalled")) {
    message = "Action Redundant: This batch has already been recalled.";
  } else if (message.includes("ManufacturerAlreadyAuthorized")) {
    message = "Notice: This manufacturer address is already authorized.";
  } else if (message.includes("EmptyStringNotAllowed")) {
    message = "Validation Error: Required text fields cannot be left empty.";
  }

  showToast("error", fallbackTitle, message);
}

// UI Toast Notification
function showToast(type, title, msg, txHash = null) {
  txStatusBox.classList.remove("hidden", "success", "error");
  
  if (type === "success") {
    txStatusBox.classList.add("success");
    txStatusIcon.textContent = "✅";
  } else if (type === "error") {
    txStatusBox.classList.add("error");
    txStatusIcon.textContent = "❌";
  } else {
    txStatusIcon.textContent = "ℹ️";
  }

  txStatusTitle.textContent = title;
  txStatusMessage.textContent = msg;

  if (txHash) {
    txStatusHash.textContent = `Tx Hash: ${txHash}`;
    txStatusHash.classList.remove("hidden");
  } else {
    txStatusHash.classList.add("hidden");
  }
}

// Helpers
function ensureConnected() {
  if (!userAddress || !mediTraceContract) {
    alert("Please connect your MetaMask wallet and ensure contract is configured first.");
    return false;
  }
  return true;
}

function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    userAddress = null;
    accountAddressEl.textContent = "Wallet: Not Connected";
    connectWalletBtn.textContent = "Connect MetaMask";
    connectWalletBtn.classList.remove("btn-secondary");
    connectWalletBtn.classList.add("btn-primary");
    roleBadgeEl.classList.add("hidden");
  } else {
    userAddress = accounts[0];
    accountAddressEl.textContent = truncateAddress(userAddress);
    refreshAccountRole();
    loadOnChainLedger();
  }
}

function truncateAddress(addr) {
  if (!addr || addr.length < 10) return addr || "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
}

function getNetworkName(chainId) {
  switch (chainId) {
    case 1: return "Ethereum Mainnet";
    case 11155111: return "Sepolia Testnet";
    case 1337: return "Ganache / Localhost";
    case 5777: return "Ganache GUI";
    case 31337: return "Hardhat Local";
    default: return `Chain ID: ${chainId}`;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

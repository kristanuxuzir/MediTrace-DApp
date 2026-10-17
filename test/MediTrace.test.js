const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MediTrace Smart Contract Test Suite", function () {
  let mediTrace;
  let owner;           // Health Regulatory Authority
  let manufacturer1;   // Authorized Pharma Company A
  let manufacturer2;   // Authorized Pharma Company B
  let unauthorizedUser;// Random consumer / unverified entity
  let consumer;        // Public pharmacy / consumer

  const SAMPLE_BATCH_ID = "LOT-2026-001";
  const SAMPLE_MEDICINE = "Amoxicillin 500mg";
  const SAMPLE_BRAND = "Amoxil";
  const SAMPLE_UNITS = 50000;
  const SAMPLE_CERT_HASH = "QmZtmD2qtWBSgaWumtL48j3m9L7mFAbZ9ZKALypDHJ";

  beforeEach(async function () {
    [owner, manufacturer1, manufacturer2, unauthorizedUser, consumer] = await ethers.getSigners();

    const MediTraceFactory = await ethers.getContractFactory("MediTrace");
    mediTrace = await MediTraceFactory.deploy();
    await mediTrace.waitForDeployment();
  });

  // =========================================================================
  // 1. DEPLOYMENT & INITIAL STATE TESTS
  // =========================================================================
  describe("1. Deployment & Initial State", function () {
    it("Should correctly assign the deployer as the Regulatory Authority (owner)", async function () {
      expect(await mediTrace.owner()).to.equal(owner.address);
    });

    it("Should initialize batch and recall counters to zero", async function () {
      const stats = await mediTrace.getSystemStats();
      expect(stats.totalBatches).to.equal(0);
      expect(stats.totalRecalls).to.equal(0);
      expect(stats.regulatoryAuthority).to.equal(owner.address);
    });

    it("Should return an empty list of batch IDs initially", async function () {
      const allIds = await mediTrace.getAllBatchIds();
      expect(allIds.length).to.equal(0);
    });
  });

  // =========================================================================
  // 2. VALID INPUT OPERATIONS
  // =========================================================================
  describe("2. Valid Operations", function () {
    it("[Valid] Owner can authorize a pharmaceutical manufacturer and emit event", async function () {
      await expect(
        mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global")
      )
        .to.emit(mediTrace, "ManufacturerAuthorized");

      expect(await mediTrace.isManufacturer(manufacturer1.address)).to.be.true;
      expect(await mediTrace.manufacturerNames(manufacturer1.address)).to.equal("Pfizer Global");
    });

    it("[Valid] Authorized manufacturer can register a genuine medicine batch and emit event", async function () {
      // Authorize first
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");

      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60; // 1 year in future

      await expect(
        mediTrace.connect(manufacturer1).registerBatch(
          SAMPLE_BATCH_ID,
          SAMPLE_MEDICINE,
          SAMPLE_BRAND,
          futureExpiry,
          SAMPLE_UNITS,
          SAMPLE_CERT_HASH
        )
      ).to.emit(mediTrace, "BatchRegistered");

      expect(await mediTrace.doesBatchExist(SAMPLE_BATCH_ID)).to.be.true;
      expect(await mediTrace.totalBatchesCount()).to.equal(1);

      const allIds = await mediTrace.getAllBatchIds();
      expect(allIds).to.deep.equal([SAMPLE_BATCH_ID]);
    });

    it("[Valid] Public user/pharmacy can verify registered batch with zero gas", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await mediTrace.connect(manufacturer1).registerBatch(
        SAMPLE_BATCH_ID,
        SAMPLE_MEDICINE,
        SAMPLE_BRAND,
        futureExpiry,
        SAMPLE_UNITS,
        SAMPLE_CERT_HASH
      );

      // Verify as public consumer
      const result = await mediTrace.connect(consumer).verifyBatch(SAMPLE_BATCH_ID);
      expect(result.isAuthentic).to.be.true;
      expect(result.isExpired).to.be.false;
      expect(result.isRecalled).to.be.false;
      expect(result.manufacturerName).to.equal("Pfizer Global");
      expect(result.batch.medicineName).to.equal(SAMPLE_MEDICINE);
      expect(result.batch.manufacturer).to.equal(manufacturer1.address);
      expect(result.batch.status).to.equal(0); // BatchStatus.Active
    });

    it("[Valid] Producing manufacturer can recall their own batch and emit events", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await mediTrace.connect(manufacturer1).registerBatch(
        SAMPLE_BATCH_ID,
        SAMPLE_MEDICINE,
        SAMPLE_BRAND,
        futureExpiry,
        SAMPLE_UNITS,
        SAMPLE_CERT_HASH
      );

      const recallReason = "Discovered packaging seal defect";

      await expect(
        mediTrace.connect(manufacturer1).recallBatch(SAMPLE_BATCH_ID, recallReason)
      )
        .to.emit(mediTrace, "BatchRecalled")
        .and.to.emit(mediTrace, "BatchStatusUpdated");

      const result = await mediTrace.verifyBatch(SAMPLE_BATCH_ID);
      expect(result.isRecalled).to.be.true;
      expect(result.batch.status).to.equal(1); // BatchStatus.Recalled
      expect(result.batch.recallReason).to.equal(recallReason);
      expect(result.batch.recalledBy).to.equal(manufacturer1.address);
      expect(await mediTrace.totalRecallsCount()).to.equal(1);
    });

    it("[Valid] Regulator (owner) can recall any batch for public safety", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await mediTrace.connect(manufacturer1).registerBatch(
        SAMPLE_BATCH_ID,
        SAMPLE_MEDICINE,
        SAMPLE_BRAND,
        futureExpiry,
        SAMPLE_UNITS,
        SAMPLE_CERT_HASH
      );

      await expect(
        mediTrace.connect(owner).recallBatch(SAMPLE_BATCH_ID, "Regulator safety mandate")
      ).to.emit(mediTrace, "BatchRecalled");

      const result = await mediTrace.verifyBatch(SAMPLE_BATCH_ID);
      expect(result.isRecalled).to.be.true;
      expect(result.batch.recalledBy).to.equal(owner.address);
    });

    it("[Valid] Verification correctly detects an expired batch when time passes", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const expiryTimestamp = (await time.latest()) + 100; // expires in 100 seconds

      await mediTrace.connect(manufacturer1).registerBatch(
        SAMPLE_BATCH_ID,
        SAMPLE_MEDICINE,
        SAMPLE_BRAND,
        expiryTimestamp,
        SAMPLE_UNITS,
        SAMPLE_CERT_HASH
      );

      // Fast forward time past expiry
      await time.increase(200);

      const result = await mediTrace.verifyBatch(SAMPLE_BATCH_ID);
      expect(result.isExpired).to.be.true;
      expect(result.isAuthentic).to.be.true;
    });

    it("[Valid] Owner can revoke manufacturer authorization", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      expect(await mediTrace.isManufacturer(manufacturer1.address)).to.be.true;

      await expect(
        mediTrace.connect(owner).revokeManufacturer(manufacturer1.address)
      ).to.emit(mediTrace, "ManufacturerRevoked");

      expect(await mediTrace.isManufacturer(manufacturer1.address)).to.be.false;
    });
  });

  // =========================================================================
  // 3. INVALID INPUTS & BOUNDARY TESTS
  // =========================================================================
  describe("3. Invalid Inputs & Boundary Validations", function () {
    it("[Invalid] Reverts when authorizing zero address (address(0))", async function () {
      await expect(
        mediTrace.connect(owner).authorizeManufacturer(ethers.ZeroAddress, "Null Corp")
      ).to.be.revertedWithCustomError(mediTrace, "InvalidAddress");
    });

    it("[Invalid] Reverts when authorizing manufacturer with an empty name", async function () {
      await expect(
        mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "")
      ).to.be.revertedWithCustomError(mediTrace, "EmptyStringNotAllowed");
    });

    it("[Invalid] Reverts when authorizing an already authorized manufacturer", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      await expect(
        mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Duplicate Co")
      ).to.be.revertedWithCustomError(mediTrace, "ManufacturerAlreadyAuthorized");
    });

    it("[Invalid] Reverts when revoking a manufacturer that is not authorized", async function () {
      await expect(
        mediTrace.connect(owner).revokeManufacturer(unauthorizedUser.address)
      ).to.be.revertedWithCustomError(mediTrace, "ManufacturerNotAuthorized");
    });

    it("[Invalid] Reverts when registering a batch with an expiry date in the past or present", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const pastExpiry = (await time.latest()) - 100;

      await expect(
        mediTrace.connect(manufacturer1).registerBatch(
          SAMPLE_BATCH_ID,
          SAMPLE_MEDICINE,
          SAMPLE_BRAND,
          pastExpiry,
          SAMPLE_UNITS,
          SAMPLE_CERT_HASH
        )
      ).to.be.revertedWithCustomError(mediTrace, "ExpiryMustBeInFuture");
    });

    it("[Invalid] Reverts when registering a batch with 0 unit quantity", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(
        mediTrace.connect(manufacturer1).registerBatch(
          SAMPLE_BATCH_ID,
          SAMPLE_MEDICINE,
          SAMPLE_BRAND,
          futureExpiry,
          0,
          SAMPLE_CERT_HASH
        )
      ).to.be.revertedWithCustomError(mediTrace, "InvalidUnitCount");
    });

    it("[Invalid] Reverts when registering a batch with an empty batch ID", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(
        mediTrace.connect(manufacturer1).registerBatch(
          "",
          SAMPLE_MEDICINE,
          SAMPLE_BRAND,
          futureExpiry,
          SAMPLE_UNITS,
          SAMPLE_CERT_HASH
        )
      ).to.be.revertedWithCustomError(mediTrace, "EmptyStringNotAllowed");
    });

    it("[Invalid] Reverts when registering duplicate batch ID", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      // Register first time
      await mediTrace.connect(manufacturer1).registerBatch(
        SAMPLE_BATCH_ID,
        SAMPLE_MEDICINE,
        SAMPLE_BRAND,
        futureExpiry,
        SAMPLE_UNITS,
        SAMPLE_CERT_HASH
      );

      // Attempt duplicate registration
      await expect(
        mediTrace.connect(manufacturer1).registerBatch(
          SAMPLE_BATCH_ID,
          "Different Medicine",
          "Different Brand",
          futureExpiry,
          100,
          "QmAnotherHash"
        )
      ).to.be.revertedWithCustomError(mediTrace, "BatchAlreadyExists");
    });

    it("[Invalid] Reverts when recalling an unregistered batch ID", async function () {
      await expect(
        mediTrace.connect(owner).recallBatch("NON_EXISTENT_BATCH", "Defect")
      ).to.be.revertedWithCustomError(mediTrace, "BatchNotFound");
    });

    it("[Invalid] Reverts when recalling with an empty recall reason", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await mediTrace.connect(manufacturer1).registerBatch(
        SAMPLE_BATCH_ID,
        SAMPLE_MEDICINE,
        SAMPLE_BRAND,
        futureExpiry,
        SAMPLE_UNITS,
        SAMPLE_CERT_HASH
      );

      await expect(
        mediTrace.connect(owner).recallBatch(SAMPLE_BATCH_ID, "")
      ).to.be.revertedWithCustomError(mediTrace, "EmptyStringNotAllowed");
    });

    it("[Invalid] Reverts when attempting to recall an already recalled batch", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await mediTrace.connect(manufacturer1).registerBatch(
        SAMPLE_BATCH_ID,
        SAMPLE_MEDICINE,
        SAMPLE_BRAND,
        futureExpiry,
        SAMPLE_UNITS,
        SAMPLE_CERT_HASH
      );

      // First recall
      await mediTrace.connect(manufacturer1).recallBatch(SAMPLE_BATCH_ID, "Initial defect");

      // Duplicate recall attempt
      await expect(
        mediTrace.connect(owner).recallBatch(SAMPLE_BATCH_ID, "Second notice")
      ).to.be.revertedWithCustomError(mediTrace, "BatchAlreadyRecalled");
    });

    it("[Invalid] Reverts when querying verifyBatch on non-existent batch", async function () {
      await expect(
        mediTrace.verifyBatch("DOES_NOT_EXIST")
      ).to.be.revertedWithCustomError(mediTrace, "BatchNotFound");
    });
  });

  // =========================================================================
  // 4. UNAUTHORISED ACCESS CONTROL TESTS
  // =========================================================================
  describe("4. Unauthorised Inputs & Access Control", function () {
    it("[Unauthorised] Reverts when non-owner attempts to authorize a manufacturer", async function () {
      await expect(
        mediTrace.connect(unauthorizedUser).authorizeManufacturer(manufacturer1.address, "Unauthorized Attempt")
      ).to.be.revertedWithCustomError(mediTrace, "OnlyOwnerAllowed");
    });

    it("[Unauthorised] Reverts when non-owner attempts to revoke a manufacturer", async function () {
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");

      await expect(
        mediTrace.connect(unauthorizedUser).revokeManufacturer(manufacturer1.address)
      ).to.be.revertedWithCustomError(mediTrace, "OnlyOwnerAllowed");
    });

    it("[Unauthorised] Reverts when unapproved address attempts to register a batch", async function () {
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(
        mediTrace.connect(unauthorizedUser).registerBatch(
          SAMPLE_BATCH_ID,
          SAMPLE_MEDICINE,
          SAMPLE_BRAND,
          futureExpiry,
          SAMPLE_UNITS,
          SAMPLE_CERT_HASH
        )
      ).to.be.revertedWithCustomError(mediTrace, "OnlyManufacturerAllowed");
    });

    it("[Unauthorised] Reverts when revoked manufacturer attempts to register a new batch", async function () {
      // Authorize then revoke
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      await mediTrace.connect(owner).revokeManufacturer(manufacturer1.address);

      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(
        mediTrace.connect(manufacturer1).registerBatch(
          SAMPLE_BATCH_ID,
          SAMPLE_MEDICINE,
          SAMPLE_BRAND,
          futureExpiry,
          SAMPLE_UNITS,
          SAMPLE_CERT_HASH
        )
      ).to.be.revertedWithCustomError(mediTrace, "OnlyManufacturerAllowed");
    });

    it("[Unauthorised] Reverts when unauthorized third party attempts to recall another manufacturer's batch", async function () {
      // Manufacturer 1 registers batch
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer1.address, "Pfizer Global");
      await mediTrace.connect(owner).authorizeManufacturer(manufacturer2.address, "Moderna Therapeutics");
      const futureExpiry = (await time.latest()) + 365 * 24 * 60 * 60;

      await mediTrace.connect(manufacturer1).registerBatch(
        SAMPLE_BATCH_ID,
        SAMPLE_MEDICINE,
        SAMPLE_BRAND,
        futureExpiry,
        SAMPLE_UNITS,
        SAMPLE_CERT_HASH
      );

      // Manufacturer 2 (unrelated party) attempts recall
      await expect(
        mediTrace.connect(manufacturer2).recallBatch(SAMPLE_BATCH_ID, "Malicious competitor recall")
      ).to.be.revertedWithCustomError(mediTrace, "NotAuthorizedToRecall");

      // Random unauthorized consumer attempts recall
      await expect(
        mediTrace.connect(unauthorizedUser).recallBatch(SAMPLE_BATCH_ID, "Random consumer recall")
      ).to.be.revertedWithCustomError(mediTrace, "NotAuthorizedToRecall");
    });
  });
});

const { expect } = require('chai');

describe('BudgetLedger', function () {
  let ledger;
  let owner;
  let otherAccount;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const BudgetLedger = await ethers.getContractFactory('BudgetLedger');
    ledger = await BudgetLedger.deploy();
    await ledger.waitForDeployment();
  });

  it('should set deployer as contract owner', async function () {
    expect(await ledger.owner()).to.equal(owner.address);
  });

  it('should revert NotOwner when called by non-owner account', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('ALC-2026-UNAUTHORIZED'));
    await expect(ledger.connect(otherAccount).record(hash)).to.be.revertedWithCustomError(
      ledger,
      'NotOwner'
    );
  });

  it('should anchor a hash and emit Recorded', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('ALC-2026-0001'));

    await expect(ledger.record(hash)).to.emit(ledger, 'Recorded');

    expect(await ledger.recordCount()).to.equal(1);
  });

  it('should emit Recorded with the exact anchored contentHash and anchorer', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('ALC-2026-0002'));

    await expect(ledger.record(hash))
      .to.emit(ledger, 'Recorded')
      .withArgs(hash, owner.address, (blockNumber) => blockNumber > 0n, (timestamp) => timestamp > 0n);
  });

  it('should emit Recorded with exact blockNumber and timestamp args from the receipt', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('ALC-2026-0003'));

    const tx = await ledger.record(hash);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);

    const event = receipt.logs
      .map((log) => {
        try {
          return ledger.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed?.name === 'Recorded');

    expect(event).to.not.equal(undefined);
    expect(event.args.contentHash).to.equal(hash);
    expect(event.args.anchoredBy).to.equal(owner.address);
    expect(event.args.blockNumber).to.equal(receipt.blockNumber);
    expect(event.args.timestamp).to.equal(block.timestamp);
  });

  it('should not verify a tampered hash and should keep the original record intact', async function () {
    const originalHash = ethers.keccak256(ethers.toUtf8Bytes('ALC-2026-0001'));
    // A different digest simulates an allocation whose financial content changed
    // after anchoring (the tampering scenario the backend detects).
    const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes('ALC-2026-0001-TAMPERED'));

    await ledger.record(originalHash);

    const tamperedVerification = await ledger.verify(tamperedHash);
    expect(tamperedVerification.exists).to.equal(false);
    expect(tamperedVerification.anchoredBy).to.equal(ethers.ZeroAddress);
    expect(tamperedVerification.anchoredAt).to.equal(0);
    expect(tamperedVerification.blockNumber).to.equal(0);

    const tamperedRecord = await ledger.getRecord(tamperedHash);
    expect(tamperedRecord.contentHash).to.equal(ethers.ZeroHash);
    expect(tamperedRecord.anchoredBy).to.equal(ethers.ZeroAddress);
    expect(tamperedRecord.anchoredAt).to.equal(0);

    // The original anchor is untouched.
    const originalVerification = await ledger.verify(originalHash);
    expect(originalVerification.exists).to.equal(true);
    expect(originalVerification.anchoredBy).to.equal(owner.address);
  });

  it('should return the full record for a recorded hash', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('ALC-2026-0001'));

    await ledger.record(hash);

    const verification = await ledger.verify(hash);
    expect(verification.exists).to.equal(true);
    expect(verification.anchoredBy).to.equal(owner.address);
    expect(verification.anchoredAt).to.be.greaterThan(0);
    expect(verification.blockNumber).to.be.greaterThan(0);

    const record = await ledger.getRecord(hash);
    expect(record.contentHash).to.equal(hash);
    expect(record.anchoredBy).to.equal(owner.address);
  });

  it('should revert when the same hash is recorded twice', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('ALC-2026-0001'));

    await ledger.record(hash);
    await expect(ledger.record(hash)).to.be.revertedWithCustomError(ledger, 'HashAlreadyRecorded');
  });

  it('should report exists=false for a hash that was never recorded', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('never-anchored'));

    const verification = await ledger.verify(hash);
    expect(verification.exists).to.equal(false);
    expect(verification.anchoredBy).to.equal(ethers.ZeroAddress);
    expect(verification.anchoredAt).to.equal(0);
  });

  it('should count multiple distinct records', async function () {
    await ledger.record(ethers.keccak256(ethers.toUtf8Bytes('one')));
    await ledger.record(ethers.keccak256(ethers.toUtf8Bytes('two')));
    await ledger.record(ethers.keccak256(ethers.toUtf8Bytes('three')));

    expect(await ledger.recordCount()).to.equal(3);
  });
});

const { expect } = require('chai');

describe('BudgetLedger', function () {
  let ledger;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const BudgetLedger = await ethers.getContractFactory('BudgetLedger');
    ledger = await BudgetLedger.deploy();
    await ledger.waitForDeployment();
  });

  it('should anchor a hash and emit Recorded', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('ALC-2026-0001'));

    await expect(ledger.record(hash)).to.emit(ledger, 'Recorded');

    expect(await ledger.recordCount()).to.equal(1);
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

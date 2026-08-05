const { expect } = require('chai');

describe('AuditLedger', function () {
  let ledger;
  let owner;
  let otherAccount;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const AuditLedger = await ethers.getContractFactory('AuditLedger');
    ledger = await AuditLedger.deploy();
    await ledger.waitForDeployment();
  });

  it('should set deployer as contract owner', async function () {
    expect(await ledger.owner()).to.equal(owner.address);
  });

  it('should revert NotOwner when called by a non-owner account', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('event-unauthorized'));
    await expect(
      ledger.connect(otherAccount).recordEvent(hash, 'AUTH_LOGIN')
    ).to.be.revertedWithCustomError(ledger, 'NotOwner');
  });

  it('should revert InvalidCategory for an empty category', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('event-no-category'));
    await expect(ledger.recordEvent(hash, '')).to.be.revertedWithCustomError(
      ledger,
      'InvalidCategory'
    );
  });

  it('should anchor an event and emit EventRecorded', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('event-one'));

    await expect(ledger.recordEvent(hash, 'ALLOCATION_APPROVE')).to.emit(
      ledger,
      'EventRecorded'
    );

    expect(await ledger.totalEvents()).to.equal(1);
  });

  it('should emit EventRecorded with the exact hash, category, and anchorer', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('event-two'));

    await expect(ledger.recordEvent(hash, 'AUTH_LOGIN'))
      .to.emit(ledger, 'EventRecorded')
      .withArgs(hash, 'AUTH_LOGIN', owner.address, (bn) => bn > 0n, (ts) => ts > 0n);
  });

  it('should emit EventRecorded with exact blockNumber and timestamp args from the receipt', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('event-three'));

    const tx = await ledger.recordEvent(hash, 'DOCUMENT_UPLOAD');
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
      .find((parsed) => parsed?.name === 'EventRecorded');

    expect(event).to.not.equal(undefined);
    expect(event.args.eventHash).to.equal(hash);
    // `category` is an `indexed string`, so it is keccak-hashed in the log and
    // exposed as an Indexed wrapper; compare its hash rather than the raw value.
    expect(event.args.category.hash).to.equal(ethers.id('DOCUMENT_UPLOAD'));
    expect(event.args.anchoredBy).to.equal(owner.address);
    expect(event.args.blockNumber).to.equal(receipt.blockNumber);
    expect(event.args.timestamp).to.equal(block.timestamp);
  });

  it('should verify an anchored event and return its full metadata', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('event-four'));

    await ledger.recordEvent(hash, 'USER_CREATE');

    const verification = await ledger.verifyEvent(hash);
    expect(verification.exists).to.equal(true);
    expect(verification.category).to.equal('USER_CREATE');
    expect(verification.anchoredBy).to.equal(owner.address);
    expect(verification.anchoredAt).to.be.greaterThan(0);
    expect(verification.blockNumber).to.be.greaterThan(0);
  });

  it('should return the full record for an anchored event', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('event-five'));

    await ledger.recordEvent(hash, 'BLOCKCHAIN_RECORD');

    const record = await ledger.getAuditEvent(hash);
    expect(record.eventHash).to.equal(hash);
    expect(record.category).to.equal('BLOCKCHAIN_RECORD');
    expect(record.anchoredBy).to.equal(owner.address);
    expect(record.anchoredAt).to.be.greaterThan(0);
    expect(record.blockNumber).to.be.greaterThan(0);
  });

  it('should revert when the same event hash is recorded twice', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('event-six'));

    await ledger.recordEvent(hash, 'AUTH_LOGOUT');
    await expect(ledger.recordEvent(hash, 'AUTH_LOGOUT')).to.be.revertedWithCustomError(
      ledger,
      'EventAlreadyRecorded'
    );
  });

  it('should report exists=false for an event hash that was never recorded', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('never-anchored'));

    const verification = await ledger.verifyEvent(hash);
    expect(verification.exists).to.equal(false);
    expect(verification.category).to.equal('');
    expect(verification.anchoredBy).to.equal(ethers.ZeroAddress);
    expect(verification.anchoredAt).to.equal(0);
  });

  it('should count events per category', async function () {
    const hashOne = ethers.keccak256(ethers.toUtf8Bytes('event-a'));
    const hashTwo = ethers.keccak256(ethers.toUtf8Bytes('event-b'));
    const hashThree = ethers.keccak256(ethers.toUtf8Bytes('event-c'));

    await ledger.recordEvent(hashOne, 'AUTH_LOGIN');
    await ledger.recordEvent(hashTwo, 'AUTH_LOGIN');
    await ledger.recordEvent(hashThree, 'ALLOCATION_CREATE');

    expect(await ledger.eventCount('AUTH_LOGIN')).to.equal(2);
    expect(await ledger.eventCount('ALLOCATION_CREATE')).to.equal(1);
    expect(await ledger.eventCount('UNKNOWN')).to.equal(0);
    expect(await ledger.totalEvents()).to.equal(3);
  });

  it('should count multiple distinct events in totalEvents', async function () {
    await ledger.recordEvent(ethers.keccak256(ethers.toUtf8Bytes('one')), 'AUTH_LOGIN');
    await ledger.recordEvent(ethers.keccak256(ethers.toUtf8Bytes('two')), 'AUTH_LOGIN');
    await ledger.recordEvent(ethers.keccak256(ethers.toUtf8Bytes('three')), 'AUTH_LOGOUT');

    expect(await ledger.totalEvents()).to.equal(3);
  });
});

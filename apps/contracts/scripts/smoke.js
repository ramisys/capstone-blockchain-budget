const hre = require('hardhat');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const DEPLOYMENT_FILE = path.join(__dirname, '..', 'deployments', 'contracts.json');
const BACKEND_ABI_FILE = path.join(
  __dirname,
  '..',
  '..',
  'backend',
  'config',
  'blockchainAbi.js'
);

function assertAbiParity(deployedAbi, backendAbi, contractLabel) {
  const sig = (item) => `${item.type}:${item.name}`;
  const deployedSigs = new Set(deployedAbi.map(sig));
  const backendSigs = backendAbi.map(sig);
  const missing = backendSigs.filter((s) => !deployedSigs.has(s));
  assert.deepStrictEqual(
    missing,
    [],
    `backend ABI entries (functions/errors/events) must all exist in the deployed ${contractLabel} ABI`
  );

  const byType = (list, t) => list.filter((x) => x.type === t).map(sig).sort();
  for (const t of ['error', 'event']) {
    const deployedEntries = byType(deployedAbi, t);
    const backendEntries = byType(backendAbi, t);
    assert.deepStrictEqual(
      backendEntries,
      deployedEntries,
      `backend ABI must exactly mirror the deployed ${contractLabel} ${t} entries`
    );
  }
  console.log(
    `ABI check : backend mirrors ${byType(deployedAbi, 'function').length} functions, ` +
      `${byType(deployedAbi, 'error').length} errors, ${byType(deployedAbi, 'event').length} events`
  );
}

async function smokeBudgetLedger(deployment, deployer) {
  const { address, abi, network, chainId } = deployment;
  console.log(`Ledger    : BudgetLedger @ ${address}`);

  const ledger = new hre.ethers.Contract(address, abi, deployer);

  const recordCountBefore = Number(await ledger.recordCount());

  const samplePayload = JSON.stringify({
    allocationCode: 'ALC-2026-SMOKE',
    fiscalYear: 'FY-2026',
    department: 'Engineering',
    allocatedAmount: 12345.67,
    createdBy: deployer.address,
    nonce: Date.now(),
  });
  const contentHash = hre.ethers.sha256(hre.ethers.toUtf8Bytes(samplePayload));
  console.log(`Content   : ${contentHash}`);

  const tx = await ledger.record(contentHash);
  const receipt = await tx.wait();
  assert.ok(receipt.blockNumber > 0, 'receipt should include a block number');
  console.log(`Recorded  : tx ${receipt.hash} in block ${receipt.blockNumber}`);

  const [exists, anchoredBy, anchoredAt, blockNumber] = await ledger.verify(contentHash);
  assert.strictEqual(exists, true, 'anchored hash should verify as existing');
  assert.strictEqual(anchoredBy, deployer.address, 'anchorer should be the deployer');
  assert.ok(Number(anchoredAt) > 0, 'anchoredAt should be set');
  assert.strictEqual(Number(blockNumber), receipt.blockNumber, 'stored block should match receipt');
  console.log(`Verified  : exists=true anchoredBy=${anchoredBy} block=${blockNumber}`);

  const rec = await ledger.getRecord(contentHash);
  assert.strictEqual(rec.contentHash, contentHash, 'getRecord should return the stored hash');
  console.log(`getRecord : contentHash round-trips (block ${Number(rec.blockNumber)})`);

  const tamperedHash = hre.ethers.sha256(hre.ethers.toUtf8Bytes(samplePayload + '-TAMPERED'));
  const [tamperedExists] = await ledger.verify(tamperedHash);
  assert.strictEqual(tamperedExists, false, 'tampered hash must not exist on the ledger');
  console.log(`Tampered  : exists=false (tamper-evidence works)`);

  let replayRejected = false;
  try {
    await ledger.record(contentHash);
  } catch (error) {
    replayRejected = /HashAlreadyRecorded/i.test(error?.message || String(error));
  }
  assert.ok(replayRejected, 're-recording the same hash should revert HashAlreadyRecorded');
  console.log(`Replay    : duplicate anchor reverted (HashAlreadyRecorded)`);

  const recordCountAfter = Number(await ledger.recordCount());
  assert.strictEqual(recordCountAfter, recordCountBefore + 1, 'recordCount should increment');
  console.log(`Count     : ${recordCountBefore} -> ${recordCountAfter}`);

  return { network, chainId };
}

async function smokeAuditLedger(deployment, deployer) {
  const auditLedgerAddress = deployment.auditLedgerAddress;
  assert.ok(
    /^0x[0-9a-fA-F]{40}$/.test(auditLedgerAddress || ''),
    'deployment must include a valid auditLedgerAddress'
  );
  const auditArtifact = await hre.artifacts.readArtifact('AuditLedger');
  console.log(`Ledger    : AuditLedger @ ${auditLedgerAddress}`);

  const auditLedger = new hre.ethers.Contract(auditLedgerAddress, auditArtifact.abi, deployer);

  const totalBefore = Number(await auditLedger.totalEvents());

  const eventHash = hre.ethers.sha256(
    hre.ethers.toUtf8Bytes(`AUDIT-SMOKE-${Date.now()}`)
  );
  const category = 'ALLOCATION_APPROVE';
  console.log(`Event     : ${eventHash} category=${category}`);

  const tx = await auditLedger.recordEvent(eventHash, category);
  const receipt = await tx.wait();
  assert.ok(receipt.blockNumber > 0, 'receipt should include a block number');
  console.log(`Recorded  : tx ${receipt.hash} in block ${receipt.blockNumber}`);

  const [exists, cat, anchoredBy, anchoredAt, blockNumber] = await auditLedger.verifyEvent(
    eventHash
  );
  assert.strictEqual(exists, true, 'anchored event should verify as existing');
  assert.strictEqual(cat, category, 'category should round-trip');
  assert.strictEqual(anchoredBy, deployer.address, 'anchorer should be the deployer');
  assert.ok(Number(anchoredAt) > 0, 'anchoredAt should be set');
  assert.strictEqual(Number(blockNumber), receipt.blockNumber, 'stored block should match receipt');
  console.log(`Verified  : exists=true category=${cat} block=${blockNumber}`);

  const ev = await auditLedger.getAuditEvent(eventHash);
  assert.strictEqual(ev.eventHash, eventHash, 'getAuditEvent should return the stored hash');
  console.log(`getEvent  : eventHash round-trips (block ${Number(ev.blockNumber)})`);

  const unknownHash = hre.ethers.sha256(hre.ethers.toUtf8Bytes('never-anchored'));
  const [unknownExists] = await auditLedger.verifyEvent(unknownHash);
  assert.strictEqual(unknownExists, false, 'unknown event must not exist on the ledger');
  console.log(`Unknown   : exists=false`);

  let replayRejected = false;
  try {
    await auditLedger.recordEvent(eventHash, category);
  } catch (error) {
    replayRejected = /EventAlreadyRecorded/i.test(error?.message || String(error));
  }
  assert.ok(replayRejected, 're-recording the same event should revert EventAlreadyRecorded');
  console.log(`Replay    : duplicate event reverted (EventAlreadyRecorded)`);

  let invalidCategoryRejected = false;
  try {
    await auditLedger.recordEvent(hre.ethers.sha256(hre.ethers.toUtf8Bytes('no-cat')), '');
  } catch (error) {
    invalidCategoryRejected = /InvalidCategory/i.test(error?.message || String(error));
  }
  assert.ok(invalidCategoryRejected, 'empty category should revert InvalidCategory');
  console.log(`Category  : empty category reverted (InvalidCategory)`);

  const categoryCount = Number(await auditLedger.eventCount(category));
  assert.ok(categoryCount > 0, 'per-category count should increment');
  const totalAfter = Number(await auditLedger.totalEvents());
  assert.strictEqual(totalAfter, totalBefore + 1, 'totalEvents should increment');
  console.log(`Count     : ${category}=${categoryCount} total ${totalBefore} -> ${totalAfter}`);

  const backendAbi = (await import(`file://${BACKEND_ABI_FILE.replace(/\\/g, '/')}`)).AUDIT_LEDGER_ABI;
  assertAbiParity(auditArtifact.abi, backendAbi, 'AuditLedger');
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const provider = hre.ethers.provider;

  const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf8'));
  const { network, chainId } = deployment;
  console.log(`Network   : ${network} (chainId ${chainId})`);

  await smokeBudgetLedger(deployment, deployer);
  await smokeAuditLedger(deployment, deployer);

  const backendAbi = (await import(`file://${BACKEND_ABI_FILE.replace(/\\/g, '/')}`)).BUDGET_LEDGER_ABI;
  assertAbiParity(deployment.abi, backendAbi, 'BudgetLedger');

  console.log('========================================================');
  console.log('SMOKE PASS — both ledgers: record, verify, tamper-evidence, replay-guard, ABI parity OK');
  console.log('========================================================');
}

main().catch((error) => {
  console.error('SMOKE FAIL');
  console.error(error);
  process.exitCode = 1;
});

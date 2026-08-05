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

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const provider = hre.ethers.provider;

  const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf8'));
  const { address, abi, network, chainId } = deployment;
  console.log(`Ledger    : ${deployment.contract} @ ${address}`);
  console.log(`Network   : ${network} (chainId ${chainId})`);

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

  const backendAbi = (await import(`file://${BACKEND_ABI_FILE.replace(/\\/g, '/')}`)).BUDGET_LEDGER_ABI;
  const sig = (item) => `${item.type}:${item.name}`;
  const deployedSigs = new Set(abi.map(sig));
  const backendSigs = backendAbi.map(sig);
  const missing = backendSigs.filter((s) => !deployedSigs.has(s));
  assert.deepStrictEqual(
    missing,
    [],
    'backend ABI entries (functions/errors/events) must all exist in the deployed ABI'
  );

  const byType = (list, t) =>
    list.filter((x) => x.type === t).map(sig).sort();
  for (const t of ['error', 'event']) {
    const deployedEntries = byType(abi, t);
    const backendEntries = byType(backendAbi, t);
    assert.deepStrictEqual(
      backendEntries,
      deployedEntries,
      `backend ABI must exactly mirror the deployed ${t} entries`
    );
  }
  console.log(
    `ABI check : backend mirrors ${byType(abi, 'function').length} functions, ` +
      `${byType(abi, 'error').length} errors, ${byType(abi, 'event').length} events`
  );

  console.log('========================================================');
  console.log('SMOKE PASS — record, verify, tamper-evidence, replay-guard, ABI parity all OK');
  console.log('========================================================');
}

main().catch((error) => {
  console.error('SMOKE FAIL');
  console.error(error);
  process.exitCode = 1;
});

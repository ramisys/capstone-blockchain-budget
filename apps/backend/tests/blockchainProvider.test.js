import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';
import { config } from '../config/env.js';
import { blockchainProvider } from '../config/blockchain.js';

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_ADDRESS = '0x1111111111111111111111111111111111111111';

const deploymentFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'contracts',
  'deployments',
  'contracts.json'
);

const originalBlockchainConfig = { ...config.blockchain };
const originalDeploymentExists = fs.existsSync(deploymentFile);
const originalDeploymentContent = originalDeploymentExists ? fs.readFileSync(deploymentFile, 'utf8') : null;

function resetBlockchainConfig() {
  config.blockchain.rpcUrl = originalBlockchainConfig.rpcUrl;
  config.blockchain.network = originalBlockchainConfig.network;
  config.blockchain.chainId = originalBlockchainConfig.chainId;
  config.blockchain.contractAddress = originalBlockchainConfig.contractAddress;
  config.blockchain.privateKey = originalBlockchainConfig.privateKey;
  blockchainProvider._reset();
}

function writeDeploymentFile(content) {
  fs.mkdirSync(path.dirname(deploymentFile), { recursive: true });
  fs.writeFileSync(deploymentFile, content, 'utf8');
}

function restoreDeploymentFile() {
  if (originalDeploymentExists) {
    writeDeploymentFile(originalDeploymentContent);
  } else if (fs.existsSync(deploymentFile)) {
    fs.unlinkSync(deploymentFile);
  }
}

function resetMocks() {
  resetBlockchainConfig();
  restoreDeploymentFile();
}

function mockContractCalls(methods) {
  blockchainProvider._provider = {};
  blockchainProvider._contract = { ...methods };
}

async function runBlockchainProviderTests() {
  console.log('🧪 Starting Blockchain Provider Unit Tests...\n');
  let passedTests = 0;
  let totalTests = 0;

  const test = async (name, testFn) => {
    totalTests++;
    resetMocks();
    try {
      await testFn();
      console.log(`   - ${name}: ✅ PASSED`);
      passedTests++;
    } catch (err) {
      console.error(`   - ${name}: ❌ FAILED`);
      console.error(`     ${err.stack || err}`);
    } finally {
      resetMocks();
    }
  };

  console.log('1. Configuration Tests:');
  await test('should report unconfigured when the RPC URL is missing', async () => {
    config.blockchain.rpcUrl = null;
    config.blockchain.contractAddress = TEST_ADDRESS;

    assert.equal(blockchainProvider.isConfigured(), false);
  });

  await test('should report unconfigured when the contract address is missing', async () => {
    config.blockchain.rpcUrl = 'http://127.0.0.1:8545';
    config.blockchain.contractAddress = null;
    writeDeploymentFile('{}');

    assert.equal(blockchainProvider.isConfigured(), false);
  });

  await test('should report configured when RPC URL and contract address are set', async () => {
    config.blockchain.rpcUrl = 'http://127.0.0.1:8545';
    config.blockchain.contractAddress = TEST_ADDRESS;

    assert.equal(blockchainProvider.isConfigured(), true);
  });

  await test('should expose whether a signing key is available', async () => {
    config.blockchain.privateKey = null;
    assert.equal(blockchainProvider.hasSigner(), false);

    config.blockchain.privateKey = TEST_PRIVATE_KEY;
    assert.equal(blockchainProvider.hasSigner(), true);
  });

  console.log('\n2. Contract Address Resolution Tests:');
  await test('should prefer the env contract address over the deployment file', async () => {
    writeDeploymentFile(JSON.stringify({ contract: 'BudgetLedger', address: '0x2222222222222222222222222222222222222222' }));
    config.blockchain.contractAddress = TEST_ADDRESS;

    assert.equal(blockchainProvider.getContractAddress(), TEST_ADDRESS);
  });

  await test('should discover the contract address from the deployment file as a fallback', async () => {
    writeDeploymentFile(JSON.stringify({ contract: 'BudgetLedger', address: TEST_ADDRESS }));
    config.blockchain.contractAddress = null;

    assert.equal(blockchainProvider.getContractAddress(), TEST_ADDRESS);
  });

  await test('should return null when no address is available anywhere', async () => {
    writeDeploymentFile('{}');
    config.blockchain.contractAddress = null;

    assert.equal(blockchainProvider.getContractAddress(), null);
  });

  console.log('\n3. Lazy Initialization Tests:');
  await test('should build ethers instances lazily and cache them', async () => {
    config.blockchain.rpcUrl = 'http://127.0.0.1:8545';
    config.blockchain.contractAddress = TEST_ADDRESS;
    config.blockchain.privateKey = TEST_PRIVATE_KEY;

    assert.equal(blockchainProvider._contract, null, 'provider must not initialize on construction');

    const first = blockchainProvider._load();

    assert.ok(first.provider instanceof ethers.JsonRpcProvider);
    assert.ok(first.signer instanceof ethers.Wallet);
    assert.ok(first.contract instanceof ethers.Contract);

    const second = blockchainProvider._load();
    assert.equal(second.provider, first.provider, 'provider instance should be cached');
    assert.equal(second.signer, first.signer, 'signer instance should be cached');
    assert.equal(second.contract, first.contract, 'contract instance should be cached');
  });

  await test('should throw when the RPC URL is missing', async () => {
    config.blockchain.rpcUrl = null;
    config.blockchain.contractAddress = TEST_ADDRESS;

    assert.throws(() => blockchainProvider._load(), /BLOCKCHAIN_RPC_URL is not configured/);
  });

  await test('should throw when the contract address is missing', async () => {
    config.blockchain.rpcUrl = 'http://127.0.0.1:8545';
    config.blockchain.contractAddress = null;
    writeDeploymentFile('{}');

    assert.throws(() => blockchainProvider._load(), /BudgetLedger contract address is not configured/);
  });

  await test('should build a signerless instance when no private key is set', async () => {
    config.blockchain.rpcUrl = 'http://127.0.0.1:8545';
    config.blockchain.contractAddress = TEST_ADDRESS;
    config.blockchain.privateKey = null;

    const { signer, contract } = blockchainProvider._load();

    assert.equal(signer, null);
    assert.ok(contract instanceof ethers.Contract);
  });

  console.log('\n4. Ledger Interaction Tests:');
  await test('should reject recording when no signer is configured', async () => {
    config.blockchain.rpcUrl = 'http://127.0.0.1:8545';
    config.blockchain.contractAddress = TEST_ADDRESS;
    config.blockchain.privateKey = null;

    await assert.rejects(
      () => blockchainProvider.record('0xabc'),
      /BLOCKCHAIN_PRIVATE_KEY is not configured/
    );
  });

  await test('should return the transaction hash and block number from a confirmed write', async () => {
    config.blockchain.privateKey = TEST_PRIVATE_KEY;
    mockContractCalls({
      record: async () => ({ wait: async () => ({ hash: '0xtx', blockNumber: 10 }) }),
    });

    const result = await blockchainProvider.record('0xabc');

    assert.equal(result.txHash, '0xtx');
    assert.equal(result.blockNumber, 10);
    assert.ok(blockchainProvider._lastSync instanceof Date, 'lastSync should be refreshed after a write');
  });

  await test('should normalize verify() results to plain numbers', async () => {
    mockContractCalls({
      verify: async () => [true, '0xowner', 1700000000n, 88n],
    });

    const result = await blockchainProvider.verify('0xabc');

    assert.deepEqual(result, {
      exists: true,
      anchoredBy: '0xowner',
      anchoredAt: 1700000000,
      blockNumber: 88,
    });
  });

  await test('should normalize getRecordCount() to a plain number', async () => {
    mockContractCalls({ recordCount: async () => 7n });

    assert.equal(await blockchainProvider.getRecordCount(), 7);
  });

  console.log('\n5. Status Reporting Tests:');
  await test('should report not-configured status when unconfigured', async () => {
    config.blockchain.rpcUrl = null;

    const status = await blockchainProvider.getStatus();

    assert.equal(status.connected, false);
    assert.equal(status.contractAddress, null);
    assert.ok(status.message.includes('not yet configured'));
  });

  await test('should report a connected status with live network data', async () => {
    config.blockchain.rpcUrl = 'http://127.0.0.1:8545';
    config.blockchain.contractAddress = TEST_ADDRESS;
    config.blockchain.network = 'hardhat';
    blockchainProvider._provider = {
      getNetwork: async () => ({ name: 'hardhat', chainId: 31337n }),
      getBlockNumber: async () => 42,
    };
    blockchainProvider._contract = { recordCount: async () => 3n };

    const status = await blockchainProvider.getStatus();

    assert.equal(status.connected, true);
    assert.equal(status.network, 'hardhat');
    assert.equal(status.chainId, 31337);
    assert.equal(status.latestBlock, 42);
    assert.equal(status.onChainCount, 3);
    assert.equal(status.contractAddress, TEST_ADDRESS);
  });

  await test('should fail fast with a graceful disconnected status when the node is unreachable', async () => {
    config.blockchain.rpcUrl = 'http://127.0.0.1:8545';
    config.blockchain.contractAddress = TEST_ADDRESS;
    blockchainProvider._provider = {
      getNetwork: async () => {
        throw new Error('ETIMEDOUT: request timed out');
      },
    };
    blockchainProvider._contract = { recordCount: async () => 0n };

    const status = await blockchainProvider.getStatus();

    assert.equal(status.connected, false);
    assert.ok(status.message.includes('unreachable'));
    assert.ok(status.message.includes('ETIMEDOUT'));
    assert.equal(status.contractAddress, TEST_ADDRESS);
  });

  console.log(`\n✨ Blockchain Provider Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runBlockchainProviderTests().catch((err) => {
  console.error('❌ Blockchain Provider unit test failed:', err);
  process.exit(1);
});

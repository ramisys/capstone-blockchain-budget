const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * Deploy the BudgetLedger and AuditLedger contracts and persist both addresses
 * (plus the BudgetLedger ABI) to `deployments/contracts.json`.
 *
 * The `address` field is kept for backward compatibility; the audit ledger
 * address is stored under `auditLedgerAddress`.
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const BudgetLedger = await hre.ethers.getContractFactory('BudgetLedger');
  const ledger = await BudgetLedger.deploy();
  await ledger.waitForDeployment();

  const AuditLedger = await hre.ethers.getContractFactory('AuditLedger');
  const auditLedger = await AuditLedger.deploy();
  await auditLedger.waitForDeployment();

  const address = await ledger.getAddress();
  const auditLedgerAddress = await auditLedger.getAddress();
  const network = await hre.ethers.provider.getNetwork();

  const artifact = await hre.artifacts.readArtifact('BudgetLedger');

  const deployment = {
    contract: 'BudgetLedger',
    address,
    auditLedgerAddress,
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployedBy: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const outputPath = path.join(deploymentsDir, 'contracts.json');
  fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2) + '\n');

  console.log('========================================================');
  console.log('Contracts deployed');
  console.log(`  BudgetLedger  : ${address}`);
  console.log(`  AuditLedger   : ${auditLedgerAddress}`);
  console.log(`  Network       : ${hre.network.name} (chainId ${Number(network.chainId)})`);
  console.log(`  Deployer      : ${deployer.address}`);
  console.log(`  Saved to      : ${path.relative(path.join(__dirname, '..', '..'), outputPath)}`);
  console.log('========================================================');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

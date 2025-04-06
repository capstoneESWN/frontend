// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  const DIDRegistryFactory = await hre.ethers.getContractFactory("DIDRegistry");
  const registry = await DIDRegistryFactory.deploy(); 
  console.log("배포 중...");
  await registry.waitForDeployment();
  console.log("DIDRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

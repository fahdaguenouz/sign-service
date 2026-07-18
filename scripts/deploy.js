const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const DocumentStorage = await hre.ethers.getContractFactory("DocumentStorage");
  const documentStorage = await DocumentStorage.deploy();

  await documentStorage.waitForDeployment();
  const address = await documentStorage.getAddress();

  console.log("DocumentStorage deployed to:", address);

  // Save the contract address to be used by the frontend
  const jsDir = path.join(__dirname, "..", "interface", "js");
  if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
  }

  const configPath = path.join(jsDir, "config.js");
  const configContent = `const CONTRACT_ADDRESS = "${address}";`;
  
  fs.writeFileSync(configPath, configContent);
  console.log("Contract address saved to interface/js/config.js");

  // Save the ABI
  const artifactPath = path.join(__dirname, "..", "artifacts", "Contracts", "storage.sol", "DocumentStorage.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const abiPath = path.join(jsDir, "abi.js");
  const abiContent = `const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};`;
  
  fs.writeFileSync(abiPath, abiContent);
  console.log("Contract ABI saved to interface/js/abi.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

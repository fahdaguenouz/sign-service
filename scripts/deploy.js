// Hardhat Runtime Environment - provides access to ethers, network config, etc.
const hre = require("hardhat");
// Node.js file system module for reading/writing files
const fs = require("fs");
// Node.js path module for cross-platform path handling
const path = require("path");


async function main() {
  // Get the compiled contract factory for DocumentStorage
  const DocumentStorage = await hre.ethers.getContractFactory("DocumentStorage");
  // Deploy a new instance of the DocumentStorage contract
  const documentStorage = await DocumentStorage.deploy();


  // Wait until the contract is fully deployed on-chain
  await documentStorage.waitForDeployment();
  // Retrieve the deployed contract's address
  const address = await documentStorage.getAddress();


  // Log the deployment address to the console
  console.log("DocumentStorage deployed to:", address);


  // Save the contract address to be used by the frontend
  // Build path to the frontend JS directory (../interface/js relative to this script)
  const jsDir = path.join(__dirname, "..", "interface", "js");
  // Create the directory if it does not already exist
  if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
  }


  // Path where the contract address config file will be written
  const configPath = path.join(jsDir, "config.js");
  // Generate JS content that exports the contract address as a constant
  const configContent = `const CONTRACT_ADDRESS = "${address}";`;
  
  // Write the address config file to disk
  fs.writeFileSync(configPath, configContent);
  
  // Confirm that the address was saved successfully
  console.log("Contract address saved to interface/js/config.js");


  // Save the ABI
  // Path to the Hardhat compilation artifact containing the contract ABI
  const artifactPath = path.join(__dirname, "..", "artifacts", "Contracts", "storage.sol", "DocumentStorage.json");
  
  // Read and parse the artifact JSON file
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Path where the ABI JS file will be written
  const abiPath = path.join(jsDir, "abi.js");
  
  // Generate JS content that exports the ABI as a constant (pretty-printed)
  const abiContent = `const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};`;
  
  // Write the ABI file to disk for frontend consumption
  fs.writeFileSync(abiPath, abiContent);


  // Confirm that the ABI was saved successfully
  console.log("Contract ABI saved to interface/js/abi.js");
}



// Execute main() and handle any uncaught errors
main().catch((error) => {
  // Log the error details
  console.error(error);
  // Set a non-zero exit code so the process signals failure
  process.exitCode = 1;
});
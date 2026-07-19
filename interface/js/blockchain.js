// js/blockchain.js


// Ethers.js BrowserProvider instance connected to MetaMask
let provider;
// Signer derived from the connected wallet (used for signing & sending txs)
let signer;
// Ethers.js Contract instance bound to DocumentStorage with the signer
let contract;


/*
|--------------------------------------------------------------------------
| Connect MetaMask
|--------------------------------------------------------------------------
*/


// Request MetaMask connection and initialize provider, signer, and contract
export async function connectWallet() {


    // Abort if the MetaMask extension (or compatible wallet) is not installed
    if (!window.ethereum) {
        throw new Error("MetaMask not found.");
    }


    // Create an ethers v6 BrowserProvider wrapping window.ethereum
    provider = new ethers.BrowserProvider(window.ethereum);


    // Prompt the user to unlock MetaMask and grant account access
    await provider.send("eth_requestAccounts", []);


    // Obtain the signer for the currently selected account
    signer = await provider.getSigner();


    // Instantiate the DocumentStorage contract with address, ABI, and signer
    contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
    );


    // Return the connected wallet address to the caller
    return await signer.getAddress();
}


/*
|--------------------------------------------------------------------------
| Sign Document
|--------------------------------------------------------------------------
*/


// Cryptographically sign a document hash with the connected wallet
export async function signDocument(hash) {


    // Ensure a wallet has been connected before attempting to sign
    if (!signer) {
        throw new Error("Wallet not connected.");
    }


    // Produce an EIP-191 personal_sign signature over the hash string
    const signature = await signer.signMessage(hash);


    // Return the hex-encoded signature
    return signature;
}


/*
|--------------------------------------------------------------------------
| Publish Document
|--------------------------------------------------------------------------
*/


// Call the on-chain publishDocument function to record the hash permanently
export async function publishDocument(hash) {


    // Ensure the contract instance exists (wallet must be connected first)
    if (!contract) {
        throw new Error("Wallet not connected.");
    }


    // Send the publishDocument transaction with the document hash
    const tx = await contract.publishDocument(hash);


    // Wait for the transaction to be mined and confirmed
    await tx.wait();


    // Return the transaction hash for reference
    return tx.hash;
}


/*
|--------------------------------------------------------------------------
| Verify Document
|--------------------------------------------------------------------------
*/


// Query the contract to check whether a document hash has been published
export async function verifyDocument(hash) {


    // Ensure the contract instance exists (wallet must be connected first)
    if (!contract) {
        throw new Error("Wallet not connected.");
    }


    // Call the view function verifyDocument; returns [timestamp, publisher]
    const result = await contract.verifyDocument(hash);


    // Map the raw tuple into a named object for easier consumption
    return {
        timestamp: result[0],
        publisher: result[1]
    };
}
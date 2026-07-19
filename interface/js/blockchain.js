// js/blockchain.js

let provider;
let signer;
let contract;

/*
|--------------------------------------------------------------------------
| Connect MetaMask
|--------------------------------------------------------------------------
*/

export async function connectWallet() {

    if (!window.ethereum) {
        throw new Error("MetaMask not found.");
    }

    provider = new ethers.BrowserProvider(window.ethereum);

    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();

    contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
    );

    return await signer.getAddress();
}

/*
|--------------------------------------------------------------------------
| Sign Document
|--------------------------------------------------------------------------
*/

export async function signDocument(hash) {

    if (!signer) {
        throw new Error("Wallet not connected.");
    }

    const signature = await signer.signMessage(hash);

    return signature;
}

/*
|--------------------------------------------------------------------------
| Publish Document
|--------------------------------------------------------------------------
*/

export async function publishDocument(hash) {

    if (!contract) {
        throw new Error("Wallet not connected.");
    }

    const tx = await contract.publishDocument(hash);

    await tx.wait();

    return tx.hash;
}

/*
|--------------------------------------------------------------------------
| Verify Document
|--------------------------------------------------------------------------
*/

export async function verifyDocument(hash) {

    if (!contract) {
        throw new Error("Wallet not connected.");
    }

    const result = await contract.verifyDocument(hash);

    return {
        timestamp: result[0],
        publisher: result[1]
    };
}
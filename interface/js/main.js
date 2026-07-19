// js/main.js

import {
    connectWallet,
    signDocument,
    publishDocument,
    verifyDocument
} from "./blockchain.js";

const connectBtn = document.getElementById("connect-wallet");
const walletText = document.getElementById("wallet-text");

const getStartedBtn = document.getElementById("get-started");

const uploadSection = document.getElementById("upload-section");
const actionsSection = document.getElementById("actions-section");

const fileInput = document.getElementById("file-input");

const fileDetails = document.getElementById("file-details");

const fileName = document.getElementById("file-name");
const fileSize = document.getElementById("file-size");
const fileHash = document.getElementById("file-hash");

const signBtn = document.getElementById("btn-sign");
const publishBtn = document.getElementById("btn-publish");
const verifyBtn = document.getElementById("btn-verify");
const retrieveBtn = document.getElementById("btn-retrieve");

const statusContainer = document.getElementById("status-container");

let selectedFile = null;
let currentHash = "";

// -------------------------------------------------

getStartedBtn.addEventListener("click", () => {
    uploadSection.classList.remove("hidden");
    actionsSection.classList.remove("hidden");

    uploadSection.scrollIntoView({
        behavior: "smooth"
    });
});

// -------------------------------------------------

connectBtn.addEventListener("click", async () => {

    try {

        const account = await connectWallet();

        walletText.textContent =
            account.substring(0, 6) +
            "..." +
            account.substring(account.length - 4);

        showStatus("✅ Wallet connected");

    } catch (err) {

        console.error(err);

        showStatus("❌ Wallet connection failed");

    }

});

// -------------------------------------------------

fileInput.addEventListener("change", async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    selectedFile = file;

    fileDetails.classList.remove("hidden");

    fileName.textContent = file.name;

    fileSize.textContent =
        (file.size / 1024).toFixed(2) + " KB";

    currentHash = await generateHash(file);

    fileHash.textContent = currentHash;

    signBtn.disabled = false;
    publishBtn.disabled = false;
    verifyBtn.disabled = false;
    retrieveBtn.disabled = false;

});

// -------------------------------------------------

signBtn.addEventListener("click", async () => {

    try {

        const signature =
            await signDocument(currentHash);

        showStatus(
            "✅ Signature created<br><br>" +
            signature
        );

    } catch (err) {

        console.error(err);

        showStatus("❌ Signature failed");

    }

});

// -------------------------------------------------

publishBtn.addEventListener("click", async () => {

    try {

        await publishDocument(currentHash);

        showStatus("✅ Document published");

        await uploadFile();

    } catch (err) {

        console.error(err);

        showStatus("❌ Publish failed");

    }

});

// -------------------------------------------------

verifyBtn.addEventListener("click", async () => {

    try {

        const result =
            await verifyDocument(currentHash);

        if (Number(result.timestamp) === 0) {

            showStatus("❌ Document not found");

            return;

        }

        const date =
            new Date(
                Number(result.timestamp) * 1000
            );

        showStatus(
            `
            ✅ Document exists

            <br><br>

            Published:

            ${date.toLocaleString()}

            <br><br>

            Publisher:

            ${result.publisher}
            `
        );

    } catch (err) {

        console.error(err);

        showStatus("❌ Verification failed");

    }

});

// -------------------------------------------------

retrieveBtn.addEventListener("click", () => {

    window.location =
        "/api/document/" + currentHash;

});

// -------------------------------------------------

async function uploadFile() {

    const formData = new FormData();

    formData.append(
        "document",
        selectedFile
    );

    formData.append(
        "hash",
        currentHash
    );

    await fetch("/api/upload", {

        method: "POST",

        body: formData

    });

}

// -------------------------------------------------

async function generateHash(file) {

    const buffer =
        await file.arrayBuffer();

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            buffer
        );

    const hashArray =
        Array.from(
            new Uint8Array(hashBuffer)
        );

    return hashArray
        .map(b =>
            b.toString(16).padStart(2, "0")
        )
        .join("");

}

// -------------------------------------------------

function showStatus(message) {

    statusContainer.classList.remove("hidden");

    statusContainer.innerHTML = message;

}
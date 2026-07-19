// js/main.js


// Import blockchain helper functions from the local module
import {
    connectWallet,
    signDocument,
    publishDocument,
    verifyDocument
} from "./blockchain.js";


// DOM reference: button that triggers MetaMask wallet connection
const connectBtn = document.getElementById("connect-wallet");
// DOM reference: text element that displays the truncated wallet address
const walletText = document.getElementById("wallet-text");


// DOM reference: hero "Get Started" button that reveals the main UI sections
const getStartedBtn = document.getElementById("get-started");


// DOM reference: section containing the file upload controls
const uploadSection = document.getElementById("upload-section");
// DOM reference: section containing sign / publish / verify / retrieve actions
const actionsSection = document.getElementById("actions-section");


// DOM reference: hidden file input used to select a document
const fileInput = document.getElementById("file-input");


// DOM reference: container that shows selected file metadata
const fileDetails = document.getElementById("file-details");


// DOM reference: element displaying the selected file's name
const fileName = document.getElementById("file-name");
// DOM reference: element displaying the selected file's size
const fileSize = document.getElementById("file-size");
// DOM reference: element displaying the computed SHA-256 hash
const fileHash = document.getElementById("file-hash");


// DOM reference: button to sign the document hash with the wallet
const signBtn = document.getElementById("btn-sign");
// DOM reference: button to publish the hash on-chain
const publishBtn = document.getElementById("btn-publish");
// DOM reference: button to verify the hash against the smart contract
const verifyBtn = document.getElementById("btn-verify");
// DOM reference: button to download the stored document from the server
const retrieveBtn = document.getElementById("btn-retrieve");


// DOM reference: container used to display status / result messages
const statusContainer = document.getElementById("status-container");


// Holds the currently selected File object (null until a file is chosen)
let selectedFile = null;
// Holds the SHA-256 hex hash of the selected file
let currentHash = "";


// -------------------------------------------------


// Reveal upload & actions sections and smoothly scroll to the upload area
getStartedBtn.addEventListener("click", () => {
    // Make the upload section visible
    uploadSection.classList.remove("hidden");
    // Make the actions section visible
    actionsSection.classList.remove("hidden");


    // Smooth-scroll the page so the upload section comes into view
    uploadSection.scrollIntoView({
        behavior: "smooth"
    });
});


// -------------------------------------------------


// Connect MetaMask, display a truncated address, and show a success status
connectBtn.addEventListener("click", async () => {


    try {


        // Request wallet connection and receive the account address
        const account = await connectWallet();


        // Display first 6 + last 4 characters of the address in the UI
        walletText.textContent =
            account.substring(0, 6) +
            "..." +
            account.substring(account.length - 4);


        // Notify the user that the wallet connected successfully
        showStatus("✅ Wallet connected");


    } catch (err) {


        // Log the underlying error for debugging
        console.error(err);


        // Notify the user that the connection attempt failed
        showStatus("❌ Wallet connection failed");


    }


});


// -------------------------------------------------


// Handle file selection: compute hash, show metadata, and enable action buttons
fileInput.addEventListener("change", async (e) => {


    // Grab the first selected file from the input
    const file = e.target.files[0];


    // Exit early if the user cancelled the file dialog
    if (!file) return;


    // Store the File object for later upload
    selectedFile = file;


    // Reveal the file-details panel
    fileDetails.classList.remove("hidden");


    // Display the original file name
    fileName.textContent = file.name;


    // Display file size converted to kilobytes with 2 decimal places
    fileSize.textContent =
        (file.size / 1024).toFixed(2) + " KB";


    // Compute the SHA-256 hash of the file contents
    currentHash = await generateHash(file);


    // Display the computed hash in the UI
    fileHash.textContent = currentHash;


    // Enable all action buttons now that a valid file/hash is available
    signBtn.disabled = false;
    publishBtn.disabled = false;
    verifyBtn.disabled = false;
    retrieveBtn.disabled = false;


});


// -------------------------------------------------


// Sign the current document hash with the connected wallet
signBtn.addEventListener("click", async () => {


    try {


        // Request a personal_sign signature over the hash
        const signature =
            await signDocument(currentHash);


        // Display the resulting signature in the status area
        showStatus(
            "✅ Signature created<br><br>" +
            signature
        );


    } catch (err) {


        // Log the underlying error for debugging
        console.error(err);


        // Notify the user that signing failed
        showStatus("❌ Signature failed");


    }


});


// -------------------------------------------------


// Publish the hash on-chain, then upload the original file to the server
publishBtn.addEventListener("click", async () => {


    try {


        // Send the publishDocument transaction and wait for confirmation
        await publishDocument(currentHash);


        // Notify the user that the on-chain publish succeeded
        showStatus("✅ Document published");


        // Store the original file on the backend (keyed by hash)
        await uploadFile();


    } catch (err) {


        // Log the underlying error for debugging
        console.error(err);


        // Notify the user that publishing failed
        showStatus("❌ Publish failed");


    }


});


// -------------------------------------------------


// Verify whether the current hash exists on-chain and display its metadata
verifyBtn.addEventListener("click", async () => {


    try {


        // Query the smart contract for timestamp and publisher
        const result =
            await verifyDocument(currentHash);


        // A zero timestamp means the hash has never been published
        if (Number(result.timestamp) === 0) {


            showStatus("❌ Document not found");


            return;


        }


        // Convert the Unix timestamp (seconds) to a local Date object
        const date =
            new Date(
                Number(result.timestamp) * 1000
            );


        // Display publication date and publisher address
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


        // Log the underlying error for debugging
        console.error(err);


        // Notify the user that verification failed
        showStatus("❌ Verification failed");


    }


});


// -------------------------------------------------


// Navigate to the backend download endpoint for the current hash
retrieveBtn.addEventListener("click", () => {


    // Trigger a browser download via the /api/document/:hash route
    window.location =
        "/api/document/" + currentHash;


});


// -------------------------------------------------


// Upload the selected file and its hash to the Express backend
async function uploadFile() {


    // Build a multipart form payload
    const formData = new FormData();


    // Attach the raw file under the field name expected by multer
    formData.append(
        "document",
        selectedFile
    );


    // Attach the SHA-256 hash used as the on-disk filename
    formData.append(
        "hash",
        currentHash
    );


    // POST the form data to the server-side upload endpoint
    await fetch("/api/upload", {


        method: "POST",


        body: formData


    });


}


// -------------------------------------------------


// Compute a lowercase hex SHA-256 digest of a File using the Web Crypto API
async function generateHash(file) {


    // Read the entire file into an ArrayBuffer
    const buffer =
        await file.arrayBuffer();


    // Run SHA-256 over the buffer
    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            buffer
        );


    // Convert the resulting ArrayBuffer into a byte array
    const hashArray =
        Array.from(
            new Uint8Array(hashBuffer)
        );


    // Map each byte to a 2-digit hex string and concatenate
    return hashArray
        .map(b =>
            b.toString(16).padStart(2, "0")
        )
        .join("");


}


// -------------------------------------------------


// Reveal the status container and set its HTML content to the given message
function showStatus(message) {


    // Make the status area visible
    statusContainer.classList.remove("hidden");


    // Inject the (possibly HTML) message into the container
    statusContainer.innerHTML = message;


}
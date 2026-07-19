// Express web framework for building the HTTP server
const express = require('express');
// CORS middleware to allow cross-origin requests from the frontend
const cors = require('cors');
// Multer middleware for handling multipart/form-data file uploads
const multer = require('multer');
// Node.js path module for cross-platform path handling
const path = require('path');
// Node.js file system module for reading/writing files and directories
const fs = require('fs');


// Create the Express application instance
const app = express();
// Port the server will listen on
const port = 3000;


// Enable CORS for all routes
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());


// Serve the static frontend files
// Serve all static assets from the ../interface directory
app.use(express.static(path.join(__dirname, '../interface')));


// Setup storage for uploaded files (Bonus functionality)
// Directory where uploaded documents will be stored on disk
const uploadDir = path.join(__dirname, '../uploads');
// Create the uploads directory if it does not already exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// Configure multer to store files on disk with custom destination and filename
const storage = multer.diskStorage({
  // Save all uploaded files into the uploads directory
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  // Name the file using the hash from the request body (fallback to original name)
  filename: function (req, file, cb) {
    // We will save it with its hash as the filename, which is passed in the body
    cb(null, req.body.hash || file.originalname);
  }
});


// Create the multer upload middleware using the disk storage config
const upload = multer({ storage: storage });


// API Endpoint to store the document on the server
// Accept a single file field named "document" and store it via multer
app.post('/api/upload', upload.single('document'), (req, res) => {
  // Reject the request if no file was provided
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Reject the request if the document hash is missing from the body
  if (!req.body.hash) {
    return res.status(400).json({ error: 'Document hash is required' });
  }
  
  // Respond with success and echo back the stored hash
  res.json({ 
    message: 'File successfully stored on server',
    hash: req.body.hash
  });
});


// API Endpoint to retrieve a document by its hash
// Look up a previously uploaded file by its hash and send it as a download
app.get('/api/document/:hash', (req, res) => {
  // Extract the document hash from the URL path parameter
  const hash = req.params.hash;
  // Build the full path to the file in the uploads directory
  const filePath = path.join(uploadDir, hash);
  
  // If the file exists, stream it as a download with a truncated-hash filename
  if (fs.existsSync(filePath)) {
    res.download(filePath, `document_${hash.substring(0, 8)}`);
  } else {
    // Return 404 if no file matches the given hash
    res.status(404).json({ error: 'Document not found on server' });
  }
});


// Start the HTTP server and log the listening URL
app.listen(port, () => {
  console.log(`Sign Service is running on http://localhost:${port}`);
});
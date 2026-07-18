const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve the static frontend files
app.use(express.static(path.join(__dirname, '../interface')));

// Setup storage for uploaded files (Bonus functionality)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // We will save it with its hash as the filename, which is passed in the body
    cb(null, req.body.hash || file.originalname);
  }
});

const upload = multer({ storage: storage });

// API Endpoint to store the document on the server
app.post('/api/upload', upload.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  if (!req.body.hash) {
    return res.status(400).json({ error: 'Document hash is required' });
  }
  
  res.json({ 
    message: 'File successfully stored on server',
    hash: req.body.hash
  });
});

// API Endpoint to retrieve a document by its hash
app.get('/api/document/:hash', (req, res) => {
  const hash = req.params.hash;
  const filePath = path.join(uploadDir, hash);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, `document_${hash.substring(0, 8)}`);
  } else {
    res.status(404).json({ error: 'Document not found on server' });
  }
});

app.listen(port, () => {
  console.log(`Sign Service is running on http://localhost:${port}`);
});

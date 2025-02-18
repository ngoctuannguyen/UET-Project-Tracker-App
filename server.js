const express = require('express');
const multer = require('multer');
const Quagga = require('quagga').default;
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/temp';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Function to decode barcode using Quagga
const decodeBarcode = (filePath) => {
  return new Promise((resolve, reject) => {
    Quagga.decodeSingle(
      {
        src: filePath,
        numOfWorkers: 0, // Set to 0 to disable worker threads
        decoder: {
          readers: ['ean_reader', 'upc_reader', 'code_128_reader'] // Supported barcode formats
        },
        locate: true,
      },
      (result) => {
        if (result && result.codeResult) {
          resolve(result.codeResult.code);
        } else {
          reject(new Error('No barcode found in image'));
        }
      }
    );
  });
};

app.post('/api/scan-barcode', upload.single('barcodeImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Decode barcode using Quagga
    const barcode = await decodeBarcode(req.file.path);
    console.log('Barcode:', barcode);
    // Get product information from Open Food Facts API
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    fs.unlinkSync(req.file.path); // Clean up file after processing

    if (response.data.status === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      barcode,
      product: response.data.product
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path); // Clean up file on error
    }
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
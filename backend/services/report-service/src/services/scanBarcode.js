const multer = require('multer');
const Quagga = require('quagga').default;
const fs = require('fs');
const path = require('path');

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

// Function to scan barcode from an image
const scanBarcode = async (filePath) => {
  try {
    const barcode = await decodeBarcode(filePath);
    return barcode;
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Clean up file on error
    }
    throw new Error(error.message);
  }
};

module.exports = { scanBarcode, upload };

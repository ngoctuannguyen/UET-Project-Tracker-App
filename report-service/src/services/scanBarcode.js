const multer = require('multer');
const Quagga = require('quagga').default;
const Jimp = require('jimp');


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
// Function to preprocess image with Jimp
const preprocessImage = async (filePath) => {
  const image = await Jimp.read(filePath);
  image
    .normalize()           // Enhance contrast
    .contrast(0.5)         // Boost contrast
    .greyscale()           // Convert to grayscale
    .resize(800, Jimp.AUTO); // Resize for consistency

  const processedPath = filePath + '_processed.jpg';
  await image.writeAsync(processedPath);
  return processedPath;
};

const decodeBarcode = async (imagePath) => {
  const tryDecode = (options) => {
    return new Promise((resolve, reject) => {
      Quagga.decodeSingle(options, (result) => {
        if (result && result.codeResult) {
          console.log("✅ Barcode decoded:", result.codeResult.code);
          console.log("📦 Box coordinates:", result.box);
          resolve(result.codeResult.code);
        } else if (result) {
          console.log("⚠️ Barcode detected but decoding failed.");
          console.log("📦 Box coordinates:", result.box);
          reject(new Error("Detected but failed to decode barcode"));
        } else {
          console.log("❌ No barcode detected at all.");
          reject(new Error("No barcode detected"));
        }
      });
    });
  };

  const configBase = {
    src: imagePath,
    numOfWorkers: 0,
    inputStream: {
      size: 800,
      singleChannel: false
    },
    decoder: {
      readers: ['ean_reader', 'upc_reader', 'code_128_reader']
    },
    locate: true
  };

  const locatorConfigs = [
    { patchSize: 'medium', halfSample: true },
    { patchSize: 'large', halfSample: false }
  ];

  for (const locator of locatorConfigs) {
    try {
      const result = await tryDecode({ ...configBase, locator });
      return result;
    } catch (e) {
      // Continue to next fallback
    }
  }

  throw new Error('Failed to decode barcode');
};


// TODO: Test barcode not good
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


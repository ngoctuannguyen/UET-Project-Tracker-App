const express = require("express");
const multer = require("multer");
const Quagga = require("quagga").default;
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
const bodyParser = require("body-parser");
const pool = require("./models/SQLconnect"); // Import pool, không phải AccountModel
const port = process.env.PORT || 3000;
const saltRounds = 10;
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  //Kiểm tra dữ liệu đầu vào
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." });
  }
  // Kiểm tra độ dài tên
  if (username.length < 3) {
    return res
      .status(400)
      .json({ message: "Tên đăng nhập phải có ít nhất 3 ký tự." });
  }
  //kiểm tra độ dài pass
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
  }

  try {
    //kiểm tra xem tên đăng nhập đã tồn tại chưa
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ message: "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác." });
    }

    //băm mật khẩu
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //lưu thông tin người dùng vào cơ sở dữ liệu
    const [result] = await pool.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );

    res.status(201).json({
      message: "Đăng ký tài khoản thành công!",
      userId: result.insertId,
    });
  } catch (error) {
    // xử lý lỗi tổng quát (server error, database error, ...)
    console.error("Lỗi trong quá trình đăng ký:", error);

    // kiểm tra loại lỗi cụ thể nếu cần (ví dụ: lỗi kết nối CSDL)
    if (error.code === "ER_DUP_ENTRY") {
      //MySql Error Code
      return res
        .status(409)
        .json({ message: "Tên đăng nhập đã tồn tại (lỗi mã MySQL)." });
    }
    if (error.code === "ECONNREFUSED") {
      //lỗi kết nối
      return res
        .status(503)
        .json({ message: "Không thể kết nối đến cơ sở dữ liệu." });
    }

    res.status(500).json({ message: "Đã xảy ra lỗi. Vui lòng thử lại sau." });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." });
  }

  try {
    //tìm người dùng trong cơ sở dữ liệu
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    //kiểm tra xem người dùng có tồn tại không
    if (users.length === 0) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng." });
    }

    const user = users[0]; // lấy thông tin người dùng do mysql2 trả về 1 mảng

    //so sánh mật khẩu
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng." });
    }
    res.status(200).json({
      message: "Đăng nhập thành công!",
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Lỗi trong quá trình đăng nhập:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi. Vui lòng thử lại sau." });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/temp";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
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
          readers: ["ean_reader", "upc_reader", "code_128_reader"], // Supported barcode formats
        },
        locate: true,
      },
      (result) => {
        if (result && result.codeResult) {
          resolve(result.codeResult.code);
        } else {
          reject(new Error("No barcode found in image"));
        }
      }
    );
  });
};

app.post(
  "/api/scan-barcode",
  upload.single("barcodeImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Decode barcode using Quagga
      const barcode = await decodeBarcode(req.file.path);
      console.log("Barcode:", barcode);
      // Get product information from Open Food Facts API
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );

      fs.unlinkSync(req.file.path); // Clean up file after processing

      if (response.data.status === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({
        barcode,
        product: response.data.product,
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path); // Clean up file on error
      }
      console.error("Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

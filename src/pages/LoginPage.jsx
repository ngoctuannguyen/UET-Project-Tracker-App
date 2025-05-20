import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/context/AuthContext"; // Đảm bảo đường dẫn chính xác
import { jwtDecode } from "jwt-decode"; // Nhập jwt-decode

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // Lấy hàm login từ AuthContext
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email.includes("@") || password.length < 4) {
        toast.error("Invalid email or password");
        setIsLoading(false); // Thêm dòng này để reset loading state
        return;
      }

      // 🧪 Tạm thời: nếu email chứa "admin", gán role là admin
      const role = email.includes("admin") ? "admin" : "user";

      // Gửi yêu cầu đăng nhập
      const response = await axios.post("/auth/login", { email, password }, { withCredentials: true });

      const { idToken, refreshToken, userData: originalUserData } = response.data;

      // Giải mã idToken để lấy Firebase User UID
      let firebaseUserUid = null;
      if (idToken) {
        try {
          const decodedToken = jwtDecode(idToken);
          firebaseUserUid = decodedToken.user_id; // Firebase UID thường nằm trong claim 'user_id' hoặc 'sub'
          console.log("LoginPage - Decoded Firebase UID from idToken:", firebaseUserUid);
        } catch (decodeError) {
          console.error("LoginPage - Error decoding idToken:", decodeError);
          toast.error("Login failed: Could not process user identity.");
          setIsLoading(false);
          return;
        }
      }

      if (!firebaseUserUid) {
        console.error("LoginPage - Firebase UID could not be extracted from idToken.");
        toast.error("Login failed: User identity is missing.");
        setIsLoading(false);
        return;
      }

      // Tạo đối tượng userData mới, thêm firebaseUserUid làm trường 'uid'
      const finalUserData = {
        ...originalUserData,
        uid: firebaseUserUid, // Đây sẽ là Firebase User UID
      };

      console.log("LoginPage - idToken:", idToken, "**** refreshToken:", refreshToken, "finalUserData:", finalUserData);
  
      // Lưu trạng thái người dùng vào Context với finalUserData đã bao gồm uid
      login(idToken, refreshToken, finalUserData);
  
      toast.success("Login successful!")  

      // Điều hướng theo role
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/"); // Điều hướng đến trang chủ (nơi có thể có Dashboard)
      }
    } catch (error) {
      console.log("LoginPage - Login error:", error);
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false); // Đảm bảo setIsLoading(false) được gọi
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng nhập</h2>

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium text-gray-700">Mật khẩu</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
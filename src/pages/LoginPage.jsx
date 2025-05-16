import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

const USER_SERVICE_API_URL = "http://localhost:3000/api/auth"; // PORT 3000 cho user-service

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.includes("@") || password.length < 6) {
      toast.error("Email không hợp lệ hoặc mật khẩu phải có ít nhất 6 ký tự.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${USER_SERVICE_API_URL}/login`, {
        email,
        password,
      });

      if (response.data && response.data.idToken && response.data.uid && response.data.userData) {
        const { idToken, uid, userData } = response.data;

        let userRole = "user";
        if (userData.role) {
          if (String(userData.role) === "1" || String(userData.role).toLowerCase() === "admin" || String(userData.role).toLowerCase() === "management") {
            userRole = "admin";
          } else if (String(userData.role) === "2" || String(userData.role).toLowerCase() === "user") {
            userRole = "user";
          }
        }

        const authData = {
          token: idToken,
          user: {
            uid: uid,
            displayName: userData.full_name || userData.name || "User",
            email: userData.email,
            role: userRole,
          },
        };
        localStorage.setItem('authData', JSON.stringify(authData));

        localStorage.removeItem("token");
        localStorage.removeItem("role");

        toast.success("Đăng nhập thành công!");

        // ĐIỀU HƯỚNG ĐẾN TRANG CHỦ (/) SAU KHI ĐĂNG NHẬP THÀNH CÔNG
        navigate("/"); // <<<< THAY ĐỔI ĐÍCH ĐIỀU HƯỚNG

      } else {
        toast.error("Đăng nhập thất bại: Dữ liệu trả về không hợp lệ từ server.");
        console.error("Invalid response data from login API:", response.data);
      }
    } catch (error) {
      console.error("Login error details:", error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`Đăng nhập thất bại: ${error.response.data.message}`);
      } else if (error.request || error.code === "ERR_NETWORK") {
        toast.error("Đăng nhập thất bại: Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và địa chỉ API.");
      } else {
        toast.error("Đăng nhập thất bại: Đã có lỗi xảy ra.");
      }
    } finally {
      setIsLoading(false);
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
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
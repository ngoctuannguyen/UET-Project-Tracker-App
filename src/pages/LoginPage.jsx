import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/context/AuthContext"; // Đảm bảo đường dẫn chính xác
import { jwtDecode } from "jwt-decode"; // Nhập jwt-decode

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post("/auth/forgot-password", { email: forgotEmail });
      toast.success("Password reset email sent! Please check your inbox.");
      setShowForgot(false);
      setForgotEmail("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send reset email.");
    } finally {
      setForgotLoading(false);
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

        <div className="mb-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
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

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            className="text-blue-600 text-sm hover:underline"
            onClick={() => setShowForgot(true)}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
          <form
            onSubmit={handleForgotPassword}
            className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm relative z-10"
          >
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl"
              onClick={() => setShowForgot(false)}
              title="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-blue-700 text-center">Forgot Password</h3>
            <label className="block mb-2 text-sm font-medium text-gray-700">Enter your email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring mb-4"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              disabled={forgotLoading}
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              disabled={forgotLoading}
            >
              {forgotLoading ? "Sending..." : "Send Reset Email"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
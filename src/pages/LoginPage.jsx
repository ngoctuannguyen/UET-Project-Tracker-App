import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/context/AuthContext"; // Đảm bảo đường dẫn chính xác

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      if (!email.includes("@") || password.length < 4) {
        toast.error("Invalid email or password");
        return;
      }

      // 🧪 Tạm thời: nếu email chứa "admin", gán role là admin
      const role = email.includes("admin") ? "admin" : "user";

      // Gửi yêu cầu đăng nhập
      const response = await axios.post("/auth/login", { email, password }, { withCredentials: true });

      const { idToken, refreshToken, userData } = response.data;

      // Lưu trạng thái người dùng vào Context
      login(idToken, refreshToken, userData);

      console.log(idToken);

      toast.success("Login successful!");

      // Điều hướng theo role
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.error || "Login failed");
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
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
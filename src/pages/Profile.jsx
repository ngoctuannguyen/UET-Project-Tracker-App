import React from "react";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {

  const { auth } = useAuth();
  const [isEditing, setIsEditing] = useState(false); // Trạng thái chỉnh sửa
  const [formData, setFormData] = useState({
    full_name: auth.userData?.full_name || "",
    email: auth.userData?.email || "",
    birthday: auth.userData?.birthday?._seconds
      ? new Date(auth.userData.birthday._seconds * 1000).toISOString().split("T")[0]
      : "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Gửi yêu cầu cập nhật profile đến API
      const updatedUserData = {
        ...auth.userData,
        full_name: formData.full_name,
        email: formData.email,
        birthday: {
          _seconds: Math.floor(new Date(formData.birthday).getTime() / 1000),
          _nanoseconds: 0,
        },
      };

      // Giả lập API cập nhật profile
      // Thay thế bằng API thực tế nếu có
      console.log("Updating profile with data:", updatedUserData);

      // Cập nhật trạng thái người dùng trong context
      login(auth.idToken, auth.refreshToken, updatedUserData);

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp._seconds) return "N/A"; // Kiểm tra nếu không có dữ liệu
    const date = new Date(timestamp._seconds * 1000); // Chuyển _seconds thành milliseconds
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }); // Định dạng: January 1, 1990
  };

  return (
      <main>
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
        <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
          
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700">User ID</h2>
            <p className="text-gray-900">{auth.userData?.user_id}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Name</h2>
            <p className="text-gray-900">{auth.userData.full_name}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Date of Birth</h2>
            <p className="text-gray-900">{formatDate(auth.userData?.birthday)}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Email</h2>
            <p className="text-gray-900">{auth.userData?.email}</p>
          </div>
        </div>
      </main>
  );
};

export default Profile;

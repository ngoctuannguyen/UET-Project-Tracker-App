import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const { auth, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: auth.userData?.full_name || "",
    birthday: auth.userData?.birthday?._seconds
      ? new Date(auth.userData.birthday._seconds * 1000).toLocaleDateString()
      : "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const updatedUserData = {
        ...auth.userData,
        full_name: formData.full_name,
        birthday: {
          _seconds: Math.floor(new Date(formData.birthday).getTime() / 1000),
          _nanoseconds: 0,
        },
      };
      // Giả lập API cập nhật profile
      console.log("Updating profile with data:", updatedUserData);
      login(auth.idToken, auth.refreshToken, updatedUserData);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp._seconds) return "N/A";
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main>
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
        {isEditing ? (
          <>
            <div className="mb-4">
              <label className="block text-lg font-semibold text-gray-700">Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
              />
            </div>
            <div className="mb-4">
              <label className="block text-lg font-semibold text-gray-700">Date of Birth</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="w-full mt-4 py-2 border rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
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
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          </>
        )}
      </div>
    </main>
  );
};

export default Profile;
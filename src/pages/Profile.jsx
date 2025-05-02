import React from "react";

const Profile = () => {
  return (
      <main>
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
        <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Name</h2>
            <p className="text-gray-900">Nguyen Van A</p>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Date of Birth</h2>
            <p className="text-gray-900">January 1, 1990</p>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Email</h2>
            <p className="text-gray-900">nguyenvana@example.com</p>
          </div>
        </div>
      </main>
  );
};

export default Profile;

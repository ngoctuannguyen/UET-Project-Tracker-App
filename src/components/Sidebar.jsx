import React from "react";
import { User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-gradient-to-b from-[#4e00c2] to-[#6e56cf] text-white p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-[#4e00c2] text-4xl">
            <User className="w-12 h-12" />
          </div>
        </div>
        <div className="space-y-6 text-lg">
          <p className="font-semibold text-center">HI, ADMIN</p>
          <nav className="space-y-4">
            <p onClick={() => navigate("/")} className="cursor-pointer hover:underline">Home</p>
            <p onClick={() => navigate("/project-management")} className="cursor-pointer hover:underline">Project management</p>
            <p onClick={() => navigate("/profile")} className="cursor-pointer hover:underline">Profile</p>
          </nav>
        </div>
      </div>
      <div className="flex justify-left">
        <LogOut className="w-8 h-8 cursor-pointer" />
      </div>
    </aside>
  );
};

export default Sidebar;
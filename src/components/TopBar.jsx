import React from "react";
import { Input } from "@/components/ui/input";
import { Users, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TopBar = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 py-2 bg-white">
      <Input 
        placeholder="Search" 
        className="w-full md:w-1/2 rounded-lg px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
      />
    <div className="flex space-x-4">
        <Users className="w-6 h-6 text-gray-700 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => navigate("/chat-group")} />
        <Bot className="w-6 h-6 text-gray-700 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => navigate("/chat-ai")} />
      </div>
    </div>
  );
};

export default TopBar;
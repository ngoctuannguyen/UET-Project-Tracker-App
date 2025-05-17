import React from "react";

// Ví dụ: members là mảng object [{ name: "Alice", role: "manager" }, ...]
const colors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-yellow-100 text-yellow-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-red-100 text-red-700",
];

const getColor = (idx) => colors[idx % colors.length];

const roleLabel = {
  manager: "Quản lý",
  staff: "Nhân viên",
  employee: "Nhân viên",
};

const GroupChatInfo = ({ members, onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xs animate-fade-in">
      <h3 className="text-xl font-bold mb-6 text-center text-blue-700">👥 Thành viên nhóm</h3>
      <ul className="mb-6 space-y-2">
        {(!members || members.length === 0) ? (
          <li className="text-gray-500 text-center">Chưa có thành viên</li>
        ) : (
          members.map((member, idx) => {
            // Nếu member là string, mặc định là nhân viên
            const name = typeof member === "string" ? member : member.name;
            const role = typeof member === "string" ? "Nhân viên" : (roleLabel[member.role] || member.role || "Nhân viên");
            return (
              <li
                key={idx}
                className={`flex items-center gap-3 py-2 px-3 rounded-lg shadow-sm ${getColor(idx)}`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border text-base font-semibold">
                  {name[0]?.toUpperCase() || "?"}
                </span>
                <span className="font-medium">{name}</span>
                <span className="ml-auto px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">
                  {role}
                </span>
              </li>
            );
          })
        )}
      </ul>
      <button
        onClick={onClose}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow"
      >
        Đóng
      </button>
    </div>
    <style>
      {`
        .animate-fade-in {
          animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}
    </style>
  </div>
);

export default GroupChatInfo;
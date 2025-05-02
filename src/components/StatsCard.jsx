import React from "react";
import { ArcElement, Chart as ChartJS } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement);

const StatsCard = ({ data }) => {
  const chartData = {
    labels: ["Complete", "In Progress", "Not Start"],
    datasets: [
      {
        data: [data.complete, data.inProgress, data.notStart],
        backgroundColor: ["#34D399", "#C4B5FD", "#FBBF24"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="bg-blue-500 rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-6">
      <div className="relative w-32 h-32">
        <Doughnut data={chartData} />
        <div className="absolute inset-0 flex items-center justify-center text-white font-semibold">
          {data.complete}
        </div>
      </div>
      <div className="text-white">
        <h3 className="text-lg font-semibold mb-2">All Projects</h3>
        <ul className="space-y-1">
          <li><span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>Complete</li>
          <li><span className="inline-block w-2 h-2 rounded-full bg-purple-300 mr-2"></span>In Progress</li>
          <li><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>Not Start</li>
        </ul>
      </div>
    </div>
  );
};

export default StatsCard;
import React from "react";
import { CardContent } from "@/components/ui/card";
import PropTypes from "prop-types";

const ProjectCard = ({ title, subtitle, date, onClick }) => {
  return (
    <div
      className="bg-gradient-to-br from-[#6e56cf] to-[#4e00c2] text-white shadow rounded-xl p-6 cursor-pointer hover:shadow-lg transition"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-xl font-bold mt-2">{subtitle}</p>
        <p className="text-sm mt-2">{date}</p>
      </CardContent>
    </div>
  );
};

ProjectCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

export default ProjectCard;
import React, { useState } from 'react';
import { Navigate } from "react-router-dom";
import "./App.css";

const Dashboard = () => {
    
    const token = localStorage.getItem("access_token");

    console.log("Token in Dashboard:", token);

    if (!token) {
        return <Navigate to= "/login"/>;
    }

    //Sample data
    const fitScore = 75;
    const matchedSkills = ["JavaScript", "React", "CSS", "Problem Solving", "Rubix Cubes"];
    const improvementSuggestions = [
        "Add more details about project management experience.",
        "Include specific achievements for leadership roles.",
        "Highlight proficiency in Python for data analysis."
    ];



  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Resume Analysis Dashboard</h1>

      {/* Resume Fit Score */}
      <section className="dashboard-section">
        <h2>Resume Fit Score</h2>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${fitScore}%` }}
          ></div>
        </div>
        <p>{fitScore}%</p>
      </section>

      {/* Skills and Keywords Matched */}
      <section className="dashboard-section">
        <h2>Skills and Keywords Matched</h2>
        <ul className="list">
          {matchedSkills.map((skill, index) => (
            <li key={index} className="list-item">
              {skill}
            </li>
          ))}
        </ul>
      </section>

      {/* Improvement Suggestions */}
      <section className="dashboard-section">
        <h2>Improvement Suggestions</h2>
        <ul className="list">
          {improvementSuggestions.map((suggestion, index) => (
            <li key={index} className="list-item">
              {suggestion}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;

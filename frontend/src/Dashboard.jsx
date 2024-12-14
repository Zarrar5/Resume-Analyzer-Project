import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import "./App.css";
import jsPDF from "jspdf";

const Dashboard = () => {
  const [fitScore, setFitScore] = useState(null);
  const [matchedSkills, setMatchedSkills] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchFitScoreData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_text: "Sample resume text",
            job_description: "Sample job description",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch fit score data");
        }

        const data = await response.json();
        setFitScore(data.fit_score);
        setMatchedSkills(data.matched_keywords);
        setFeedback(data.feedback);
      } catch (error) {
        console.error("Error fetching data: ", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFitScoreData();
  }, [token]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  const filteredFeedback = feedback.filter((item) =>
    selectedCategory === "all" ? true : item.category === selectedCategory
  );

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Resume Analysis Report", 10, 10);

    doc.setFontSize(12);
    doc.text(`Fit Score: ${fitScore !== null ? `${fitScore}%` : "N/A"}`, 10, 30);

    doc.setFontSize(14);
    doc.text("Matched Keywords:", 10, 50);
    matchedSkills.forEach((skill, index) => {
      doc.text(`- ${skill}`, 10, 60 + index * 10);
    });

    doc.text("Improvement Suggestions:", 10, 80 + matchedSkills.length * 10);
    feedback.forEach((item, index) => {
      doc.text(`- ${item.text}`, 10, 90 + matchedSkills.length * 10 + index * 10);
    });

    doc.save("Resume_Analysis_Report.pdf");
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Resume Analysis Dashboard</h1>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <section className="dashboard-section">
            <h2>Resume Fit Score</h2>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${fitScore || 0}%` }}></div>
            </div>
            <p>{fitScore !== null ? `${fitScore}%` : "Data not available"}</p>
          </section>

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

          <section className="dashboard-section">
            <h2>Improvement Suggestions</h2>
            <label htmlFor="filter">Filter Feedback by Category: </label>
            <select
              id="filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All</option>
              <option value="skills">Skills</option>
              <option value="experience">Experience</option>
              <option value="formatting">Formatting</option>
            </select>
            <ul className="list">
              {filteredFeedback.map((item, index) => (
                <li key={index} className="list-item">
                  {item.text}
                </li>
              ))}
            </ul>
          </section>

          <button onClick={generatePDF} className="download-btn">
            Download PDF Report
          </button>
        </>
      )}
    </div>
  );
};

export default Dashboard;

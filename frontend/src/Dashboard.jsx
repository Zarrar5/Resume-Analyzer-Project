import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import "./App.css";
import jsPDF from "jspdf";

const Dashboard = () => {
  const token = localStorage.getItem("access_token");

  console.log("Token in Dashboard:", token);

  if (!token) {
    return <Navigate to="/login" />;
  }

  // State for fitScore, matchedSkills, unmatchedSkills, and improvementSuggestions
  const [fitScore, setFitScore] = useState(null);
  const [matchedSkills, setMatchedSkills] = useState([]);
  const [unmatchedSkills, setUnmatchedSkills] = useState([]);
  const [improvementSuggestions, setImprovementSuggestions] = useState({skills: [], experience: []});
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory]= useState("all");
  const [filteredFeedback, setFilteredFeedback]= useState([]);

  // Fetch data from the backend (current analysis data)
  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/api/current-data", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch current analysis data");
        }

        const data = await response.json();
        if (data.status === "incomplete") {
          throw new Error("Incomplete analysis data. Resume or Job Description is missing.");
        }

        setResumeText(data.resume);
        setJobDescription(data.job_description);
        //Debugging
        //console.log("Fetched Resume Text:", data.resume);
        //console.log("Fetched Job Description:", data.job_description);
      } catch (error) {
        console.error("Error fetching current data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentData();
  }, [token]);

  // Fetch analysis data based on resume and job description
  useEffect(() => {
    if (resumeText && jobDescription) {
      const fetchAnalysisData = async () => {
        try {
          setLoading(true);
          const response = await fetch("http://localhost:8000/api/calculate-fit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              resume_text: resumeText,  // Use actual resume text from backend
              job_description: jobDescription,  // Use actual job description from backend
            }),
          });

          if (!response.ok) {
            const errorDetails = await response.text();
            console.error("Backend Error Details:", errorDetails);
            throw new Error("Failed to fetch analysis data");
          }

          const data = await response.json();
          setFitScore(data.fit_score);
          setMatchedSkills(data.matched_keywords); // Matched skills from backend
          setUnmatchedSkills(data.unmatched_keywords); // Unmatched skills from backend
          setImprovementSuggestions(data.feedback); // Improvement suggestions from backend

          const skills= improvementSuggestions.skills;
          const experience= improvementSuggestions.experience;
          console.log("Data Feedback: ", data.feedback);
          console.log(improvementSuggestions);
          console.log(skills);
          console.log(experience);
          setFilteredFeedback(skills.concat(experience));
          console.log("Feedback: ", filteredFeedback);

        } catch (error) {
          console.error("Error fetching analysis data:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchAnalysisData();
    }
  }, [resumeText, jobDescription, token]);

  // Loading state
  if (loading) {
    return <p>Loading...</p>;
  }

  // Error state
  if (error) {
    return <p>Error: {error}</p>;
  }

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

  const changeFeedback= (e) =>{
    e.preventDefault();
    setSelectedCategory(e.target.value);
  };

  const renderFeedback= () => {
    let categoryFeedback= [];

    if (selectedCategory == 'skills'){
      categoryFeedback= improvementSuggestions.skills;
    }
    else if (selectedCategory == 'experience'){
      categoryFeedback= improvementSuggestions.experience;
    }
    else{
      const skills= improvementSuggestions.skills;
      const experience= improvementSuggestions.experience;

      categoryFeedback= skills.concat(experience);
    }
    return categoryFeedback.map((item, index) => <li className= "feedback" key={index}>{item}</li>);
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Resume Analysis Dashboard</h1>

      {/* Resume Fit Score */}
      <section className="dashboard-section">
        <h2>Resume Fit Score</h2>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${fitScore}%` }}></div>
        </div>
        <p>{fitScore}%</p>
      </section>

      {/* Matched Skills and Keywords */}
      <section className="dashboard-section">
        <h2>Skills and Keywords Matched</h2>
        <ul className="list">
          {matchedSkills.length > 0 ? (
            matchedSkills.map((skill, index) => (
              <li key={index} className="list-item">
                {skill}
              </li>
            ))
          ) : (
            <li>No matched skills</li>
          )}
        </ul>
      </section>

      {/* Unmatched Skills and Keywords */}
      <section className="dashboard-section">
        <h2>Skills and Keywords Not Matched</h2>
        <ul className="list">
          {unmatchedSkills.length > 0 ? (
            unmatchedSkills.map((skill, index) => (
              <li key={index} className="list-item">
                {skill}
              </li>
            ))
          ) : (
            <li>No unmatched skills</li>
          )}
        </ul>
      </section>

      {/* Improvement Suggestions */}
      {/* <section className="dashboard-section">
        <h2>Improvement Suggestions</h2>
        <ul className="list">
          {improvementSuggestions.length > 0 ? (
            improvementSuggestions.map((suggestion, index) => (
              <li key={index} className="list-item">
                {suggestion}
              </li>
            ))
          ) : (
            <li>No suggestions available</li>
          )}
        </ul>
      </section> */}

      <section className="dashboard-section">
            <h2>Improvement Suggestions</h2>
            <label htmlFor="filter">Filter Feedback by Category: </label>
            <select
              id="filter"
              value={selectedCategory}
              onChange={changeFeedback}
            >
              <option value="all">All</option>
              <option value="skills">Skills</option>
              <option value="experience">Experience</option>
            </select>
            <ul>
              {/* {filteredFeedback.map((item, index) => (
                <li key={index} className="list-item">
                  {item}
                </li>

              ))} */}
              {renderFeedback()}
            </ul>
      </section>

      <button onClick={generatePDF} className="download-btn">
            Download PDF Report
      </button>
    </div>
  );
};

export default Dashboard;
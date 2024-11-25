import React, { useState } from "react";
import LoadingSpinner from './LoadingSpinner';

const JobDescriptionForm = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobDescription) {
      setMessage("Please enter a job description.");
      return;
    }

    setLoading(true); 

    try {
      const response = await fetch("http://127.0.0.1:8000/api/job-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ job_description: jobDescription }),
      });
      setLoading(false);

      if (response.ok) {
        setMessage("Job description submitted successfully.");
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || "Error submitting job description.");
      }
    } catch {
      setLoading(false);
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div>
      <h2>Submit Job Description</h2>
      {loading && <LoadingSpinner/>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="jobDescription">Paste Job Description:</label>
        <textarea
          id="jobDescription"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          maxLength="5000"
          required
        ></textarea>
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default JobDescriptionForm;

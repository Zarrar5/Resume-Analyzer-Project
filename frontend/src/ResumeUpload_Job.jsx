import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import mammoth from "mammoth";
import LoadingSpinner from './LoadingSpinner';  

pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
const ResumeUpload = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const [message, setMessage] = useState('');
  const [resumeCheck, setResumeCheck]= useState(false);
  const [preview, setPreview]= useState(true);
  const [loading, setLoading] = useState(false);  
  const [isPDF, setIsPDF]= useState(false);
  const [isWORD, setIsWORD]= useState(false);
  const [docxPreview, setDocxPreview] = useState("");
   

  const handleDocxPreview = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        setDocxPreview(value);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {

        if (file.type === 'application/pdf'){
          setIsPDF(true);
          setIsWORD(false);
        }
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          setIsWORD(true);
          setIsPDF(false);
        }
        const fileSize= file.size/ (1024*1024);

        if(fileSize > 2){
          setMessage('File Larger Than 2MB');
          setResumeCheck(false);
          setResumeFile(null);
          return;
        }
        else{
          setResumeCheck(true);
          setResumeFile(file);
          setPreview(true);
          setMessage('');
        }
    } 
    else {
      alert('Please upload a valid PDF or DOCX file.');
      setResumeFile(null);
      setResumeCheck(false);
    }
  };

  const handleCharCount = (e) =>{
    e.preventDefault();

    if (charCount <5000){
      setJobDescription(e.target.value);
      setCharCount(e.target.value.length);

      if(charCount >= 4000){
        setMessage('Max Char almost reached!!!');
      }
      else{
        setMessage('');
      }
    }
    else{
      setMessage('Max Char Limit Reached');
    }
  };

  const handleClick= (e) =>{
    e.preventDefault();
    setCharCount(0);
    setJobDescription('');
  };

  const handleResumeCheck = async (event) => {
    event.preventDefault();
    setLoading(true); // Set loading to true at the start
    try {
        if (resumeCheck) {
            const formData = new FormData();
            formData.append('resume_file', resumeFile);

            const response = await fetch('http://127.0.0.1:8000/api/resume-upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setPreview(false);
                setMessage('Uploaded Successfully');
            } else {
                const errorData = await response.json();
                setMessage(errorData.detail || 'Failed to send data');
            }
        } else {
            throw new Error("Invalid File");
        }
    } catch (error) {
        setMessage('An error occurred: ' + error.message);
    } finally {
        setLoading(false); // Ensure loading is set to false when the operation finishes
    }
};

  const handleJobDescription= async (event) =>{
    event.preventDefault();

    try{
      const response = await fetch('http://127.0.0.1:8000/api/job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ job_description: jobDescription }),
      });

      if(response.ok){
        const data= await response.json();
        setMessage(data.message);
      }
      else{
        const errorData = await response.json();
        setMessage(errorData.detail || 'Failed to send data');
      }
    }
    catch (error){
      setMessage('An error occurred: '+ error.message);
    }
  };

  return (
    <div class="container">
      {loading && <LoadingSpinner/>} 
      <form onSubmit={handleResumeCheck}>
      <h2>Resume Upload</h2>
      <input type="file" 
      accept="application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      onChange={handleFileChange} 
      required/>

      <button type="submit">Submit Resume</button>
      </form>
    
      {resumeFile && preview && isPDF &&(
          <div>
              <h3>File Preview:</h3>
              <Document
                  file={URL.createObjectURL(resumeFile)}
                  onLoadSuccess={() => setMessage("File loaded successfully.")}
                  onLoadError={(error) =>
                      setMessage("Failed to load: " + error.message)
                  }
              >
                <Page pageNumber={1} />
              </Document>
          </div>
      )}

      {resumeFile && preview && isWORD &&(
        <div>
          <h3>File Preview:</h3>
          <div>
              <button onClick={() => handleDocxPreview(resumeFile)}>
                  Load Word Preview
              </button>
              <div style={{ whiteSpace: "pre-wrap" }}>{docxPreview}</div>
          </div>
        </div>
      )}

      <br/>
      <br/>
      {loading && <LoadingSpinner/>} 
      <form onSubmit={handleJobDescription}>
      <label>
        Job Description
        <br></br>
        <textarea
          id= "jobDescription"
          name="jobDescription"
          value= {jobDescription}
          rows={5}
          onChange={handleCharCount}
          required
        />
      </label>
      <p>Character Count: {charCount}/5000</p>

      <button type='submit'>Submit Job Description</button>
      <br></br>
      <button onClick={handleClick}>Clear</button>
      </form>
      <p className="message">{message}</p>
    </div>
  );
};

export default ResumeUpload;
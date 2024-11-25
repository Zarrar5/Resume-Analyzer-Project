import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
const ResumeUpload = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const [message, setMessage] = useState('');
  const [resumeCheck, setResumeCheck]= useState(false);


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
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
          setMessage('');
        }
    } 
    else {
      alert('Please upload a valid PDF file.');
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

  const handleResumeCheck = async (event) =>{
    event.preventDefault();

    try{
      if (resumeCheck){
        const formData= new FormData();
        formData.append('resume_file', resumeFile);

        const response = await fetch('http://127.0.0.1:8000/api/resume-upload', {
          method: 'POST',
          body: formData,
        });

        if(response.ok){
          const data= await response.json();
          setMessage(data.content);
        }
        else{
          const errorData = await response.json();
          setMessage(errorData.detail || 'Failed to send data');
        }
      }
      else{
        throw new Error("Invalid File");
      }
    }
    catch (error){
      setMessage('An error occurred: '+ error.message);
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
    <div>
      <form onSubmit={handleResumeCheck}>
      <h2>Resume Upload</h2>
      <input type="file" 
      accept="application/pdf"
      onChange={handleFileChange} 
      required/>
      
      <button type="submit">Submit Resume</button>
      </form>
      {resumeFile && (
          <div>
              <h3>PDF Preview:</h3>
              <Document
                  file={URL.createObjectURL(resumeFile)}
                  onLoadSuccess={() => setMessage("PDF loaded successfully.")}
                  onLoadError={(error) =>
                      setMessage("Failed to PDF: " + error.message)
                  }
              >
                <Page pageNumber={1} />
              </Document>
          </div>
      )}

      <br/>
      <br/>
      <form onSubmit={handleJobDescription}>
      <label>
        Job Description
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
      <button onClick={handleClick}>Clear</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default ResumeUpload;
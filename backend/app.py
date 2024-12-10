from fastapi import FastAPI, HTTPException, Depends, status, Form, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from typing import Optional, Dict
import jwt
import os
from PyPDF2 import PdfReader
from datetime import datetime, timedelta, timezone
import fitz
import requests
from dotenv import load_dotenv

# Initialize app
app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update with your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv(".env")  
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
if not HUGGINGFACE_API_KEY:
    raise EnvironmentError("Hugging Face API key not set in environment variables.")

# Constants
ALLOWED_EXTENSIONS = {"pdf", "docx"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

# User Database (In-Memory)
userDB: Dict[str, Dict] = {}
current_analysis: Dict = {}

# JWT Configuration
SECRET_KEY = "bdd31c34fb1bb2bb93979bd30e7d628a8b18506aca574bad0266b2c0c608b57b"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Root Endpoint
@app.get("/", status_code=status.HTTP_200_OK)
async def root():
    """
    Root endpoint for the API.
    """
    return {
        "message": "Welcome to the Resume Analyzer API!",
        "endpoints": [
            {"method": "POST", "endpoint": "/api/register", "description": "Register a new user."},
            {"method": "POST", "endpoint": "/api/login", "description": "Login and get an access token."},
            {"method": "POST", "endpoint": "/api/resume-upload", "description": "Upload a resume (PDF)."},
            {"method": "POST", "endpoint": "/api/job-description", "description": "Submit a job description."},
            {"method": "GET", "endpoint": "/api/current-data", "description": "Get the current resume and job description data."},
            {"method": "POST", "endpoint": "/api/analyze", "description": "Analyze the resume and job description for fit."}
        ]
    }

# User Registration
@app.post("/api/register", status_code=status.HTTP_201_CREATED)
async def register_user(username: str = Form(...), email: EmailStr = Form(...), password: str = Form(...)):
    if username in userDB:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(password)
    userDB[username] = {"email": email, "password": hashed_password}
    return {"message": "User registered successfully."}

# User Login
@app.post("/api/login")
async def login_user(username: str = Form(...), password: str = Form(...)):
    db_user = userDB.get(username)
    if not db_user or not verify_password(password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    access_token = create_access_token(data={"sub": username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"token": access_token}

# Task 8: Job Description Submission Endpoint
class JobDescription(BaseModel):
    job_description: str

@app.post("/api/job-description", status_code=status.HTTP_200_OK)
async def job_description(data: JobDescription):
    job_description = data.job_description.strip()
    if len(job_description) > 5000:
        raise HTTPException(status_code=400, detail="Job description exceeds character limit of 5,000 characters.")
    current_analysis["job_text"] = job_description
    return {"message": "Job description submitted successfully.", "status": "success"}

# Resume Upload and Text Extraction
def extract_text_from_pdf(file):
    pdf_document = fitz.open(stream=file, filetype="pdf")
    text = ""
    for page_num in range(pdf_document.page_count):
        page = pdf_document.load_page(page_num)
        text += page.get_text()
    return text

@app.post("/api/resume-upload", status_code=status.HTTP_200_OK)
async def resume_upload(resume_file: UploadFile = File(...)):
    if '.' not in resume_file.filename or resume_file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs allowed.")
    content = await resume_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 2MB limit.")
    if resume_file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
        current_analysis["resume_text"] = text
        return {"message": "Resume uploaded successfully.", "extracted_text": text, "status": "success"}
    return {"message": "Resume uploaded successfully.", "status": "success"}

# Retrieve Current Data
@app.get("/api/current-data", status_code=status.HTTP_200_OK)
async def get_current_data():
    if not current_analysis:
        raise HTTPException(status_code=404, detail="No current analysis data available.")
    if "job_text" not in current_analysis or "resume_text" not in current_analysis:
        return {"message": "Incomplete analysis data.", "status": "incomplete"}
    return {"message": "ready for analysis", "resume": current_analysis["resume_text"], "job_description": current_analysis["job_text"]}

# API NLP Endpoint with Mocked Response
@app.post("/api/analyze")
async def analyze():
    # Mocked Response for Task 27
    return {
        "fit_score": 85,
        "feedback": [
            {"category": "skills", "text": "Include experience with AWS services."},
            {"category": "experience", "text": "Add projects demonstrating REST API development."},
            {"category": "formatting", "text": "Ensure consistent font sizes across your resume."}
        ],
        "matched_keywords": ["Python", "REST APIs", "AWS"]
    }

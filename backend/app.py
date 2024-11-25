from fastapi import FastAPI, HTTPException, Depends, status, Form, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from typing import Optional, Dict
import jwt
from datetime import datetime, timedelta, timezone
import bcrypt
from PyPDF2 import PdfReader
import fitz

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

# Constants for Task 8
ALLOWED_EXTENSIONS = {"pdf", "docx"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

# User Database (In-Memory)
userDB: Dict[str, Dict] = {}

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
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# User Registration
@app.post("/api/register", status_code=status.HTTP_201_CREATED)
async def register_user(username: str = Form(...), email: EmailStr = Form(...), password: str = Form(...)):
    if username in userDB:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_password_hash(password)
    userDB[username] = {
        "email": email,
        "password": hashed_password
    }

    return {"message": "User registered successfully."}


# User Login
@app.post("/api/login")
async def login_user(username: str = Form(...), password: str = Form(...)):
    db_user = userDB.get(username)

    if not db_user or not verify_password(password, db_user['password']):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": username}, expires_delta=access_token_expires)

    return {"token": access_token}


# Task 8: Resume Upload Endpoint
@app.post("/api/resume-upload", status_code=status.HTTP_200_OK)
async def resume_upload(resume_file: UploadFile = File(...)):
    # Validate file type
    if '.' not in resume_file.filename or resume_file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF or DOCX files are allowed."
        )

    # Validate file size
    content = await resume_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 2MB limit."
        )
    
     # Decode file content if it's text-based
    try:
        # Open the PDF file from in-memory content
        pdf_document = fitz.open(stream=content, filetype="pdf")

        # Extract text from all pages
        pdf_text = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            pdf_text += page.get_text()

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="PDF contains no extractable text.")
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF file: {str(e)}")
    
    return {
        "message": "Resume uploaded successfully.",
        "status": "success",
        "content": pdf_text
    }


# Task 8: Job Description Submission Endpoint
class JobDescription(BaseModel):
    job_description: str


@app.post("/api/job-description", status_code=status.HTTP_200_OK)
async def job_description(data: JobDescription):
    job_description = data.job_description.strip()

    # Validate character count
    if len(job_description) > 5000:
        raise HTTPException(
            status_code=400,
            detail="Job description exceeds character limit of 5,000 characters."
        )

    return {
        "message": "Job description submitted successfully.",
        "status": "success"
    }

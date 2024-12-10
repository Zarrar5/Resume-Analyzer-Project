from fastapi import FastAPI, HTTPException, Depends, status, Form, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
import os
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

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

#Hugging Face NLP API

load_dotenv(".env")  

#print(HUGGINGFACE_API_KEY)
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
if not HUGGINGFACE_API_KEY:
    raise EnvironmentError("Hugging Face API key not set in environment variables.")


# Constants for Task 8
ALLOWED_EXTENSIONS = {"pdf", "docx"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

# User Database (In-Memory)
userDB: Dict[str, Dict] = {}
current_analysis: Dict ={}

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


# # Task 8: Resume Upload Endpoint
# @app.post("/api/resume-upload", status_code=status.HTTP_200_OK)
# async def resume_upload(resume_file: UploadFile = File(...)):
#     # Validate file type
#     if '.' not in resume_file.filename or resume_file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
#         raise HTTPException(
#             status_code=400,
#             detail="Invalid file type. Only PDF or DOCX files are allowed."
#         )
#     # Validate file size
#     content = await resume_file.read()
#     if len(content) > MAX_FILE_SIZE:
#         raise HTTPException(
#             status_code=400,
#             detail="File size exceeds the 2MB limit."
#         )


#      # Decode file content if it's text-based
#     try:
#         # Open the PDF file from in-memory content
#         pdf_document = fitz.open(stream=content, filetype="pdf")

#         # Extract text from all pages
#         pdf_text = ""
#         for page_num in range(pdf_document.page_count):
#             page = pdf_document.load_page(page_num)
#             pdf_text += page.get_text()

#         if not pdf_text.strip():
#             raise HTTPException(status_code=400, detail="PDF contains no extractable text.")

#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Error reading PDF file: {str(e)}")

#     return {
#         "message": "Resume uploaded successfully.",
#         "status": "success",
#         "content": pdf_text
#     }


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
    else:        
        current_analysis["job_text"]= job_description

    return {
        "message": "Job description submitted successfully.",
        "status": "success"
    }


#Task 11 function declaration: use Python PdfReader function to 
def extract_text_from_pdf(file):
    pdf_document= fitz.open(stream=file, filetype="pdf");
    text = ""
    for page_num in range(pdf_document.page_count):
        page = pdf_document.load_page(page_num)
        text += page.get_text()
    return text

# Task 11: Resume Upload Endpoint with text extraction from PDF
@app.post("/api/resume-upload", status_code=status.HTTP_200_OK)
async def resume_upload(resume_file: UploadFile = File(...)):
    # Validate file type
    if '.' not in resume_file.filename or resume_file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDFs allowed."
        )

    # Validate file size <=2MB
    content = await resume_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 2MB limit."
        )

    # Extract text from PDF if it's a PDF file
    if resume_file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
        # Process or store the text as needed
        
        current_analysis["resume_text"]= text

        return {"message": "Resume uploaded successfully.", "extracted_text": text, "status": "success"}

    return {"message": "Resume uploaded successfully.", "status": "success"}


# Checks if current data is correct. Retrieve from frontend
@app.get("/api/current-data", status_code=status.HTTP_200_OK)
async def get_current_data():
    if not current_analysis:
        raise HTTPException(
            status_code=404,
            detail="No current analysis data available."
        )
    
    if "job_text" not in current_analysis or "resume_text" not in current_analysis:
        return {
            "message": "Incomplete analysis data.",
            "status": "incomplete",
            "missing_fields": {
                "job_description": "job_text" in current_analysis,
                "resume_text": "resume_text" in current_analysis,
            }
        }
    
    return {
        "message": "ready for analysis",
        "resume": current_analysis["resume_text"],
        "job_description": current_analysis["job_text"]
    }


# API NLP Endpoint
@app.post("/api/analyze")
async def analyze():
    
    # Construct the request to Hugging Face NLP API
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    data = {
        "inputs": {
            "resume": current_analysis["resume_text"],
            "job_description": current_analysis["job_text"]
        }
    }
    
    try:
        response = requests.post(
            #Dummy model sent https://api-inference.huggingface.co/models/your-model
            #Might have to create our own model
            "https://api-inference.huggingface.co/models/model",
            headers=headers,
            json=data
        )
        # Raise error if the Hugging Face API returns an HTTP error
        response.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to NLP API: {e}")
    
    # Parse and return the response from the NLP API
    return response.json()


#Task 19
class Input(BaseModel):
    resume_text: str = Field(..., max_length=10000, description="The content of the user's resume...")
    job_description: str = Field(..., max_length=10000, description="The content of the job description...")

class Output(BaseModel):
    fit_score: int = Field(..., ge=0, le=100, description="Resume-job fit percentage.")
    feedback: list[str] = Field(..., description="Suggestions for improvement.")

class ErrorResponse(BaseModel):
    error: str

   
#Task 20
@app.post("/api/analyze",response_model=Output,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def analyze_data(input_data: Input):
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    data = {
        "inputs": {
            "resume": input_data.resume_text,
            "job_description": input_data.job_description
        }
    }
    
    try:
        response = requests.post(
            "https://api-inference.huggingface.co/models/model",
            headers=headers,
            json=data
        )
        response.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to NLP API: {e}")

    api_response = response.json()
    
    if "results" not in api_response or not api_response["results"]:
        raise HTTPException(status_code=500, detail="Malformed API response.")
    
    result = api_response["results"][0]
    
    try:
        fit_score = int(result["fit_score"] * 100) 
        feedback = result.get("feedback", [])

    except (KeyError, TypeError) as e:
        raise HTTPException(status_code=500, detail=f"Error failed to provide results: {e}")
    
    return Output(fit_score=fit_score, feedback=feedback)


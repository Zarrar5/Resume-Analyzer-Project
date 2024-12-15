from fastapi import FastAPI, HTTPException, Depends, status, Form, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from typing import Optional, Dict, List
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
import numpy as np
from docx import Document
from io import BytesIO
from collections import Counter
import string
from transformers import pipeline

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

def extract_text_from_word(file):
    file= BytesIO(file)
    doc= Document(file)
    text= ""

    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"

    return text

# Task 11: Resume Upload Endpoint with text extraction from PDF
@app.post("/api/resume-upload", status_code=status.HTTP_200_OK)
async def resume_upload(resume_file: UploadFile = File(...)):
    # Validate file type
    if '.' not in resume_file.filename or resume_file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF or WORD allowed."
        )

    # Validate file size <=2MB
    content = await resume_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 2MB limit."
        )

    print(resume_file)
    print("file parsed")
    # Extract text from PDF if it's a PDF file
    if resume_file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
        # Process or store the text as needed
        
        current_analysis["resume_text"]= text

        return {"message": "Resume uploaded successfully.", "extracted_text": text, "status": "success"}
    elif resume_file.filename.endswith(".docx"):
        text= extract_text_from_word(content)

        current_analysis["resume_text"]= text
        print(text)
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


# def cosine_similarity(embedding1, embedding2):
#     """Calculate cosine similarity between two vectors."""
#     embedding1 = np.array(embedding1)
#     embedding2 = np.array(embedding2)
#     return float(np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2)))


#Authorization Key
HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
# API NLP Endpoint
@app.post("/api/analyze")
async def analyze():
    
    # Construct the request to Hugging Face NLP API

    try:
        def similarity_score(resume_text, job_text):
            response = requests.post(
                "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
                headers=HEADERS,
                json={"inputs": {
                    "source_sentence":resume_text, 
                    "sentences": [job_text]
                    },
                }
            )
            response.raise_for_status()
            return response.json()
        
        similarity= similarity_score(current_analysis["resume_text"], current_analysis["job_text"])

        print(similarity)
        return similarity
    
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to NLP API: {e}")
    
    # Parse and return the response from the NLP API
    # print(response.json())
    # return response.json()


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
# @app.post("/api/analyze",response_model=Output,
#     responses={
#         400: {"model": ErrorResponse},
#         500: {"model": ErrorResponse}
#     }
# )
# async def analyze_data(input_data: Input):
#     headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
#     data = {
#         "inputs": {
#             "resume": input_data.resume_text,
#             "job_description": input_data.job_description
#         }
#     }
    
#     try:
#         response = requests.post(
#             "https://api-inference.huggingface.co/models/model",
#             headers=headers,
#             json=data
#         )
#         response.raise_for_status()
#     except requests.RequestException as e:
#         raise HTTPException(status_code=500, detail=f"Error connecting to NLP API: {e}")

#     api_response = response.json()
    
#     if "results" not in api_response or not api_response["results"]:
#         raise HTTPException(status_code=500, detail="Malformed API response.")
    
#     result = api_response["results"][0]
    
#     try:
#         fit_score = int(result["fit_score"] * 100) 
#         feedback = result.get("feedback", [])

#     except (KeyError, TypeError) as e:
#         raise HTTPException(status_code=500, detail=f"Error failed to provide results: {e}")
    
#     return Output(fit_score=fit_score, feedback=feedback)

#Alphabetically order it for easier visualization
filler_words= ["a", "about", "after", "all", "also", "although", "an", "and", "any", "anyone", "are", "as", "at", 
               "be", "before", "been", "being", "both", "but", "by", "because", 
               "can", "could",
               "did", "do", "does", "doing", 
               "each", "either", "else", "enough", "especially", "everyone", 
               "few", "for", "from", 
               "had", "has", "have", "having", "he", "here", "how", 
               "i", "ideal", "if", "in", "including", "it", 
               "just", 
               "like",
               "many", "more", "most", "much", 
               "neither", "none", "nothing", 
               "of", "on", "once", "only", "or", "other", "our", "ours", "ourself", "ourselves", 
               "problem", 
               "require", "required",
               "should", "since", "skill", "skills", "so", "still", 
               "that", "the", "these", "they", "this", "those", "to", "too", 
               "unless", "until", 
               "we", "what", "when", "where", "which", "whenever", "whatever", "whichever", "while", "who", "whom", "whose", "will", "with", "within", "would",
               "year", "you", "your", "you're", "yourself", "yourself"]

# Helper function to tokenize and normalize text
def tokenize_and_normalize(text: str) -> List[str]:
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = text.split()
    final= set(tokens)- set(filler_words)
    return final

'''
Job Description: Job Title: Software Engineer

Job Description: We are seeking a passionate and driven Software Engineer to join our growing team. The ideal candidate should be proficient in multiple programming languages, with a strong background in cloud technologies, and a deep understanding of system architecture. You will work closely with cross-functional teams to design, develop, and deploy innovative software solutions.

Responsibilities:

Design, develop, and maintain software applications and systems.
Collaborate with product managers and designers to create user-friendly software features.
Write clean, efficient, and scalable code.
Participate in code reviews and contribute to team knowledge sharing.
Troubleshoot and resolve software issues and bugs.
Stay up to date with the latest industry trends and technologies.
Required Skills:

Strong proficiency in Java, Python, and JavaScript.
Experience with cloud platforms such as AWS or Azure.
Familiarity with containerization technologies like Docker and Kubernetes.
Solid understanding of object-oriented programming principles.
Strong problem-solving and debugging skills.
Excellent communication skills and ability to work in a team environment.
Preferred Qualifications:

Experience with microservices architecture.
Familiarity with CI/CD pipelines.
Knowledge of database management systems (SQL and NoSQL).
Bachelor’s degree in Computer Science, Engineering, or a related field.
Benefits:

Competitive salary and benefits package.
Flexible work hours and remote work options.
Opportunities for professional development and career growth.
Collaborative and inclusive work environment.
'''
# Load zero-shot classification pipeline
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
# Labels/categories
labels = ["Hard Skill", "Soft Skill", "None"]

def classify(labels, keywords):
    # Categorize each keyword
    feedback= {"skills": [], "experience": []}
    
    for keyword in keywords:
        sentence = f"In terms of a resume this keyword: {keyword} most likely belong to "
        result = classifier(sentence, labels)
        #print(f"Keyword: {keyword}")
        #print(f"Prediction: {result['labels'][0]} (Score: {result['scores'][0]:.2f})")
        if result['scores'][0] >=0.45:
            if result['labels'][0] == "Hard Skill":
                string= f'Consider adding experience in {keyword}'
                feedback['experience'].append(string)
            elif result['labels'][0] == "Soft Skill":
                string= f'Consider adding skill in {keyword}'
                feedback['skills'].append(string)
    #print("skills ", feedback['skills'])
    #print("experience ", feedback['experience'])

    return feedback



# Task 21: Algorithm to Compare Resume and Job Description
def calculate_fit_score(resume_text: str, job_description: str) -> Dict:
    if not resume_text or not job_description:
        raise HTTPException(status_code=400, detail="Resume text or job description cannot be empty.")

    # Tokenize and normalize inputs
    resume_tokens = tokenize_and_normalize(resume_text)
    job_tokens = tokenize_and_normalize(job_description)

    # Count keywords in both texts
    resume_counter = Counter(resume_tokens)
    job_counter = Counter(job_tokens)

    # Find matched keywords
    matched_keywords = set(resume_tokens) & set(job_tokens)
    matched_count = sum(job_counter[keyword] for keyword in matched_keywords)

    # Total keywords in the job description
    total_keywords = sum(job_counter.values())

    # Calculate fit score
    fit_score = (matched_count / total_keywords) * 100 if total_keywords > 0 else 0

    # Generate feedback for unmatched keywords
    unmatched_keywords = set(job_tokens) - set(resume_tokens)
    feedback= classify(labels, unmatched_keywords)

    #feedback = [f"Consider adding '{keyword}' to your resume." for keyword in unmatched_keywords]

    # Return the result with matched keywords and feedback
    return {
        "fit_score": round(fit_score,2),
        "matched_keywords": list(matched_keywords),
        "unmatched_keywords": list(unmatched_keywords),
        "feedback": feedback
    }

class Output(BaseModel):
    fit_score: int = Field(..., ge=0, le=100, description="Resume-job fit percentage.")
    matched_keywords: List[str] = Field(..., description="Keywords matched between resume and job description.")
    unmatched_keywords: List[str] = Field(..., description="Keywords not found in the resume.")
    feedback: Dict[str, list[str]] = Field(..., description="Suggestions for improvement.")


# Example usage
@app.post("/api/calculate-fit")
async def calculate_fit(input_data: Input):
        
    try:
        result = calculate_fit_score(input_data.resume_text, input_data.job_description)
        return Output(
            fit_score=int(result["fit_score"]),
            matched_keywords=result["matched_keywords"],
            unmatched_keywords=result["unmatched_keywords"],
            feedback=result["feedback"]
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error occurred: {e}")

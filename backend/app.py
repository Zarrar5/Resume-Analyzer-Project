from fastapi import FastAPI, HTTPException, Depends, status, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.templating import Jinja2Templates
from typing import Dict
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)
userDB: Dict[str, Dict] = {}

templates = Jinja2Templates(directory="../frontend")

SECRET_KEY = "bdd31c34fb1bb2bb93979bd30e7d628a8b18506aca574bad0266b2c0c608b57b"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#verfing password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

#hash password
def get_password_hash(password):
    return pwd_context.hash(password)

#create access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire =datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

#Registeration form
# @app.get("/api/register", response_class=HTMLResponse)
# async def register_form(request: Request):
#     return templates.TemplateResponse("register.html", {"request": request})

#Register Backend
@app.post("/api/register", status_code=status.HTTP_201_CREATED)
async def register_user(username: str = Form(...), email: str = Form(...), password: str = Form(...)):
    if username in userDB:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(password)
    userDB[username]={
        "email": email,
        "password": hashed_password
    }
    
    return {"message": "User registered"}


#Login form
# @app.get("/api/login", response_class=HTMLResponse)
# async def login_form(request: Request):
#     return templates.TemplateResponse("login.html", {"request": request})


@app.post("/api/login")
async def login_user(username: str = Form(...), password: str = Form(...)):
    db_user= userDB.get(username)

    if not db_user or not verify_password(password, db_user['password']):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": db_user}, expires_delta=access_token_expires)
    
    return {"token": access_token}

@app.post("/api/resume-upload")
async def analyze_resume(resumeFile: str= Form(...)):
    return {"resume": resumeFile}
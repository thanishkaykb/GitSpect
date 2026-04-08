import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import timedelta
from jose import JWTError, jwt

from db.database import engine, Base, get_db
from db.models import User, AnalysisHistory
from models.schemas import (
    UserCreate, UserAuth, UserProfile, Token, 
    AnalysisCreate, AnalysisHistorySchema, OTPRequest, OTPVerify,
    AnalysisRequest
)
from core.security import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM
from core.analyzer_ai import BugAnalyzer

# Load environment variables from .env
load_dotenv()

# Initialize DB
Base.metadata.create_all(bind=engine)

app = FastAPI(title="GitSpect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TEMP FIX
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Dependency
async def get_current_user(db: Session = Depends(get_db), token: str = Body(..., embed=True)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        # Check if token is directly a string or in an object
        actual_token = token
        payload = jwt.decode(actual_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# API Routes
@app.post("/api/auth/register", response_model=UserProfile)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password, is_email_verified=True)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"\n[SIGN UP SUCCESS] GitSpect account created for {user.email}\n")
    
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login_for_access_token(user: UserAuth, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Verification check removed per user request
        
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/verify")
def verify_email(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_email_verified = True
    db.commit()
    return {"message": "Email verified successfully. You can now log in."}

@app.post("/api/analyze")
async def analyze_repository(req: AnalysisRequest, db: Session = Depends(get_db)):
    # Manual Auth check to keep it simple since we're using embedded bodies
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        current_user = db.query(User).filter(User.email == email).first()
        if not current_user:
             raise HTTPException(status_code=401, detail="User not found")
    except Exception as e:
        print(f"[!] Auth failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

    print(f"[*] GitSpect analyzing repository: {req.repo_url}")
    
    # To avoid API key leakage, the analyzer should get it from env.
    analyzer = BugAnalyzer(os.getenv("GEMINI_API_KEY", ""))
    try:
        result = await analyzer.analyze_repo(req.repo_url)
    except Exception as e:
        print(f"[!] Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")
    
    # Save to history
    history = AnalysisHistory(
        user_id=current_user.id,
        repo_url=req.repo_url,
        repo_name=req.repo_url.split("/")[-1],
        summary=result.get("summary", ""),
        analysis_results=json.dumps(result.get("bugs", []))
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    
    return result

@app.post("/api/history", response_model=List[AnalysisHistorySchema])
def get_user_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(AnalysisHistory).filter(AnalysisHistory.user_id == current_user.id).all()

@app.delete("/api/history/{history_id}")
def delete_history_item(history_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(AnalysisHistory).filter(AnalysisHistory.id == history_id, AnalysisHistory.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    db.delete(item)
    db.commit()
    return {"message": "History item deleted successfully"}

@app.delete("/api/profile/me")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

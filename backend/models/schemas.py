from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserAuth(UserBase):
    password: str

class UserProfile(UserBase):
    id: int
    is_email_verified: bool
    phone_number: Optional[str] = None
    is_phone_verified: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class AnalysisRequest(BaseModel):
    repo_url: str
    token: str

class AnalysisCreate(BaseModel):
    repo_url: str
    repo_name: str
    summary: str
    analysis_results: str

class AnalysisHistorySchema(BaseModel):
    id: int
    repo_url: str
    repo_name: str
    summary: str
    analysis_results: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class OTPRequest(BaseModel):
    phone_number: str

class OTPVerify(BaseModel):
    otp: str

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, require_admin
from app.models import User
from app.schemas import LoginRequest, Token
from app.auth import verify_password, create_access_token, get_password_hash

router = APIRouter()

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "role": current_user.role}

from pydantic import BaseModel

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="旧密码错误")
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "密码修改成功"}

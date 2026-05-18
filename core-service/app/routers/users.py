# ════════════════════════════════════════════════════════════════════════════
# Author: Daniel Chisacá Rubio
# ════════════════════════════════════════════════════════════════════════════

from fastapi import APIRouter, status, Depends, HTTPException 
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError 
from pydantic import BaseModel
from app.schemas import UserResponse
from app.database import get_db
from app.models import User
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/core1/users", tags=["Users Core 1"])

class LoginRequest(BaseModel):
    username: str


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: dict, db: Session = Depends(get_db)):
    operation_name = "POST /core1/users/register"

    username = user_data.get("username")
    phone_number = user_data.get("phone_number")
    document_type = user_data.get("document_type")
    document_id = user_data.get("document_id")
    email = user_data.get("email")
    password_hash = user_data.get("password_hash")

    logger.info(
        "Petición de creación física en BD para usuario", 
        operation=operation_name,
        username=username
    )
    
    try:
        new_user = User(
            username=username,
            phone_number=phone_number,
            document_type=document_type,
            document_id=document_id,
            email=email,
            password_hash=password_hash
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        from app.models import Account 
        new_account = Account(user_id=new_user.id, balance=1000.0)
        db.add(new_account)
        db.commit()
        
        logger.info(
            "Usuario y cuenta inicial guardados con éxito", 
            operation=operation_name,
            httpStatus=201,
            username=username
        )
        return new_user

    except IntegrityError as e:
        db.rollback()
        logger.info(
            "Intento de registro duplicado", 
            operation=operation_name,
            status="DUPLICATE_REJECTED",
            httpStatus=400,
            errorCode="USER_ALREADY_EXISTS",
            username=username
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario o teléfono o correo ya se encuentra registrado."
        )
        
    except Exception as e:
        db.rollback()
        logger.error(
            "Error inesperado al persistir usuario",
            operation=operation_name,
            httpStatus=500,
            errorCode="USER_PERSISTENCE_ERROR",
            detail=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al procesar el registro."
        )

@router.post("/login")
def get_user_for_login(payload: LoginRequest, db: Session = Depends(get_db)):
    username = payload.username
    operation_name = "POST /core1/users/login"
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        logger.error(
            "Usuario no encontrado en base de datos para login",
            operation=operation_name,
            httpStatus=404,
            errorCode="USER_NOT_FOUND",
            detail=f"El username '{username}' solicitado por el servicio de Auth no existe"
        )
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    logger.info(
        "Recuperación exitosa de credenciales para verificación de Login", 
        operation=operation_name,
        httpStatus=200,
        username=username
    )
    
    return {
        "id": user.id,
        "username": user.username,
        "password_hash": user.password_hash,
        "phone_number": user.phone_number,
        "document_type": user.document_type,
        "document_id": user.document_id,
        "email": user.email
    }
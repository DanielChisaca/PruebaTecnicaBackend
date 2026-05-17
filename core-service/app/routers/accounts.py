from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime
from zoneinfo import ZoneInfo
import structlog
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/accounts", tags=["Accounts"])
logger = structlog.get_logger()

@router.get("/balance/{user_id}", response_model=schemas.AccountBalanceResponse)
def get_balance(user_id: int, db: Session = Depends(get_db)):
    operation_name = f"GET /accounts/balance/{user_id}"
    
    account = db.query(models.Account).filter(models.Account.user_id == user_id).first()
    if not account:
        logger.error(
            "Cuenta no encontrada", 
            operation=operation_name,
            httpStatus=404,
            errorCode="ACCOUNT_NOT_FOUND",
            event=f"No existe cuenta asociada al user_id: {user_id}"
        )
        raise HTTPException(status_code=404, detail="Cuenta no encontrada para este usuario")
    
    logger.info(
        "Consulta de saldo exitosa", 
        operation=operation_name,
        httpStatus=200,
        balance=float(account.balance)
    )
    return {"account_id": account.id, "balance": account.balance}

@router.post("/transfer", status_code=status.HTTP_201_CREATED)
def execute_transfer(payload: schemas.TransferRequest, db: Session = Depends(get_db)):
    operation_name = "POST /accounts/transfer"

    origin_acc = db.query(models.Account).filter(models.Account.user_id == payload.origin_user_id).first()
    if not origin_acc:
        logger.error(
            "Transferencia fallida: Cuenta origen inexistente",
            operation=operation_name,
            httpStatus=404,
            errorCode="ORIGIN_ACCOUNT_NOT_FOUND",
            event=f"User ID {payload.origin_user_id} no registra cuenta activa"
        )
        raise HTTPException(status_code=404, detail="Cuenta origen no encontrada")

    if origin_acc.balance < payload.amount:
        logger.info(
            "Transferencia rechazada: Fondos insuficientes", 
            operation=operation_name,
            status="REJECTED",
            httpStatus=400,
            user_id=payload.origin_user_id, 
            amount=float(payload.amount)
        )
        raise HTTPException(status_code=400, detail="Fondos insuficientes para realizar la transferencia")

    dest_user = db.query(models.User).filter(models.User.phone_number == payload.destination_phone).first()
    if not dest_user:
        logger.error(
            "Transferencia fallida: Teléfono destino no registrado",
            operation=operation_name,
            httpStatus=404,
            errorCode="DESTINATION_PHONE_NOT_FOUND",
            event=f"Teléfono {payload.destination_phone} no está asignado a ningún usuario"
        )
        raise HTTPException(status_code=404, detail="El número telefónico de destino no está registrado")
    
    if dest_user.id == payload.origin_user_id:
        logger.info(
            "Intento de transferencia a sí mismo bloqueado", 
            operation=operation_name,
            status="BLOCKED_OPERATION",
            httpStatus=400,
            user_id=payload.origin_user_id, 
            phone=payload.destination_phone
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No puedes realizar una transferencia a tu propio número de teléfono"
        )
    
    dest_acc = db.query(models.Account).filter(models.Account.user_id == dest_user.id).first()
    
    try:
        origin_acc.balance -= payload.amount
        dest_acc.balance += payload.amount
        
        colombia_now = datetime.now(ZoneInfo("America/Bogota"))
        
        new_tx = models.Transaction(
            origin_account_id=origin_acc.id,
            destination_phone=payload.destination_phone,
            amount=payload.amount,
            timestamp=colombia_now 
        )
        db.add(new_tx)
        db.commit() 
        
        logger.info(
            "Transferencia ejecutada con éxito", 
            operation=operation_name,
            httpStatus=201,
            origin=payload.origin_user_id, 
            dest_phone=payload.destination_phone, 
            amount=float(payload.amount),
            hora_colombia=colombia_now.isoformat()
        )
                    
        return {"status": "success", "message": "Transferencia completada"}
    except Exception as e:
        db.rollback()
        logger.error(
            "Fallo crítico en base de datos. Transacción revertida", 
            operation=operation_name,
            httpStatus=500,
            errorCode="TRANSACTION_DB_ROLLBACK",
            event=str(e)
        )
        raise HTTPException(status_code=500, detail="Error interno al procesar la transferencia")
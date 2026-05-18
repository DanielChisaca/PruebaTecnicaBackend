# ════════════════════════════════════════════════════════════════════════════
# Author: Daniel Chisacá Rubio
# ════════════════════════════════════════════════════════════════════════════

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import structlog
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/core2/movements", tags=["Movements"])
logger = structlog.get_logger()

class MovementRequest(BaseModel):
    userId: int

@router.post("")
def get_movements(payload: MovementRequest, db: Session = Depends(get_db)):
    user_id = payload.userId
    operation_name = "POST /core2/movements"

    #Traemos la cuenta del usuario LOGUEADO
    account = db.query(models.Account).filter(models.Account.user_id == user_id).first()
    if not account:
        logger.error(
            "No se encontró cuenta para el usuario", 
            operation=operation_name,
            httpStatus=404,
            errorCode="ACCOUNT_NOT_FOUND",
            detail=f"User ID {user_id} no registra cuenta en base de datos"
        )
        return []
        
    #Traemos la info del usuario logueado para saber SU número de teléfono
    user_info = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_info:
        logger.error(
            "No se encontró información de usuario", 
            operation=operation_name,
            httpStatus=404,
            errorCode="USER_NOT_FOUND",
            detail=f"User ID {user_id} no existe en la tabla de usuarios"
        )
        return []
    
    # Traemos todas las transacciones donde esté involucrado
    txs = db.query(models.Transaction).filter(
        (models.Transaction.origin_account_id == account.id) | 
        (models.Transaction.destination_phone == user_info.phone_number)
    ).order_by(models.Transaction.id.desc()).all()

    formatted_movements = []
    for tx in txs:
        tx_time = tx.timestamp
        
        # Lógica de negocio intacta y corregida para ingresos/egresos
        is_egreso = tx.origin_account_id == account.id
        
        formatted_movements.append({
            "id": tx.id,
            "origin_account_id": tx.origin_account_id,
            "destination_phone": tx.destination_phone,
            "amount": float(tx.amount),
            "timestamp": tx_time.isoformat() if tx_time else None,
            "type": "egreso" if is_egreso else "ingreso"
        })

    # Log exitoso estructurado con métricas de control
    logger.info(
        "Consulta de movimientos mixtos completada vía POST", 
        operation=operation_name,
        httpStatus=200,
        user_id=user_id, 
        total_records=len(formatted_movements)
    )
    return formatted_movements
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import structlog
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/movements", tags=["Movements"])
logger = structlog.get_logger()

@router.get("/{user_id}")
def get_movements(user_id: int, db: Session = Depends(get_db)):
    operation_name = f"GET /movements/{user_id}"

    # 1. Traemos la cuenta del usuario LOGUEADO (el que hace la consulta)
    account = db.query(models.Account).filter(models.Account.user_id == user_id).first()
    if not account:
        logger.error(
            "No se encontró cuenta para el usuario", 
            operation=operation_name,
            httpStatus=404,
            errorCode="ACCOUNT_NOT_FOUND",
            event=f"User ID {user_id} no registra cuenta en base de datos"
        )
        return []
        
    # 2. Traemos la info del usuario logueado para saber SU número de teléfono
    user_info = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_info:
        logger.error(
            "No se encontró información de usuario", 
            operation=operation_name,
            httpStatus=404,
            errorCode="USER_NOT_FOUND",
            event=f"User ID {user_id} no existe en la tabla de usuarios"
        )
        return []
    
    # 3. Traemos todas las transacciones donde esté involucrado
    txs = db.query(models.Transaction).filter(
        (models.Transaction.origin_account_id == account.id) | 
        (models.Transaction.destination_phone == user_info.phone_number)
    ).order_by(models.Transaction.id.desc()).all()

    formatted_movements = []
    for tx in txs:
        tx_time = tx.timestamp
        
        # 🌟 LA CORRECCIÓN AQUÍ: 
        # Si el origin_account_id de la transferencia coincide con MI cuenta, yo la envié (egreso).
        # Si NO coincide, significa que vino de otra cuenta hacia mi teléfono (ingreso).
        is_egreso = tx.origin_account_id == account.id
        
        formatted_movements.append({
            "id": tx.id,
            "origin_account_id": tx.origin_account_id,
            "destination_phone": tx.destination_phone,
            "amount": float(tx.amount),
            "timestamp": tx_time.isoformat() if tx_time else None,
            "type": "egreso" if is_egreso else "ingreso"  # 🚀 Ahora sí enviará "ingreso" si tú eres el receptor
        })

    # Log exitoso estructurado con métricas de control
    logger.info(
        "Consulta de movimientos mixtos completada", 
        operation=operation_name,
        httpStatus=200,
        user_id=user_id, 
        total_records=len(formatted_movements)
    )
    return formatted_movements
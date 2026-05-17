from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    phone_number: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    document_type: str
    document_id: str
    phone_number: str
    password_hash: str

class TransferRequest(BaseModel):
    origin_user_id: int
    destination_phone: str = Field(..., description="Número de teléfono destino")
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)

class AccountBalanceResponse(BaseModel):
    account_id: int
    balance: Decimal

class TransactionResponse(BaseModel):
    id: int
    origin_account_id: int
    destination_phone: str
    amount: Decimal
    timestamp: datetime
    type: str

    class Config:
        from_attributes = True
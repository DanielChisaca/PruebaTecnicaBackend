# ════════════════════════════════════════════════════════════════════════════
# Author: Daniel Chisacá Rubio
# ════════════════════════════════════════════════════════════════════════════

from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from zoneinfo import ZoneInfo
from .database import Base

def get_colombia_time():
    return datetime.now(ZoneInfo("America/Bogota"))

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    phone_number = Column(String(20), unique=True, index=True)
    document_type = Column(String(20))
    document_id = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String, nullable=False)
class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    balance = Column(Numeric(12, 2), default=0.00)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    origin_account_id = Column(Integer, ForeignKey("accounts.id"))
    destination_phone = Column(String(20))
    amount = Column(Numeric(12, 2))
    timestamp = Column(DateTime, default=get_colombia_time)
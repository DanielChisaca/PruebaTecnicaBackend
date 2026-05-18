# ════════════════════════════════════════════════════════════════════════════
# Author: Daniel Chisacá Rubio
# ════════════════════════════════════════════════════════════════════════════

import pytest
from decimal import Decimal
from datetime import datetime
from pydantic import ValidationError
from app.schemas import (
    TransferRequest,
    AccountBalanceResponse,
    UserCreate,
    UserResponse,
    TransactionResponse,
)


# TransferRequest

def test_transfer_request_valido():
    req = TransferRequest(origin_user_id=1, destination_phone="3001112233", amount=Decimal("100.50"))
    assert req.origin_user_id == 1
    assert req.destination_phone == "3001112233"
    assert req.amount == Decimal("100.50")


def test_transfer_request_amount_cero_rechazado():
    with pytest.raises(ValidationError):
        TransferRequest(origin_user_id=1, destination_phone="3001112233", amount=0)


def test_transfer_request_amount_negativo_rechazado():
    with pytest.raises(ValidationError):
        TransferRequest(origin_user_id=1, destination_phone="3001112233", amount=-50)


def test_transfer_request_sin_origin_user_id_rechazado():
    with pytest.raises(ValidationError):
        TransferRequest(destination_phone="3001112233", amount=100)


def test_transfer_request_sin_destination_phone_rechazado():
    with pytest.raises(ValidationError):
        TransferRequest(origin_user_id=1, amount=100)


def test_transfer_request_sin_amount_rechazado():
    with pytest.raises(ValidationError):
        TransferRequest(origin_user_id=1, destination_phone="3001112233")


def test_transfer_request_demasiados_digitos_rechazado():
    with pytest.raises(ValidationError):
        TransferRequest(origin_user_id=1, destination_phone="3001112233", amount=Decimal("9999999999999"))


# AccountBalanceResponse

def test_account_balance_response_valido():
    resp = AccountBalanceResponse(account_id=10, balance=Decimal("5000.00"))
    assert resp.account_id == 10
    assert resp.balance == Decimal("5000.00")


def test_account_balance_response_serializa_decimal():
    resp = AccountBalanceResponse(account_id=10, balance=Decimal("5000.00"))
    assert resp.model_dump()["balance"] == Decimal("5000.00")
    assert resp.model_dump(mode="json")["balance"] == "5000.00"


def test_account_balance_response_balance_cero():
    resp = AccountBalanceResponse(account_id=10, balance=Decimal("0.00"))
    assert resp.balance == Decimal("0.00")


# UserCreate

def test_user_create_valido():
    user = UserCreate(username="testuser", phone_number="3001112233")
    assert user.username == "testuser"
    assert user.phone_number == "3001112233"


def test_user_create_sin_username_rechazado():
    with pytest.raises(ValidationError):
        UserCreate(phone_number="3001112233")


def test_user_create_sin_phone_rechazado():
    with pytest.raises(ValidationError):
        UserCreate(username="testuser")


# TransactionResponse

def test_transaction_response_valido():
    ts = datetime(2025, 1, 15, 10, 0, 0)
    tx = TransactionResponse(
        id=1,
        origin_account_id=10,
        destination_phone="3004445566",
        amount=Decimal("500.00"),
        timestamp=ts,
        type="egreso",
    )
    assert tx.id == 1
    assert tx.type == "egreso"
    assert tx.amount == Decimal("500.00")
    assert tx.timestamp == ts

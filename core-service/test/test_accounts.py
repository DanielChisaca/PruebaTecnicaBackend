# ════════════════════════════════════════════════════════════════════════════
# Author: Daniel Chisacá Rubio
# ════════════════════════════════════════════════════════════════════════════

import pytest
from app.models import User, Account

## Helpers para preparar datos
def create_mock_data(db):
    # Usuario 1 con balance
    user1 = User(id=1, phone_number="3001112233", password_hash="hash_test")
    acc1 = Account(id=10, user_id=1, balance=5000.0)
    # Usuario 2
    user2 = User(id=2, phone_number="3004445566", password_hash="hash_test")
    acc2 = Account(id=20, user_id=2, balance=100.0)
    
    db.add_all([user1, acc1, user2, acc2])
    db.commit()


# Pruebas de /core2/balance
def test_get_balance_success(client, db_session):
    create_mock_data(db_session)
    response = client.post("/core2/balance", json={"userId": 1})
    
    assert response.status_code == 200
    assert response.json() == {"account_id": 10, "balance": "5000.00"}

def test_get_balance_user_not_found(client, db_session):
    response = client.post("/core2/balance", json={"userId": 999})
    assert response.status_code == 404
    assert "Cuenta no encontrada" in response.json()["detail"]


# Pruebas de /core3/transfers
def test_transfer_success(client, db_session):
    create_mock_data(db_session)
    transfer_data = {
        "origin_user_id": 1,
        "destination_phone": "3004445566",
        "amount": 1000.0
    }
    response = client.post("/core3/transfers", json=transfer_data)
    
    assert response.status_code == 201
    assert response.json()["status"] == "success"
    
    # Verificar cambios en DB
    acc_orig = db_session.query(Account).filter(Account.user_id == 1).first()
    acc_dest = db_session.query(Account).filter(Account.user_id == 2).first()
    assert acc_orig.balance == 4000.0
    assert acc_dest.balance == 1100.0

def test_transfer_insufficient_funds(client, db_session):
    create_mock_data(db_session)
    transfer_data = {
        "origin_user_id": 2,
        "destination_phone": "3001112233",
        "amount": 1000.0
    }
    response = client.post("/core3/transfers", json=transfer_data)
    
    assert response.status_code == 400
    assert "Fondos insuficientes" in response.json()["detail"]

def test_transfer_to_self_blocked(client, db_session):
    create_mock_data(db_session)
    transfer_data = {
        "origin_user_id": 1,
        "destination_phone": "3001112233",
        "amount": 100.0
    }
    response = client.post("/core3/transfers", json=transfer_data)

    assert response.status_code == 400
    assert "propio número" in response.json()["detail"]


def test_get_balance_missing_user_id(client):
    response = client.post("/core2/balance", json={})
    assert response.status_code == 400
    assert "userId" in response.json()["detail"]


def test_transfer_destination_phone_not_found(client, db_session):
    create_mock_data(db_session)
    transfer_data = {
        "origin_user_id": 1,
        "destination_phone": "3009999999",
        "amount": 100.0,
    }
    response = client.post("/core3/transfers", json=transfer_data)
    assert response.status_code == 404
    assert "telefónico" in response.json()["detail"]


def test_transfer_saldo_exacto(client, db_session):
    create_mock_data(db_session)
    transfer_data = {
        "origin_user_id": 2,
        "destination_phone": "3001112233",
        "amount": 100.0,
    }
    response = client.post("/core3/transfers", json=transfer_data)
    assert response.status_code == 201

    acc = db_session.query(Account).filter(Account.user_id == 2).first()
    db_session.refresh(acc)
    assert acc.balance == 0


def test_transfer_dest_usuario_sin_cuenta(client, db_session):
    # Expone el bug: dest_acc puede ser None si el usuario destino no tiene cuenta,
    # lo que causa AttributeError → 500 en lugar de un error claro
    user1 = User(id=1, phone_number="3001112233", password_hash="hash_test")
    acc1 = Account(id=10, user_id=1, balance=5000.0)
    user2 = User(id=2, phone_number="3004445566", password_hash="hash_test")  # sin cuenta
    db_session.add_all([user1, acc1, user2])
    db_session.commit()

    transfer_data = {
        "origin_user_id": 1,
        "destination_phone": "3004445566",
        "amount": 100.0,
    }
    response = client.post("/core3/transfers", json=transfer_data)
    assert response.status_code == 500
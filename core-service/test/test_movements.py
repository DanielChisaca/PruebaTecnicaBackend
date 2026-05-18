# ════════════════════════════════════════════════════════════════════════════
# Author: Daniel Chisacá Rubio
# ════════════════════════════════════════════════════════════════════════════

import pytest
from datetime import datetime
from app.models import User, Account, Transaction


def create_base_data(db):
    user1 = User(id=1, phone_number="3001112233", password_hash="hash_test")
    acc1 = Account(id=10, user_id=1, balance=5000.0)
    user2 = User(id=2, phone_number="3004445566", password_hash="hash_test")
    acc2 = Account(id=20, user_id=2, balance=100.0)
    db.add_all([user1, acc1, user2, acc2])
    db.commit()


# Pruebas de /core2/movements

def test_get_movements_no_account(client, db_session):
    # userId sin cuenta registrada → lista vacía (no es 404)
    response = client.post("/core2/movements", json={"userId": 999})
    assert response.status_code == 200
    assert response.json() == []


def test_get_movements_sin_transacciones(client, db_session):
    create_base_data(db_session)
    response = client.post("/core2/movements", json={"userId": 1})
    assert response.status_code == 200
    assert response.json() == []


def test_get_movements_egreso(client, db_session):
    create_base_data(db_session)
    tx = Transaction(
        id=1,
        origin_account_id=10,
        destination_phone="3004445566",
        amount=500.0,
        timestamp=datetime(2025, 1, 15, 10, 0, 0),
    )
    db_session.add(tx)
    db_session.commit()

    response = client.post("/core2/movements", json={"userId": 1})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "egreso"
    assert data[0]["amount"] == 500.0
    assert data[0]["origin_account_id"] == 10
    assert data[0]["destination_phone"] == "3004445566"


def test_get_movements_ingreso(client, db_session):
    create_base_data(db_session)
    # Usuario 2 transfiere al teléfono del usuario 1
    tx = Transaction(
        id=1,
        origin_account_id=20,
        destination_phone="3001112233",
        amount=200.0,
        timestamp=datetime(2025, 1, 15, 10, 0, 0),
    )
    db_session.add(tx)
    db_session.commit()

    response = client.post("/core2/movements", json={"userId": 1})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "ingreso"
    assert data[0]["amount"] == 200.0


def test_get_movements_mixtos(client, db_session):
    create_base_data(db_session)
    # Usuario 1 envía a usuario 2
    tx_egreso = Transaction(
        id=1,
        origin_account_id=10,
        destination_phone="3004445566",
        amount=300.0,
        timestamp=datetime(2025, 1, 15, 9, 0, 0),
    )
    # Usuario 2 envía al usuario 1
    tx_ingreso = Transaction(
        id=2,
        origin_account_id=20,
        destination_phone="3001112233",
        amount=100.0,
        timestamp=datetime(2025, 1, 15, 10, 0, 0),
    )
    db_session.add_all([tx_egreso, tx_ingreso])
    db_session.commit()

    response = client.post("/core2/movements", json={"userId": 1})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # El endpoint ordena por id DESC → el más reciente primero
    assert data[0]["type"] == "ingreso"
    assert data[0]["amount"] == 100.0
    assert data[1]["type"] == "egreso"
    assert data[1]["amount"] == 300.0

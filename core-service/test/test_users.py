# ════════════════════════════════════════════════════════════════════════════
# Author: Daniel Chisacá Rubio
# ════════════════════════════════════════════════════════════════════════════

import pytest
from app.models import User, Account


USER_DATA = {
    "username": "testuser",
    "phone_number": "3001112233",
    "document_type": "CC",
    "document_id": "123456789",
    "email": "test@example.com",
    "password_hash": "hashed_password",
}


# Pruebas de /core1/users/register

def test_register_success(client, db_session):
    response = client.post("/core1/users/register", json=USER_DATA)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert data["phone_number"] == "3001112233"
    assert "id" in data

    user = db_session.query(User).filter(User.username == "testuser").first()
    account = db_session.query(Account).filter(Account.user_id == user.id).first()
    assert account is not None
    assert float(account.balance) == 1000.0


def test_register_duplicate_username(client, db_session):
    client.post("/core1/users/register", json=USER_DATA)
    response = client.post("/core1/users/register", json=USER_DATA)
    assert response.status_code == 400
    assert "ya se encuentra registrado" in response.json()["detail"]


def test_register_duplicate_email(client, db_session):
    client.post("/core1/users/register", json=USER_DATA)
    data2 = {
        **USER_DATA,
        "username": "otro_user",
        "phone_number": "3009998877",
        "document_id": "987654321",
    }
    response = client.post("/core1/users/register", json=data2)
    assert response.status_code == 400
    assert "ya se encuentra registrado" in response.json()["detail"]


def test_register_duplicate_phone(client, db_session):
    client.post("/core1/users/register", json=USER_DATA)
    data2 = {
        **USER_DATA,
        "username": "otro_user",
        "email": "otro@example.com",
        "document_id": "987654321",
    }
    response = client.post("/core1/users/register", json=data2)
    assert response.status_code == 400
    assert "ya se encuentra registrado" in response.json()["detail"]


# Pruebas de /core1/users/login

def test_login_success(client, db_session):
    client.post("/core1/users/register", json=USER_DATA)
    response = client.post("/core1/users/login", json={"username": "testuser"})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["password_hash"] == "hashed_password"
    assert data["phone_number"] == "3001112233"
    assert data["email"] == "test@example.com"
    assert "id" in data


def test_login_user_not_found(client, db_session):
    response = client.post("/core1/users/login", json={"username": "no_existe"})
    assert response.status_code == 404
    assert "no encontrado" in response.json()["detail"]


def test_register_sin_password_hash(client, db_session):
    data = {k: v for k, v in USER_DATA.items() if k != "password_hash"}
    response = client.post("/core1/users/register", json=data)
    assert response.status_code == 400

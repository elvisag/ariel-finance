import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class TestRegister:
    async def test_register_success(self, async_client: AsyncClient, user_data):
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(self, async_client: AsyncClient, user_data, created_user):
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 409
        assert "ya está registrado" in response.json()["detail"]

    async def test_register_invalid_email(self, async_client: AsyncClient):
        response = await async_client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "name": "Test",
            "password": "Pass123!",
        })
        assert response.status_code == 422


class TestLogin:
    async def test_login_success(self, async_client: AsyncClient, user_data, created_user):
        response = await async_client.post("/api/v1/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"],
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, async_client: AsyncClient, user_data):
        response = await async_client.post("/api/v1/auth/login", json={
            "email": user_data["email"],
            "password": "WrongPassword!",
        })
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, async_client: AsyncClient):
        response = await async_client.post("/api/v1/auth/login", json={
            "email": "noone@example.com",
            "password": "Pass123!",
        })
        assert response.status_code == 401

    async def test_login_google_only_user(self, async_client: AsyncClient, db_session: AsyncSession):
        user = User(
            email="googleonly@example.com",
            name="Google Only",
            google_id="google-only-id",
            password_hash=None,
        )
        db_session.add(user)
        await db_session.flush()

        response = await async_client.post("/api/v1/auth/login", json={
            "email": "googleonly@example.com",
            "password": "anything",
        })
        assert response.status_code == 401


class TestGoogleAuth:
    async def test_google_auth_new_user(self, async_client: AsyncClient, mock_google_token, db_session: AsyncSession):
        mock, payload, email, name, google_id = mock_google_token

        response = await async_client.post("/api/v1/auth/google", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

        result = await db_session.execute(
            select(User).where(User.google_id == google_id)
        )
        user = result.scalar_one_or_none()
        assert user is not None
        assert user.email == email
        assert user.name == name
        assert user.password_hash is None

    async def test_google_auth_existing_by_google_id(self, async_client: AsyncClient, mock_google_token, db_session: AsyncSession):
        mock, payload, email, name, google_id = mock_google_token

        existing = User(
            email="existing@gmail.com",
            name="Old Name",
            google_id=google_id,
            password_hash=None,
        )
        db_session.add(existing)
        await db_session.flush()

        response = await async_client.post("/api/v1/auth/google", json=payload)
        assert response.status_code == 200

        result = await db_session.execute(
            select(User).where(User.google_id == google_id)
        )
        user = result.scalar_one()
        assert user.name == name

    async def test_google_auth_existing_by_email(self, async_client: AsyncClient, mock_google_token, db_session: AsyncSession):
        mock, payload, email, name, google_id = mock_google_token

        existing = User(
            email=email,
            name="Original Name",
            password_hash="$2b$12$LJ3mSaltHashHere",
            google_id=None,
        )
        db_session.add(existing)
        await db_session.flush()

        response = await async_client.post("/api/v1/auth/google", json=payload)
        assert response.status_code == 200

        result = await db_session.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one()
        assert user.google_id == google_id
        assert user.name == name

    async def test_google_auth_invalid_token(self, async_client: AsyncClient):
        from google.oauth2 import id_token
        from google.auth.transport import requests

        response = await async_client.post("/api/v1/auth/google", json={
            "id_token": "totally-fake-token",
        })
        assert response.status_code == 401

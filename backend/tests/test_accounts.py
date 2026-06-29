import pytest
from httpx import AsyncClient


class TestListAccounts:
    async def test_empty(self, async_client: AsyncClient, auth_headers):
        response = await async_client.get("/api/v1/accounts/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    async def test_with_accounts(self, async_client: AsyncClient, auth_headers, db_session):
        await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Mi billetera", "type": "cash", "currency": "ARS", "balance": 1500,
        })
        response = await async_client.get("/api/v1/accounts/", headers=auth_headers)
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Mi billetera"

    async def test_requires_auth(self, async_client: AsyncClient):
        response = await async_client.get("/api/v1/accounts/")
        assert response.status_code in (401, 403)


class TestCreateAccount:
    async def test_success(self, async_client: AsyncClient, auth_headers):
        response = await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Cuenta nueva", "type": "savings", "currency": "USD", "balance": 500,
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Cuenta nueva"
        assert data["type"] == "savings"
        assert float(data["balance"]) == 500.0

    async def test_minimal_body(self, async_client: AsyncClient, auth_headers):
        response = await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Mínima", "type": "cash",
        })
        assert response.status_code == 201
        assert float(response.json()["balance"]) == 0.0


class TestGetAccount:
    async def test_success(self, async_client: AsyncClient, auth_headers):
        created = (await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Para obtener", "type": "checking",
        })).json()

        response = await async_client.get(f"/api/v1/accounts/{created['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Para obtener"

    async def test_not_found(self, async_client: AsyncClient, auth_headers):
        response = await async_client.get("/api/v1/accounts/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert response.status_code == 404

    async def test_other_users_account(self, async_client: AsyncClient, auth_headers, db_session, user_data):
        from app.core.security import hash_password, create_access_token
        from app.models.user import User

        other = User(email="other@test.com", name="Other", password_hash=hash_password("Pass123!"))
        db_session.add(other)
        await db_session.flush()

        created = (await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Mi cuenta", "type": "cash",
        })).json()

        other_token = create_access_token({"sub": str(other.id)})
        response = await async_client.get(
            f"/api/v1/accounts/{created['id']}",
            headers={"Authorization": f"Bearer {other_token}"},
        )
        assert response.status_code == 404


class TestUpdateAccount:
    async def test_success(self, async_client: AsyncClient, auth_headers):
        created = (await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Original", "type": "cash",
        })).json()

        response = await async_client.put(
            f"/api/v1/accounts/{created['id']}",
            headers=auth_headers,
            json={"name": "Renombrada"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Renombrada"


class TestDeleteAccount:
    async def test_success(self, async_client: AsyncClient, auth_headers):
        created = (await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "A eliminar", "type": "cash",
        })).json()

        response = await async_client.delete(f"/api/v1/accounts/{created['id']}", headers=auth_headers)
        assert response.status_code == 204

        get_response = await async_client.get("/api/v1/accounts/", headers=auth_headers)
        assert len(get_response.json()) == 0

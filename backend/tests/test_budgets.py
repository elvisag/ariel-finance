import pytest
from httpx import AsyncClient


@pytest.fixture
async def category(async_client: AsyncClient, auth_headers):
    resp = await async_client.post("/api/v1/categories/", headers=auth_headers, json={
        "name": "Comida", "type": "expense",
    })
    return resp.json()


class TestListBudgets:
    async def test_empty(self, async_client: AsyncClient, auth_headers):
        response = await async_client.get("/api/v1/budgets/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    async def test_isolation(self, async_client: AsyncClient, auth_headers, category, db_session):
        import uuid
        from datetime import date
        from app.core.security import hash_password, create_access_token
        from app.models.user import User
        from app.models.budget import Budget

        other = User(email="other4@test.com", name="Other", password_hash=hash_password("Pass123!"))
        db_session.add(other)
        await db_session.flush()

        other_budget = Budget(
            user_id=other.id, category_id=uuid.UUID(category["id"]),
            amount=500, period="monthly", start_date=date(2026, 6, 1),
        )
        db_session.add(other_budget)
        await db_session.flush()

        response = await async_client.get("/api/v1/budgets/", headers=auth_headers)
        assert response.json() == []


class TestCreateBudget:
    async def test_success(self, async_client: AsyncClient, auth_headers, category):
        response = await async_client.post("/api/v1/budgets/", headers=auth_headers, json={
            "category_id": category["id"],
            "amount": 500,
            "period": "monthly",
            "start_date": "2026-06-01",
        })
        assert response.status_code == 201
        data = response.json()
        assert float(data["amount"]) == 500.0
        assert data["period"] == "monthly"


class TestUpdateBudget:
    async def test_success(self, async_client: AsyncClient, auth_headers, category):
        created = (await async_client.post("/api/v1/budgets/", headers=auth_headers, json={
            "category_id": category["id"], "amount": 300, "period": "monthly",
            "start_date": "2026-06-01",
        })).json()

        response = await async_client.put(
            f"/api/v1/budgets/{created['id']}",
            headers=auth_headers,
            json={"amount": 400},
        )
        assert response.status_code == 200
        assert float(response.json()["amount"]) == 400.0


class TestDeleteBudget:
    async def test_success(self, async_client: AsyncClient, auth_headers, category):
        created = (await async_client.post("/api/v1/budgets/", headers=auth_headers, json={
            "category_id": category["id"], "amount": 200, "period": "weekly",
            "start_date": "2026-06-01",
        })).json()

        response = await async_client.delete(f"/api/v1/budgets/{created['id']}", headers=auth_headers)
        assert response.status_code == 204

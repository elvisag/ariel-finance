import pytest
from httpx import AsyncClient


@pytest.fixture
async def account(async_client: AsyncClient, auth_headers):
    resp = await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
        "name": "Analytics account", "type": "cash", "balance": 1000,
    })
    return resp.json()


@pytest.fixture
async def seed_transactions(async_client: AsyncClient, auth_headers, account):
    import datetime
    today = datetime.date.today()
    for day, amount, type_ in [(1, 1000, "income"), (5, 200, "expense"), (10, 50, "expense")]:
        d = today.replace(day=min(day, 28))
        await async_client.post("/api/v1/transactions/", headers=auth_headers, json={
            "account_id": account["id"], "amount": amount, "type": type_,
            "transaction_date": d.isoformat(),
        })
    yield


class TestMonthlySummary:
    async def test_current_month(self, async_client: AsyncClient, auth_headers, seed_transactions):
        import datetime
        today = datetime.date.today()
        response = await async_client.get(
            f"/api/v1/analytics/monthly-summary?year={today.year}&month={today.month}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_income"] == 1000.0
        assert data["total_expense"] == 250.0
        assert data["balance"] == 750.0
        assert data["transaction_count"] == 3


class TestMonthlyTrend:
    async def test_returns_trend(self, async_client: AsyncClient, auth_headers, seed_transactions):
        response = await async_client.get(
            "/api/v1/analytics/monthly-trend?months=3",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "months" in data
        assert len(data["months"]) >= 1


class TestSpendingByCategory:
    async def test_returns_spending(self, async_client: AsyncClient, auth_headers, seed_transactions):
        response = await async_client.get(
            "/api/v1/analytics/spending-by-category",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert data["total"] == 250.0
        assert len(data["categories"]) > 0
        assert data["categories"][0]["name"] == "Sin categoría"

import pytest
from httpx import AsyncClient


@pytest.fixture
async def account(async_client: AsyncClient, auth_headers):
    resp = await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
        "name": "Test account", "type": "cash", "balance": 1000,
    })
    return resp.json()


@pytest.fixture
async def category(async_client: AsyncClient, auth_headers):
    resp = await async_client.post("/api/v1/categories/", headers=auth_headers, json={
        "name": "Comida", "type": "expense", "icon": "fast-food", "color": "#ef4444",
    })
    return resp.json()


class TestListTransactions:
    async def test_empty(self, async_client: AsyncClient, auth_headers):
        response = await async_client.get("/api/v1/transactions/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_with_filters(self, async_client: AsyncClient, auth_headers, account):
        await async_client.post("/api/v1/transactions/", headers=auth_headers, json={
            "account_id": account["id"], "amount": 100, "type": "expense",
            "description": "Cena", "transaction_date": "2026-06-01",
        })
        await async_client.post("/api/v1/transactions/", headers=auth_headers, json={
            "account_id": account["id"], "amount": 200, "type": "income",
            "description": "Sueldo", "transaction_date": "2026-06-15",
        })

        all_tx = (await async_client.get("/api/v1/transactions/", headers=auth_headers)).json()
        assert len(all_tx) == 2

        expenses = (await async_client.get("/api/v1/transactions/?type=expense", headers=auth_headers)).json()
        assert len(expenses) == 1
        assert float(expenses[0]["amount"]) == 100.0


class TestCreateTransaction:
    async def test_expense_reduces_balance(self, async_client: AsyncClient, auth_headers, account):
        response = await async_client.post("/api/v1/transactions/", headers=auth_headers, json={
            "account_id": account["id"], "amount": 50, "type": "expense",
            "description": "Compra", "transaction_date": "2026-06-19",
        })
        assert response.status_code == 201
        assert response.json()["type"] == "expense"

        acc_resp = await async_client.get(f"/api/v1/accounts/{account['id']}", headers=auth_headers)
        assert float(acc_resp.json()["balance"]) == 950.0

    async def test_income_increases_balance(self, async_client: AsyncClient, auth_headers, account):
        await async_client.post("/api/v1/transactions/", headers=auth_headers, json={
            "account_id": account["id"], "amount": 300, "type": "income",
            "description": "Pago", "transaction_date": "2026-06-19",
        })
        acc_resp = await async_client.get(f"/api/v1/accounts/{account['id']}", headers=auth_headers)
        assert float(acc_resp.json()["balance"]) == 1300.0

    async def test_other_users_account(self, async_client: AsyncClient, auth_headers, db_session):
        from app.core.security import hash_password, create_access_token
        from app.models.user import User
        from app.models.account import Account

        other = User(email="other3@test.com", name="Other", password_hash=hash_password("Pass123!"))
        db_session.add(other)
        await db_session.flush()

        other_acc = Account(user_id=other.id, name="Other account", type="cash", balance=500)
        db_session.add(other_acc)
        await db_session.flush()

        response = await async_client.post("/api/v1/transactions/", headers=auth_headers, json={
            "account_id": str(other_acc.id), "amount": 10, "type": "expense",
            "transaction_date": "2026-06-19",
        })
        assert response.status_code == 404


class TestUpdateTransaction:
    async def test_update_amount_updates_balance(self, async_client: AsyncClient, auth_headers, account):
        tx = (await async_client.post("/api/v1/transactions/", headers=auth_headers, json={
            "account_id": account["id"], "amount": 100, "type": "expense",
            "transaction_date": "2026-06-01",
        })).json()

        response = await async_client.put(
            f"/api/v1/transactions/{tx['id']}",
            headers=auth_headers,
            json={"amount": 60},
        )
        assert response.status_code == 200

        acc_resp = await async_client.get(f"/api/v1/accounts/{account['id']}", headers=auth_headers)
        assert float(acc_resp.json()["balance"]) == 940.0

    async def test_change_type_recalculates(self, async_client: AsyncClient, auth_headers, account):
        tx = (await async_client.post("/api/v1/transactions/", headers=auth_headers, json={
            "account_id": account["id"], "amount": 100, "type": "expense",
            "transaction_date": "2026-06-01",
        })).json()

        response = await async_client.put(
            f"/api/v1/transactions/{tx['id']}",
            headers=auth_headers,
            json={"type": "income"},
        )
        assert response.status_code == 200

        acc_resp = await async_client.get(f"/api/v1/accounts/{account['id']}", headers=auth_headers)
        assert float(acc_resp.json()["balance"]) == 1100.0


class TestDeleteTransaction:
    async def test_delete_expense_restores_balance(self, async_client: AsyncClient, auth_headers, account):
        tx = (await async_client.post("/api/v1/transactions/", headers=auth_headers, json={
            "account_id": account["id"], "amount": 100, "type": "expense",
            "transaction_date": "2026-06-01",
        })).json()

        response = await async_client.delete(f"/api/v1/transactions/{tx['id']}", headers=auth_headers)
        assert response.status_code == 204

        acc_resp = await async_client.get(f"/api/v1/accounts/{account['id']}", headers=auth_headers)
        assert float(acc_resp.json()["balance"]) == 1000.0


class TestTransfer:
    async def test_transfer_between_accounts(self, async_client: AsyncClient, auth_headers):
        from_acc = (await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Origen", "type": "cash", "balance": 500,
        })).json()
        to_acc = (await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Destino", "type": "cash", "balance": 100,
        })).json()

        response = await async_client.post("/api/v1/transactions/transfer", headers=auth_headers, json={
            "from_account_id": from_acc["id"],
            "to_account_id": to_acc["id"],
            "amount": 200,
            "description": "Transferencia",
            "transaction_date": "2026-06-20",
        })
        assert response.status_code == 201
        data = response.json()
        assert "from_transaction" in data
        assert "to_transaction" in data

        from_resp = await async_client.get(f"/api/v1/accounts/{from_acc['id']}", headers=auth_headers)
        assert float(from_resp.json()["balance"]) == 300.0

        to_resp = await async_client.get(f"/api/v1/accounts/{to_acc['id']}", headers=auth_headers)
        assert float(to_resp.json()["balance"]) == 300.0

    async def test_transfer_insufficient_balance(self, async_client: AsyncClient, auth_headers):
        from_acc = (await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Pobre", "type": "cash", "balance": 10,
        })).json()
        to_acc = (await async_client.post("/api/v1/accounts/", headers=auth_headers, json={
            "name": "Rico", "type": "cash", "balance": 0,
        })).json()

        response = await async_client.post("/api/v1/transactions/transfer", headers=auth_headers, json={
            "from_account_id": from_acc["id"],
            "to_account_id": to_acc["id"],
            "amount": 100,
            "transaction_date": "2026-06-20",
        })
        assert response.status_code == 400
        assert "insuficiente" in response.json()["detail"]

    async def test_transfer_same_account(self, async_client: AsyncClient, auth_headers, account):
        response = await async_client.post("/api/v1/transactions/transfer", headers=auth_headers, json={
            "from_account_id": account["id"],
            "to_account_id": account["id"],
            "amount": 50,
            "transaction_date": "2026-06-20",
        })
        assert response.status_code == 400
        assert "distintas" in response.json()["detail"]

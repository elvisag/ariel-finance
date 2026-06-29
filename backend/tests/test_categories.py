import pytest
from httpx import AsyncClient


class TestListCategories:
    async def test_empty(self, async_client: AsyncClient, auth_headers):
        response = await async_client.get("/api/v1/categories/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    async def test_includes_global_and_own(self, async_client: AsyncClient, auth_headers, db_session):
        from app.models.category import Category
        global_cat = Category(name="Global", type="expense", user_id=None)
        db_session.add(global_cat)
        await db_session.flush()

        own = (await async_client.post("/api/v1/categories/", headers=auth_headers, json={
            "name": "Propia", "type": "income", "icon": "cash", "color": "#10b981",
        })).json()

        response = await async_client.get("/api/v1/categories/", headers=auth_headers)
        data = response.json()
        assert len(data) == 2
        names = {c["name"] for c in data}
        assert names == {"Global", "Propia"}


class TestCreateCategory:
    async def test_success(self, async_client: AsyncClient, auth_headers):
        response = await async_client.post("/api/v1/categories/", headers=auth_headers, json={
            "name": "Comida", "type": "expense", "icon": "fast-food", "color": "#ef4444",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Comida"
        assert data["type"] == "expense"

    async def test_minimal(self, async_client: AsyncClient, auth_headers):
        response = await async_client.post("/api/v1/categories/", headers=auth_headers, json={
            "name": "Mínima", "type": "income",
        })
        assert response.status_code == 201


class TestDeleteCategory:
    async def test_success(self, async_client: AsyncClient, auth_headers):
        created = (await async_client.post("/api/v1/categories/", headers=auth_headers, json={
            "name": "A eliminar", "type": "expense",
        })).json()

        response = await async_client.delete(f"/api/v1/categories/{created['id']}", headers=auth_headers)
        assert response.status_code == 204

    async def test_cannot_delete_global(self, async_client: AsyncClient, auth_headers, db_session):
        from app.models.category import Category
        cat = Category(name="Global", type="expense", user_id=None)
        db_session.add(cat)
        await db_session.flush()

        response = await async_client.delete(f"/api/v1/categories/{cat.id}", headers=auth_headers)
        assert response.status_code == 404

    async def test_other_users_category(self, async_client: AsyncClient, auth_headers, db_session, user_data):
        from app.core.security import hash_password, create_access_token
        from app.models.user import User
        other = User(email="other2@test.com", name="Other", password_hash=hash_password("Pass123!"))
        db_session.add(other)
        await db_session.flush()

        own = (await async_client.post("/api/v1/categories/", headers=auth_headers, json={
            "name": "Mía", "type": "expense",
        })).json()

        other_token = create_access_token({"sub": str(other.id)})
        response = await async_client.delete(
            f"/api/v1/categories/{own['id']}",
            headers={"Authorization": f"Bearer {other_token}"},
        )
        assert response.status_code == 404

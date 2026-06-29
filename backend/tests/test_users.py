from httpx import AsyncClient


class TestGetMe:
    async def test_success(self, async_client: AsyncClient, auth_headers, created_user):
        response = await async_client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == created_user.email
        assert data["name"] == created_user.name
        assert "password_hash" not in data

    async def test_requires_auth(self, async_client: AsyncClient):
        response = await async_client.get("/api/v1/users/me")
        assert response.status_code in (401, 403)

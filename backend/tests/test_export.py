class TestExportPDF:
    async def test_export_empty(self, async_client, auth_headers):
        resp = await async_client.get("/api/v1/export/transactions/pdf", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert len(resp.content) > 100

    async def test_export_with_data(self, async_client, auth_headers, created_user):
        acct_resp = await async_client.post(
            "/api/v1/accounts/",
            json={"name": "Test", "type": "cash", "currency": "USD"},
            headers=auth_headers,
        )
        acct_id = acct_resp.json()["id"]

        for _ in range(3):
            await async_client.post(
                "/api/v1/transactions/",
                json={
                    "account_id": acct_id,
                    "amount": "100.00",
                    "type": "expense",
                    "transaction_date": "2026-06-01",
                    "description": "Test tx",
                },
                headers=auth_headers,
            )

        resp = await async_client.get("/api/v1/export/transactions/pdf", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert len(resp.content) > 500

    async def test_export_requires_auth(self, async_client):
        resp = await async_client.get("/api/v1/export/transactions/pdf")
        assert resp.status_code == 403

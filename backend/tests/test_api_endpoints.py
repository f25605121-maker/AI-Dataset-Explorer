import pytest
import httpx
from backend.app.main import app
from backend.app.db.init_db import init_db


@pytest.mark.asyncio
async def test_api_v1_endpoints():
    await init_db()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Root health
        root_resp = await client.get("/")
        assert root_resp.status_code == 200
        assert root_resp.json()["status"] == "online"

        # 2. Problem analysis
        prob_resp = await client.post(
            "/api/v1/problem/analyze",
            json={"query": "Nuclei segmentation in microscopy with 12GB GPU"},
        )
        assert prob_resp.status_code == 200
        prob_data = prob_resp.json()
        assert "Microscopy" in prob_data["modalities"]
        assert prob_data["compute_constraints"]["gpu_memory_gb"] == 12.0

        # 3. Master recommend endpoint
        rec_resp = await client.post(
            "/api/v1/recommend",
            json={"query": "Nuclei segmentation in microscopy with 12GB GPU"},
        )
        assert rec_resp.status_code == 200
        rec_data = rec_resp.json()
        assert len(rec_data["datasets"]) > 0
        assert len(rec_data["models"]) > 0
        assert len(rec_data["papers"]) > 0
        # Score breakdown check
        assert rec_data["datasets"][0]["score_breakdown"]["semantic"] > 0
        # Hard constraint check: top model must fit within 12GB
        if rec_data["models"][0]["min_vram_gb"]:
            assert rec_data["models"][0]["min_vram_gb"] <= 12.0

        # 4. Search datasets
        ds_resp = await client.post(
            "/api/v1/search/datasets",
            json={"query": "ISIC skin lesion"},
        )
        assert ds_resp.status_code == 200
        assert len(ds_resp.json()) > 0

        # 5. User feedback
        fb_resp = await client.post(
            "/api/v1/feedback",
            json={
                "resource_id": rec_data["datasets"][0]["id"],
                "resource_type": "dataset",
                "action": "thumbs_up",
                "comment": "Accurate recommendation for nuclei",
            },
        )
        assert fb_resp.status_code == 200
        assert fb_resp.json()["success"] is True

        # 6. Admin health
        admin_resp = await client.get("/api/v1/admin/health")
        assert admin_resp.status_code == 200
        health_data = admin_resp.json()
        assert health_data["status"] == "healthy"
        assert health_data["counts"]["datasets"] >= 8

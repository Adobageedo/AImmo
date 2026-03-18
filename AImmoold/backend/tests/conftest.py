import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Client de test FastAPI"""
    return TestClient(app)


@pytest.fixture
def mock_supabase_url():
    """URL Supabase pour tests"""
    return "http://localhost:54321"


@pytest.fixture
def test_organization_id():
    """UUID d'organisation pour tests"""
    return "123e4567-e89b-12d3-a456-426614174000"


@pytest.fixture
def test_user_id():
    """UUID d'utilisateur pour tests"""
    return "987fcdeb-51a2-43d7-8f9e-123456789abc"

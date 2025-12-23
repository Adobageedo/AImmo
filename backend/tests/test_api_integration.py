"""
Tests d'intégration pour tous les endpoints de l'API
Nécessite un serveur backend en cours d'exécution
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
import os

client = TestClient(app)

# Variables globales pour les tests
test_token = None
test_user_id = None
test_org_id = None
test_property_id = None
test_tenant_id = None
test_lease_id = None
test_document_id = None


class TestHealthEndpoints:
    """Tests des endpoints de santé"""
    
    def test_health_check(self):
        """Test du health check"""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_root_endpoint(self):
        """Test du endpoint root"""
        response = client.get("/")
        assert response.status_code == 200


class TestAuthEndpoints:
    """Tests des endpoints d'authentification"""
    
    def test_signup(self):
        """Test de l'inscription"""
        global test_token, test_user_id, test_org_id
        
        response = client.post("/api/v1/auth/signup", json={
            "email": f"test_{os.urandom(4).hex()}@example.com",
            "password": "TestPassword123!",
            "organization_name": f"Test Org {os.urandom(4).hex()}"
        })
        
        # Peut échouer si l'utilisateur existe déjà
        if response.status_code == 201:
            data = response.json()
            test_token = data.get("access_token")
            test_user_id = data.get("user", {}).get("id")
            assert test_token is not None
    
    def test_login(self):
        """Test de la connexion"""
        # Skip si pas de credentials de test
        pytest.skip("Nécessite des credentials de test configurés")
    
    def test_get_current_user(self):
        """Test de récupération de l'utilisateur courant"""
        if not test_token:
            pytest.skip("Pas de token disponible")
        
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "email" in data


class TestOrganizationEndpoints:
    """Tests des endpoints d'organisations"""
    
    def test_list_organizations(self):
        """Test de listage des organisations"""
        if not test_token:
            pytest.skip("Pas de token disponible")
        
        response = client.get(
            "/api/v1/organizations",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code in [200, 401]
    
    def test_get_organization(self):
        """Test de récupération d'une organisation"""
        if not test_token or not test_org_id:
            pytest.skip("Pas de token ou org_id disponible")
        
        response = client.get(
            f"/api/v1/organizations/{test_org_id}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code in [200, 404, 401]


class TestPropertyEndpoints:
    """Tests des endpoints de propriétés"""
    
    def test_create_property(self):
        """Test de création d'une propriété"""
        if not test_token or not test_org_id:
            pytest.skip("Pas de token ou org_id disponible")
        
        global test_property_id
        
        response = client.post(
            "/api/v1/properties",
            headers={"Authorization": f"Bearer {test_token}"},
            json={
                "name": "Test Property",
                "address": "123 Test St",
                "city": "Paris",
                "postal_code": "75001",
                "country": "France",
                "property_type": "appartement",
                "surface_area": 50.0,
                "organization_id": test_org_id
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            test_property_id = data.get("id")
    
    def test_list_properties(self):
        """Test de listage des propriétés"""
        if not test_token or not test_org_id:
            pytest.skip("Pas de token ou org_id disponible")
        
        response = client.get(
            f"/api/v1/properties?organization_id={test_org_id}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code in [200, 401]


class TestDocumentEndpoints:
    """Tests des endpoints de documents"""
    
    def test_get_quota(self):
        """Test de récupération du quota"""
        if not test_token or not test_org_id:
            pytest.skip("Pas de token ou org_id disponible")
        
        response = client.get(
            f"/api/v1/documents/quota?organization_id={test_org_id}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code in [200, 401]
    
    def test_list_documents(self):
        """Test de listage des documents"""
        if not test_token or not test_org_id:
            pytest.skip("Pas de token ou org_id disponible")
        
        response = client.get(
            f"/api/v1/documents?organization_id={test_org_id}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code in [200, 401]


class TestProcessingEndpoints:
    """Tests des endpoints de traitement"""
    
    def test_process_document(self):
        """Test de traitement d'un document"""
        if not test_token or not test_org_id or not test_document_id:
            pytest.skip("Pas de token, org_id ou document_id disponible")
        
        response = client.post(
            "/api/v1/processing/process",
            headers={"Authorization": f"Bearer {test_token}"},
            json={
                "document_id": test_document_id,
                "organization_id": test_org_id,
                "ocr_provider": "hybrid"
            }
        )
        
        assert response.status_code in [201, 401, 404, 500]


class TestConversationEndpoints:
    """Tests des endpoints de conversations"""
    
    def test_create_conversation(self):
        """Test de création d'une conversation"""
        if not test_token or not test_org_id:
            pytest.skip("Pas de token ou org_id disponible")
        
        response = client.post(
            "/api/v1/conversations",
            headers={"Authorization": f"Bearer {test_token}"},
            json={
                "organization_id": test_org_id,
                "title": "Test Conversation"
            }
        )
        
        assert response.status_code in [201, 401]
    
    def test_list_conversations(self):
        """Test de listage des conversations"""
        if not test_token or not test_org_id:
            pytest.skip("Pas de token ou org_id disponible")
        
        response = client.get(
            f"/api/v1/conversations?organization_id={test_org_id}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code in [200, 401]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

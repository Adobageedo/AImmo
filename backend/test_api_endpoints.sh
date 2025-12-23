#!/bin/bash

# Script de test complet des endpoints API AImmo
# Usage: ./test_api_endpoints.sh [BASE_URL]

BASE_URL="${1:-http://localhost:8000/api/v1}"
TOKEN=""
USER_ID=""
ORG_ID=""
PROPERTY_ID=""
TENANT_ID=""
LEASE_ID=""
DOCUMENT_ID=""
PROCESSING_ID=""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚀 Test des Endpoints API AImmo"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Fonction pour afficher le résultat
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -e "${BLUE}Testing:${NC} $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $status_code"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAIL${NC} - Expected: $expected_status, Got: $status_code"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    echo ""
    
    echo "$body"
}

# ============================================
# 1. HEALTH CHECK
# ============================================
echo "📊 1. Health Check"
echo "==================="
result=$(test_endpoint "Health Check" "GET" "/health" "" "200")
echo ""

# ============================================
# 2. AUTHENTICATION
# ============================================
echo "🔐 2. Authentication"
echo "===================="

# Signup
echo "2.1 Signup"
SIGNUP_DATA='{
  "email": "test'$(date +%s)'@example.com",
  "password": "TestPassword123!",
  "organization_name": "Test Org '$(date +%s)'"
}'
result=$(test_endpoint "Signup" "POST" "/auth/signup" "$SIGNUP_DATA" "201")
TOKEN=$(echo "$result" | jq -r '.access_token // empty')
USER_ID=$(echo "$result" | jq -r '.user.id // empty')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get token from signup. Using test credentials...${NC}"
    
    # Login avec credentials existants
    echo "2.2 Login (fallback)"
    LOGIN_DATA='{
      "email": "test@example.com",
      "password": "password123"
    }'
    result=$(test_endpoint "Login" "POST" "/auth/login" "$LOGIN_DATA" "200")
    TOKEN=$(echo "$result" | jq -r '.access_token // empty')
    USER_ID=$(echo "$result" | jq -r '.user.id // empty')
fi

echo "Token: ${TOKEN:0:20}..."
echo "User ID: $USER_ID"
echo ""

# Get current user
echo "2.3 Get Current User"
result=$(test_endpoint "Get Me" "GET" "/auth/me" "" "200")
ORG_ID=$(echo "$result" | jq -r '.organizations[0].organizations.id // empty')
echo "Organization ID: $ORG_ID"
echo ""

# ============================================
# 3. ORGANIZATIONS
# ============================================
echo "🏢 3. Organizations"
echo "==================="

# List organizations
echo "3.1 List Organizations"
test_endpoint "List Orgs" "GET" "/organizations" "" "200"

if [ -n "$ORG_ID" ]; then
    # Get organization
    echo "3.2 Get Organization"
    test_endpoint "Get Org" "GET" "/organizations/$ORG_ID" "" "200"
    
    # Update organization
    echo "3.3 Update Organization"
    UPDATE_ORG_DATA='{
      "name": "Updated Test Org"
    }'
    test_endpoint "Update Org" "PUT" "/organizations/$ORG_ID" "$UPDATE_ORG_DATA" "200"
fi

# ============================================
# 4. PROPERTIES
# ============================================
echo "🏠 4. Properties"
echo "================"

if [ -n "$ORG_ID" ]; then
    # Create property
    echo "4.1 Create Property"
    PROPERTY_DATA='{
      "name": "Test Apartment",
      "address": "123 Test Street",
      "city": "Paris",
      "postal_code": "75001",
      "country": "France",
      "property_type": "appartement",
      "surface_area": 50.5,
      "organization_id": "'$ORG_ID'"
    }'
    result=$(test_endpoint "Create Property" "POST" "/properties" "$PROPERTY_DATA" "201")
    PROPERTY_ID=$(echo "$result" | jq -r '.id // empty')
    echo "Property ID: $PROPERTY_ID"
    echo ""
    
    # List properties
    echo "4.2 List Properties"
    test_endpoint "List Properties" "GET" "/properties?organization_id=$ORG_ID" "" "200"
    
    if [ -n "$PROPERTY_ID" ]; then
        # Get property
        echo "4.3 Get Property"
        test_endpoint "Get Property" "GET" "/properties/$PROPERTY_ID?organization_id=$ORG_ID" "" "200"
        
        # Update property
        echo "4.4 Update Property"
        UPDATE_PROPERTY_DATA='{
          "name": "Updated Test Apartment",
          "surface_area": 55.0
        }'
        test_endpoint "Update Property" "PUT" "/properties/$PROPERTY_ID?organization_id=$ORG_ID" "$UPDATE_PROPERTY_DATA" "200"
    fi
fi

# ============================================
# 5. TENANTS (si endpoints existent)
# ============================================
echo "👥 5. Tenants"
echo "============="

if [ -n "$ORG_ID" ]; then
    # Create tenant
    echo "5.1 Create Tenant"
    TENANT_DATA='{
      "name": "John Doe",
      "tenant_type": "particulier",
      "email": "john.doe@example.com",
      "phone": "0123456789",
      "organization_id": "'$ORG_ID'"
    }'
    result=$(test_endpoint "Create Tenant" "POST" "/tenants" "$TENANT_DATA" "201")
    TENANT_ID=$(echo "$result" | jq -r '.id // empty')
    echo "Tenant ID: $TENANT_ID"
    echo ""
fi

# ============================================
# 6. LEASES (si endpoints existent)
# ============================================
echo "📄 6. Leases"
echo "============"

if [ -n "$ORG_ID" ] && [ -n "$PROPERTY_ID" ] && [ -n "$TENANT_ID" ]; then
    # Create lease
    echo "6.1 Create Lease"
    LEASE_DATA='{
      "property_id": "'$PROPERTY_ID'",
      "tenant_id": "'$TENANT_ID'",
      "organization_id": "'$ORG_ID'",
      "start_date": "2024-01-01",
      "monthly_rent": 1200.00,
      "charges": 150.00,
      "deposit": 2400.00
    }'
    result=$(test_endpoint "Create Lease" "POST" "/leases" "$LEASE_DATA" "201")
    LEASE_ID=$(echo "$result" | jq -r '.id // empty')
    echo "Lease ID: $LEASE_ID"
    echo ""
fi

# ============================================
# 7. DOCUMENTS
# ============================================
echo "📁 7. Documents"
echo "==============="

if [ -n "$ORG_ID" ]; then
    # Get quota
    echo "7.1 Get Storage Quota"
    test_endpoint "Get Quota" "GET" "/documents/quota?organization_id=$ORG_ID" "" "200"
    
    # List documents
    echo "7.2 List Documents"
    test_endpoint "List Docs" "GET" "/documents?organization_id=$ORG_ID" "" "200"
    
    # Upload document (nécessite un fichier)
    echo "7.3 Upload Document (skip - nécessite fichier)"
    echo -e "${YELLOW}⚠️  Skipped - requires file upload${NC}"
    echo ""
fi

# ============================================
# 8. PROCESSING (OCR & Parsing)
# ============================================
echo "🔍 8. Document Processing"
echo "========================="

if [ -n "$DOCUMENT_ID" ] && [ -n "$ORG_ID" ]; then
    # Process document
    echo "8.1 Process Document"
    PROCESS_DATA='{
      "document_id": "'$DOCUMENT_ID'",
      "organization_id": "'$ORG_ID'",
      "ocr_provider": "hybrid",
      "force_reprocess": false
    }'
    result=$(test_endpoint "Process Doc" "POST" "/processing/process" "$PROCESS_DATA" "201")
    PROCESSING_ID=$(echo "$result" | jq -r '.id // empty')
    echo "Processing ID: $PROCESSING_ID"
    echo ""
    
    if [ -n "$PROCESSING_ID" ]; then
        # Get processing result
        echo "8.2 Get Processing Result"
        test_endpoint "Get Processing" "GET" "/processing/$PROCESSING_ID" "" "200"
    fi
else
    echo -e "${YELLOW}⚠️  Skipped - no document ID available${NC}"
    echo ""
fi

# ============================================
# 9. CONVERSATIONS (RAG)
# ============================================
echo "💬 9. Conversations"
echo "==================="

if [ -n "$ORG_ID" ]; then
    # Create conversation
    echo "9.1 Create Conversation"
    CONV_DATA='{
      "organization_id": "'$ORG_ID'",
      "title": "Test Conversation"
    }'
    result=$(test_endpoint "Create Conv" "POST" "/conversations" "$CONV_DATA" "201")
    CONV_ID=$(echo "$result" | jq -r '.id // empty')
    echo "Conversation ID: $CONV_ID"
    echo ""
    
    # List conversations
    echo "9.2 List Conversations"
    test_endpoint "List Convs" "GET" "/conversations?organization_id=$ORG_ID" "" "200"
fi

# ============================================
# 10. CLEANUP (optionnel)
# ============================================
echo "🧹 10. Cleanup"
echo "=============="

if [ -n "$PROPERTY_ID" ] && [ -n "$ORG_ID" ]; then
    echo "10.1 Delete Property (optionnel)"
    echo -e "${YELLOW}⚠️  Skipped - keeping test data${NC}"
    # test_endpoint "Delete Property" "DELETE" "/properties/$PROPERTY_ID?organization_id=$ORG_ID" "" "204"
fi

echo ""
echo "======================================"
echo "✅ Tests terminés!"
echo "======================================"
echo ""
echo "Variables capturées:"
echo "- TOKEN: ${TOKEN:0:30}..."
echo "- USER_ID: $USER_ID"
echo "- ORG_ID: $ORG_ID"
echo "- PROPERTY_ID: $PROPERTY_ID"
echo "- TENANT_ID: $TENANT_ID"
echo "- LEASE_ID: $LEASE_ID"
echo ""
echo "Pour tester manuellement:"
echo "export TOKEN='$TOKEN'"
echo "export ORG_ID='$ORG_ID'"
echo ""
echo "Exemple:"
echo "curl -H \"Authorization: Bearer \$TOKEN\" $BASE_URL/properties?organization_id=\$ORG_ID"

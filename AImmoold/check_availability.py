
import sys
import json
import time
import random
import string
from urllib import request, parse, error
from datetime import datetime

# Configuration
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000/api/v1"

# Colors
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
YELLOW = "\033[93m"

def log(message, status="INFO"):
    text = ""
    if status == "PASS":
        text = f"[{GREEN}PASS{RESET}] {message}"
    elif status == "FAIL":
        text = f"[{RED}FAIL{RESET}] {message}"
    elif status == "WARN":
        text = f"[{YELLOW}WARN{RESET}] {message}"
    else:
        text = f"[INFO] {message}"
    
    print(text)
    
    # Strip colors for log file
    clean_text = text.replace(GREEN, "").replace(RED, "").replace(YELLOW, "").replace(RESET, "")
    try:
        with open("availability.log", "a", encoding="utf-8") as f:
            f.write(clean_text + "\n")
    except Exception as e:
        print(f"Failed to write to log: {e}")

def check_url(url, description):
    try:
        with request.urlopen(url) as response:
            if response.status == 200:
                log(f"{description} is reachable ({url})", "PASS")
                return True
            else:
                log(f"{description} returned status {response.status}", "FAIL")
                return False
    except error.URLError as e:
        log(f"{description} is unreachable ({url}): {e}", "FAIL")
        return False

def api_request(method, endpoint, data=None, token=None):
    url = f"{BACKEND_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if data:
        data_bytes = json.dumps(data).encode("utf-8")
    else:
        data_bytes = None

    req = request.Request(url, data=data_bytes, headers=headers, method=method)
    
    try:
        with request.urlopen(req) as response:
            resp_body = response.read().decode("utf-8")
            return response.status, json.loads(resp_body)
    except error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        log(f"DEBUG - Request to {endpoint} failed: {e.code}", "WARN")
        if data:
             log(f"DEBUG - Payload: {json.dumps(data)}", "WARN")
        log(f"DEBUG - Response: {resp_body}", "WARN")
        try:
             return e.code, json.loads(resp_body)
        except:
             return e.code, {"detail": str(e), "body": resp_body}
    except error.URLError as e:
        return 0, {"detail": str(e)}

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def run_tests():
    # Clear log file
    with open("availability.log", "w", encoding="utf-8") as f:
        f.write("Starting Availability Checks\n")
        
    print(f"Starting Availability Checks")
    print("===============================")
    
    # 1. Check Frontend
    print("\nFrontend Checks")
    check_url(FRONTEND_URL, "Frontend Root")
    check_url(f"{FRONTEND_URL}/auth/login", "Login Page")
    
    # 2. Check Backend Health
    print("\nBackend Checks")
    status_code, data = api_request("GET", "/health")
    if status_code == 200 and data.get("status") == "healthy":
        log("Backend Health Check", "PASS")
    else:
        log(f"Backend Health Check Failed: {status_code} - {data}", "FAIL")
        return

    # 3. Authentication
    print("\nAuthentication & Core Flow")
    
    # 3. Authentication
    print("\nAuthentication & Core Flow")
    
    # Create Test User (Verified)
    status_code, setup_data = api_request("POST", "/auth/test-setup", {})
    
    if status_code == 200:
        log("Test User Creation", "PASS")
        email = setup_data.get("email")
        password = setup_data.get("password")
        org_id = setup_data.get("organization_id") # Note: we get org_id directly
    else:
        log(f"Test User Creation Failed: {status_code}", "FAIL")
        # Try fallback login just in case
        email = "test@example.com"
        password = "password123"

    # Login
    payload = {"email": email, "password": password}
    status_code, auth_data = api_request("POST", "/auth/login", payload)
    
    if status_code == 200:
        log("Login", "PASS")
        token = auth_data.get("access_token")
        user_id = auth_data.get("user", {}).get("id")
    else:
        log(f"Login Failed: {status_code}", "FAIL")
        return

    if not token:
        log("No access token obtained. Aborting.", "FAIL")
        return

    # Get Organization (Verify /me works)
    status_code, me_data = api_request("GET", "/auth/me", token=token)
    if status_code == 200:
        orgs = me_data.get("organizations", [])
        if orgs:
            # Prefer the one from /me if available, or stay with setup data
            org_id = orgs[0].get("organization_id")
            log(f"Organization Retrieval (ID: {org_id})", "PASS")
        else:
            log("No organizations found for user", "FAIL")
            # If we have org_id from setup, we might continue, but /me should return it
            if not org_id:
                return
    else:
        log(f"Get Me Failed: {status_code}", "FAIL")
        return

    # 4. Properties
    print("\nProperties Check")
    property_payload = {
        "name": f"Test Property {generate_random_string()}",
        "address": "123 Test St",
        "city": "Test City",
        "postal_code": "12345",
        "country": "Test Country",
        "property_type": "appartement",
        "surface_area": 50,
        "organization_id": org_id
    }
    
    status_code, prop_data = api_request("POST", "/properties/", property_payload, token)
    if status_code == 201:
        log("Create Property", "PASS")
        property_id = prop_data.get("id")
    else:
        log(f"Create Property Failed: {status_code} - {prop_data}", "FAIL")
        property_id = None

    if property_id:
        status_code, _ = api_request("GET", f"/properties/{property_id}", token=token)
        if status_code == 200:
             log("Get Property", "PASS")
        else:
             log("Get Property Failed", "FAIL")

    # 5. Tenants
    print("\nTenants Check")
    tenant_payload = {
        "name": f"Tenant {generate_random_string()}",
        "tenant_type": "individual",
        "email": f"tenant_{generate_random_string()}@example.com",
        "organization_id": org_id
    }
    
    status_code, tenant_data = api_request("POST", "/tenants/", tenant_payload, token)
    if status_code == 201:
        log("Create Tenant", "PASS")
        tenant_id = tenant_data.get("id")
    else:
        log(f"Create Tenant Failed: {status_code} - {tenant_data}", "FAIL")
        tenant_id = None

    if tenant_id:
        status_code, _ = api_request("GET", f"/tenants/{tenant_id}", token=token)
        if status_code == 200:
             log("Get Tenant", "PASS")
        else:
             log("Get Tenant Failed", "FAIL")

    # 6. Leases
    print("\nLeases Check")
    if property_id and tenant_id:
        lease_payload = {
            "property_id": property_id,
            "tenant_id": tenant_id,
            "organization_id": org_id,
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "monthly_rent": 1000,
            "charges": 100
        }
        
        status_code, lease_data = api_request("POST", "/leases/", lease_payload, token)
        if status_code == 201:
            log("Create Lease", "PASS")
            lease_id = lease_data.get("id")
            
            # Check payments endpoint mock
            status_code, payments = api_request("GET", f"/leases/{lease_id}/payments", token=token)
            if status_code == 200 and isinstance(payments, list):
                 log("Get Lease Payments (Mock)", "PASS")
            else:
                 log(f"Get Lease Payments Failed: {status_code}", "FAIL")

        else:
            log(f"Create Lease Failed: {status_code} - {lease_data}", "FAIL")
    else:
        log("Skipping Lease check due to missing Property or Tenant", "WARN")

    print("\nVerification Complete")

if __name__ == "__main__":
    run_tests()

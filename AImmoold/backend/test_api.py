
import requests
import json

def test_api():
    url = "http://localhost:8000/api/v1/health"
    try:
        r = requests.get(url, timeout=5)
        print(f"Health check status: {r.status_code}")
        print(f"Health check body: {r.text}")
    except Exception as e:
        print(f"Health check failed: {e}")

if __name__ == "__main__":
    test_api()

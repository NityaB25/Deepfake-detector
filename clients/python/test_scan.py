import requests
import sys

BASE = "http://localhost:4000"

def main():
    s = requests.Session()

    # 1) run a scan (guest)
    payload = {
        "fileUrl": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        "fileType": "image"
    }
    r = s.post(f"{BASE}/api/scan", json=payload)
    if r.status_code != 200:
        print("scan failed:", r.status_code, r.text)
        sys.exit(1)
    scan = r.json()
    print("scan response:", scan)

    scan_id = scan["scanId"]

    # 2) fetch that scan's details (uses the same session/cookies)
    r = s.get(f"{BASE}/api/scan/{scan_id}")
    if r.status_code != 200:
        print("scan details failed:", r.status_code, r.text)
        sys.exit(1)
    print("scan details:", r.json())

    # 3) list my scans (guest session)
    r = s.get(f"{BASE}/api/scans")
    if r.status_code != 200:
        print("list scans failed:", r.status_code, r.text)
        sys.exit(1)
    print("list scans:", r.json())

if __name__ == "__main__":
    main()

"""
Export Francisco call metrics from Vapi
Fetches calls for a specific date range and exports to CSV
"""
import json
import subprocess
import csv
from datetime import datetime

VAPI_API_KEY = "4c259ada-39cd-4cc3-934e-1340c15cd9de"
ASSISTANT_ID = "192f7f1c-bf83-48e3-95bf-e691430d6379"  # Francisco

# Date range (ISO 8601 format with timezone)
# 2026-02-22 00:00:00 to 2026-02-24 23:59:59 (Atlantic/Azores = UTC-1)
START_DATE = "2026-02-22T00:00:00-01:00"
END_DATE = "2026-02-24T23:59:59-01:00"

print(f"Fetching calls for Francisco from {START_DATE} to {END_DATE}...")

# Build API request
# Using List Calls endpoint with filters
url = "https://api.vapi.ai/call"
params = [
    f"assistantId={ASSISTANT_ID}",
    f"createdAtGt={START_DATE}",
    f"createdAtLt={END_DATE}",
    "limit=100"  # Max per request
]
full_url = f"{url}?{'&'.join(params)}"

# Fetch calls via curl
result = subprocess.run(
    [
        "curl", "-s",
        "-X", "GET",
        full_url,
        "-H", f"Authorization: Bearer {VAPI_API_KEY}",
    ],
    capture_output=True,
    text=True,
    encoding="utf-8",
    timeout=30
)

if result.returncode != 0:
    print(f"Error: {result.stderr}")
    exit(1)

try:
    calls = json.loads(result.stdout)

    if isinstance(calls, dict) and "error" in calls:
        print(f"API Error: {calls}")
        exit(1)

    print(f"\nFound {len(calls)} calls")

    # Export to CSV
    output_file = f"francisco-metrics-{datetime.now().strftime('%Y%m%d-%H%M%S')}.csv"

    if len(calls) == 0:
        print("No calls found in this date range.")
        exit(0)

    # Define CSV fields (adjust based on what's available in response)
    fieldnames = [
        "id",
        "createdAt",
        "updatedAt",
        "type",
        "status",
        "endedReason",
        "cost",
        "costBreakdown",
        "duration",
        "transcript",
        "messages",
        "phoneNumber",
        "customer"
    ]

    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()

        for call in calls:
            # Flatten nested data for CSV
            row = {
                "id": call.get("id"),
                "createdAt": call.get("createdAt"),
                "updatedAt": call.get("updatedAt"),
                "type": call.get("type"),
                "status": call.get("status"),
                "endedReason": call.get("endedReason"),
                "cost": call.get("cost"),
                "costBreakdown": json.dumps(call.get("costBreakdown", {})) if call.get("costBreakdown") else "",
                "duration": call.get("duration"),
                "transcript": call.get("transcript", ""),
                "messages": json.dumps(call.get("messages", [])) if call.get("messages") else "",
                "phoneNumber": call.get("phoneNumber", {}).get("number", "") if call.get("phoneNumber") else "",
                "customer": json.dumps(call.get("customer", {})) if call.get("customer") else ""
            }
            writer.writerow(row)

    print(f"\n✓ Exported to: {output_file}")

    # Print summary statistics
    total_duration = sum(call.get("duration", 0) for call in calls if call.get("duration"))
    total_cost = sum(call.get("cost", 0) for call in calls if call.get("cost"))

    print(f"\n--- Summary ---")
    print(f"Total calls: {len(calls)}")
    print(f"Total duration: {total_duration:.0f} seconds ({total_duration/60:.1f} minutes)")
    print(f"Total cost: ${total_cost:.2f}")

    # Count by status
    statuses = {}
    for call in calls:
        status = call.get("status", "unknown")
        statuses[status] = statuses.get(status, 0) + 1

    print(f"\nCalls by status:")
    for status, count in statuses.items():
        print(f"  {status}: {count}")

except json.JSONDecodeError as e:
    print(f"Failed to parse JSON response: {e}")
    print(f"Response: {result.stdout[:500]}")
    exit(1)
except Exception as e:
    print(f"Unexpected error: {e}")
    exit(1)

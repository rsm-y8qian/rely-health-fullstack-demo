"""Simulated real-time EHR feed.

Generates FHIR-ish discharge events, normalizes them to our internal schema,
and posts them to the Node backend's /api/ingest endpoint on an interval —
mimicking an interoperability layer ingesting a third-party data feed.
"""

import random
import time

import httpx

INGEST_URL = "http://localhost:4000/api/ingest"

FIRST = ["Liam", "Olivia", "Noah", "Emma", "Ava", "Mason", "Sophia", "Lucas", "Mia", "Ethan"]
LAST = ["Nguyen", "Garcia", "Smith", "Patel", "Kim", "Johnson", "Lopez", "Brown", "Davis", "Khan"]
DEPARTMENTS = ["Cardiology", "Oncology"]


def make_fhir_event() -> dict:
    """A simplified FHIR Encounter resource as an EHR might emit on discharge."""
    return {
        "resourceType": "Encounter",
        "status": "finished",
        "class": {"code": "IMP", "display": "inpatient"},
        "subject": {"display": f"{random.choice(FIRST)} {random.choice(LAST)}"},
        "serviceProvider": {"display": random.choice(DEPARTMENTS)},
        "hospitalization": {"dischargeDisposition": {"text": "home"}},
    }


def normalize(evt: dict) -> dict:
    """Map the messy third-party FHIR shape onto our internal event schema."""
    return {
        "patientName": evt["subject"]["display"],
        "department": evt["serviceProvider"]["display"],
        "eventType": "discharge",
    }


def run(count: int = 8, delay: float = 2.0) -> None:
    with httpx.Client(timeout=5.0) as client:
        for i in range(count):
            normalized = normalize(make_fhir_event())
            try:
                r = client.post(INGEST_URL, json=normalized)
                status = r.status_code
            except httpx.HTTPError as e:
                status = f"ERROR {e}"
            print(f"[{i + 1}/{count}] {normalized['patientName']} ({normalized['department']}) -> {status}")
            time.sleep(delay)


if __name__ == "__main__":
    run()

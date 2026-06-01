"""End-to-end smoke test against the FastAPI app using TestClient.

Exercises: register, login, create/list/update/delete tasks.
Run from the backend/ directory:  python verify.py
"""
import os
import sys
import tempfile

# Use a fresh temp DB so the test is isolated
tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
tmp_db.close()
os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db.name}"
os.environ["SECRET_KEY"] = "verify-test-secret"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
failed = 0


def check(label, cond, extra=""):
    global failed
    status = "PASS" if cond else "FAIL"
    if not cond:
        failed += 1
    print(f"[{status}] {label} {extra}")


# ---------- Health ----------
r = client.get("/health")
check("GET /health -> 200", r.status_code == 200, r.text)

# ---------- Register ----------
r = client.post("/auth/register", json={"email": "alice@example.com", "password": "secret123"})
check("POST /auth/register -> 201", r.status_code == 201, r.text)
token = r.json().get("access_token")
check("register returns access_token", bool(token))

# Duplicate register should fail
r = client.post("/auth/register", json={"email": "alice@example.com", "password": "secret123"})
check("Duplicate register -> 400", r.status_code == 400)

# ---------- Login ----------
r = client.post("/auth/login", json={"email": "alice@example.com", "password": "secret123"})
check("POST /auth/login -> 200", r.status_code == 200, r.text)
token = r.json()["access_token"]

# Bad credentials
r = client.post("/auth/login", json={"email": "alice@example.com", "password": "wrong"})
check("Bad login -> 401", r.status_code == 401)

headers = {"Authorization": f"Bearer {token}"}

# ---------- Unauthenticated task call ----------
r = client.get("/tasks")
check("GET /tasks without token -> 401", r.status_code == 401)

# ---------- Create tasks ----------
r = client.post("/tasks", json={"title": "Write README", "stage": "todo"}, headers=headers)
check("POST /tasks (todo) -> 201", r.status_code == 201, r.text)
task1_id = r.json()["id"]

r = client.post(
    "/tasks",
    json={"title": "Implement backend", "description": "FastAPI + JWT", "stage": "in_progress"},
    headers=headers,
)
check("POST /tasks (in_progress) -> 201", r.status_code == 201, r.text)
task2_id = r.json()["id"]

r = client.post("/tasks", json={"title": "Set up repo", "stage": "done"}, headers=headers)
check("POST /tasks (done) -> 201", r.status_code == 201, r.text)

# ---------- List ----------
r = client.get("/tasks", headers=headers)
check("GET /tasks -> 200", r.status_code == 200)
check("List returns 3 tasks", len(r.json()) == 3, f"got {len(r.json())}")

# ---------- Filter by stage ----------
r = client.get("/tasks?stage=done", headers=headers)
check("GET /tasks?stage=done filters", r.status_code == 200 and len(r.json()) == 1)

# ---------- Update (move stage) ----------
r = client.patch(f"/tasks/{task1_id}", json={"stage": "in_progress"}, headers=headers)
check("PATCH /tasks/:id stage", r.status_code == 200 and r.json()["stage"] == "in_progress")

# ---------- Update (title) ----------
r = client.patch(f"/tasks/{task1_id}", json={"title": "Write README (v2)"}, headers=headers)
check("PATCH /tasks/:id title", r.status_code == 200 and r.json()["title"] == "Write README (v2)")

# ---------- Get one ----------
r = client.get(f"/tasks/{task1_id}", headers=headers)
check("GET /tasks/:id -> 200", r.status_code == 200)

# ---------- Cross-user isolation ----------
r = client.post("/auth/register", json={"email": "bob@example.com", "password": "secret123"})
bob_token = r.json()["access_token"]
bob_headers = {"Authorization": f"Bearer {bob_token}"}
r = client.get("/tasks", headers=bob_headers)
check("Bob sees no tasks (isolation)", r.status_code == 200 and len(r.json()) == 0)
r = client.get(f"/tasks/{task1_id}", headers=bob_headers)
check("Bob can't read Alice's task -> 404", r.status_code == 404)

# ---------- Delete ----------
r = client.delete(f"/tasks/{task2_id}", headers=headers)
check("DELETE /tasks/:id -> 204", r.status_code == 204)
r = client.get(f"/tasks/{task2_id}", headers=headers)
check("Deleted task is gone -> 404", r.status_code == 404)

# Cleanup
try:
    os.unlink(tmp_db.name)
except OSError:
    pass

print()
print(f"Failures: {failed}")
sys.exit(1 if failed else 0)

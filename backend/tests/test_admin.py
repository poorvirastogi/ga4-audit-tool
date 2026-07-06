ADMIN_HEADERS = {"x-admin-key": "test-admin-key"}
BAD_HEADERS = {"x-admin-key": "wrong-key"}


def test_admin_endpoint_requires_key(client):
    resp = client.get("/api/admin/questions")
    assert resp.status_code == 401


def test_admin_endpoint_rejects_wrong_key(client):
    resp = client.get("/api/admin/questions", headers=BAD_HEADERS)
    assert resp.status_code == 401


def test_admin_endpoint_accepts_correct_key(client):
    resp = client.get("/api/admin/questions", headers=ADMIN_HEADERS)
    assert resp.status_code == 200
    assert len(resp.json()) >= 18


def test_admin_create_question(client):
    new_q = {
        "id": "test_q_temp",
        "text": "Is this a test question?",
        "category": "Basic Setup",
        "severity": "Warning",
        "weight": 5,
        "why": "Testing why field.",
        "fix": "Testing fix field.",
        "order_index": 99,
    }
    resp = client.post("/api/admin/questions", json=new_q, headers=ADMIN_HEADERS)
    assert resp.status_code == 200
    assert resp.json()["id"] == "test_q_temp"


def test_admin_create_duplicate_id_fails(client):
    dup_q = {
        "id": "test_q_temp", "text": "Duplicate", "category": "Basic Setup",
        "severity": "Warning", "weight": 5, "why": "x", "fix": "x", "order_index": 99,
    }
    resp = client.post("/api/admin/questions", json=dup_q, headers=ADMIN_HEADERS)
    assert resp.status_code == 400


def test_admin_update_question(client):
    resp = client.put(
        "/api/admin/questions/test_q_temp",
        json={"weight": 8},
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 200
    assert resp.json()["weight"] == 8


def test_admin_update_nonexistent_question(client):
    resp = client.put(
        "/api/admin/questions/does_not_exist",
        json={"weight": 8},
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 404


def test_admin_delete_question(client):
    resp = client.delete("/api/admin/questions/test_q_temp", headers=ADMIN_HEADERS)
    assert resp.status_code == 200
    remaining = client.get("/api/admin/questions", headers=ADMIN_HEADERS).json()
    assert "test_q_temp" not in [q["id"] for q in remaining]


def test_admin_delete_nonexistent_question(client):
    resp = client.delete("/api/admin/questions/does_not_exist", headers=ADMIN_HEADERS)
    assert resp.status_code == 404

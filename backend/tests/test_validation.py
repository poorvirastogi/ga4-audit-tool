ADMIN_HEADERS = {"x-admin-key": "test-admin-key"}


def test_reject_negative_weight(client):
    bad_q = {
        "id": "bad_weight_q", "text": "Test", "category": "Basic Setup",
        "severity": "Warning", "weight": -5, "why": "x", "fix": "x", "order_index": 0,
    }
    resp = client.post("/api/admin/questions", json=bad_q, headers=ADMIN_HEADERS)
    assert resp.status_code == 422


def test_reject_excessive_weight(client):
    bad_q = {
        "id": "big_weight_q", "text": "Test", "category": "Basic Setup",
        "severity": "Warning", "weight": 500, "why": "x", "fix": "x", "order_index": 0,
    }
    resp = client.post("/api/admin/questions", json=bad_q, headers=ADMIN_HEADERS)
    assert resp.status_code == 422


def test_reject_blank_text(client):
    bad_q = {
        "id": "blank_text_q", "text": "   ", "category": "Basic Setup",
        "severity": "Warning", "weight": 5, "why": "x", "fix": "x", "order_index": 0,
    }
    resp = client.post("/api/admin/questions", json=bad_q, headers=ADMIN_HEADERS)
    assert resp.status_code == 422


def test_reject_invalid_id_characters(client):
    bad_q = {
        "id": "bad id with spaces!", "text": "Test", "category": "Basic Setup",
        "severity": "Warning", "weight": 5, "why": "x", "fix": "x", "order_index": 0,
    }
    resp = client.post("/api/admin/questions", json=bad_q, headers=ADMIN_HEADERS)
    assert resp.status_code == 422


def test_reject_negative_order_index(client):
    bad_q = {
        "id": "neg_order_q", "text": "Test", "category": "Basic Setup",
        "severity": "Warning", "weight": 5, "why": "x", "fix": "x", "order_index": -1,
    }
    resp = client.post("/api/admin/questions", json=bad_q, headers=ADMIN_HEADERS)
    assert resp.status_code == 422


def test_update_rejects_blank_text(client):
    resp = client.put(
        "/api/admin/questions/q1",
        json={"text": "   "},
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 422


def test_audit_rejects_too_many_answers(client):
    huge_answers = {f"fake_q_{i}": "Yes" for i in range(150)}
    resp = client.post("/api/audit", json={"answers": huge_answers})
    assert resp.status_code == 422


def test_valid_question_still_works(client):
    good_q = {
        "id": "valid_test_q", "text": "Is this valid?", "category": "Basic Setup",
        "severity": "Warning", "weight": 7, "why": "Testing.", "fix": "Testing.", "order_index": 5,
    }
    resp = client.post("/api/admin/questions", json=good_q, headers=ADMIN_HEADERS)
    assert resp.status_code == 200
    client.delete("/api/admin/questions/valid_test_q", headers=ADMIN_HEADERS)

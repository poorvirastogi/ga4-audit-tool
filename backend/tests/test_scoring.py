def test_get_questions_returns_18(client):
    resp = client.get("/api/questions")
    assert resp.status_code == 200
    assert len(resp.json()) == 18


def test_all_yes_scores_100(client):
    questions = client.get("/api/questions").json()
    answers = {q["id"]: "Yes" for q in questions}
    resp = client.post("/api/audit", json={"answers": answers})
    assert resp.status_code == 200
    data = resp.json()
    assert data["health_score"] == 100
    assert data["band"] == "Healthy"
    assert data["critical_count"] == 0
    assert data["warning_count"] == 0
    assert data["passed_count"] == 18


def test_all_no_scores_0(client):
    questions = client.get("/api/questions").json()
    answers = {q["id"]: "No" for q in questions}
    resp = client.post("/api/audit", json={"answers": answers})
    data = resp.json()
    assert data["health_score"] == 0
    assert data["band"] == "Critical"
    assert data["passed_count"] == 0


def test_partial_answers_score_half_weight(client):
    questions = client.get("/api/questions").json()
    answers = {q["id"]: "Partial" for q in questions}
    resp = client.post("/api/audit", json={"answers": answers})
    assert resp.json()["health_score"] == 50


def test_missing_answers_default_to_no(client):
    resp = client.post("/api/audit", json={"answers": {}})
    assert resp.status_code == 200
    assert resp.json()["health_score"] == 0


def test_audit_gets_saved_and_retrievable(client):
    questions = client.get("/api/questions").json()
    answers = {q["id"]: "Yes" for q in questions}
    submit_resp = client.post("/api/audit", json={"answers": answers})
    audit_id = submit_resp.json()["id"]

    list_resp = client.get("/api/audits")
    assert audit_id in [a["id"] for a in list_resp.json()]

    get_resp = client.get(f"/api/audits/{audit_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == audit_id


def test_get_nonexistent_audit_returns_404(client):
    resp = client.get("/api/audits/999999")
    assert resp.status_code == 404

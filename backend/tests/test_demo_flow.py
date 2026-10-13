from datetime import datetime

from app.core import clock


def _ids(client, coord):
    sid = client.get("/api/students", headers=coord).json()[0]["id"]
    items = {i["item_code"]: i for i in client.get("/api/inventory", headers=coord).json()}
    assets = {a["asset_tag"]: a for a in client.get("/api/assets", headers=coord).json()}
    return sid, items, assets


def _avail(client, coord):
    return {i["item_code"]: i["available_quantity"]
            for i in client.get("/api/inventory", headers=coord).json()}


def test_full_demo_scenario(client, coord, student):
    sid, items, assets = _ids(client, coord)

    r = client.post("/api/issues", headers=coord, json={
        "student_id": sid, "item_id": items["DEVBOARD"]["id"],
        "asset_id": assets["DB-01"]["id"], "quantity": 1, "purpose": "Lab practical"})
    assert r.status_code == 201, r.text
    issue = r.json()
    assert issue["due_date"].startswith("2026-10-16")
    r = client.post("/api/issues", headers=coord, json={
        "student_id": sid, "item_id": items["USBCABLE"]["id"], "quantity": 2,
        "issue_id": issue["id"]})
    assert r.status_code == 201, r.text

    s = client.get("/api/dashboard/summary", headers=coord).json()
    assert s["issued"] == 3 and s["pending_renewals"] == 0
    assert _avail(client, coord) == {"DEVBOARD": 9, "USBCABLE": 18}

    b = client.get("/api/me/borrowings", headers=student).json()
    assert len(b) == 1 and len(b[0]["items"]) == 2
    r = client.post("/api/renewals", headers=student, json={"issue_id": issue["id"]})
    assert r.status_code == 201
    rid = r.json()["id"]
    b = client.get("/api/me/borrowings", headers=student).json()
    assert b[0]["due_date"].startswith("2026-10-16")
    assert client.post("/api/renewals", headers=student, json={"issue_id": issue["id"]}).status_code == 409
    assert client.post(f"/api/renewals/{rid}/approve", headers=student).status_code == 403

    r = client.post(f"/api/renewals/{rid}/approve", headers=coord, json={"remarks": "OK"})
    assert r.status_code == 200 and r.json()["revised_due_date"].startswith("2026-10-31")
    b = client.get("/api/me/borrowings", headers=student).json()
    assert b[0]["due_date"].startswith("2026-10-31")

    cable_ii = next(x for x in b[0]["items"] if x["item_code"] == "USBCABLE")
    r = client.post("/api/returns", headers=coord, json={
        "issue_item_id": cable_ii["id"], "quantity_returned": 1, "condition": "usable"})
    assert r.status_code == 201 and r.json()["outstanding"] == 1
    assert _avail(client, coord)["USBCABLE"] == 19
    assert client.post("/api/returns", headers=coord, json={
        "issue_item_id": cable_ii["id"], "quantity_returned": 5, "condition": "usable"}).status_code == 400

    client.patch(f"/api/assets/{assets['DB-02']['id']}", headers=coord,
                 json={"condition": "damaged", "status": "damaged"})
    r = client.post("/api/issues", headers=coord, json={
        "student_id": sid, "item_id": items["DEVBOARD"]["id"], "asset_id": assets["DB-02"]["id"], "quantity": 1})
    assert r.status_code == 409
    r = client.post("/api/issues", headers=coord, json={
        "student_id": sid, "item_id": items["DEVBOARD"]["id"], "asset_id": assets["DB-01"]["id"], "quantity": 1})
    assert r.status_code == 409
    r = client.post("/api/issues", headers=coord, json={
        "student_id": sid, "item_id": items["USBCABLE"]["id"], "quantity": 100})
    assert r.status_code == 409

    board_ii = next(x for x in b[0]["items"] if x["item_code"] == "DEVBOARD")
    client.post("/api/returns", headers=coord, json={
        "issue_item_id": board_ii["id"], "quantity_returned": 1, "condition": "damaged"})
    assert _avail(client, coord)["DEVBOARD"] == 8

    actions = {a["action"] for a in client.get("/api/reports/audit", headers=coord).json()}
    assert {"LOGIN", "ISSUE_ITEM", "RENEWAL_REQUESTED", "RENEWAL_APPROVED", "RETURN_ITEM"} <= actions
    assert client.get("/api/reports/export?report=issues", headers=coord).text.startswith("issue_number")
    assert client.get(f"/api/issues/{issue['id']}/acknowledgement", headers=coord).status_code == 200


def test_rbac_and_overdue(client, coord, student):
    assert client.get("/api/inventory").status_code == 401
    assert client.get("/api/inventory", headers=student).status_code == 403
    assert client.get("/api/dashboard/summary", headers=student).status_code == 403
    assert client.post("/api/auth/login", json={"email": "x@y.z", "password": "bad"}).status_code == 401

    sid, items, assets = _ids(client, coord)
    client.post("/api/issues", headers=coord, json={
        "student_id": sid, "item_id": items["USBCABLE"]["id"], "quantity": 1})
    clock.set_now(datetime(2026, 10, 20, 9, 0, 0))
    d = client.get("/api/dashboard/overdue", headers=coord).json()
    assert len(d["overdue"]) == 1 and d["overdue"][0]["days_overdue"] == 4

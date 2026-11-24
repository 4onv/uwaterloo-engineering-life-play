import copy
import importlib.util
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from email.message import Message
from types import SimpleNamespace

from server import GameServer, Handler, SaveStore, validate_payload


def payload():
    return {"savedAt": "2026-11-17T12:00:00Z", "state": {"version": 1, "name": "Quinn", "stage": "choice", "termIndex": 0, "week": 1, "stats": {"stress": 20, "energy": 80, "morale": 75, "cash": 4000, "skill": 20, "network": 15, "prep": 80, "reputation": 20}}}


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        self.web = root / "dist"
        self.web.mkdir()
        (self.web / "index.html").write_text("<h1>Waterloo</h1>", encoding="utf-8")
        self.store = SaveStore(root / "saves.sqlite3")
        self.server = GameServer(("127.0.0.1", 0), self.web, self.store)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp.cleanup()

    def request(self, path, data=None, headers=None):
        req = Request(self.url + path, data=json.dumps(data).encode() if data else None, method="PUT" if data else "GET", headers={"Content-Type": "application/json", **(headers or {})})
        return urlopen(req, timeout=3)

    def test_serves_game_and_health(self):
        with self.request("/") as res:
            self.assertIn(b"Waterloo", res.read())
        with self.request("/api/health") as res:
            self.assertEqual(json.load(res)["service"], "waterloo-life")
            self.assertEqual(res.headers["X-Content-Type-Options"], "nosniff")

    def test_slots_roundtrip_overwrite_and_survive_reopening(self):
        first = payload()
        with self.request("/api/saves/1", first) as res:
            self.assertTrue(json.load(res)["saved"])
        first["state"]["week"] = 3
        with self.request("/api/saves/1", first):
            pass
        with self.request("/api/saves") as res:
            saved = json.load(res)
            self.assertEqual(saved["1"]["state"]["week"], 3)
        reopened = SaveStore(self.store.path)
        self.assertEqual(reopened.all()["1"], first)

    def test_invalid_payload_does_not_replace_a_good_slot(self):
        self.store.put(1, payload())
        bad = payload()
        bad["state"]["stats"]["energy"] = "<script>"
        with self.assertRaises(HTTPError) as error:
            self.request("/api/saves/1", bad)
        self.assertEqual(error.exception.code, 400)
        self.assertEqual(self.store.all()["1"], payload())

    def test_cross_origin_and_rebound_hosts_are_rejected(self):
        with self.assertRaises(HTTPError) as error:
            self.request("/api/saves/1", payload(), {"Origin": "https://evil.example"})
        self.assertEqual(error.exception.code, 403)
        # Exercise the Host boundary directly: Windows security software can abort
        # forged-Host loopback traffic before it reaches the HTTP handler.
        handler = object.__new__(Handler)
        handler.server = SimpleNamespace(server_port=self.server.server_port)
        handler.headers = Message()
        handler.headers["Host"] = "evil.example"
        replies = []
        handler.reply = lambda status, body: replies.append((status, body))
        self.assertFalse(handler.local_request())
        self.assertEqual(replies[0][0], 403)
        self.assertEqual(self.store.all(), {})

    def test_invalid_slot_and_unknown_api_return_404(self):
        for path in ("/api/saves/4", "/api/missing"):
            with self.assertRaises(HTTPError) as error:
                self.request(path, payload())
            self.assertEqual(error.exception.code, 404)

    def test_nan_boolean_and_out_of_range_stats_are_rejected(self):
        for value in (float("nan"), float("inf"), True, -1, 101):
            bad = copy.deepcopy(payload())
            bad["state"]["stats"]["energy"] = value
            with self.assertRaises(ValueError):
                validate_payload(bad)

    def test_oversized_saves_and_injection_slot_are_rejected(self):
        bad = payload()
        bad["state"]["padding"] = "x" * 250_001
        with self.assertRaises(ValueError):
            validate_payload(bad)
        with self.assertRaises(ValueError):
            self.store.put("1; DROP TABLE saves", payload())


class BalanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("balance", Path(__file__).resolve().parents[1] / "tools" / "balance.py")
        cls.balance = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.balance)

    def test_wilson_bounds_and_invalid_graduation(self):
        lo, hi = self.balance.wilson(10, 10)
        self.assertGreater(lo, .7)
        self.assertLessEqual(hi, 1)
        invalid = {"seed": 1, "difficulty": "balanced", "strategy": "balanced", "ending": "graduated", "terms": 1, "coops": 0, "gpa": 75}
        self.assertTrue(self.balance.check([invalid]))


if __name__ == "__main__":
    unittest.main()

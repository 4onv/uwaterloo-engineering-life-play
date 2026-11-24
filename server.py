"""Local-first Python/SQLite save server. Python 3.11+, standard library only.

Build the frontend with `npm run build`, then `python server.py`.
The server deliberately binds to loopback and does not collect telemetry.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import sqlite3
from contextlib import closing
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
MAX_SAVE_BYTES = 250_000
STATS = {"stress", "energy", "morale", "cash", "skill", "network", "prep", "reputation"}
STAGES = {"admissions", "choice", "event", "assessment", "report", "ended"}


def validate_payload(payload: Any) -> dict[str, Any]:
    """Reject malformed data before it is stored. The TS client validates again on load."""
    if not isinstance(payload, dict) or not isinstance(payload.get("state"), dict):
        raise ValueError("Expected an object containing state and savedAt.")
    state = payload["state"]
    if state.get("version") != 1 or state.get("stage") not in STAGES:
        raise ValueError("Unsupported save version or stage.")
    if not isinstance(state.get("name"), str) or len(state["name"]) > 24:
        raise ValueError("Invalid player name.")
    if type(state.get("termIndex")) is not int or not 0 <= state["termIndex"] <= 13:
        raise ValueError("Invalid term index.")
    if type(state.get("week")) is not int or not 0 <= state["week"] <= 4:
        raise ValueError("Invalid week.")
    stats = state.get("stats")
    if not isinstance(stats, dict) or not STATS.issubset(stats):
        raise ValueError("Missing game stats.")
    for key in STATS:
        value = stats[key]
        if type(value) not in (int, float) or not (-100_000_000 <= value <= 100_000_000):
            raise ValueError("Invalid numeric stat.")
        if key != "cash" and not 0 <= value <= 100:
            raise ValueError("Stat outside its range.")
    if not isinstance(payload.get("savedAt"), str) or len(payload["savedAt"]) > 40:
        raise ValueError("Invalid save timestamp.")
    encoded = json.dumps(payload, allow_nan=False, ensure_ascii=False)
    if len(encoded.encode("utf-8")) > MAX_SAVE_BYTES:
        raise ValueError("Save is too large.")
    return payload


class SaveStore:
    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        with closing(self.connect()) as db, db:
            db.execute("CREATE TABLE IF NOT EXISTS saves (slot INTEGER PRIMARY KEY CHECK(slot BETWEEN 1 AND 3), payload TEXT NOT NULL)")

    def connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path, timeout=10)

    def put(self, slot: int, payload: dict[str, Any]) -> None:
        if slot not in (1, 2, 3):
            raise ValueError("Choose save slot 1, 2, or 3.")
        validate_payload(payload)
        with closing(self.connect()) as db, db:
            db.execute("INSERT INTO saves(slot,payload) VALUES (?,?) ON CONFLICT(slot) DO UPDATE SET payload=excluded.payload", (slot, json.dumps(payload, allow_nan=False)))

    def all(self) -> dict[str, Any]:
        with closing(self.connect()) as db:
            return {str(slot): json.loads(payload) for slot, payload in db.execute("SELECT slot,payload FROM saves ORDER BY slot")}


class GameServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address: tuple[str, int], directory: Path, store: SaveStore):
        self.directory = directory.resolve()
        self.store = store
        super().__init__(address, Handler)


class Handler(SimpleHTTPRequestHandler):
    server: GameServer

    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, directory=str(args[2].directory), **kwargs)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Cache-Control", "no-store" if self.path.startswith("/api/") else "no-cache")
        super().end_headers()

    def local_request(self) -> bool:
        port = self.server.server_port
        host = self.headers.get("Host", "")
        if host not in {f"127.0.0.1:{port}", f"localhost:{port}"}:
            self.reply(HTTPStatus.FORBIDDEN, {"error": "Localhost requests only."})
            return False
        origin = self.headers.get("Origin")
        if origin and origin != f"http://{host}":
            self.reply(HTTPStatus.FORBIDDEN, {"error": "Cross-origin writes are not supported."})
            return False
        return True

    def reply(self, status: int, body: dict[str, Any]) -> None:
        data = json.dumps(body, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        if not self.local_request():
            return
        route = urlsplit(self.path).path
        if route == "/api/health":
            self.reply(HTTPStatus.OK, {"service": "waterloo-life", "version": 1, "storage": "sqlite"})
        elif route == "/api/saves":
            self.reply(HTTPStatus.OK, self.server.store.all())
        elif route.startswith("/api/"):
            self.reply(HTTPStatus.NOT_FOUND, {"error": "Unknown API route."})
        else:
            super().do_GET()

    def do_PUT(self) -> None:
        if not self.local_request():
            return
        route = urlsplit(self.path).path
        if route not in {"/api/saves/1", "/api/saves/2", "/api/saves/3"}:
            self.reply(HTTPStatus.NOT_FOUND, {"error": "Choose save slot 1, 2, or 3."})
            return
        if self.headers.get_content_type() != "application/json":
            self.reply(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, {"error": "Use application/json."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= MAX_SAVE_BYTES:
                self.reply(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "Save must be between 1 and 250,000 bytes."})
                return
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            self.server.store.put(int(route.rsplit("/", 1)[1]), payload)
        except (ValueError, UnicodeError) as error:
            self.reply(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            return
        self.reply(HTTPStatus.OK, {"saved": True})

    def list_directory(self, path: str) -> None:
        self.send_error(HTTPStatus.NOT_FOUND, "Directory listing is disabled.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8790)
    parser.add_argument("--data-dir", type=Path, default=ROOT / ".data")
    parser.add_argument("--directory", type=Path, default=ROOT / "dist")
    args = parser.parse_args()
    if not (args.directory / "index.html").is_file():
        parser.error("Frontend build missing. Run npm install && npm run build first.")
    mimetypes.add_type("text/javascript", ".js")
    server = GameServer(("127.0.0.1", args.port), args.directory, SaveStore(args.data_dir / "saves.sqlite3"))
    print(f"Waterloo Engineering Life: http://127.0.0.1:{server.server_port}/", flush=True)
    print(f"Python + SQLite saves: {args.data_dir.resolve()}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

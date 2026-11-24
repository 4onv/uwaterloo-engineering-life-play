"""Package the already-built game without dependencies, credentials, or player saves."""
from pathlib import Path
import json
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]


def main():
    dist = ROOT / "dist"
    if not (dist / "index.html").is_file():
        raise SystemExit("Run npm run build before packaging.")
    version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
    out = ROOT / "releases" / f"waterloo-engineering-life-v{version}.zip"
    out.parent.mkdir(exist_ok=True)
    with ZipFile(out, "w", compression=ZIP_DEFLATED) as archive:
        for asset in sorted(dist.rglob("*")):
            if asset.is_file():
                archive.write(asset, asset.relative_to(ROOT))
        for name in ("server.py", "README.md", "ART.md", "RELEASE_NOTES.md", "DESIGN.md", "docs/gameplay.jpg"):
            archive.write(ROOT / name, name)
        for font in ("pixelify-sans", "ibm-plex-sans"):
            archive.write(ROOT / "node_modules" / "@fontsource" / font / "LICENSE", f"licenses/{font}-LICENSE.txt")
        archive.writestr("PLAY.txt", "Waterloo Engineering Life\n\nRequires Python 3.11+. No extra packages or Node needed for this download.\n\n1. Extract this ZIP.\n2. In this folder, run: python server.py\n3. Open http://127.0.0.1:8790/\n\nThe Reset button starts a new run. Saves stay in your browser and .data/saves.sqlite3.\n")
    print(out)


if __name__ == "__main__":
    main()

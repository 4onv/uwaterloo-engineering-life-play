"""Summarize seeded TypeScript campaigns and enforce broad balance guardrails.

node --experimental-strip-types tools/simulate.ts --runs 1000 --output balance-report.json
python tools/balance.py balance-report.json --check
"""
from __future__ import annotations
import argparse
import json
import math
from collections import defaultdict
from pathlib import Path
from statistics import mean, median


def wilson(successes: int, total: int) -> tuple[float, float]:
    if not total:
        return 0, 0
    p, z = successes / total, 1.96
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator
    return max(0, center - half), min(1, center + half)


def summarize(records: list[dict]) -> list[str]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for run in records:
        groups[f'{run["difficulty"]:8} / {run["strategy"]:8}'].append(run)
    lines = ["DIFFICULTY / STRATEGY       RUNS  GRADUATE     AVG GPA   MEDIAN CASH  CALI/RUN"]
    for label, runs in sorted(groups.items()):
        wins = sum(r["ending"] == "graduated" for r in runs)
        lines.append(f'{label:27} {len(runs):4}  {wins / len(runs):7.1%}      {mean(r["gpa"] for r in runs):5.1f}%   ${median(r["cash"] for r in runs):10,.0f}  {mean(r["cali"] for r in runs):.2f}')
    return lines


def check(records: list[dict]) -> list[str]:
    errors = []
    for r in records:
        if r["ending"] not in {"graduated", "academic", "afm", "career", "burnout", "funding"}:
            errors.append(f'Run {r["seed"]} has no valid ending.')
        if r["ending"] == "graduated" and (r["terms"] != 8 or r["coops"] != 6 or r["gpa"] < 60):
            errors.append(f'Run {r["seed"]} graduated without fulfilling the campaign.')
    for difficulty in ("balanced", "cozy", "crunch", "devil"):
        good = [r for r in records if r["difficulty"] == difficulty and r["strategy"] == "balanced"]
        reckless = [r for r in records if r["difficulty"] == difficulty and r["strategy"] == "reckless"]
        if good and difficulty == "cozy" and sum(r["ending"] == "graduated" for r in good) / len(good) < .35:
            errors.append(f"Balanced strategy is too punishing in {difficulty}.")
        if good and difficulty == "balanced" and len(good) >= 20:
            rate = sum(r["ending"] == "graduated" for r in good) / len(good)
            if not .10 <= rate <= .85:
                errors.append("Normal difficulty should be winnable but carry a substantial failure risk.")
        if good and difficulty == "devil" and sum(r["ending"] == "graduated" for r in good) / len(good) > .08:
            errors.append("Devil difficulty has become too forgiving.")
        if good and reckless and mean(r["terms"] for r in reckless) > mean(r["terms"] for r in good):
            errors.append(f"Reckless play outlasts balanced play in {difficulty}.")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    report = json.loads(args.report.read_text(encoding="utf-8"))
    records = report["records"]
    if not records:
        parser.error("No campaign records were found.")
    print("\n".join(summarize(records)))
    balanced = [r for r in records if r["strategy"] == "balanced" and r["difficulty"] == "balanced"]
    if balanced:
        lo, hi = wilson(sum(r["ending"] == "graduated" for r in balanced), len(balanced))
        print(f"\nBalanced strategy graduation interval (95% Wilson): {lo:.1%}–{hi:.1%}")
    if args.check:
        errors = check(records)
        if errors:
            raise SystemExit("\n".join(errors))
        print("Balance guardrails passed. These bots are regression checks, not a substitute for human playtesting.")


if __name__ == "__main__":
    main()

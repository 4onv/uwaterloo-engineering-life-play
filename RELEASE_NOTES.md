# Waterloo Engineering Life 1.2.0

Three freshly dealt cards replace each weekly hand. Action, travel, shop and event wheels show the outcome and resource changes. The hand and the roll survive reloading.

All fourteen programs have an official Waterloo guide, a sample course, and two fictional studio activities. Cathy and Cathy Guo may apply to every program and stream. Only Mechatronics stream 8 guarantees admission.

Week two features an EngSoc pop-up arcade. Its two new booths, Goose Crossing and Parts Swap, also appear in the regular break menu.

The public repository now builds the live game from its TypeScript, Python and Bash sources. Python generates the program-specific activity catalog and checks the simulated campaigns.

# Waterloo Engineering Life 1.1.0

## Difficulty and campus expansion

- Cathy and Cathy Guo now complete both wheels. TRON admission is secretly rigged to succeed at the ordinary displayed odds, including 0.001%, and always assigns stream 8.
- Grade rolls now include genuinely poor marks, down to 20%. Exams can roll 0–100. Preparation decays and finals pressure makes failure possible even after studying.
- Two academic strikes force a transfer to AFM. Poor co-op evaluations can end the campaign. Burnout recovery limits depend on difficulty.
- Terry, ignoring case and whitespace, forces the hidden Devil difficulty regardless of the selected pace. This includes tougher resources, stress, fees, interviews, and a one-burnout limit.
- Expanded to 39 actions and 48 events, with visible action risks, financial setbacks, capstone problems, workplace crises, and campus encounters.
- Locations now apply different facility effects. Travel costs energy, arrivals can trigger choices, and campus conditions affect networking, studying, and travel.
- Larger, clearer text, readable HUD numbers, action filters, and an Info panel for facility rules. Added walking, action effects, rain, snow, leaves, a moving goose, and monitor animation.
- 26 engine tests and eight Python tests; 1,600 seeded campaigns checked. In the balanced-strategy sample, 29/100 normal runs graduated; none of 400 Devil campaigns across the four bot strategies graduated. Bots use limited strategies and are not an estimate of every human player's odds.

## Included base game

Complete single-player campaign with full-screen illustrated campus scenes, 14 engineering programs, both co-op streams, eight study terms, and six co-ops.

Chance-based grade, admission, co-op interview, and assessment wheels. Four bonus games: prize wheel, Plinko, scratch card, and dice. Random events, three friendship arcs, six upgrades, 15 achievements, and graduation or setback endings.

Includes the Cathy Guo → Mechatronics stream 8 and Markus → math-only name rules. Reset stays available throughout gameplay and menus.

Local autosave, three manual slots, import/export, reduced motion, optional sound, bundled fonts, and Python/SQLite save support. No telemetry or external runtime services.

The browser download contains a ready-built game and `server.py`. Extract it, run `python server.py` from its folder, then open http://127.0.0.1:8790/. Python 3.11+ is required; no Python packages or Node installation are needed for the download.

The source repository includes engine tests, Python server tests, a seeded campaign simulator, Python balance checks, and GitHub Actions validation.

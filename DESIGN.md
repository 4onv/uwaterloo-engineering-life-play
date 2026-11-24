# Full-screen game UI

The scene is the visual anchor. No website header, marketing section, or footer surrounds the game. The readable controls sit over the quieter right-hand side of each location.

Palette: deep pine `#142226`, parchment `#f7f0d6`, Waterloo gold `#f0ce7f`, recovery green `#c3e0a0`, risk coral `#f0b993`, Devil red `#e98e79`.

Typography: bundled IBM Plex Sans for numbers, choices, descriptions, and consequences; Pixelify Sans for scene titles and a limited number of game headings. Descriptions use 12–14px rather than the earlier 8–10px labels. Risk probabilities and every resource effect remain visible before a choice.

```text
stats · term · reset · menu

campus artwork                 current location / preparation
                               facility benefit + Info
                               campus condition
                               All / Focus / Life / Risky / Break
                               scrollable action choices
                               weekly living costs

travel controls                action panel
cohort / journal / desk / badges
term journey
```

The first layout spent too much height on duplicate facility text and pushed the break button out of view. The revised panel keeps the benefit visible, moves full tradeoffs into Info, puts Break alongside the action filters, and reserves more vertical space for actual choices. Mobile keeps the travel controls and Reset available while the choices scroll.

Animation answers actions: a walking overlay accompanies travel, and a short effect marks a rolled action. Weather, snow, leaves, monitor activity, and the Plaza goose add visible scene motion. Reduced motion disables animated overlays. Location effects and arrivals are game-engine behavior, independent of the artwork.

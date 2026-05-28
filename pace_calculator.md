# Pace Calculator — Project Summary

## Overview
A mobile-friendly web app for runners to calculate running pace and finish times. Built as a single-page HTML/CSS/JS app deployed on GitHub Pages and installable as a PWA on iPhone.

**Live URL**: `https://HDI-Ty.github.io/pace-calculator` (configure after GitHub Pages deployment)

---

## How It Works

### Two Calculation Modes

**Mode A — Time → Pace**
- User inputs: distance (miles or km) + total time (h:m:s)
- Output: pace per mile or per km
- Pace unit is independently selectable (decoupled from distance unit)
- Optional: view splits at custom intervals

**Mode B — Pace → Time**
- User inputs: pace (m:s per mi/km) + distance (miles or km)
- Output: total time (h:m:s)
- Optional: view splits at custom intervals

### Core Math
All internal calculations are done in **seconds** and **miles** to avoid floating-point drift. Conversions to/from km happen on input/output.

```
KM_PER_MILE = 0.621371
toMiles(value, unit) = unit === 'km' ? value * 0.621371 : value
fromMiles(miles, unit) = unit === 'km' ? miles / 0.621371 : miles
```

---

## Key Features

### Distance Presets
Quick-select buttons for common race distances:
- 1 mile
- 5K (5 km)
- 10K (10 km)
- Half-marathon (13.1 miles)
- Marathon (26.2 miles)

Clicking a preset fills the distance input and unit, highlights the button. Typing in the distance field clears the highlight.

### Splits Table
Optional breakdown of the race by user-defined interval (e.g., every 0.25 miles, every 1 km).

Shows:
- Split #
- Cumulative distance
- Time for that segment
- Elapsed time to that point

Partial splits (e.g., last 0.3 mi in a 5.3 mi race) are rendered in italic to flag them as incomplete.

### Mobile Responsiveness
- Flexible input widths (`flex: 1` with `min-width` guards) — no overflow on narrow screens
- Touch targets: all buttons have `min-height: 44px` for reliable tapping
- Media query at `max-width: 500px` reduces padding and font sizes for small phones
- `inputmode="decimal"` on distance and interval inputs for numeric keyboard with period
- `inputmode="numeric"` on time and pace inputs for numbers-only keyboard

### PWA (iPhone App)
The app is fully installable as a home screen app on iPhone:
- **Manifest** (`manifest.json`) — declares the app metadata, icon, and display mode
- **Service Worker** (`sw.js`) — handles offline caching with a **network-first** strategy:
  - When online: fetches fresh files from the network and updates the cache
  - When offline: serves from cache
  - New service worker activates immediately (`skipWaiting()` + `clients.claim()`)
  - Old caches are auto-deleted on activation
- **iOS Meta Tags** (`index.html`) — tells Safari to launch full-screen without browser chrome
- **Icon** (`icon.svg`) — navy stopwatch icon used as home screen icon

To install on iPhone: Open in Safari → Share → "Add to Home Screen"

### Reactive UI
- Pace output updates instantly when the pace unit toggle is changed (no need to recalculate)
- Mode toggle shows/hides relevant input sections
- Splits interval visibility controlled by a checkbox

---

## File Structure

```
pace-calculator/
├── index.html         # HTML markup + PWA meta tags + SW registration script
├── styles.css         # Styles + mobile media query at 500px
├── app.js             # All calculation logic + event listeners
├── manifest.json      # PWA manifest
├── icon.svg           # App icon (192×192 SVG)
├── sw.js              # Service worker (network-first strategy)
└── pace_calculator.md # This file
```

### Key Code Locations

**Calculation functions** (`app.js:40–55`):
- `calcPaceFromTime(distanceMiles, totalSeconds)` → seconds per mile
- `calcTimeFromPace(distanceMiles, secondsPerMile)` → total seconds
- `buildSplits(distanceMiles, secondsPerMile, intervalMiles, displayUnit)` → array of split objects

**UI state management** (`app.js:104–155`):
- `setMode(mode)` — switches between Time→Pace and Pace→Time
- `selectPreset(value, unit)` — fills distance input and highlights preset button
- `updatePaceDisplay()` — reactively updates pace output when unit toggle changes
- `toggleSplits()` — shows/hides interval input

**Main calculation entry point** (`app.js:157–221`):
- `calculate()` — validates inputs, calls appropriate calculation, displays results + optional splits

---

## Hosting & Deployment

**Current Setup**: GitHub Pages

**To deploy changes**:
```bash
cd "C:\Users\tyron\OneDrive\Documents\HDI\Claude Projects\pace-calculator"
git add .
git commit -m "describe the change"
git push
```

Pages redeploys within ~60 seconds. Updates appear on the phone on next app load (thanks to network-first service worker).

---

## Important Context for Future Development

### Service Worker Strategy
The app uses a **network-first** strategy (as of latest update):
1. On fetch, tries the network first
2. On success, updates the cache and returns the fresh response
3. On failure (offline), returns cached version
4. New service worker activates immediately without requiring an app restart

This means users always see the latest version when online, but the app still works offline.

### Conversion Constants
All internal math uses miles and seconds. The `KM_PER_MILE` constant is used for conversions:
- `milesToKm(miles)` = `miles / 0.621371`
- `kmToMiles(km)` = `km * 0.621371`

### Floating-Point Precision
Results are rounded to whole seconds when formatting time and pace. Splits are accumulated as fractional distances but formatted to 2 decimal places.

### Mobile Considerations
- The app is designed mobile-first but looks good at all screen sizes
- Touch targets are 44×44px minimum (WCAG AA standard)
- Numeric inputs use `inputmode` for appropriate mobile keyboards
- The `<meta name="viewport">` tag is set for responsive scaling

### Browser Compatibility
- Service workers require HTTPS (or localhost for development)
- `inputmode` is supported on modern iOS Safari and Android browsers
- SVG icon works everywhere
- CSS flexbox and media queries are well-supported

---

## Testing Checklist

Before making changes, verify:
- [ ] Time→Pace mode: 26.2 mi, 3:30:00 → ~8:01/mile
- [ ] Pace→Time mode: 8:00/mile, 10 km → ~49:42
- [ ] Marathon preset sets 26.2 miles in miles unit
- [ ] Half preset sets 13.1 miles in miles unit
- [ ] Pace unit toggle updates output reactively without recalculating
- [ ] Splits: 5 miles at 10:00/mile, every 1 mile → 5 rows with 10:00 splits
- [ ] Mobile: inputs fit without horizontal scroll at 375px (iPhone SE width)
- [ ] Mobile: all buttons are tappable (min 44px height)
- [ ] PWA: app installs from iPhone Safari with home screen icon
- [ ] PWA: app works offline after initial load
- [ ] Chrome DevTools: Service Worker is active, manifest loads, cache is populated

---

## Future Enhancement Ideas

- **Dark mode toggle** — add theme preference detection + CSS variables
- **Workout templates** — save favorite distances/paces
- **Custom race distances** — let users add their own presets
- **Split comparison** — compare actual splits to target pace
- **Export/share results** — generate a shareable pace plan
- **Voice input** — speak pace/time instead of typing
- **Interval workouts** — calculate warm-up + repeats + cool-down

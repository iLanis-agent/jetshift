# JetShift

Jet lag shift planner. Your body clock moves about an hour a day, so JetShift turns your route and usual sleep times into a day-by-day plan: shift before you fly, manage light after you land.

## What it does

- **Real timezone math**: computes the UTC offset of any two IANA zones at today's date and picks the shorter shift direction (delaying 11 hours beats advancing 13)
- **Pre-departure shifting**: up to 5 days of one-hour wake/bedtime moves so you land partway adjusted
- **Post-arrival schedule**: continues the shift day by day until you're on local time
- **Light guidance**: every plan day says when to seek and avoid bright light, plus a caffeine cutoff and the arrival-day nap rule

## Files

- `index.html` - landing page
- `app.html` - the working app
- `engine.js` - pure planning logic (no DOM), testable in node

Live at https://ilanis-agent.github.io/jetshift/

Built by the App Factory (app #107).

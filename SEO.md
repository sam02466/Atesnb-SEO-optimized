# AtES NB — SEO & Performance Improvements

**Site:** https://atesnb.vercel.app/  |  **Tested with:** Google PageSpeed Insights (mobile, Slow 4G)

## Summary
The SEO audit already scored 100. The work focused on **page experience (Core Web Vitals)**: load speed, layout stability and page weight on mobile, which affect rankings (Google indexes mobile-first) and bounce rate.

## Results

| Metric (mobile) | Before | After |
|---|---|---|
| Performance score | 39 | 75 (best run 87; runs vary) |
| Layout shift (CLS) | 0.64 | 0 (0.003 on latest run) |
| Total blocking time | 230 ms | 0 ms |
| Largest Contentful Paint | 14.4 s | 4.5 s (best run 2.9 s) |
| Speed Index | 8.5 s | about 5–6 s |
| Image savings flagged | about 7.2 MB | about 40 KiB |
| Page weight of local assets | about 9 MB | about 0.6 MB |
| Best Practices | 77 | 100 |
| Accessibility | 96 | 96 |
| SEO | 100 | 100 |

The final build (loader/CSS reordering) was delivered after these runs; re-test it to confirm the latest LCP/FCP.

## What we changed

**1. Images (biggest win)**
- Converted all PNG/JPG/AVIF to WebP; team photos cropped to the card size (about 1.3 MB each down to about 20 KB).
- Added `width`/`height` to every image and lazy-loading below the fold.

**2. Layout stability**
- Removed the unstyled-page flash and reserved image space, so content no longer jumps.
- Page content stays hidden until the stylesheet and Inter font are ready, then is revealed behind the loader.

**3. Faster first paint**
- No stylesheet blocks rendering; the loader paints on the first frame.
- Loader no longer waits on third-party CSS (shorter hold: 2 s minimum, 4 s maximum).
- Font Awesome font set to `swap` so icons never stay invisible.

**4. Third parties and best practices**
- YouTube hero video moved to the no-cookie domain and started on first touch/scroll or after 6 s, so its scripts don't compete with page load (works on phones too).
- Added cache headers (`server.js`, `vercel.json`) for images, CSS and JS.

**5. JavaScript**
- Fixed a forced reflow in the process-timeline code (`script.js`); it now measures only while on screen.

## Why it helps SEO
Faster loads and stable layouts improve Core Web Vitals, which Google uses as a page-experience signal. Lighter pages also reduce mobile data use and bounce rate.

## Still open
- Speed Index (about 5 s) is held back by the loader length; trimming `MIN_MS` to about 1200 ms would help.
- About 38 KiB unused CSS and the icon fonts (Font Awesome, Remixicon) could be replaced by inline SVGs.
- Colour-contrast items from the accessibility audit still need the element list.
- Re-run PageSpeed 2–3 times; single runs vary. `/?loader=0` shows what the loader costs.

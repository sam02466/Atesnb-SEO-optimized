# AtES NB - single-page site (Node.js + Express)

```
project-root/
├── public/
│   ├── css/style.css     tokens + reset + per-section styles (scoped .sec-N) + harmony layer
│   ├── js/config.js      YOUR SETTINGS: Calendly link + EmailJS keys (the only file to edit to go live)
│   ├── js/script.js      all section behaviour, each scoped to its own section
│   ├── index.html        loader, header, sections in order, footer, floating buttons
│   ├── images/           client logos + team photos (see Images guide below)
│   ├── logo.png          header logo
│   ├── mountain.png      background of "Have a Question? Contact Us"
│   ├── banner1-5.png     work showcase thumbnails
│   └── work1-5.png       work showcase large previews
├── server.js             tiny Express server for the static site, PORT || 3000
└── package.json
```

## Run
```bash
npm install
npm start          # http://localhost:3000
```
No keys or database are needed to run the site. Email sending and Calendly switch on when you fill in `public/js/config.js`.

## Notes
- Section order: sec1 -> sec5, sec6 (team carousel), sec7 -> sec9, section11, section12 (reviews, CTA, FAQ, form), section13 (footer). The upload had no section 10.
- None of the local images were in the zip. See the **Images guide** below for every file the site expects and where it goes.
  Missing `<img>` images are swapped for a generated placeholder by script.js, so nothing breaks while files are missing.
- Both quote forms send email straight from the browser through EmailJS, and the "Book a Call" buttons open Calendly. Setup is below. There is no backend.
- Fonts/icons load from Google Fonts, Font Awesome and Remix Icon CDNs.

## Email and booking setup (free, no backend)

Everything is switched on from one file: `public/js/config.js`. Until a value is filled in, that feature stays off safely
(forms show a message asking visitors to email or call; "Book a Call" buttons scroll to the contact form).

### A. Quote form emails with EmailJS (about 10 minutes)

```
Visitor submits a form ──> EmailJS ──┬─> email to YOU (your Gmail), Reply-To = the customer
                                     └─> optional instant auto-reply to the CUSTOMER
```
1. Create a free account at emailjs.com and add an **Email Service** (choose Gmail and sign in with the Gmail you want to send from). Copy its **Service ID**.
2. Create an **Email Template**. Set *To Email* to the address that should receive quote requests (your personal email, or any you choose), and *Reply To* to `{{reply_to}}`.
   Copy-paste text:
   - Subject: `New quote request from {{from_name}}`
   - Body:
     ```
     New quote request ({{source}}) - {{submitted_at}}

     Name: {{from_name}}
     Email: {{reply_to}}
     Company: {{company}}
     Message:
     {{message}}
     ```
   Copy the template's **Template ID**.
3. Optional instant auto-reply to the customer: open the same template, find its **Auto-Reply** tab (menu labels may differ slightly), enable it and set *To Email* to `{{reply_to}}`.
   Copy-paste text:
   - Subject: `Thanks for contacting AtES NB - we have received your request`
   - Body:
     ```
     Hi {{from_name}},

     Thank you for reaching out to ATES NB Ecommerce Solutions! We have received your request and our team will get back to you shortly.
     Your details are 100% confidential and we are happy to sign an NDA.

     Need help right away?
     Phone / WhatsApp: +91 8406031253 | +91 9709096518
     Sales: atesnb1@gmail.com

     Warm regards,
     Team ATES NB Ecommerce Solutions
     ```
4. In the EmailJS dashboard copy your **Public Key** (Account > General).
5. Paste the three values into `public/js/config.js` under `emailjs`, then **send a test request from the site and check both inboxes** (also the spam folder).

Good to know:
- The form sends these template variables: `from_name`, `reply_to`, `company`, `message`, `source`, `submitted_at`. If you rename one in the template, rename it in `sendWithEmailJS` / `initForms` in `public/js/script.js` too.
- Free plan limits (as published by EmailJS): 200 requests a month and 2 templates. If the auto-reply counts as an extra request on your account, that is closer to 100 form submissions a month, so check the usage page after your test.
- The public key is visible in the page source. That is normal for EmailJS and it is not a password, but anyone could use it to send through your quota.
  Domain restriction appears to be a paid-plan feature, so on the free plan keep an eye on the usage page.
- Built-in spam brakes: a hidden trap field that bots fill in, and one request per minute per browser. For stronger protection, add reCAPTCHA in EmailJS later.

### B. "Book a call" with Calendly (about 5 minutes)

1. Create a free Calendly account and an event type (for example "Free Consultation").
2. Copy the event's link, such as `https://calendly.com/your-name/30min`, into `calendlyUrl` in `public/js/config.js`.
3. Reload the site. The header "Book A Call" button, the hero "Book a ... Call" button and a new "Pick a time on Calendly" button in the Book a Call block now open Calendly in a popup. Calendly's own script loads only when a visitor reaches for one of these buttons, so it does not slow the page.
   If a visitor's browser blocks the popup script, the link opens in a new tab instead.

Good to know:
- Calendly's free plan allows one active event type, so there is only one call length. The site currently says **"30 Minutes"** in the hero button and **"20-Minute"** in the Book a Call heading. Change the wording or the Calendly event length so they match.
- Embedding is available on all Calendly plans, including free.

## Loading screen

The logo reveal is built to stay smooth on phones:
- Its CSS is inline in the `<head>`, so it appears on the first frame instead of waiting for five stylesheets.
- The red pillars are revealed with a sliding cover (a GPU-friendly `transform`) instead of animating `clip-path`, and the text and fade-out use only `opacity`/`transform`. Only the thin blue arc uses a path animation, and it is tiny.
- The page's own stylesheets load without blocking, and the heavy YouTube hero video is only started after the loader has faded out, so nothing competes with the animation.
- The animation plays for at least 2.4 seconds, then waits for the page styles. It never waits longer than 7 seconds.
- Visitors who prefer reduced motion get a short static version.

To change timing, edit `TEXT_AT`, `MIN_MS` and `MAX_MS` at the top of the inline script right after `<div id="page-loader">` in `public/index.html`.

## Saved for later: AI chat + Brevo backend

An AI chat assistant (Claude API), server-side quote emails and an instant Brevo auto-reply were built and tested, then taken out of the live site on purpose to keep it simple and free.
The complete working version is kept in the separate zip `ATES-NB_FULL_with-AI-chat-and-Brevo-backend.zip` (its own README has the setup). To bring it back later, use that zip as your project.

## Images guide

All paths are relative to the `public/` folder. Drop each file in at exactly the name and extension shown
(names are case-sensitive on most servers) and it loads with no code change. Restart is not needed.

### 1. Branding and backgrounds

| File | Where it shows |
|------|----------------|
| `public/logo.png` | Header logo (top-left, next to "AtES NB") |
| `public/mountain.png` | Full-width background of the **"Have a Question? Contact Us"** section. A white veil sits on top so the heading stays readable. If the file is missing, the section shows a plain yellow gradient. |

### 2. Work showcase (section "Our Work")

Five projects, each with a small thumbnail and a large preview. Names and order are set in `portfolioData` in `js/script.js`.

| Project | Thumbnail (carousel card) | Large preview |
|---------|---------------------------|---------------|
| Scooter Direct | `public/banner1.png` | `public/work1.png` |
| Remedy Liquor | `public/banner2.png` | `public/work2.png` |
| Americord | `public/banner3.png` | `public/work3.png` |
| Sokolin | `public/banner4.png` | `public/work4.png` |
| Partner Brand | `public/banner5.png` | `public/work5.png` |

`work1.png` is also the preview shown when the page first loads.

### 3. Client logos (section "We've Driven Impact At" - diamond marquee)

Seventeen logos in `public/images/`, saved as **.jpg**. The number is the position in the HTML, not an importance rank.

| File | Client | File | Client |
|------|--------|------|--------|
| `images/1.jpg` | EMAAR | `images/10.jpg` | KMT |
| `images/2.jpg` | Nanogen | `images/11.jpg` | Macmillan |
| `images/3.jpg` | Miracle Digital | `images/12.jpg` | NDSV |
| `images/4.jpg` | Printme | `images/13.jpg` | Baton Tea |
| `images/5.jpg` | Qubist | `images/14.jpg` | Lafua |
| `images/6.jpg` | ANI Divine | `images/15.jpg` | Wogzy |
| `images/7.jpg` | Sri Maa Venture | `images/16.jpg` | Delci |
| `images/8.jpg` | JTC | `images/17.jpg` | Allester |
| `images/9.jpg` | Ahead Labs | | |

The top marquee row uses 1-10, the bottom row uses 11-17.

### 4. Team photos (section "Our Team" - 3D carousel)

Six photos in `public/images/`. Note the **mixed extensions** and that the order is not strictly numeric:

| Carousel position | File |
|-------------------|------|
| Team Member 1 | `images/1.png` |
| Team Member 2 | `images/2.png` |
| Team Member 3 | `images/4.png` |
| Team Member 4 | `images/4.avif` |
| Team Member 5 | `images/5.png` |
| Team Member 6 | `images/3.png` |

`images/1.png` (team) and `images/1.jpg` (client logo) are different files and can live in the same folder side by side.
Members 3 and 4 both use the number 4 (`4.png` and `4.avif`). That looks like it may be a leftover from the original upload,
so to change it, edit the `src` of those two `<img>` tags in the `#team` section of `index.html`.

### 5. Not needed - loaded from the internet

These come from external CDNs, so there is nothing to upload: the Amazon / Flipkart / Myntra / Shopify logos in "Partners",
the platform logos in "Platforms" (Shopify, Amazon, Flipkart, Meesho, Myntra, Blinkit, Snapdeal, JioMart, Zepto, Meta, Google),
and the hero background video (YouTube). The loading-screen logo is inline SVG, so it has no image file either.
If you want the site to work without relying on those CDNs, download the logos into `public/images/` and update the `src` values.

### Tips
- Use compressed files (roughly under 300 KB each) so the page stays fast on mobile data.
- Keep each group visually consistent (same aspect ratio and background) so the carousel and marquee look even.
- The old footer skyline (`footer.png`) is no longer used since the footer redesign.

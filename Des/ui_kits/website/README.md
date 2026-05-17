# ПодариМомент — Website UI Kit

Marketing landing + order flow + success + admin, all rendered as an interactive single-page prototype.

## Files
- `index.html` — entry; loads React + Babel + components, switches between landing / order / success / admin views.
- `Nav.jsx` — sticky glass nav.
- `Hero.jsx` — headline, subhead, primary CTA, floating product cards.
- `ProductCards.jsx` — product grid (four products incl. Gender-Reveal Voice with `accent="reveal"`).
- `HowItWorks.jsx` — 3-step process strip.
- `Reviews.jsx` — testimonials.
- `Footer.jsx` — footer + small logo.
- `OrderForm.jsx` — tabbed form (Песня / Видео из фото / Знаменитость / Гендер-пати) with full validation.
- `GenderFields.jsx` — Reveal Stage live preview, WebAudio voice-preview chips, script templates, price preview for gender-reveal flow.
- `SuccessScreen.jsx` — post-payment screen.
- `AdminTable.jsx` — orders dashboard.

## How to view
Open `index.html`. Use the top-nav buttons or the in-page CTAs to navigate between views — Landing → Order → Success. The Admin view is gated by a password (`admin` for the demo).

## Notes
- All components consume tokens from `../../colors_and_type.css`. No hardcoded brand hex.
- The form validates client-side; submit shows a loading state then routes to Success.
- This is a UI kit, not a production app — networking, payments, file storage are stubbed.

# ПодариМомент — Design System

> AI-generated celebration gifts. Songs, photo videos, and celebrity greetings — delivered to inbox in minutes.

**Brand:** ПодариМомент (PodariMoment / "Gift the Moment")
**Domain:** подаримомент.рф
**Audience:** Russian-speaking gift-givers (18–45) — birthdays, weddings, anniversaries, New Year
**Tone:** Premium, warm, alive, playful but not childish. Slight luxe.

---

## What it does

A self-serve site that generates personalized AI celebration content. The user picks a product, fills a form, pays, and receives a finished file by email. Three products:

| Product | Price | Output |
|---|---|---|
| ИИ-песня (AI Song) | 299 ₽ | MP3 |
| Видео из фото (Photo Video) | 499 ₽ | MP4 |
| Видео от знаменитости (Celebrity Video) | 799 ₽ | MP4 |
| Голос для гендер-пати (Gender Reveal Voice) | 599 ₽ | MP3 / MP4 |

### Гендер-пати: голос анонса

Премиум-голосовой ИИ-анонс пола ребёнка для гендер-пати — короткий драматичный ролик (15 с / 30 с / 1 мин) с настраиваемым голосом, стилем и сценарием.

**Поля формы:**
- **Что обнародуем:** `boy` · `girl` · `surprise` (ИИ выбирает сам и держит интригу до раскрытия).
- **Голос объявляющего:** `male`, `female`, `child`, `star` (+200 ₽, узнаваемая знаменитость), `showman`. Каждый чип в UI — мини-плеер с 2.6-сек превью.
- **Стиль анонса:** `душевно` · `громко-весело` · `кинематика` · `с приколом` · `загадочно`.
- **Формат:** MP3 (для bluetooth-колонки), MP4 16:9 с анимацией, или вертикальное 9:16 для соцсетей.
- **Имена родителей:** свободный текст, минимум 2 символа.
- **Длительность:** 15 с · 30 с · 1 мин (+200 ₽).
- **Сценарий:** свободный текст; есть 4 готовых шаблона (кинодрама / прикол / душевно / загадочно), которые подставляются по клику и остаются редактируемыми.
- **Фото родителей:** опционально, помогает ИИ задать тон.

**Цветовой код:** не привязываемся к плоскому «розовый/голубой». Используем брендовый тёмный фон + морфирующий glow между голубым `#6fb6ff`, розовым `#ff8fb4` и нейтральным золотом `#ffd166`. Pill в Reveal Stage окрашивается в зависимости от выбора — это единственное место, где разрешён прямой розово-голубой код.

**Тон копирайта:** интрига, не китч. «У вас будет…» вместо «Поздравляем счастливых родителей!». Никаких клише «принцесса/защитник». ИИ-сценарий не использует имя ребёнка (его ещё нет).

**Ограничения:** сценарий до 280 символов в одном «такте» (длиннее — ИИ резюмирует); запрещены прямые упоминания пола в шаблоне `surprise`; не разрешаем имена медицинских сроков/недель — фокус на эмоции.



Pages: `index.html` (landing), `order.html` (form, 3 tabs), `success.html` (post-pay), `admin.html` (orders dashboard).

---

## Sources & inspiration

- **Product brief:** Pasted into the conversation by the founder.
- **Visual direction:** "Like batvai.by" — youthful, lively, animated, premium dark.
- **Inspiration assets** (in `assets/inspiration-*.webp`): Carty fintech card landing (gradient cards on black, lime CTA), NexusSci (rounded glass cards on light) — these are mood references, NOT the actual brand.
- No prior codebase, Figma file, or font files were provided.

---

## CONTENT FUNDAMENTALS

**Language:** Russian. Conversational "вы" form for the visitor (полит. вежливое), but **never stiff** — the brand acts like a thoughtful friend who happens to be very good at making gifts.

**Voice traits**
- Warm, never corporate. "Готово за 5 минут" not "Срок исполнения — 5 минут."
- Lyrical when it matters, blunt when it doesn't. Headlines lean poetic ("Подарите момент, который запомнится"), CTAs are short and direct ("Заказать", "Создать песню", "Получить видео").
- Concrete numerals: "299 ₽", "за 5 минут", "до 15 фото". Avoid round-the-edges fluff like "быстро" without a number.
- Ironic confidence — the product is a little magical, and the copy knows it. Not "наш сервис генерирует контент с использованием ИИ" — instead "ИИ напишет песню, которую невозможно купить в магазине".

**Casing**
- Headlines: sentence case, Russian rules. No Title Case.
- Buttons: sentence case, imperative verb first. ("Заказать песню", not "ЗАКАЗАТЬ ПЕСНЮ" or "Заказ песни")
- All-caps reserved for tiny labels (`Шаг 1 / 3`, `НОВОЕ`, `299 ₽`) — uppercase + 0.18em tracking, never for body.

**Punctuation**
- «Ёлочки» for quotes, тире for dashes (—), no double spaces.
- Numbers + currency: `299 ₽` (non-breaking space). Never `299₽` or `299 руб.`
- Hours/minutes: `5 минут`, not `5 мин`.

**Emoji**: Used sparingly, ONLY in tiny celebratory contexts — never as bullets, never in headlines. Examples that are OK: `🎉` next to a success toast, `✨` on a "premium" badge. Default to typography & color over emoji.

**Examples (real copy to write like)**
- Hero: "Подарите момент, который запомнится"
- Subhead: "ИИ-песни, видео и поздравления от знаменитостей. Готово за 5 минут — отправим на почту."
- Product card: "ИИ-песня на заказ — текст, голос, бит. Всё про вашего человека."
- Step label: "Шаг 2 из 3 — расскажите о герое"
- Empty state: "Пока тихо. Загрузите первое фото."
- Error: "Кажется, файл великоват. JPG/PNG до 10 МБ, пожалуйста."
- Success: "Готово! Письмо уже летит на ваш ящик."

---

## VISUAL FOUNDATIONS

### Mood
**Premium midnight celebration.** A dark velvet stage on which warm fire-colored type and gradients glow. Think: a candlelit dinner, a vinyl record sleeve, a high-end concert poster. NOT: party-store confetti, kids' birthday clipart.

### Color
- **Background:** `#0a0a0f` (near-black with slight indigo). Cards step up to `#1a1a26`, hover to `#232333`.
- **Primary accent:** `#ff6b35` orange — used for CTAs, gradient hero text, focus rings, key numbers.
- **Secondary accent:** `#ffd166` gold — italic display accents, badges, small stars/sparkles, premium signals.
- **Foreground text:** `#f7f5f0` warm off-white (NOT pure white — pure white feels clinical against the warm accents).
- The signature gradient is **Flame** — `linear-gradient(135deg, #ff6b35, #ffd166)`. Use it on: hero word(s), primary button, glow halos behind product cards.
- One accent per surface. Never orange + gold both as solid CTAs in the same view.

### Typography
- **Display: Playfair Display** (serif, italic ligatures available). Used for h1/h2/h3 — gives the premium, almost-editorial weight. Italic + gold for inline accent words inside a headline.
- **Body: Manrope** (sans, geometric, readable). Used for everything else — paragraphs, buttons, labels, form fields.
- Pairing rule: serif display + sans body. Never mix Playfair into body copy.
- Numbers in stats use Manrope 700 with `font-feature-settings: "tnum"`.
- Inline italic Playfair in gold is the brand's "wink" — use once or twice per screen, never more.

### Backgrounds
- Plain `#0a0a0f` is the default. NO photographic backgrounds.
- Subtle decoration: a single radial **ember glow** (`--pm-grad-ember`) bleeding from one corner or behind product imagery. Very low opacity. Never full-screen gradients.
- A faint horizontal hairline (`rgba(255,255,255,0.06)`) separates major sections; never a hard divider.
- Optional: a slow-moving SVG noise/grain overlay at 3-4% opacity for texture (premium analog feel).

### Animation
- Default easing: `cubic-bezier(0.22, 1, 0.36, 1)` (out-expo) — swift in, soft out, never bouncy on UI chrome.
- **Spring** easing reserved for *delight* moments (hero card landing, success checkmark, badge pop).
- Durations: 160ms (hover), 280ms (modal/drawer), 520ms (hero entrances).
- Hero entrance: stagger lines of the headline by 60ms, fade-up 16px each.
- Hover on cards: lift 4px, border brightens to `--pm-line-3`, glow halo fades in. Never scale up beyond 1.02.
- Product imagery (cards/MP3 visualizer) idles with a 6-second slow rotate or float — the interface should feel *alive* even when nothing is happening.
- Page transitions: simple cross-fade, 200ms. No swooping page slides.

### Hover & press
- **Hover button:** background lightens to `--pm-orange-bright`, no scale.
- **Press button:** background deepens to `--pm-orange-deep`, scales to 0.98 for 80ms.
- **Hover card:** translateY(-4px), border 06% → 18% white, glow fades in.
- **Hover link:** underline grows from left, 200ms.
- **Hover icon button:** background `rgba(255,255,255,0.08)`, no color shift.
- Disabled: 40% opacity, `cursor: not-allowed`.

### Borders & shadows
- Default card border: `1px solid rgba(255,255,255,0.10)`. Hover: `0.18`.
- Focus ring: `0 0 0 2px var(--pm-orange)` outset — NEVER blue browser default.
- Shadows are only for elevated UI (modals, dropdowns) — flat cards rely on the lighter fill, not shadow. The **glow shadow** (`--pm-shadow-glow`) replaces shadow on hover for primary cards.

### Corner radii
- Inputs/buttons: `10–14px` (`--pm-r-sm` / `--pm-r-md`).
- Cards: `24px` (`--pm-r-lg`).
- Hero/feature blocks: `32px` (`--pm-r-xl`).
- Pills/badges: full pill (`--pm-r-pill`).
- NEVER sharp corners (0px) and never huge "bubble" radii (>40px) on rectangles.

### Layout
- Max content width: 1240px on desktop. Section vertical rhythm: 96px desktop / 64px mobile (`--pm-s-9` / `--pm-s-8`).
- 12-column grid implied; in practice flex/grid with `gap`.
- Sticky elements: only the top nav (translucent + backdrop blur), and the floating "Заказать" CTA on mobile.

### Transparency & blur
- Nav uses `backdrop-filter: blur(20px) saturate(140%)` over `rgba(10,10,15,0.7)`.
- Modals overlay scrim is `rgba(5,5,10,0.7)` + 10px blur.
- Otherwise opaque — no glassy panels everywhere.

### Imagery
- Photography: warm, slightly desaturated, candle/golden-hour palette. Never harsh white studio.
- Product mockups (the "song", the "video frame") are rendered as 3D-like cards with the **Flame gradient**, similar in spirit to the Carty inspiration — gradient surface, soft realistic shadow, subtle highlight at top.
- B&W detail shots OK if they have warm grain.

### Cards
- Fill `#1a1a26`, 1px line `rgba(255,255,255,0.10)`, radius 24px, padding 32px.
- A small uppercase label (`КАТЕГОРИЯ`) in `--pm-fg-3` sits at the top, then a serif h3 title, then sans body.
- Price chip: pill, gold gradient background, dark text — always bottom-right corner.

---

## ICONOGRAPHY

**Approach:** Outline icons with **2px stroke**, rounded caps and joins. The outline weight matches Manrope's weight at body size. Filled icons are reserved for primary CTAs and selected states only.

**Source:** No bespoke icon set was provided. We use **[Lucide](https://lucide.dev)** via CDN as the base set — it matches the desired stroke style closely. Icons are inlined as SVG (not icon font).

```html
<!-- Example: lucide loaded as ESM -->
<script type="module">
  import { createIcons, icons } from 'https://unpkg.com/lucide@latest/dist/esm/lucide.js';
  createIcons({ icons });
</script>
<i data-lucide="music" class="pm-icon"></i>
```

**Sizes:** 16, 20, 24, 32px. Default is 20px next to body text.
**Color:** `currentColor` — inherits from text. On accent buttons, that's `--pm-fg-on-accent`.

**Brand glyphs (custom SVG, in `assets/icons/`)**
- `assets/icons/logo-mark.svg` — stylized "П" inside a flame circle.
- `assets/icons/logo-full.svg` — wordmark "ПодариМомент" in Playfair italic.
- `assets/icons/sparkle.svg` — 4-point gold sparkle (used as decoration around success/premium states).
- `assets/icons/flame.svg` — small flame mark for the badge.

**Emoji:** Discouraged. Permitted only for tiny inline celebratory accents (`🎉` in a toast, `✨` rare). Never as a list bullet.

**Unicode chars as icons:** Allowed for arrows in editorial contexts (`→`, `↗`) where the line should look like type, not chrome.

> **Substitution flag:** The brief did not provide a logo or icons. The `logo-mark.svg`, `logo-full.svg`, `sparkle.svg`, and `flame.svg` in `assets/icons/` are **placeholders we drew using brand tokens**. Please supply real logo files; we'll swap them in everywhere they're referenced.

> **Font flag:** Playfair Display + Manrope are loaded from Google Fonts CDN — no local font files were shipped or required.

---

## INDEX — what's in this folder

```
README.md                    ← you are here
SKILL.md                     ← Claude Skill manifest (cross-compatible with Code)
colors_and_type.css          ← all CSS variables + base type styles
assets/
  inspiration-*.webp         ← Carty + NexusSci mood refs
  icons/
    logo-mark.svg            ← placeholder logo mark
    logo-full.svg            ← placeholder wordmark
    sparkle.svg
    flame.svg
preview/                     ← design-system preview cards
  type-display.html
  type-body.html
  ...
ui_kits/
  website/
    README.md
    index.html               ← interactive demo of the marketing + order flow
    Hero.jsx
    ProductCards.jsx
    OrderForm.jsx
    Nav.jsx
    Footer.jsx
    SuccessScreen.jsx
    AdminTable.jsx
```

---

## Quick start

1. Link `colors_and_type.css` in your `<head>`.
2. Use the CSS variables (`var(--pm-orange)`, `var(--pm-bg)`, etc.) — never hardcode brand hex codes.
3. Apply semantic classes: `.pm-h1`, `.pm-body`, `.pm-caps`.
4. Lift JSX components from `ui_kits/website/` for the marketing site.
5. Read `SKILL.md` if you're using this as a Claude/Claude Code skill.

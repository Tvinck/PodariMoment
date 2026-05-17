# ПодариМомент

AI-сервис подарков: ИИ-песни, видео из фото, голос знаменитостей, **голос-анонс для гендер-пати** и др. Готовый файл за 5 минут.

**Production:** https://podarimoment.ru (после деплоя)
**Дизайн-система:** [`Des/README.md`](./Des/README.md)
**UI-кит:** [`Des/ui_kits/website/README.md`](./Des/ui_kits/website/README.md)

---

## Локальная разработка

```bash
# Запустить статический сайт (Python ≥ 3.8, без зависимостей)
python3 Des/ui_kits/website/serve.py 8080
# или через npm:
npm run dev

# Проверить production-сборку локально
npm run preview
```

Открыть `http://localhost:8080/`. Поддерживаются глубокие ссылки:

| URL | Раздел |
|---|---|
| `/` | Лендинг |
| `/order/gender` | **Голос для гендер-пати** (новое) |
| `/order/song` · `/order/video` · `/order/star` · `/order/animate` · `/order/photo` · `/order/postcard` · `/order/logo` · `/order/card` · `/order/market` | Формы продуктов |
| `/catalog` | Каталог работ |
| `/account` | Личный кабинет |
| `/admin` | Админка (пароль `admin` в демо) |
| `/des-preview/components-gender.html` | Дизайн-референс |

---

## Деплой на Vercel

1. На `vercel.com/new` импортировать репозиторий `Tvinck/PodariMoment`.
2. Vercel автоматически прочитает `vercel.json` — `buildCommand: node build.js`, `outputDirectory: dist`.
3. **Environment Variables** — добавить ключи из [`.env.example`](./.env.example) (Settings → Environment Variables). Production-, Preview- и Development-области заполняются раздельно.
4. Подключить домен `подаримомент.рф` / `podarimoment.ru` в Settings → Domains.

Preview-деплой создаётся автоматически на каждый PR.

### Что делает `build.js`
- Копирует `Des/ui_kits/website/*` → `dist/`
- Прокладывает `dist/des-preview/*` (дизайн-референсы) и `dist/des-assets/*` (бренд-ассеты)
- Кладёт `colors_and_type.css` в корень `dist/` для preview-страниц

### SPA-rewrites
`vercel.json` отправляет все известные пути (`/order/*`, `/admin`, `/catalog`, ...) на `/index.html`, где History API роутер открывает нужный вид.

---

## Структура

```
.
├── Des/                          # Дизайн-система и UI-кит
│   ├── README.md                 # Бренд-гайдлайны, типографика, цвета
│   ├── colors_and_type.css       # Все CSS-токены
│   ├── assets/                   # Иконки, инспирация
│   ├── preview/                  # 20 design reference cards
│   └── ui_kits/website/          # Готовый интерактивный SPA-кит
│       ├── index.html            # Полный SPA с роутингом
│       ├── styles.css            # Стили React-кита
│       ├── serve.py              # Лёгкий dev-сервер с SPA-fallback
│       ├── *.jsx                 # React-компоненты (ProductCards, OrderForm,
│       │                         #   GenderFields, Hero, Nav, …)
│       └── README.md
├── vercel.json                   # Конфиг деплоя + rewrites + headers
├── build.js                      # Сборка статики в dist/
├── package.json                  # npm scripts (dev, build, preview)
├── .env.example                  # Шаблон переменных окружения
└── .gitignore                    # Игнор .env, dist, node_modules, .vercel
```

---

## Безопасность

- **Никаких секретов в репо.** Все ключи — через Vercel Environment Variables или локальный `.env.local` (gitignored).
- `vercel.json` выставляет `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, отключает FLoC/Topics.
- Статика кешируется на 1 год (`immutable`), HTML — без кеша (Vercel default).
- Админка пока за фронт-паролем (`admin`) — **не для прода**. Перед публичным запуском заменить на NextAuth/JWT с `ADMIN_PASSWORD_HASH` из `.env`.

---

## Roadmap

- [x] Дизайн-система v1
- [x] UI-кит SPA (10 продуктов)
- [x] Гендер-пати: voice-preview, Reveal Stage, шаблоны сценариев
- [x] History API роутинг
- [x] Vercel-конфиг
- [ ] Интеграция TTS (ElevenLabs / Yandex SpeechKit)
- [ ] Платёжный шлюз (ЮKassa)
- [ ] Email-доставка готовых файлов (Resend)
- [ ] Real auth для админки
- [ ] CMS для каталога работ

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
| `/admin` | Админка (пароль из env `ADMIN_PASSWORD`, проверка на сервере) |
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

- **Никаких секретов в репо.** Все ключи — через Vercel Environment Variables или локальный `.env.local` (gitignored). В браузер (`window.__ENV__`) попадают только публичные `SUPABASE_URL` и `ANON_KEY`.
- **Service-role и `ADMIN_PASSWORD` — только на сервере.** Кабинет и админка работают через serverless-функции; ключи и пароль не покидают бэкенд. Пароль админки проверяется `timingSafeEqual` в `api/_lib/admin.js`.
- **Оплата.** `payment-callback` проверяет SHA-256 подпись Т-Банк (`verifyToken`); при несовпадении — `400` + лог. Идемпотентность: повторное уведомление по уже оплаченному заказу не запускает генерацию заново.
- **Webhook Kie.ai** защищён секретом: `callBackUrl?secret=KIE_WEBHOOK_SECRET`, проверяется в `api/kie-callback`.
- **Rate limiting** (`api/_rateLimit.js`, in-memory per IP): payment-callback 100/мин, kie-callback 50/мин, my-orders 30/мин, admin-orders 10/мин → `429` при превышении.
- `vercel.json` выставляет `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, отключает FLoC/Topics.
- Статика кешируется на 1 год (`immutable`), HTML — без кеша (Vercel default).
- RLS на таблице `orders` включён; anon-доступа нет, запись — только service-role.

---

## Бэкенд: оплата и заказы

### Serverless-функции (`/api/`)
- `POST /api/payment-init` — создаёт заказ в Supabase (`pending`), инициализирует
  оплату через Т-Банк (Tinkoff `Init`), возвращает `{ paymentUrl }`.
- `POST /api/payment-callback` — уведомление Т-Банк: проверяет SHA-256 токен,
  обновляет `payment_status` (`paid`/`failed`), отвечает `OK`.

### Supabase
1. Создать проект на supabase.com.
2. Применить миграцию `supabase/migrations/0001_create_orders.sql`
   (SQL Editor или `supabase db push`).
3. Скопировать URL, anon key и service_role key в env.

### Т-Банк (Tinkoff) эквайринг
1. Подключить Т-Кассу: https://www.tinkoff.ru/kassa/
2. Взять Terminal Key и Password → `TBANK_TERMINAL_KEY`, `TBANK_PASSWORD`.
3. В ЛК указать NotificationURL `https://<домен>/api/payment-callback`.
4. Цена фиксирована: 599 ₽ (59900 копеек) в `api/payment-init.js`.

Обязательные env для оплаты: `TBANK_TERMINAL_KEY`, `TBANK_PASSWORD`,
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Roadmap

- [x] Дизайн-система v1
- [x] UI-кит SPA
- [x] Гендер-пати: voice-preview, Reveal Stage, шаблоны сценариев, демо-плеер
- [x] History API роутинг
- [x] Vercel-конфиг
- [x] Лендинг сфокусирован на гендер-пати (599 ₽)
- [x] Оплата через Т-Банк + заказы в Supabase
- [ ] Интеграция TTS (ElevenLabs / Yandex SpeechKit) → генерация файла
- [ ] Email-доставка готовых файлов (Resend)
- [ ] Реальные демо-голоса вместо placeholder MP3
- [ ] Real auth для админки
- [ ] Страницы оферты / политики / возврата (роуты offer/privacy/refund)

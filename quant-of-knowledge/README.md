# Квант·знаний — трекер заданий для студентов

Next.js 16 + React 19 + PostgreSQL + Drizzle ORM + Better Auth. Приложение работает со своей базой, серверными API и файловым хранилищем; внешний BaaS не требуется.

## Возможности

- Личные и групповые задания, дедлайны, приоритеты, вложения до 50 МБ.
- Предметы, недельный и месячный календарь, личное и групповое расписание.
- Группы с приглашениями; староста управляет групповыми заданиями и расписанием.
- Регистрация по почте, вход по телефону через OTP, Google/GitHub/Discord и Telegram.
- Профиль, экспорт данных, удаление аккаунта, автоматическая очистка выполненных заданий.

## Быстрый запуск для разработки

Требуется Node.js 20+ (рекомендуется Node.js 24).

```bash
npm install
npm run dev
```

Если `DATABASE_URL` не задан, режим разработки использует PGlite и сохраняет данные в `data/pglite`. Это локальный fallback для разработки и тестов, не production-замена PostgreSQL. Без SMTP и SMS-провайдера письма и OTP выводятся в консоль сервера.

## Запуск с PostgreSQL

1. Запустите PostgreSQL. При установленном Docker достаточно:

   ```bash
   docker compose up -d postgres
   ```

2. Скопируйте `.env.example` в `.env.local` и задайте как минимум:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/evermind
   BETTER_AUTH_SECRET=<случайная строка длиной не менее 32 символов>
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Выполните `npm run dev`. Схема создаётся автоматически при первом обращении к БД. Drizzle-схема находится в `lib/db/schema.ts`, начальная SQL-схема — в `lib/db/migration.ts`.

Для production `DATABASE_URL` и `BETTER_AUTH_SECRET` обязательны. Каталог `data/uploads` должен быть на постоянном диске или Docker volume.

## Дополнительные способы входа

Все настройки перечислены в `.env.example`.

- **Почта:** для подтверждения адреса установите `REQUIRE_EMAIL_VERIFICATION=true` и настройте `SMTP_URL`, `EMAIL_FROM`.
- **Телефон:** настройте `SMS_WEBHOOK_URL`. Приложение отправляет POST `{ "phoneNumber": "+...", "code": "..." }`; `SMS_WEBHOOK_SECRET` передаётся как Bearer token.
- **Google/GitHub/Discord:** задайте пару `*_CLIENT_ID` и `*_CLIENT_SECRET`. Callback Better Auth: `<BETTER_AUTH_URL>/api/auth/callback/<provider>`.
- **Telegram:** задайте `TELEGRAM_BOT_TOKEN` и `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, в BotFather разрешите домен приложения. Подпись Login Widget и свежесть `auth_date` проверяются на сервере.

Без соответствующих ключей внешние кнопки скрываются; вход по телефону доступен, но production требует SMS webhook.

## Команды

```bash
npm run dev          # разработка
npm run typecheck    # TypeScript
npm run check        # Biome
npm run build        # production-сборка
npm start            # production-сервер
npm run db:generate  # сформировать Drizzle-миграцию после изменения схемы
npm run db:studio    # Drizzle Studio
```

## Структура

```text
app/api/            # защищённые Route Handlers
lib/db/             # Drizzle-схема, подключение и начальная SQL-схема
lib/server/         # операции и серверные проверки прав
lib/auth.ts         # Better Auth, OAuth, email и phone OTP
lib/telegram-auth.ts# проверенный Telegram Login Widget flow
data/uploads/       # локальные вложения (постоянный volume в production)
```

Права проверяются на сервере для каждого API-запроса. Файлы выдаются только владельцу или участнику группы, которой доступно связанное задание.

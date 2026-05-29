# Свадебное приглашение — Алексей & Марина

Одностраничный светлый сайт-приглашение для GitHub Pages.

## Стек

- Vite
- React
- TypeScript
- localStorage для мгновенного локального сохранения RSVP
- Google Apps Script endpoint для отправки ответов в Google Sheets

## Запуск локально

```bash
npm install
npm run dev
```

Открыть:

```text
http://localhost:5173/?uuid=550e8400-e29b-41d4-a716-446655440000
```

## Дизайн

В проекте оставлена одна актуальная дизайн-концепция — `Pearl`. Плашка дизайна на сайте сохранена как индикатор текущей концепции.

Вариант можно открыть напрямую через параметр `design`:

```text
?design=pearl
```

Пример:

```text
http://localhost:5173/?uuid=550e8400-e29b-41d4-a716-446655440000&design=pearl
```

## Фотографии локаций

Для блока «Где встречаемся» используются файлы:

```text
public/images/opera-house.png
public/images/lauren-parker.png
```

Если этих файлов нет, сайт автоматически покажет встроенные SVG-заглушки.

## Формат уникальной ссылки

Используется query-параметр `uuid`:

```text
https://your-domain.example/?uuid=550e8400-e29b-41d4-a716-446655440000
```

Если `uuid` не передан или не похож на UUID, сайт создаст временный локальный UUID и сохранит ответы только на текущем устройстве.

## Подключение Google Sheets

1. Создать Google Sheet.
2. Открыть **Extensions → Apps Script**.
3. Вставить скрипт из `docs/google-apps-script.md`.
4. Опубликовать как **Web app**.
5. Полученный URL `/exec` добавить в `.env`:

```env
VITE_RSVP_ENDPOINT=https://script.google.com/macros/s/XXXXX/exec
```

6. Пересобрать и задеплоить сайт.

## Сборка

```bash
npm run build
```

Готовые файлы появятся в `dist/`.

## GitHub Pages

В проект добавлен workflow `.github/workflows/deploy.yml`.

Для endpoint можно создать repository variable:

```text
VITE_RSVP_ENDPOINT
```

Если переменная не задана, сайт всё равно работает, но RSVP сохраняется только в браузере.

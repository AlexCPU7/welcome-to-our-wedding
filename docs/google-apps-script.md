# Google Apps Script для RSVP в Google Sheets

Скрипт принимает ответы с сайта, ищет строку по ID гостя и обновляет её. Если ID ещё нет в таблице — добавляет новую строку.

## Что изменено для надёжности

- Таблица хранит один актуальный ответ на гостя: повторные отправки обновляют строку по `guest_uuid`.
- Каждый ответ имеет клиентскую версию (`client_revision`), поэтому старый запрос не перезапишет более новый ответ.
- Все операции записи выполняются под `LockService`, чтобы параллельные запросы не создали дубли.
- Запись в таблицу выполняется с повторами при временных ошибках Google Sheets.
- Колонки и значения в таблице — на русском языке.
- Каждый напиток записывается в отдельную колонку значением `1` или `0`.
- Отдельный лист `Сводка напитков` автоматически считает сумму по каждой колонке напитков. Формулы используют открытые диапазоны, поэтому новые строки будут попадать в расчёт сами.

Важно: при прямой отправке из статического сайта в Google Apps Script браузер использует `no-cors` и не может прочитать подтверждение записи от сервера. Это надёжно для доставки сетевого запроса, но не даёт математической гарантии 99.999% подтверждённой записи. Для такого уровня уверенности нужен промежуточный сервер/API с CORS, логами, мониторингом и подтверждением доставки.

## Инструкция

1. Создайте Google Sheet.
2. Откройте **Extensions → Apps Script**.
3. Замените содержимое `Code.gs` на код ниже.
4. Нажмите **Deploy → New deployment**.
5. Выберите тип **Web app**.
6. `Execute as`: **Me**.
7. `Who has access`: **Anyone**.
8. Скопируйте URL, который заканчивается на `/exec`.
9. Добавьте его в переменную окружения `VITE_RSVP_ENDPOINT`.

## Code.gs

```js
const SHEET_NAME = 'Ответы RSVP';
const SUMMARY_SHEET_NAME = 'Сводка напитков';

const HEADERS = [
  'ID гостя',
  'Присутствие на свадьбе',
  'Будет на церемонии в Царицыно',
  'Коньяк',
  'Водка',
  'Белое вино',
  'Красное вино',
  'Шампанское',
  'Не буду пить алкоголь',
  'Пищевые ограничения и аллергии',
  'Комментарий или пожелание',
  'Обновлено гостем',
  'Версия ответа',
  'Источник',
  'Первое получение',
  'Последнее получение',
  'Технический ID отправки',
];

const COLUMN = Object.freeze({
  GUEST_ID: 1,
  REVISION: 14,
  FIRST_RECEIVED_AT: 16,
});

const DRINK_COLUMNS = [
  { key: 'drink_cognac', legacyValue: 'cognac', label: 'Коньяк', columnNumber: 4 },
  { key: 'drink_vodka', legacyValue: 'vodka', label: 'Водка', columnNumber: 5 },
  { key: 'drink_white_wine', legacyValue: 'white_wine', label: 'Белое вино', columnNumber: 6 },
  { key: 'drink_red_wine', legacyValue: 'red_wine', label: 'Красное вино', columnNumber: 7 },
  { key: 'drink_champagne', legacyValue: 'champagne', label: 'Шампанское', columnNumber: 8 },
  { key: 'drink_no_alcohol', legacyValue: 'no_alcohol', label: 'Не буду пить алкоголь', columnNumber: 9 },
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  let hasLock = false;

  try {
    lock.waitLock(20000);
    hasLock = true;

    const payload = parsePayload(e);
    validatePayload(payload);

    const result = withRetries(function () {
      return upsertRsvp(payload);
    });

    return jsonResponse({ ok: true, result: result });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error) });
  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

function parsePayload(e) {
  const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  return JSON.parse(rawBody);
}

function validatePayload(payload) {
  if (!payload || !payload.guest_uuid) {
    throw new Error('ID гостя обязателен');
  }
}

function upsertRsvp(payload) {
  const sheet = getOrCreateSheet();
  ensureHeaders(sheet);
  ensureDrinkSummarySheet();

  const now = new Date().toISOString();
  const rowIndex = findRowByGuestId(sheet, payload.guest_uuid);
  const incomingRevision = normalizeRevision(payload.client_revision);

  if (rowIndex) {
    const currentRevision = normalizeRevision(sheet.getRange(rowIndex, COLUMN.REVISION).getValue());

    if (incomingRevision < currentRevision) {
      return {
        status: 'skipped_old_revision',
        currentRevision: currentRevision,
        incomingRevision: incomingRevision,
      };
    }
  }

  const firstReceivedAt = rowIndex
    ? sheet.getRange(rowIndex, COLUMN.FIRST_RECEIVED_AT).getValue() || now
    : now;

  const rowValues = [
    payload.guest_uuid,
    attendanceToRu(payload.attendance, payload.attendance_label),
    yesNoToRu(payload.ceremony, payload.ceremony_label),
    ...DRINK_COLUMNS.map(function (drink) {
      return drinkFlag(payload, drink.key, drink.legacyValue);
    }),
    sanitizeText(payload.allergies),
    sanitizeText(payload.comment),
    sanitizeText(payload.updated_at) || now,
    incomingRevision,
    sanitizeText(payload.source),
    firstReceivedAt,
    now,
    sanitizeText(payload.request_id),
  ];

  if (rowIndex) {
    sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  SpreadsheetApp.flush();

  return {
    status: rowIndex ? 'updated' : 'created',
    revision: incomingRevision,
  };
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders(sheet) {
  const maxColumns = Math.max(sheet.getLastColumn(), HEADERS.length);
  sheet.getRange(1, 1, 1, maxColumns).clearContent();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);

  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f4efe8');
}

function ensureDrinkSummarySheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SUMMARY_SHEET_NAME) || spreadsheet.insertSheet(SUMMARY_SHEET_NAME);

  sheet.getRange(1, 1, 1, 2).setValues([['Напиток', 'Количество гостей']]);
  sheet.getRange(2, 1, DRINK_COLUMNS.length, 1).setValues(
    DRINK_COLUMNS.map(function (drink) {
      return [drink.label];
    }),
  );
  sheet.getRange(2, 2, DRINK_COLUMNS.length, 1).setFormulas(
    DRINK_COLUMNS.map(function (drink) {
      return [makeOpenSumFormula(drink.columnNumber)];
    }),
  );

  const totalRow = DRINK_COLUMNS.length + 3;
  sheet.getRange(totalRow, 1, 1, 2).setValues([['Всего гостей с ответом', '']]);
  sheet.getRange(totalRow, 2).setFormula("=COUNTA('" + SHEET_NAME + "'!A2:A)");

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f4efe8');
  sheet.getRange(2, 2, DRINK_COLUMNS.length, 1).setNumberFormat('0');
  sheet.getRange(totalRow, 1, 1, 2).setFontWeight('bold');
  sheet.autoResizeColumns(1, 2);
}

function makeOpenSumFormula(columnNumber) {
  const columnLetter = columnNumberToLetter(columnNumber);
  return "=SUM('" + SHEET_NAME + "'!" + columnLetter + '2:' + columnLetter + ')';
}

function columnNumberToLetter(columnNumber) {
  let columnLetter = '';
  let current = columnNumber;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
    current = Math.floor((current - 1) / 26);
  }

  return columnLetter;
}

function findRowByGuestId(sheet, guestId) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const values = sheet.getRange(2, COLUMN.GUEST_ID, lastRow - 1, 1).getValues();

  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === String(guestId)) {
      return index + 2;
    }
  }

  return null;
}

function attendanceToRu(value, fallback) {
  if (fallback) {
    return sanitizeText(fallback);
  }

  if (value === 'yes') {
    return 'Да, буду';
  }

  if (value === 'no') {
    return 'К сожалению, не смогу';
  }

  return '';
}

function yesNoToRu(value, fallback) {
  if (fallback) {
    return sanitizeText(fallback);
  }

  if (value === 'yes') {
    return 'Да';
  }

  if (value === 'no') {
    return 'Нет';
  }

  return '';
}

function drinkFlag(payload, key, legacyValue) {
  if (payload[key] === 1 || payload[key] === '1' || payload[key] === true) {
    return 1;
  }

  if (Array.isArray(payload.drinks) && payload.drinks.indexOf(legacyValue) !== -1) {
    return 1;
  }

  return 0;
}

function normalizeRevision(value) {
  const revision = Number(value);
  return Number.isFinite(revision) && revision >= 0 ? revision : 0;
}

function sanitizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function withRetries(callback) {
  const delaysMs = [0, 300, 900, 1800];
  let lastError = null;

  for (let index = 0; index < delaysMs.length; index += 1) {
    if (delaysMs[index] > 0) {
      Utilities.sleep(delaysMs[index]);
    }

    try {
      return callback();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Важно про Apps Script и CORS

Frontend отправляет запросы в Google Apps Script в режиме `no-cors`, потому что это самый простой вариант для статического сайта на GitHub Pages. Запрос доходит до Apps Script, но браузер не может прочитать JSON-ответ. Поэтому сайт дополнительно:

- сохраняет ответ в `localStorage` до сетевой отправки;
- повторяет отправку при ошибке сети;
- повторяет отправку при возвращении онлайн;
- делает аварийную отправку через `sendBeacon`, если пользователь закрывает страницу;
- отправляет `client_revision`, чтобы таблица не приняла старую версию поверх новой.

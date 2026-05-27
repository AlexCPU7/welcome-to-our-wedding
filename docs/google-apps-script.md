# Google Apps Script для RSVP в Google Sheets

Скрипт принимает ответы с сайта, ищет строку по `guest_uuid` и обновляет её. Если UUID ещё нет в таблице — добавляет новую строку.

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
const SHEET_NAME = 'RSVP';

const HEADERS = [
  'guest_uuid',
  'attendance',
  'ceremony',
  'drinks',
  'allergies',
  'comment',
  'updated_at',
  'first_received_at',
  'last_received_at',
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');

    if (!payload.guest_uuid) {
      return jsonResponse({ ok: false, error: 'guest_uuid is required' });
    }

    const sheet = getOrCreateSheet();
    ensureHeaders(sheet);

    const now = new Date().toISOString();
    const rowIndex = findRowByUuid(sheet, payload.guest_uuid);
    const firstReceivedAt = rowIndex ? sheet.getRange(rowIndex, 8).getValue() || now : now;

    const rowValues = [
      payload.guest_uuid,
      payload.attendance || '',
      payload.ceremony || '',
      Array.isArray(payload.drinks) ? payload.drinks.join(', ') : '',
      payload.allergies || '',
      payload.comment || '',
      payload.updated_at || now,
      firstReceivedAt,
      now,
    ];

    if (rowIndex) {
      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = currentHeaders.some(Boolean);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function findRowByUuid(sheet, uuid) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let index = 0; index < values.length; index += 1) {
    if (values[index][0] === uuid) {
      return index + 2;
    }
  }

  return null;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Важно про Apps Script и CORS

Frontend отправляет запросы в Google Apps Script в режиме `no-cors`, потому что это самый простой и устойчивый вариант для статического сайта на GitHub Pages. Запрос доходит до таблицы, но браузер не может прочитать JSON-ответ. Поэтому сайт считает отправку успешной, если сам сетевой запрос не упал.

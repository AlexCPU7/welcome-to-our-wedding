const SHEET_NAME = 'Ответы RSVP';
const SUMMARY_SHEET_NAME = 'Сводка напитков';
const DEFAULT_GUEST_COUNT = 2;

const HEADERS = [
  'ID гостя',
  'Имена гостей',
  'Количество гостей',
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
  GUEST_NAMES: 2,
  GUEST_COUNT: 3,
  ATTENDANCE: 4,
  CEREMONY: 5,
  ALLERGIES: 12,
  COMMENT: 13,
  UPDATED_AT: 14,
  REVISION: 15,
  SOURCE: 16,
  FIRST_RECEIVED_AT: 17,
  LAST_RECEIVED_AT: 18,
  REQUEST_ID: 19,
});

const DRINK_COLUMNS = [
  { key: 'drink_cognac', legacyValue: 'cognac', label: 'Коньяк', columnNumber: 6 },
  { key: 'drink_vodka', legacyValue: 'vodka', label: 'Водка', columnNumber: 7 },
  { key: 'drink_white_wine', legacyValue: 'white_wine', label: 'Белое вино', columnNumber: 8 },
  { key: 'drink_red_wine', legacyValue: 'red_wine', label: 'Красное вино', columnNumber: 9 },
  { key: 'drink_champagne', legacyValue: 'champagne', label: 'Шампанское', columnNumber: 10 },
  { key: 'drink_no_alcohol', legacyValue: 'no_alcohol', label: 'Не буду пить алкоголь', columnNumber: 11 },
];

const CALLBACK_PATTERN = /^[A-Za-z_$][0-9A-Za-z_$]*(?:\.[A-Za-z_$][0-9A-Za-z_$]*)*$/;

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

function doGet(e) {
  const lock = LockService.getScriptLock();
  let hasLock = false;

  try {
    lock.waitLock(20000);
    hasLock = true;

    const parameter = e && e.parameter ? e.parameter : {};
    const action = parameter.action || 'getRsvp';

    if (action !== 'getRsvp') {
      return scriptResponse(e, { ok: true, result: { status: 'ready' } });
    }

    const guestId = parameter.guest_uuid !== undefined ? String(parameter.guest_uuid) : String(parameter.uuid || '');

    if (guestId === '') {
      throw new Error('ID гостя обязателен');
    }

    return scriptResponse(e, {
      ok: true,
      result: getRsvp(guestId),
    });
  } catch (error) {
    console.error(error);
    return scriptResponse(e, { ok: false, error: String(error) });
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
  if (!payload || payload.guest_uuid === null || payload.guest_uuid === undefined || String(payload.guest_uuid) === '') {
    throw new Error('ID гостя обязателен');
  }
}

function upsertRsvp(payload) {
  const sheet = getOrCreateSheet();
  ensureDrinkSummarySheet();

  const now = new Date().toISOString();
  const guestId = String(payload.guest_uuid);
  const rowIndex = findRowByGuestId(sheet, guestId);
  const incomingRevision = normalizeRevision(payload.client_revision);

  if (rowIndex) {
    const currentRevision = normalizeRevision(sheet.getRange(rowIndex, COLUMN.REVISION).getValue());

    if (incomingRevision <= currentRevision) {
      return {
        status: 'skipped_stale_or_duplicate_revision',
        currentRevision: currentRevision,
        incomingRevision: incomingRevision,
      };
    }
  }

  const firstReceivedAt = rowIndex
    ? sheet.getRange(rowIndex, COLUMN.FIRST_RECEIVED_AT).getValue() || now
    : now;

  const responseValues = [
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
    ensureDefaultGuestCount(sheet, rowIndex);
    sheet.getRange(rowIndex, COLUMN.ATTENDANCE, 1, responseValues.length).setValues([responseValues]);
  } else {
    sheet.appendRow([
      guestId,
      '',
      DEFAULT_GUEST_COUNT,
      ...responseValues,
    ]);
  }

  SpreadsheetApp.flush();

  return {
    status: rowIndex ? 'updated' : 'created',
    revision: incomingRevision,
  };
}

function getRsvp(guestId) {
  const sheet = getOrCreateSheet();
  const rowIndex = findRowByGuestId(sheet, guestId);

  if (!rowIndex) {
    return {
      status: 'not_found',
      guest_uuid: guestId,
    };
  }

  const row = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];

  return {
    status: 'found',
    guest_uuid: String(row[COLUMN.GUEST_ID - 1]),
    guest_names: sanitizeText(row[COLUMN.GUEST_NAMES - 1]),
    guest_count: normalizeGuestCount(row[COLUMN.GUEST_COUNT - 1]),
    answers: readAnswersFromRow(row),
    updated_at: sanitizeText(row[COLUMN.UPDATED_AT - 1]),
    client_revision: normalizeRevision(row[COLUMN.REVISION - 1]),
    last_received_at: sanitizeText(row[COLUMN.LAST_RECEIVED_AT - 1]),
  };
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  ensureSheetLayout(sheet);
  ensureDefaultGuestCounts(sheet);
  return sheet;
}

function ensureSheetLayout(sheet) {
  migrateOldLayoutIfNeeded(sheet);

  if (sheet.getMaxColumns() < HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), HEADERS.length - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);

  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f4efe8');

  sheet.getRange(1, COLUMN.GUEST_ID, sheet.getMaxRows(), 1).setNumberFormat('@');
  sheet.getRange(1, COLUMN.GUEST_COUNT, sheet.getMaxRows(), 1).setNumberFormat('0');
}

function migrateOldLayoutIfNeeded(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
    return String(value || '').trim();
  });
  const alreadyNewLayout =
    headers[COLUMN.GUEST_NAMES - 1] === HEADERS[COLUMN.GUEST_NAMES - 1] &&
    headers[COLUMN.GUEST_COUNT - 1] === HEADERS[COLUMN.GUEST_COUNT - 1];
  const looksLikeOldLayout =
    headers[0] === 'ID гостя' &&
    headers[1] === 'Присутствие на свадьбе';

  if (!alreadyNewLayout && looksLikeOldLayout) {
    sheet.insertColumnsAfter(1, 2);
  }
}

function ensureDefaultGuestCount(sheet, rowIndex) {
  const range = sheet.getRange(rowIndex, COLUMN.GUEST_COUNT);
  const value = range.getValue();

  if (value === null || value === undefined || String(value).trim() === '') {
    range.setValue(DEFAULT_GUEST_COUNT);
  }
}

function ensureDefaultGuestCounts(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  const rowCount = lastRow - 1;
  const guestIds = sheet.getRange(2, COLUMN.GUEST_ID, rowCount, 1).getValues();
  const guestCountsRange = sheet.getRange(2, COLUMN.GUEST_COUNT, rowCount, 1);
  const guestCounts = guestCountsRange.getValues();
  let hasChanges = false;

  for (let index = 0; index < rowCount; index += 1) {
    const hasGuestId = String(guestIds[index][0] || '').trim() !== '';
    const hasGuestCount = String(guestCounts[index][0] || '').trim() !== '';

    if (hasGuestId && !hasGuestCount) {
      guestCounts[index][0] = DEFAULT_GUEST_COUNT;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    guestCountsRange.setValues(guestCounts);
  }
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
  sheet.getRange(totalRow, 2).setFormula(makeAnsweredGuestsFormula());

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

function makeAnsweredGuestsFormula() {
  const separator = getFormulaArgumentSeparator();
  const countColumn = columnNumberToLetter(COLUMN.GUEST_COUNT);
  const markerColumn = columnNumberToLetter(COLUMN.UPDATED_AT);
  const countRange = "'" + SHEET_NAME + "'!" + countColumn + '2:' + countColumn;
  const markerRange = "'" + SHEET_NAME + "'!" + markerColumn + '2:' + markerColumn;

  return '=IFERROR(SUMIF(' + markerRange + separator + '"<>"' + separator + countRange + ')' + separator + '0)';
}

function getFormulaArgumentSeparator() {
  const locale = String(SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetLocale() || '').toLowerCase();
  const semicolonLocales = /^(ru|uk|be|bg|cs|da|de|el|es|et|fi|fr|hr|hu|it|lt|lv|nl|no|pl|pt|ro|sk|sl|sr|sv|tr)/;

  return semicolonLocales.test(locale) ? ';' : ',';
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

function readAnswersFromRow(row) {
  return {
    attendance: attendanceFromRu(row[COLUMN.ATTENDANCE - 1]),
    ceremony: yesNoFromRu(row[COLUMN.CEREMONY - 1]),
    drinks: DRINK_COLUMNS
      .filter(function (drink) {
        return Number(row[drink.columnNumber - 1]) === 1;
      })
      .map(function (drink) {
        return drink.legacyValue;
      }),
    allergies: sanitizeText(row[COLUMN.ALLERGIES - 1]),
    comment: sanitizeText(row[COLUMN.COMMENT - 1]),
  };
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

function attendanceFromRu(value) {
  const text = sanitizeText(value);

  if (text === 'yes' || text === 'Да, буду') {
    return 'yes';
  }

  if (text === 'no' || text === 'К сожалению, не смогу') {
    return 'no';
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

function yesNoFromRu(value) {
  const text = sanitizeText(value);

  if (text === 'yes' || text === 'Да') {
    return 'yes';
  }

  if (text === 'no' || text === 'Нет') {
    return 'no';
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

function normalizeGuestCount(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return DEFAULT_GUEST_COUNT;
  }

  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : DEFAULT_GUEST_COUNT;
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

function scriptResponse(e, payload) {
  const callback = e && e.parameter ? e.parameter.callback : '';

  if (callback && CALLBACK_PATTERN.test(callback)) {
    return ContentService
      .createTextOutput(String(callback) + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return jsonResponse(payload);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

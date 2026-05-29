import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RSVP_ENDPOINT } from '../data/wedding';
import type { GuestIdentity } from '../services/guest';
import { loadRsvpFromServer, sendRsvpBeacon, submitRsvp } from '../services/rsvpApi';
import { loadRsvpAnswers, loadStoredRsvp, markRsvpSynced, saveRsvpLocally } from '../services/storage';
import {
  noAlcoholDrinkOptions,
  rsvpDrinkOptions,
  type DrinkOption,
  type RsvpAnswers,
  type StoredRsvp,
  type YesNo,
} from '../types/rsvp';

type RsvpFormProps = {
  guest: GuestIdentity;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'local-only' | 'error';
type RemoteLoadState = 'loading' | 'ready' | 'error';

const SAVE_STATUS_HIDE_DELAY_MS: Partial<Record<SaveState, number>> = {
  saved: 2000,
  'local-only': 2000,
  error: 6000,
};

const yesNoOptions: Array<{ value: YesNo; label: string }> = [
  { value: 'yes', label: 'Да' },
  { value: 'no', label: 'Нет' },
];

const attendanceOptions: Array<{ value: YesNo; label: string }> = [
  { value: 'yes', label: 'Да, буду' },
  { value: 'no', label: 'К сожалению, не смогу' },
];

function statusText(state: SaveState) {
  switch (state) {
    case 'saving':
      return 'Сохраняем...';
    case 'saved':
      return 'Сохранено';
    case 'local-only':
      return 'Сохранено на устройстве';
    case 'error':
      return 'Не удалось отправить, но ответ сохранён на устройстве';
    default:
      return 'Заполните ответы — они сохранятся автоматически';
  }
}

function SaveStatusToast({ className, state }: { className: string; state: SaveState }) {
  return createPortal(
    <div className={className} role="alert" aria-live="assertive">
      <span aria-hidden="true" />
      {statusText(state)}
    </div>,
    document.body,
  );
}

export function RsvpForm({ guest }: RsvpFormProps) {
  const canSyncToExternalService = Boolean(RSVP_ENDPOINT);
  const [answers, setAnswers] = useState<RsvpAnswers>(() => loadRsvpAnswers(guest.uuid));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastError, setLastError] = useState('');
  const [remoteLoadState, setRemoteLoadState] = useState<RemoteLoadState>(() =>
    canSyncToExternalService ? 'loading' : 'ready',
  );
  const [remoteLoadError, setRemoteLoadError] = useState('');
  const isFirstRenderRef = useRef(true);
  const hasUserEditedAnswersRef = useRef(false);
  const skipNextAutoSaveRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const statusHideTimerRef = useRef<number | null>(null);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const showTemporaryStatus = useCallback((state: SaveState) => {
    setSaveState(state);

    if (statusHideTimerRef.current) {
      window.clearTimeout(statusHideTimerRef.current);
    }

    const hideDelayMs = SAVE_STATUS_HIDE_DELAY_MS[state];

    if (hideDelayMs) {
      statusHideTimerRef.current = window.setTimeout(() => {
        setSaveState('idle');
      }, hideDelayMs);
    }
  }, []);

  const applyAnswersWithoutAutoSave = useCallback((stored: StoredRsvp) => {
    skipNextAutoSaveRef.current = true;
    setAnswers(stored.answers);
  }, []);

  const syncStoredAnswers = useCallback(
    async (stored: StoredRsvp, attempt = 0) => {
      if (!canSyncToExternalService) {
        showTemporaryStatus('local-only');
        return;
      }

      const current = loadStoredRsvp(guest.uuid);

      if (!current || current.revision !== stored.revision) {
        return;
      }

      showTemporaryStatus('saving');
      setLastError('');

      const result = await submitRsvp({
        guestUuid: guest.uuid,
        answers: stored.answers,
        updatedAt: stored.updatedAt,
        revision: stored.revision,
      });

      if (result.status === 'success') {
        const synced = markRsvpSynced(guest.uuid, stored.answers, stored.revision, stored.updatedAt);

        if (synced?.revision === stored.revision && !synced.pendingSync) {
          clearRetryTimer();
          showTemporaryStatus('saved');
        }

        return;
      }

      if (result.status === 'skipped') {
        showTemporaryStatus('local-only');
        return;
      }

      setLastError(result.message);
      showTemporaryStatus('error');

      const latest = loadStoredRsvp(guest.uuid);

      if (latest?.revision === stored.revision && latest.pendingSync) {
        clearRetryTimer();

        const delayMs = Math.min(120000, 2500 * 2 ** Math.min(attempt, 5));
        const jitterMs = Math.round(Math.random() * 900);

        retryTimerRef.current = window.setTimeout(() => {
          void syncStoredAnswers(stored, attempt + 1);
        }, delayMs + jitterMs);
      }
    },
    [canSyncToExternalService, clearRetryTimer, guest.uuid, showTemporaryStatus],
  );

  useEffect(() => {
    let isCancelled = false;

    if (!canSyncToExternalService) {
      setRemoteLoadState('ready');
      setRemoteLoadError('');
      return () => {
        isCancelled = true;
      };
    }

    setRemoteLoadState('loading');
    setRemoteLoadError('');

    const hydrateFromServer = async () => {
      const result = await loadRsvpFromServer(guest.uuid);

      if (isCancelled) {
        return;
      }

      if (result.status === 'success') {
        const latestLocal = loadStoredRsvp(guest.uuid);

        if (result.rsvp) {
          const localIsNewer = Boolean(latestLocal && latestLocal.revision > result.rsvp.revision);
          const localPendingIsNotOlder = Boolean(
            latestLocal?.pendingSync && latestLocal.revision >= result.rsvp.revision,
          );

          if (latestLocal && (localIsNewer || localPendingIsNotOlder)) {
            if (!latestLocal.pendingSync) {
              const pendingLocal = saveRsvpLocally(guest.uuid, latestLocal.answers, {
                pendingSync: true,
                revision: latestLocal.revision,
                updatedAt: latestLocal.updatedAt,
                lastSyncedAt: latestLocal.lastSyncedAt,
              });

              applyAnswersWithoutAutoSave(pendingLocal);
            }
          } else {
            const storedFromServer = saveRsvpLocally(guest.uuid, result.rsvp.answers, {
              pendingSync: false,
              revision: result.rsvp.revision,
              updatedAt: result.rsvp.updatedAt,
              lastSyncedAt: new Date().toISOString(),
            });

            applyAnswersWithoutAutoSave(storedFromServer);
          }
        } else if (latestLocal && latestLocal.revision > 0) {
          const pendingLocal = saveRsvpLocally(guest.uuid, latestLocal.answers, {
            pendingSync: true,
            revision: latestLocal.revision,
            updatedAt: latestLocal.updatedAt,
            lastSyncedAt: latestLocal.lastSyncedAt,
          });

          applyAnswersWithoutAutoSave(pendingLocal);
        }

        setRemoteLoadState('ready');
        return;
      }

      if (result.status === 'skipped') {
        setRemoteLoadState('ready');
        return;
      }

      setRemoteLoadError(result.message);
      setRemoteLoadState('error');
    };

    void hydrateFromServer();

    return () => {
      isCancelled = true;
    };
  }, [applyAnswersWithoutAutoSave, canSyncToExternalService, guest.uuid]);

  useEffect(() => {
    if (remoteLoadState !== 'ready') {
      return;
    }

    const stored = loadStoredRsvp(guest.uuid);

    if (stored?.pendingSync && canSyncToExternalService) {
      void syncStoredAnswers(stored);
    }
  }, [canSyncToExternalService, guest.uuid, remoteLoadState, syncStoredAnswers]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    if (remoteLoadState !== 'ready') {
      return;
    }

    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    if (!hasUserEditedAnswersRef.current) {
      return;
    }

    const stored = saveRsvpLocally(guest.uuid, answers, {
      pendingSync: canSyncToExternalService,
    });

    if (canSyncToExternalService) {
      showTemporaryStatus('saving');
    } else {
      showTemporaryStatus('local-only');
    }

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }

    clearRetryTimer();

    syncTimerRef.current = window.setTimeout(() => {
      void syncStoredAnswers(stored);
    }, 650);

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [
    answers,
    canSyncToExternalService,
    clearRetryTimer,
    guest.uuid,
    remoteLoadState,
    showTemporaryStatus,
    syncStoredAnswers,
  ]);

  useEffect(() => {
    return () => {
      if (statusHideTimerRef.current) {
        window.clearTimeout(statusHideTimerRef.current);
      }

      clearRetryTimer();
    };
  }, [clearRetryTimer]);

  useEffect(() => {
    const handleOnline = () => {
      if (remoteLoadState !== 'ready') {
        return;
      }

      const stored = loadStoredRsvp(guest.uuid);

      if (stored?.pendingSync) {
        void syncStoredAnswers(stored);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [guest.uuid, remoteLoadState, syncStoredAnswers]);

  useEffect(() => {
    const flushPendingAnswer = () => {
      if (!canSyncToExternalService || remoteLoadState !== 'ready') {
        return;
      }

      const stored = loadStoredRsvp(guest.uuid);

      if (stored?.pendingSync) {
        sendRsvpBeacon({
          guestUuid: guest.uuid,
          answers: stored.answers,
          updatedAt: stored.updatedAt,
          revision: stored.revision,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingAnswer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flushPendingAnswer);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flushPendingAnswer);
    };
  }, [canSyncToExternalService, guest.uuid, remoteLoadState]);

  const updateAnswer = <Key extends keyof RsvpAnswers>(key: Key, value: RsvpAnswers[Key]) => {
    hasUserEditedAnswersRef.current = true;

    setAnswers((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleDrink = (drink: DrinkOption) => {
    hasUserEditedAnswersRef.current = true;

    setAnswers((current) => {
      if (noAlcoholDrinkOptions.includes(drink as (typeof noAlcoholDrinkOptions)[number])) {
        return {
          ...current,
          drinks: current.drinks.includes(drink) ? [] : [drink],
        };
      }

      const withoutNoAlcohol = current.drinks.filter(
        (item) => !noAlcoholDrinkOptions.includes(item as (typeof noAlcoholDrinkOptions)[number]),
      );
      const alreadySelected = withoutNoAlcohol.includes(drink);

      return {
        ...current,
        drinks: alreadySelected
          ? withoutNoAlcohol.filter((item) => item !== drink)
          : [...withoutNoAlcohol, drink],
      };
    });
  };

  const statusClassName = useMemo(() => `save-status save-status--${saveState}`, [saveState]);
  const isFormDisabled = remoteLoadState !== 'ready';

  return (
    <section className="content-section section-reveal" aria-labelledby="rsvp-title">
      <div className="section-kicker">RSVP</div>
      <div className="rsvp-heading">
        <div>
          <h2 id="rsvp-title">Пожалуйста, пройдите опрос</h2>
          <p className="body-copy">
            Мы очень стараемся сделать праздник незабываемым, поэтому будем рады, если Вы
            подтвердите свое присутствие и заполните анкету ниже, чтобы мы учли все детали.
          </p>
          <p className="rsvp-heading__note">Ответы сохраняются автоматически после каждого изменения.</p>
        </div>
      </div>

      {remoteLoadState === 'loading' ? (
        <p className="rsvp-dev-note">
          Загружаем ранее сохранённые ответы по вашему UUID. Анкета откроется после синхронизации.
        </p>
      ) : null}

      {remoteLoadState === 'error' ? (
        <p className="rsvp-error">
          Не удалось загрузить ранее сохранённые ответы, поэтому редактирование временно
          заблокировано, чтобы случайно не перезаписать данные в таблице. Обновите страницу позже.
          {remoteLoadError ? <> Техническая деталь: {remoteLoadError}</> : null}
        </p>
      ) : null}

      <form className="rsvp-form" aria-busy={remoteLoadState === 'loading'} aria-disabled={isFormDisabled}>
        <fieldset className="question-card">
          <legend>Подтвердите, пожалуйста, своё присутствие на свадьбе</legend>
          <div className="option-grid option-grid--two">
            {attendanceOptions.map((option) => (
              <label className="choice-pill" key={option.value}>
                <input
                  type="radio"
                  name="attendance"
                  checked={answers.attendance === option.value}
                  disabled={isFormDisabled}
                  onChange={() => updateAnswer('attendance', option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="question-card">
          <legend>
            Планируете ли вы присутствовать на свадебной церемонии в музее-заповеднике «Царицыно»?
          </legend>
          <div className="option-grid option-grid--two">
            {yesNoOptions.map((option) => (
              <label className="choice-pill" key={option.value}>
                <input
                  type="radio"
                  name="ceremony"
                  checked={answers.ceremony === option.value}
                  disabled={isFormDisabled}
                  onChange={() => updateAnswer('ceremony', option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="question-card">
          <legend>Какие напитки вы предпочитаете?</legend>
          <p className="question-card__hint">
            Можно выбрать несколько вариантов. Варианты без алкоголя отменяют алкогольные напитки.
          </p>
          <div className="option-grid option-grid--drinks">
            {rsvpDrinkOptions.map((option) => (
              <label className="choice-pill" key={option.value}>
                <input
                  type="checkbox"
                  name="drinks"
                  checked={answers.drinks.includes(option.value)}
                  disabled={isFormDisabled}
                  onChange={() => toggleDrink(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="question-card question-card--field">
          <span>Есть ли у вас пищевые ограничения или аллергии?</span>
          <textarea
            value={answers.allergies}
            rows={3}
            placeholder="Например: не ем рыбу, аллергия на орехи..."
            disabled={isFormDisabled}
            onChange={(event) => updateAnswer('allergies', event.target.value)}
          />
        </label>

        <label className="question-card question-card--field">
          <span>Комментарий или пожелание для нас</span>
          <textarea
            value={answers.comment}
            rows={4}
            placeholder="Можно оставить музыкальное пожелание, вопрос или тёплые слова."
            disabled={isFormDisabled}
            onChange={(event) => updateAnswer('comment', event.target.value)}
          />
        </label>
      </form>

      {lastError ? <p className="rsvp-error">Техническая деталь: {lastError}</p> : null}
      {!canSyncToExternalService ? (
        <p className="rsvp-dev-note">
          Сейчас endpoint Google Apps Script не подключён, поэтому ответы сохраняются только в
          браузере. После добавления <code>VITE_RSVP_ENDPOINT</code> они будут дополнительно
          отправляться в Google Sheets.
        </p>
      ) : null}

      {saveState !== 'idle' ? <SaveStatusToast className={statusClassName} state={saveState} /> : null}
    </section>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RSVP_ENDPOINT } from '../data/wedding';
import type { GuestIdentity } from '../services/guest';
import { submitRsvp } from '../services/rsvpApi';
import { loadRsvpAnswers, loadStoredRsvp, markRsvpSynced, saveRsvpLocally } from '../services/storage';
import type { DrinkOption, RsvpAnswers, YesNo } from '../types/rsvp';

type RsvpFormProps = {
  guest: GuestIdentity;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'local-only' | 'error';

const yesNoOptions: Array<{ value: YesNo; label: string }> = [
  { value: 'yes', label: 'Да' },
  { value: 'no', label: 'Нет' },
];

const attendanceOptions: Array<{ value: YesNo; label: string }> = [
  { value: 'yes', label: 'Да, буду' },
  { value: 'no', label: 'К сожалению, не смогу' },
];

const drinkOptions: Array<{ value: DrinkOption; label: string }> = [
  { value: 'champagne', label: 'Шампанское' },
  { value: 'white_wine', label: 'Белое вино' },
  { value: 'red_wine', label: 'Красное вино' },
  { value: 'vodka', label: 'Водка' },
  { value: 'cognac', label: 'Коньяк' },
  { value: 'no_alcohol', label: 'Не пью алкоголь' },
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

export function RsvpForm({ guest }: RsvpFormProps) {
  const [answers, setAnswers] = useState<RsvpAnswers>(() => loadRsvpAnswers(guest.uuid));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastError, setLastError] = useState('');
  const isFirstRenderRef = useRef(true);
  const syncTimerRef = useRef<number | null>(null);
  const statusHideTimerRef = useRef<number | null>(null);

  const canSyncToExternalService = Boolean(RSVP_ENDPOINT);

  const showTemporaryStatus = useCallback((state: SaveState) => {
    setSaveState(state);

    if (statusHideTimerRef.current) {
      window.clearTimeout(statusHideTimerRef.current);
    }

    if (state === 'saved' || state === 'local-only' || state === 'error') {
      statusHideTimerRef.current = window.setTimeout(() => {
        setSaveState('idle');
      }, 6000);
    }
  }, []);

  const syncAnswers = useCallback(
    async (nextAnswers: RsvpAnswers) => {
      if (!canSyncToExternalService) {
        showTemporaryStatus('local-only');
        return;
      }

      showTemporaryStatus('saving');
      setLastError('');

      const result = await submitRsvp({
        guestUuid: guest.uuid,
        answers: nextAnswers,
      });

      if (result.status === 'success') {
        markRsvpSynced(guest.uuid, nextAnswers);
        showTemporaryStatus('saved');
        return;
      }

      if (result.status === 'skipped') {
        showTemporaryStatus('local-only');
        return;
      }

      setLastError(result.message);
      showTemporaryStatus('error');
    },
    [canSyncToExternalService, guest.uuid, showTemporaryStatus],
  );

  useEffect(() => {
    const stored = loadStoredRsvp(guest.uuid);

    if (stored?.pendingSync && canSyncToExternalService) {
      void syncAnswers(stored.answers);
    }
  }, [canSyncToExternalService, guest.uuid, syncAnswers]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    saveRsvpLocally(guest.uuid, answers, {
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

    syncTimerRef.current = window.setTimeout(() => {
      void syncAnswers(answers);
    }, 650);

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [answers, canSyncToExternalService, guest.uuid, showTemporaryStatus, syncAnswers]);

  useEffect(() => {
    return () => {
      if (statusHideTimerRef.current) {
        window.clearTimeout(statusHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      const stored = loadStoredRsvp(guest.uuid);

      if (stored?.pendingSync) {
        void syncAnswers(stored.answers);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [guest.uuid, syncAnswers]);

  const updateAnswer = <Key extends keyof RsvpAnswers>(key: Key, value: RsvpAnswers[Key]) => {
    setAnswers((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleDrink = (drink: DrinkOption) => {
    setAnswers((current) => {
      if (drink === 'no_alcohol') {
        return {
          ...current,
          drinks: current.drinks.includes('no_alcohol') ? [] : ['no_alcohol'],
        };
      }

      const withoutNoAlcohol = current.drinks.filter((item) => item !== 'no_alcohol');
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

  return (
    <section className="content-section section-reveal" aria-labelledby="rsvp-title">
      <div className="section-kicker">RSVP</div>
      <div className="rsvp-heading">
        <div>
          <h2 id="rsvp-title">Пожалуйста, пройдите опрос</h2>
          <p>
            Ответы сохраняются автоматически после каждого изменения. Отдельная кнопка отправки не
            нужна.
          </p>
        </div>
      </div>

      <form className="rsvp-form">
        <fieldset className="question-card">
          <legend>Подтвердите, пожалуйста, своё присутствие на свадьбе</legend>
          <div className="option-grid option-grid--two">
            {attendanceOptions.map((option) => (
              <label className="choice-pill" key={option.value}>
                <input
                  type="radio"
                  name="attendance"
                  checked={answers.attendance === option.value}
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
            Можно выбрать несколько вариантов. «Не пью алкоголь» отменяет остальные варианты.
          </p>
          <div className="option-grid option-grid--drinks">
            {drinkOptions.map((option) => (
              <label className="choice-pill" key={option.value}>
                <input
                  type="checkbox"
                  name="drinks"
                  checked={answers.drinks.includes(option.value)}
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
            onChange={(event) => updateAnswer('allergies', event.target.value)}
          />
        </label>

        <label className="question-card question-card--field">
          <span>Комментарий или пожелание для нас</span>
          <textarea
            value={answers.comment}
            rows={4}
            placeholder="Можно оставить музыкальное пожелание, вопрос или тёплые слова."
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

      {saveState !== 'idle' ? (
        <div className={statusClassName} role="alert" aria-live="assertive">
          <span aria-hidden="true" />
          {statusText(saveState)}
        </div>
      ) : null}
    </section>
  );
}

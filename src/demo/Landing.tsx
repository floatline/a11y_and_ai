import { useState, type Ref } from 'react';
import { Button } from '@gravity-ui/uikit';
import { useDemo } from '../hooks/useDemo';
import { CASES, FORMATS, QUESTS, getCase, type CaseId, type Format } from './cases';
import './demo.css';

type Platform = 'mac' | 'windows' | 'ios' | 'android' | 'keyboard';

const PLATFORMS: { id: Platform; title: string; how: string[] }[] = [
  {
    id: 'mac',
    title: 'Mac — VoiceOver',
    how: [
      'Включить и выключить: Cmd + F5.',
      'Следующий и предыдущий элемент: Control + Option + → и ←.',
      'Нажать: Control + Option + Пробел.',
      'Между кнопками и полями: Tab и Shift + Tab.',
      'Замолчать: Control.',
    ],
  },
  {
    id: 'windows',
    title: 'Windows — NVDA',
    how: [
      'Включить: Ctrl + Alt + N. Выключить: Insert + Q.',
      'Читать по порядку: стрелки ↓ и ↑.',
      'Между кнопками и полями: Tab и Shift + Tab.',
      'Нажать: Enter или Пробел.',
      'В поле ввода NVDA сам переходит в режим ввода; вернуться к чтению — Esc.',
      'Замолчать: Ctrl.',
    ],
  },
  {
    id: 'ios',
    title: 'iPhone — VoiceOver',
    how: [
      'Включить: Настройки → Универсальный доступ → VoiceOver. Выключить — там же.',
      'Следующий и предыдущий элемент: смахнуть одним пальцем вправо и влево.',
      'Нажать: двойное касание.',
      'Прокрутить: смахнуть тремя пальцами.',
      'Без VoiceOver квест проходится обычными касаниями.',
    ],
  },
  {
    id: 'android',
    title: 'Android — TalkBack',
    how: [
      'Включить: Настройки → Спец. возможности → TalkBack. Выключить — там же.',
      'Следующий и предыдущий элемент: смахнуть вправо и влево.',
      'Нажать: двойное касание.',
      'Прокрутить: смахнуть двумя пальцами.',
      'Без TalkBack квест проходится обычными касаниями.',
    ],
  },
  {
    id: 'keyboard',
    title: 'Без скринридера',
    how: [
      'Клавиатура: Tab и Shift + Tab — между элементами, Enter или Пробел — нажать, Esc — закрыть окно.',
      'Телефон: обычные касания.',
    ],
  },
];

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, but has touch points
  if (/iPhone|iPad|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mac/.test(ua)) return 'mac';
  if (/Windows/.test(ua)) return 'windows';
  return 'keyboard';
};

// Without a screen reader a blank screen leaves nothing to do, and on phones we don't turn one on.
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

export const Landing = ({ headingRef }: { headingRef: Ref<HTMLHeadingElement> }) => {
  const demo = useDemo();
  const [format, setFormat] = useState<Format>(demo.format);
  const [single, setSingle] = useState<CaseId | 'full'>('full');
  const [platform] = useState(detectPlatform);
  const formats = isTouch() ? FORMATS.filter((f) => f.id !== 'blank') : FORMATS;
  const mine = PLATFORMS.find((p) => p.id === platform)!;

  return (
    <section className="landing" aria-labelledby="landing-title">
      <h2 id="landing-title" ref={headingRef} tabIndex={-1} className="landing__title">
        Квест: ты — спикер конференции
      </h2>
      <p>
        Тебя позвали выступить на конференции. До доклада — несколько дел, и все они на сайтах{' '}
        <strong>с барьерами</strong>: так многие сайты работают для людей со скринридером. В конце — что именно
        мешало в каждом деле.
      </p>
      <ol className="landing__quest">
        {QUESTS.short.map((id) => (
          <li key={id}>{getCase(id).title}</li>
        ))}
      </ol>

      <fieldset className="demo-bar__fieldset">
        <legend>Как проходите</legend>
        {formats.map((f) => (
          <label key={f.id} className="demo-bar__option">
            <input
              type="radio"
              name="format"
              value={f.id}
              checked={format === f.id}
              onChange={() => setFormat(f.id)}
            />
            <span>
              <strong>{f.label}.</strong> {f.note}
            </span>
          </label>
        ))}
      </fieldset>

      <Button view="action" size="xl" onClick={() => demo.start(QUESTS.short, format)}>
        Начать квест
      </Button>

      <section className="landing__how" aria-labelledby="landing-how">
        <h3 id="landing-how">Как проходить на этом устройстве: {mine.title}</h3>
        <ul>
          {mine.how.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <details className="landing__details">
          <summary>Другие устройства</summary>
          {PLATFORMS.filter((p) => p.id !== platform).map((p) => (
            <div key={p.id}>
              <h4>{p.title}</h4>
              <ul>
                {p.how.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </details>
        <p className="demo-bar__note">
          Скринридер на своём телефоне включайте, только если знаете, как его выключить. Без него квест тоже
          проходится.
        </p>
      </section>

      <details className="landing__details">
        <summary>Выбрать отдельное задание</summary>
        <form
          className="landing__single"
          onSubmit={(e) => {
            e.preventDefault();
            demo.start(single === 'full' ? QUESTS.full : [single], format);
          }}
        >
          <fieldset className="demo-bar__fieldset">
            <legend>Задание</legend>
            <label className="demo-bar__option">
              <input
                type="radio"
                name="case"
                value="full"
                checked={single === 'full'}
                onChange={() => setSingle('full')}
              />
              <span>
                <strong>Полный квест.</strong> Все {QUESTS.full.length} дел спикера подряд.
              </span>
            </label>
            {CASES.map((c) => (
              <label key={c.id} className="demo-bar__option">
                <input
                  type="radio"
                  name="case"
                  value={c.id}
                  checked={single === c.id}
                  onChange={() => setSingle(c.id)}
                />
                <span>
                  <strong>{c.title}.</strong> {c.task}
                </span>
              </label>
            ))}
          </fieldset>
          <Button type="submit" view="outlined" size="l">
            Начать задание
          </Button>
        </form>
      </details>
    </section>
  );
};

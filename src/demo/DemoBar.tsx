import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox } from '@gravity-ui/uikit';
import { useDemo } from '../hooks/useDemo';
import { FAULTS, FAULT_INFO, FORMATS, getCase } from './cases';
import type { ItemResult } from './DemoContext';
import { Landing } from './Landing';
import './demo.css';

// Words, not «1:05»: NVDA reads a clock format as «one colon zero five».
const formatTime = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  return minutes ? `${minutes} мин ${total % 60} с` : `${total} с`;
};

const sumTime = (results: ItemResult[]) => results.reduce((sum, r) => sum + r.ms, 0);

const resultText = (r?: ItemResult) =>
  r ? `${r.skipped ? 'пропущено' : formatTime(r.ms)}${r.mistakes ? `, ошибок: ${r.mistakes}` : ''}` : '—';

export const DemoBar = () => {
  const demo = useDemo();
  const { phase, quest, itemIndex, itemDone, format, faults, runId, itemStartedAt, progress, results } = demo;
  const demoCase = getCase(demo.caseId);
  const pass = phase === 'hard';
  const lastResult = results[itemIndex];
  const nextCase = itemIndex < quest.length - 1 ? getCase(quest[itemIndex + 1]) : undefined;

  const [now, setNow] = useState(() => Date.now());
  const focusRef = useRef<HTMLHeadingElement>(null);
  // Always on the page, so changes are announced; written directly, it is not part of the visible UI.
  const liveRef = useRef<HTMLParagraphElement>(null);
  const say = (text: string) => {
    if (liveRef.current) liveRef.current.textContent = text;
  };

  useEffect(() => {
    if (!pass || itemDone) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [pass, itemDone]);

  // Each step replaces the page content, so move focus to its heading instead of losing it on <body>.
  // If the case already autofocused a field (the stealAutofocus fault), leave focus there and say the task instead,
  // or a screen reader user hears only «Email, edit» and never the task.
  useEffect(() => {
    if (runId === 0) return;
    // a stale task in the banner would be read twice in browse mode
    say('');
    if (document.activeElement?.closest('.demo-surface')) say(`Задание: ${demoCase.task}`);
    else focusRef.current?.focus();
  }, [phase, runId, itemIndex, itemDone, demoCase.task]);

  const doneSteps = progress.steps.filter(Boolean).length;

  useEffect(() => {
    // Not on the last step: the success card takes focus and says it, two announcements would overlap.
    if (doneSteps > 0 && !itemDone) say(`Выполнено шагов: ${doneSteps} из ${demoCase.steps.length}`);
  }, [doneSteps, itemDone, demoCase.steps.length]);
  const formatNote = FORMATS.find((f) => f.id === format)?.note;

  const questList = pass && quest.length > 1 && (
    <ol className="demo-bar__quest" aria-label="Дела спикера">
      {quest.map((id, i) => {
        const r = results[i];
        const state = r ? (r.skipped ? 'пропущено' : 'готово') : i === itemIndex ? 'сейчас' : 'впереди';
        return (
          <li key={id} className={`demo-bar__quest-item demo-bar__quest-item_${r ? 'done' : i === itemIndex ? 'current' : 'todo'}`}>
            <span aria-hidden="true">{r ? (r.skipped ? '– ' : '✓ ') : i === itemIndex ? '→ ' : '○ '}</span>
            {getCase(id).title}
            <span className="sr-only"> — {state}</span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      <header className="demo-bar">
        <div className="demo-bar__inner">
          <h1 className="demo-bar__title">Стенд доступности</h1>
          <p ref={liveRef} className="sr-only" aria-live="polite" />

          {pass && !itemDone && (
            <section className="demo-bar__attempt" aria-labelledby="demo-task">
              <div className="demo-bar__status">
                <span className="demo-bar__mode demo-bar__mode_hard">С барьерами</span>
                {/* Hidden from screen readers: a text that changes every second disturbs NVDA's browse mode. The card says the time. */}
                <span className="demo-bar__timer" aria-hidden="true">
                  {formatTime(now - itemStartedAt)}
                </span>
              </div>
              {questList}
              <h2 id="demo-task" ref={focusRef} tabIndex={-1} className="demo-bar__task">
                {quest.length > 1 && `${itemIndex + 1} из ${quest.length}. `}
                {demoCase.task}
              </h2>
              {formatNote && format !== 'solo' && <p className="demo-bar__note">{formatNote}</p>}
              <ol className="demo-bar__steps">
                {demoCase.steps.map((step, i) => (
                  <li key={step} className={progress.steps[i] ? 'demo-bar__step_done' : undefined}>
                    <span aria-hidden="true">{progress.steps[i] ? '✓ ' : '○ '}</span>
                    {step}
                    <span className="sr-only">
                      {progress.steps[i] ? ' — выполнено' : ' — не выполнено'}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="demo-bar__actions">
                <Button view="outlined" size="l" onClick={demo.skip}>
                  Пропустить
                </Button>
                <Button view="flat" size="l" onClick={demo.reset}>
                  Сбросить
                </Button>
              </div>
            </section>
          )}

          <details className="demo-bar__host">
            <summary>Для ведущего</summary>
            <fieldset className="demo-bar__fieldset">
              <legend>Барьеры текущего дела (меняются сразу)</legend>
              {FAULTS.map((f) => (
                <Checkbox key={f} checked={faults[f]} onUpdate={(on) => demo.setFault(f, on)}>
                  {FAULT_INFO[f].label}
                </Checkbox>
              ))}
            </fieldset>
          </details>
        </div>
      </header>

      {/* Landing, success cards and results are the page content, so they live in <main>, not in the banner. */}
      {!(pass && !itemDone) && (
        <main className="demo-page">
            {phase === 'intro' && <Landing headingRef={focusRef} />}

            {pass && itemDone && (
              <section className="demo-bar__card">
                {questList}
                <h2 ref={focusRef} tabIndex={-1} className="demo-bar__heading">
                  {lastResult?.skipped ? 'Пропущено' : `${demoCase.doneTitle} ${formatTime(lastResult?.ms ?? 0)}`}
                  {lastResult?.mistakes ? `, ошибок: ${lastResult.mistakes}` : ''}
                </h2>
                <div className="demo-bar__actions">
                  <Button view="action" size="xl" onClick={demo.next}>
                    {nextCase ? `Дальше: ${nextCase.title}` : 'Дальше'}
                  </Button>
                  <Button view="flat" size="l" onClick={demo.reset}>
                    Сбросить
                  </Button>
                </div>
              </section>
            )}

            {phase === 'result' && (
              <section className="demo-bar__result">
                <h2 ref={focusRef} tabIndex={-1} className="demo-bar__heading">
                  Итог
                </h2>
                <table className="demo-bar__table">
                  <thead>
                    <tr>
                      <th scope="col">Дело</th>
                      <th scope="col">Результат</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quest.map((id, i) => (
                      <tr key={id}>
                        <th scope="row">{getCase(id).title}</th>
                        <td>{resultText(results[i])}</td>
                      </tr>
                    ))}
                  </tbody>
                  {quest.length > 1 && (
                    <tfoot>
                      <tr>
                        <th scope="row">Всего</th>
                        <td>{formatTime(sumTime(results))}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
                <h3>Что мешало</h3>
                {results.map((r) => (
                  <div key={r.caseId} className="demo-bar__hindered">
                    {quest.length > 1 && <h4>{getCase(r.caseId).title}</h4>}
                    <ul>
                      {FAULTS.filter((f) => r.faults[f]).map((f) => (
                        <li key={f}>
                          <strong>{FAULT_INFO[f].label}.</strong> {FAULT_INFO[f].hint}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Button view="action" size="xl" onClick={demo.reset}>
                  Сбросить для следующего
                </Button>
              </section>
            )}

        </main>
      )}
    </>
  );
};

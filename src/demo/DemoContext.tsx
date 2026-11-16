import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { allFaults, getCase, type CaseId, type Fault, type Faults, type Format, type Progress } from './cases';

export type Phase = 'intro' | 'hard' | 'result';
export type { Format };

export interface ItemResult {
  caseId: CaseId;
  ms: number;
  skipped: boolean;
  mistakes: number;
  faults: Faults;
}

interface DemoState {
  phase: Phase;
  /** Quest items in order; a single case is a quest of one item. */
  quest: CaseId[];
  itemIndex: number;
  /** The current item is finished or skipped; the success card is showing. */
  itemDone: boolean;
  format: Format;
  faults: Faults;
  /** Bumped on every start/reset; used as a key to rebuild the data from the seed. */
  runId: number;
  itemStartedAt: number;
  progress: Progress;
  results: ItemResult[];
}

export interface DemoContextType extends DemoState {
  caseId: CaseId;
  start: (quest: CaseId[], format: Format) => void;
  next: () => void;
  skip: () => void;
  reset: () => void;
  setFault: (fault: Fault, on: boolean) => void;
  report: (progress: Progress) => void;
}

const emptyProgress: Progress = { steps: [], mistakes: 0 };

// Hard mode turns on only the current item's faults, so they don't mask each other.
const caseFaults = (id: CaseId): Faults => ({
  ...allFaults(false),
  ...Object.fromEntries(getCase(id).faults.map((f) => [f, true])),
});

const finishItem = (s: DemoState, skipped: boolean): DemoState => {
  if (s.phase !== 'hard' || s.itemDone) return s;
  const result: ItemResult = {
    caseId: s.quest[s.itemIndex],
    ms: Date.now() - s.itemStartedAt,
    skipped,
    mistakes: s.progress.mistakes,
    faults: s.faults,
  };
  return { ...s, itemDone: true, results: [...s.results, result] };
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<DemoState>({
    phase: 'intro',
    quest: [],
    itemIndex: 0,
    itemDone: false,
    format: 'solo',
    faults: allFaults(false),
    runId: 0,
    itemStartedAt: 0,
    progress: emptyProgress,
    results: [],
  });

  const start = useCallback((quest: CaseId[], format: Format) => {
    setState((s) => ({
      ...s,
      phase: 'hard',
      quest,
      itemIndex: 0,
      itemDone: false,
      format,
      faults: caseFaults(quest[0]),
      runId: s.runId + 1,
      itemStartedAt: Date.now(),
      progress: emptyProgress,
      results: [],
    }));
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      if (!s.itemDone) return s;
      if (s.itemIndex < s.quest.length - 1) {
        const itemIndex = s.itemIndex + 1;
        return {
          ...s,
          itemIndex,
          itemDone: false,
          faults: caseFaults(s.quest[itemIndex]),
          itemStartedAt: Date.now(),
          progress: emptyProgress,
        };
      }
      return { ...s, phase: 'result' };
    });
  }, []);

  const skip = useCallback(() => {
    setState((s) => finishItem(s, true));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: 'intro',
      itemIndex: 0,
      itemDone: false,
      faults: allFaults(false),
      runId: s.runId + 1,
      progress: emptyProgress,
      results: [],
    }));
  }, []);

  const setFault = useCallback((fault: Fault, on: boolean) => {
    setState((s) => ({ ...s, faults: { ...s.faults, [fault]: on } }));
  }, []);

  const report = useCallback((progress: Progress) => {
    setState((s) => {
      const nextState = { ...s, progress };
      const complete = progress.steps.length > 0 && progress.steps.every(Boolean);
      return progress.done || complete ? finishItem(nextState, false) : nextState;
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      caseId: state.quest[state.itemIndex] ?? '2a',
      start,
      next,
      skip,
      reset,
      setFault,
      report,
    }),
    [state, start, next, skip, reset, setFault, report]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export { DemoContext };

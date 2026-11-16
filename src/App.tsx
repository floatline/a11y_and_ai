import { ThemeProvider } from '@gravity-ui/uikit';
import { ChecklistProvider } from './context/ChecklistContext';
import { TodoScreen } from './components/TodoScreen';
import { DemoBar } from './demo/DemoBar';
import { RegisterCase } from './demo/RegisterCase';
import { CartCase } from './demo/CartCase';
import { TODO_SEED, getCase } from './demo/cases';
import { useDemo } from './hooks/useDemo';
import './App.css';

function App() {
  const { phase, caseId, itemIndex, itemDone, format, faults, runId } = useDemo();
  const screen = getCase(caseId).screen;
  const working = phase === 'hard' && !itemDone;

  return (
    <ThemeProvider theme="light">
      {/* key={runId}: the board lives through the whole quest and starts from the seed again on every start and reset */}
      <ChecklistProvider key={runId} initial={TODO_SEED}>
        <div className="app">
          <DemoBar />
          {working && (
            <main
              key={`${runId}-${itemIndex}`}
              className="demo-surface"
              data-reverse-order={faults.reverseOrder || undefined}
              data-no-focus-outline={faults.noFocusOutline || undefined}
            >
              {screen === 'todo' && <TodoScreen />}
              {screen === 'register' && <RegisterCase />}
              {(screen === 'tickets' || screen === 'merch') && <CartCase shop={screen} />}
            </main>
          )}
          {working && format === 'blank' && <div className="demo-blank" aria-hidden="true" />}
        </div>
      </ChecklistProvider>
    </ThemeProvider>
  );
}

export default App;

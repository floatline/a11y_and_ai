import type { Checklist, Priority, Task } from '../types';

export const FAULTS = [
  'missingNames',
  'reverseOrder',
  'noFocusOutline',
  'brokenModal',
  'stealAutofocus',
  'nestedSvg',
  'emptyAlts',
  'svgButton',
] as const;

export type Fault = (typeof FAULTS)[number];
export type Faults = Record<Fault, boolean>;

export const allFaults = (on: boolean): Faults =>
  Object.fromEntries(FAULTS.map((f) => [f, on])) as Faults;

export const FAULT_INFO: Record<Fault, { label: string; hint: string }> = {
  missingNames: {
    label: 'Нет имён у кнопок и полей',
    hint: 'Кнопки-иконки и поля без подписей: скринридер говорит просто «кнопка» и «флажок».',
  },
  reverseOrder: {
    label: 'Порядок на экране не совпадает с порядком чтения',
    hint: 'На экране элементы стоят в одном порядке, а Tab и скринридер проходят их в другом.',
  },
  noFocusOutline: {
    label: 'Невидимый фокус',
    hint: 'Рамка фокуса скрыта: не видно, где сейчас клавиатурный курсор.',
  },
  brokenModal: {
    label: 'Диалог не держит фокус',
    hint: 'Окно открыто, но Tab уходит на страницу за ним.',
  },
  stealAutofocus: {
    label: 'Фокус встаёт не туда',
    hint: 'При открытии фокус оказывается не на первом поле или вообще за окном.',
  },
  nestedSvg: {
    label: 'Мусор в SVG и кликабельная карточка',
    hint: 'Иконки читаются как «icon-plus-24», а вся карточка — лишняя безымянная остановка: нажатие на неё неожиданно добавляет ещё одну позицию.',
  },
  emptyAlts: {
    label: 'Пустой alt у картинок',
    hint: 'Товар понятен только по картинке, а у неё alt="": скринридер её пропускает.',
  },
  svgButton: {
    label: 'Иконка вместо кнопки',
    hint: 'Значок «удалить» — просто картинка с обработчиком клика: с клавиатуры и скринридером до неё не добраться.',
  },
};

export interface Progress {
  steps: boolean[];
  mistakes: number;
  /** The attempt cannot continue (order placed, checklist deleted). */
  done?: boolean;
}

export type Format = 'solo' | 'blank' | 'pair';

export const FORMATS: { id: Format; label: string; note: string }[] = [
  { id: 'solo', label: 'Сам', note: 'Проходите квест сами.' },
  {
    id: 'blank',
    label: 'Сам, пустой экран',
    note: 'Экран скрыт. Ориентируйтесь только по скринридеру.',
  },
  {
    id: 'pair',
    label: 'В паре',
    note: 'Ведомый не смотрит на экран и управляет клавиатурой со скринридером. Штурман смотрит и подсказывает только голосом, руками не трогает.',
  },
];

export type CaseId = '2a' | '1a' | 'merch' | 'modal' | '2v' | '1b' | '2b';

export interface DemoCase {
  id: CaseId;
  /** Quest checklist item */
  title: string;
  /** Heading of the success card */
  doneTitle: string;
  task: string;
  steps: string[];
  /** Faults that matter in this case; hard mode turns on exactly these. */
  faults: Fault[];
  screen: 'todo' | 'register' | 'tickets' | 'merch';
  /** ToDo cases share one board, so progress is counted from the board as it was when the item started. */
  progress?: (checklists: Checklist[], atStart: Checklist[]) => Progress;
}

const task = (id: string, title: string, priority: Priority = 'medium'): Task => ({
  id,
  title,
  description: '',
  deadline: '',
  priority,
  completed: false,
});

const allTasks = (checklists: Checklist[]) => checklists.flatMap((cl) => cl.tasks);

// Ticking the target is the step; any other task ticked during this item is a mistake.
const tickProgress = (targetId: string) => (checklists: Checklist[], atStart: Checklist[]): Progress => {
  const doneBefore = new Set(allTasks(atStart).filter((t) => t.completed).map((t) => t.id));
  const tasks = allTasks(checklists);
  return {
    steps: [tasks.some((t) => t.id === targetId && t.completed)],
    mistakes: tasks.filter((t) => t.id !== targetId && t.completed && !doneBefore.has(t.id)).length,
  };
};

/** One board for every ToDo case: the speaker's preparation. */
export const TODO_SEED: Checklist[] = [
  {
    id: 'conf',
    title: 'Подготовка к докладу',
    tasks: [
      task('c-rehearse', 'Прогнать доклад вслух', 'critical'),
      task('c-draft', 'Черновик слайдов', 'low'),
      task('c-slides', 'Отправить слайды организаторам', 'critical'),
      task('c-train', 'Купить билет на поезд'),
    ],
  },
  {
    id: 'schedule',
    title: 'Расписание конференции',
    tasks: [
      task('s-10', '10:00 Открытие'),
      task('s-12', '12:00 Доступные формы'),
      task('s-14', '14:00 Твой доклад: ИИ и скринридеры'),
      task('s-16', '16:00 Закрытие и нетворкинг'),
    ],
  },
  {
    id: 'personal',
    title: 'Личное',
    tasks: [task('p-gift', 'Купить подарок'), task('p-net', 'Оплатить интернет', 'low')],
  },
];

export const CASES: DemoCase[] = [
  {
    id: '2a',
    title: 'Подать заявку на доклад',
    doneTitle: 'Заявка подана!',
    task: 'Подай заявку на доклад: имя, email, тема, формат, согласие с условиями — и отправь.',
    steps: ['Поля заполнены верно', 'Условия приняты', 'Заявка отправлена'],
    faults: ['missingNames', 'reverseOrder', 'noFocusOutline', 'brokenModal', 'stealAutofocus'],
    screen: 'register',
  },
  {
    id: '1a',
    title: 'Вписать +1',
    doneTitle: 'Гость вписан!',
    task: 'Впиши гостя (+1), убери афтерпати и оформи заказ.',
    steps: ['Гость вписан', 'Афтерпати убрана', 'Заказ оформлен'],
    faults: ['missingNames', 'nestedSvg', 'svgButton', 'noFocusOutline', 'brokenModal'],
    screen: 'tickets',
  },
  {
    id: 'merch',
    title: 'Заказать мерч',
    doneTitle: 'Мерч заказан!',
    task: 'Закажи кружку из мерча конференции.',
    steps: ['Кружка в корзине', 'Заказ оформлен'],
    faults: ['missingNames', 'emptyAlts', 'noFocusOutline', 'brokenModal'],
    screen: 'merch',
  },
  {
    id: 'modal',
    title: 'Добавить задачу',
    doneTitle: 'Задача добавлена!',
    task: 'В «Подготовке к докладу» создай задачу «Проверить презентацию» с критическим приоритетом.',
    steps: ['Задача создана в «Подготовке к докладу»', 'Приоритет — критический'],
    faults: ['missingNames', 'brokenModal', 'stealAutofocus', 'noFocusOutline'],
    screen: 'todo',
    progress: (checklists, atStart) => {
      const before = new Set(allTasks(atStart).map((t) => t.id));
      // Any title counts: a typo should not block the item, the dialog is what is being tested.
      const created = (checklists.find((cl) => cl.id === 'conf')?.tasks ?? []).filter((t) => !before.has(t.id));
      return {
        steps: [created.length > 0, created.some((t) => t.priority === 'critical')],
        mistakes: 0,
      };
    },
  },
  {
    id: '2v',
    title: 'Отметить свой доклад',
    doneTitle: 'Доклад отмечен!',
    task: 'В «Расписании конференции» отметь свой доклад — он в 14:00.',
    steps: ['Доклад в 14:00 отмечен'],
    faults: ['missingNames', 'reverseOrder', 'noFocusOutline'],
    screen: 'todo',
    progress: tickProgress('s-14'),
  },
  {
    id: '1b',
    title: 'Отправить слайды',
    doneTitle: 'Слайды отправлены!',
    task: 'В «Подготовке к докладу» отметь выполненной задачу «Отправить слайды организаторам».',
    steps: ['Задача «Отправить слайды организаторам» отмечена'],
    faults: ['missingNames', 'reverseOrder', 'noFocusOutline'],
    screen: 'todo',
    progress: tickProgress('c-slides'),
  },
  {
    id: '2b',
    title: 'Удалить черновик',
    doneTitle: 'Черновик удалён!',
    task: 'В «Подготовке к докладу» удали задачу «Черновик слайдов». Сам чеклист должен остаться.',
    steps: ['Задача «Черновик слайдов» удалена'],
    faults: ['missingNames', 'brokenModal', 'stealAutofocus', 'noFocusOutline'],
    screen: 'todo',
    progress: (checklists) => {
      const confGone = !checklists.some((cl) => cl.id === 'conf');
      return {
        steps: [!allTasks(checklists).some((t) => t.id === 'c-draft')],
        mistakes: confGone ? 1 : 0,
        done: confGone,
      };
    },
  },
];

export const getCase = (id: CaseId): DemoCase => CASES.find((c) => c.id === id) ?? CASES[0];

export const QUESTS = {
  /** 3–4 minutes: a form, nesting, a dialog, names. */
  short: ['2a', '1a', 'modal', '1b'] as CaseId[],
  full: ['2a', '1a', 'merch', 'modal', '2v', '1b', '2b'] as CaseId[],
};

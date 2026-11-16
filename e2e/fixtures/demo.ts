import { expect, type Page } from '@playwright/test';

export type CaseId = '2a' | '1a' | 'merch' | 'modal' | '2v' | '1b' | '2b';
type Format = 'solo' | 'blank' | 'pair';

/** Starts the short quest from the landing. */
export async function startQuest(page: Page, format: Format = 'solo') {
  await page.goto('/');
  await page.locator(`input[name="format"][value="${format}"]`).check();
  await page.getByRole('button', { name: 'Начать квест' }).click();
  await expect(page.getByText('С барьерами', { exact: true })).toBeVisible();
}

/** Starts a single case in hard mode via «Выбрать отдельное задание». */
export async function startHard(page: Page, caseId: CaseId, format: Format = 'solo') {
  await page.goto('/');
  await page.locator(`input[name="format"][value="${format}"]`).check();
  await page.getByText('Выбрать отдельное задание').click();
  await page.locator(`input[name="case"][value="${caseId}"]`).check();
  await page.getByRole('button', { name: 'Начать задание' }).click();
  await expect(page.getByText('С барьерами', { exact: true })).toBeVisible();
}

/** Starts a case and turns its faults off from «Для ведущего», the way the host shows the accessible version. */
export async function startOriginal(page: Page, caseId: CaseId) {
  await startHard(page, caseId);
  await clearFaults(page);
}

export async function clearFaults(page: Page) {
  const host = page.locator('.demo-bar__host');
  if (!(await host.getAttribute('open'))) await host.locator('summary').click();
  const checked = host.getByRole('checkbox', { checked: true });
  // the set shrinks after every uncheck, so always take the first one
  while ((await checked.count()) > 0) await checked.first().uncheck();
  await host.locator('summary').click();
}

/** Presses «Дальше» on the success card. */
export async function next(page: Page) {
  await page.getByRole('button', { name: /^Дальше/ }).click();
}

export const surface = (page: Page) => page.locator('main.demo-surface');

/** Opens a collapsed checklist by its visible title. */
export async function expandChecklist(page: Page, title: string) {
  await surface(page).locator('.checklist-card__expand-button', { hasText: title }).click();
}

/** Task card by visible title; works in hard mode where controls have no names. */
export const taskCard = (page: Page, title: string) => page.locator('.task-item', { hasText: title });

export const PREP = 'Подготовка к докладу';

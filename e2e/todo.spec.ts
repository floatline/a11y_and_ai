import { test, expect } from '@playwright/test';
import { PREP, expandChecklist, startOriginal, surface } from './fixtures/demo';

// Plain ToDo behaviour, checked in original mode where every control has a name.
test.describe('ToDo в обычном режиме', () => {
  test.beforeEach(async ({ page }) => {
    await startOriginal(page, '1b');
  });

  test('чеклисты свёрнуты при старте и раскрываются', async ({ page }) => {
    const toggle = surface(page).getByRole('button', { name: PREP, exact: true });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Купить билет на поезд', { exact: true })).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Купить билет на поезд', { exact: true })).toBeVisible();
  });

  test('создать чеклист', async ({ page }) => {
    await page.getByRole('button', { name: 'Новый чеклист' }).click();
    await page.getByLabel('Название').fill('Поездка');
    await page.getByRole('button', { name: 'Создать' }).click();

    await expect(surface(page).getByRole('button', { name: 'Поездка', exact: true })).toBeVisible();
  });

  test('добавить задачу', async ({ page }) => {
    await expandChecklist(page, PREP);
    await page.getByRole('button', { name: `Добавить задачу в «${PREP}»` }).click();
    await page.getByLabel('Название').fill('Зарядить ноутбук');
    await page.getByRole('button', { name: 'Создать' }).click();

    await expect(page.getByRole('checkbox', { name: 'Выполнено: Зарядить ноутбук' })).toBeVisible();
  });

  test('редактировать задачу', async ({ page }) => {
    await expandChecklist(page, PREP);
    await page.getByRole('button', { name: 'Редактировать задачу «Купить билет на поезд»' }).click();
    await page.getByLabel('Название').fill('Купить билет на поезд туда и обратно');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByText('Купить билет на поезд туда и обратно')).toBeVisible();
  });

  test('удаление задачи спрашивает подтверждение и не трогает чеклист', async ({ page }) => {
    await expandChecklist(page, PREP);
    await page.getByRole('button', { name: 'Удалить задачу «Прогнать доклад вслух»' }).click();
    const dialog = page.getByRole('dialog', { name: 'Удалить задачу «Прогнать доклад вслух»?' });
    await dialog.getByRole('button', { name: 'Удалить' }).click();

    await expect(page.getByText('Прогнать доклад вслух')).toBeHidden();
    await expect(page.getByText('Купить билет на поезд', { exact: true })).toBeVisible();
  });

  test('удалить чеклист', async ({ page }) => {
    await page.getByRole('button', { name: 'Удалить чеклист «Личное»' }).click();
    await expect(surface(page).getByRole('button', { name: 'Личное', exact: true })).toBeHidden();
  });
});

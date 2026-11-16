import { test, expect } from '@playwright/test';
import { PREP, clearFaults, expandChecklist, next, startHard, startOriginal, startQuest, surface, taskCard } from './fixtures/demo';

const result = (page: import('@playwright/test').Page) => page.getByRole('heading', { name: 'Итог' });

test.describe('Квест', () => {
  test('лендинг: квест без выбора задач и подсказка для своего устройства', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Квест: ты — спикер конференции' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Как проходить на этом устройстве/ })).toBeVisible();
    await expect(page.locator('input[name="case"]').first()).toBeHidden();
  });

  test('карточка «Дальше» между делами, после последнего — сразу итог', async ({ page }) => {
    await startQuest(page);
    await page.getByRole('button', { name: 'Пропустить' }).click();
    await expect(page.getByRole('heading', { name: 'Пропущено' })).toBeFocused();
    await page.getByRole('button', { name: 'Дальше: Вписать +1' }).click();

    await expect(page.getByRole('heading', { name: /^2 из 4\./ })).toBeVisible();
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Пропустить' }).click();
      await next(page);
    }
    await expect(result(page)).toBeFocused();
    await expect(page.locator('.demo-bar__table tbody tr')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Перейти в обычный режим' })).toHaveCount(0);
  });

  test('доска задач общая на весь проход: задача из одного дела видна в следующем', async ({ page }) => {
    await startQuest(page);
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: 'Пропустить' }).click();
      await next(page);
    }
    // «Добавить задачу» in hard mode: unnamed «+», broken dialog
    await surface(page).locator('.checklist-card__actions').first().locator('button').first().click();
    await page.getByPlaceholder('Введите название задачи').fill('Проверить презентацию');
    await page.locator('.demo-dialog').getByRole('button', { name: 'Создать' }).click();
    await page.getByRole('button', { name: 'Пропустить' }).click();
    await next(page);

    await expandChecklist(page, PREP);
    await expect(taskCard(page, 'Проверить презентацию')).toBeVisible();
  });
});

test.describe('Стенд: фазы и сброс', () => {
  test('сложный режим → итог: шаг засчитывается сам, ошибка видна', async ({ page }) => {
    await startHard(page, '1b');
    await expandChecklist(page, PREP);
    await taskCard(page, 'Прогнать доклад вслух').locator('input').click();
    await taskCard(page, 'Отправить слайды организаторам').locator('input').click();

    await expect(page.getByRole('heading', { name: /Слайды отправлены! .*, ошибок: 1/ })).toBeFocused();
    await next(page);

    await expect(result(page)).toBeVisible();
    await expect(page.getByRole('cell', { name: /ошибок: 1/ })).toBeVisible();
    await expect(page.getByText('Порядок на экране не совпадает с порядком чтения.')).toBeVisible();
  });

  test('«Пропустить» завершает дело как пропущенное', async ({ page }) => {
    await startHard(page, '2v');
    await page.getByRole('button', { name: 'Пропустить' }).click();
    await expect(page.getByRole('heading', { name: 'Пропущено' })).toBeVisible();
  });

  test('сброс и перезагрузка начинают с тех же данных', async ({ page }) => {
    await startHard(page, '1b');
    await expandChecklist(page, PREP);
    await taskCard(page, 'Прогнать доклад вслух').locator('input').click();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Квест: ты — спикер конференции' })).toBeVisible();

    await startHard(page, '1b');
    await expandChecklist(page, PREP);
    await expect(taskCard(page, 'Прогнать доклад вслух').locator('input')).not.toBeChecked();

    await page.getByRole('button', { name: 'Сбросить' }).click();
    await expect(page.getByRole('heading', { name: 'Квест: ты — спикер конференции' })).toBeVisible();
    await expect(surface(page)).toHaveCount(0);
  });
});

test.describe('Стенд: поломки', () => {
  test('missingNames: в сложном режиме у кнопок-иконок нет имён', async ({ page }) => {
    await startHard(page, '1b');
    await expandChecklist(page, PREP);
    await expect(page.getByRole('button', { name: /Удалить задачу/ })).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: /Выполнено/ })).toHaveCount(0);
  });

  test('reverseOrder: порядок DOM обратный, на экране — исходный', async ({ page }) => {
    await startHard(page, '2v');
    await expandChecklist(page, 'Расписание конференции');
    const titles = surface(page).locator('.checklist-card', { hasText: 'Расписание' }).locator('.task-item__title');
    await expect(titles.first()).toHaveText('16:00 Закрытие и нетворкинг');
    const firstY = (await titles.first().boundingBox())!.y;
    const lastY = (await titles.last().boundingBox())!.y;
    expect(firstY).toBeGreaterThan(lastY);
  });

  test('noFocusOutline: фокус есть, рамки нет только в сложном режиме', async ({ page }) => {
    await startHard(page, '1b');
    const toggle = surface(page).locator('.checklist-card__expand-button').first();
    await toggle.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveCSS('outline-style', 'none');

    await clearFaults(page);
    const original = surface(page).locator('.checklist-card__expand-button').first();
    await original.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(original).toHaveCSS('outline-style', 'solid');
  });
});

test.describe('Стенд: дела', () => {
  test('Добавить задачу, сложный: окно не забирает фокус, Tab уходит на страницу', async ({ page }) => {
    await startHard(page, 'modal');
    const plus = surface(page).locator('.checklist-card__actions').first().locator('button').first();
    await plus.click();
    const dialog = page.locator('.demo-dialog');
    await expect(dialog).toBeVisible();
    await expect(plus).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.locator(':focus')).toHaveCount(0);
    // the page behind stays clickable
    await surface(page).getByRole('button', { name: 'Личное', exact: true }).click();
    await expect(dialog).toBeVisible();
  });

  test('Добавить задачу, обычный: фокус в окне, критическая задача засчитана', async ({ page }) => {
    await startOriginal(page, 'modal');
    await page.getByRole('button', { name: `Добавить задачу в «${PREP}»` }).click();
    const dialog = page.getByRole('dialog', { name: 'Новая задача' });
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    await expect(dialog.locator(':focus')).toHaveCount(1);

    await dialog.getByLabel('Название').fill('Проверить презентацию');
    await dialog.getByRole('combobox', { name: 'Приоритет' }).click();
    await page.getByRole('option', { name: 'Критический' }).click();
    await dialog.getByRole('button', { name: 'Создать' }).click();

    await expect(page.getByRole('heading', { name: /Задача добавлена!/ })).toBeVisible();
    await next(page);
    await expect(result(page)).toBeVisible();
  });

  test('Удалить черновик, сложный: фокус уходит на «удалить чеклист», Enter удаляет всё', async ({ page }) => {
    await startHard(page, '2b');
    await expandChecklist(page, PREP);
    await taskCard(page, 'Черновик слайдов').locator('button').nth(1).click();

    const deleteChecklist = surface(page).locator('.checklist-card__actions').first().locator('button').nth(2);
    await expect(deleteChecklist).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: /ошибок: 1/ })).toBeVisible();
  });

  test('Удалить черновик, обычный: диалог держит фокус, удаляется только задача', async ({ page }) => {
    await startOriginal(page, '2b');
    await expandChecklist(page, PREP);
    await page.getByRole('button', { name: 'Удалить задачу «Черновик слайдов»' }).click();
    const dialog = page.getByRole('dialog', { name: 'Удалить задачу «Черновик слайдов»?' });
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
    await expect(dialog.locator(':focus')).toHaveCount(1);
    await dialog.getByRole('button', { name: 'Удалить' }).click();

    await next(page);
    await expect(result(page)).toBeVisible();
  });

  test('Заявка, сложный: автофокус на email, порядок Tab перемешан', async ({ page }) => {
    await startHard(page, '2a');
    await expect(page.getByPlaceholder('Email')).toBeFocused();
    await expect(surface(page).locator('input').first()).toHaveAttribute('placeholder', 'Тема доклада');
    await expect(surface(page).locator('label[for]')).toHaveCount(0);
  });

  test('Заявка, обычный: подписанные поля, отправка завершает дело', async ({ page }) => {
    await startOriginal(page, '2a');
    // focus was placed at start, while stealAutofocus was still on; here we check names, not autofocus
    await expect(page.getByRole('textbox', { name: 'Имя' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Имя' }).fill('Аня');
    await page.getByRole('textbox', { name: 'Email' }).fill('anya@example.com');
    await page.getByRole('textbox', { name: 'Тема доклада' }).fill('ИИ и скринридеры');
    await page.getByRole('combobox', { name: 'Формат' }).click();
    await page.getByRole('option', { name: 'Доклад' }).click();
    await page.getByRole('checkbox', { name: 'Я принимаю условия использования' }).check();
    await page.getByRole('button', { name: 'Отправить заявку' }).click();

    await expect(page.getByRole('heading', { name: /Заявка подана!/ })).toBeVisible();
    await next(page);
    await expect(result(page)).toBeVisible();
  });

  test('+1, сложный: иконки читаются как мусор из SVG', async ({ page }) => {
    await startHard(page, '1a');
    await expect(surface(page).getByRole('button', { name: 'icon-plus-24' }).first()).toBeVisible();
    await expect(surface(page).getByRole('button', { name: /Увеличить количество/ })).toHaveCount(0);
  });

  test('+1, сложный: карточка кликабельна и в фокусе, но кнопки внутри достижимы', async ({ page }) => {
    await startHard(page, '1a');
    const guest = surface(page).locator('.cart__item_clickable', { hasText: 'Гость +1' });
    await expect(guest).toHaveAttribute('tabindex', '0');
    await expect(surface(page).locator('[role="button"]')).toHaveCount(0);
    // Tab from the card goes into its buttons
    await guest.focus();
    await page.keyboard.press('Tab');
    await expect(guest.locator('button').first()).toBeFocused();
    // a tap on the card itself adds one more
    await guest.locator('.cart__info').click();
    await expect(guest).toContainText('1 шт.');
  });

  test('+1, сложный: «удалить» — голый svg, не кнопка', async ({ page }) => {
    await startHard(page, '1a');
    await expect(surface(page).locator('svg.cart__svg-button')).toHaveCount(3);
    await expect(surface(page).getByRole('button', { name: 'ic_trash_outline' })).toHaveCount(0);
    // still works with a mouse or a finger
    await surface(page).locator('svg.cart__svg-button').nth(2).click();
    await expect(surface(page).locator('.cart__item', { hasText: 'Афтерпати' })).toContainText('0 шт.');
  });

  test('+1, обычный: гость вписан, заказ без ошибок', async ({ page }) => {
    await startOriginal(page, '1a');
    await page.getByRole('button', { name: 'Увеличить количество: Гость +1, сейчас 0' }).click();
    await page.getByRole('button', { name: 'Убрать из корзины: Афтерпати' }).click();
    await page.getByRole('button', { name: 'Оформить заказ' }).click();
    await page.getByRole('dialog', { name: 'Оформить заказ на 5 000 ₽?' }).getByRole('button', { name: 'Оформить' }).click();

    await expect(page.getByRole('heading', { name: /^Гость вписан! \d+:\d+$/ })).toBeVisible();
    await next(page);
    await expect(result(page)).toBeVisible();
    await expect(page.getByText(/ошибок/)).toHaveCount(0);
  });

  test('Мерч, сложный: пустой alt, картинки и кнопки не спрятаны во вложенность', async ({ page }) => {
    await startHard(page, 'merch');
    const images = surface(page).locator('img.cart__image');
    await expect(images).toHaveCount(3);
    for (const img of await images.all()) await expect(img).toHaveAttribute('alt', '');
    await expect(surface(page).locator('[role="button"]')).toHaveCount(0);
    await expect(surface(page).getByRole('img', { name: /кружка/i })).toHaveCount(0);
  });

  test('Мерч, обычный: кружка находится по картинке, заказ без ошибок', async ({ page }) => {
    await startOriginal(page, 'merch');
    await expect(surface(page).getByRole('img', { name: 'Синяя кружка с надписью a11y' })).toBeVisible();
    await page.getByRole('button', { name: /Увеличить количество: Мерч №2, синяя кружка/ }).click();
    await page.getByRole('button', { name: 'Оформить заказ' }).click();
    await page.getByRole('dialog', { name: 'Оформить заказ на 900 ₽?' }).getByRole('button', { name: 'Оформить' }).click();

    await next(page);
    await expect(result(page)).toBeVisible();
    await expect(page.getByText(/ошибок/)).toHaveCount(0);
  });

  test('пустой экран закрывает страницу, но не панель', async ({ page, isMobile }) => {
    test.skip(isMobile, 'на телефоне варианта «пустой экран» нет');
    await startHard(page, '1b', 'blank');
    await expect(page.locator('.demo-blank')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сбросить' })).toBeVisible();
  });
});

test('на телефоне нет горизонтальной прокрутки', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'только для мобильного проекта');
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), 'лендинг').toBe(false);
  for (const id of ['1b', '2a', '1a', 'merch'] as const) {
    await startHard(page, id);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `дело ${id}`).toBe(false);
  }
});

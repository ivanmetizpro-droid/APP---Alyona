import { test, expect } from '@playwright/test';

test('development entry point loads modules and links to the full specification', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Основа проекта подготовлена' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('JavaScript загружен. Можно начинать разработку по ТЗ.');
  const specLink = page.getByRole('link', { name: 'Техническое задание', exact: true });
  const response = await page.request.get(await specLink.getAttribute('href'));
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('C24');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

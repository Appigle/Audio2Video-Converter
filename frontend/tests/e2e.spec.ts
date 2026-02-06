import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, 'fixtures', 'sample.m4a');

test('single conversion flow and history preview', async ({ page }) => {
  await page.goto('/');

  const fileInput = page.getByLabel(/Audio File/i);
  await fileInput.setInputFiles(filePath);

  await page.getByRole('button', { name: /convert to video/i }).click();

  await expect(page.getByText(/Job ID:/i)).toBeVisible();
  await expect(page.getByTestId('download-section')).toBeVisible({
    timeout: 60_000,
  });

  await page.getByRole('button', { name: /new upload/i }).click();

  await page.getByText(/Your conversion history/i).scrollIntoViewIfNeeded();
  const historyCard = page.getByRole('button', { name: /sample_/i }).first();
  await historyCard.click();

  await expect(page.getByText(/History Job:/i)).toBeVisible();
});

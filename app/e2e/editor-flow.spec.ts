import { test, expect } from '@playwright/test';

test.describe('Editor Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/editor');
        // Wait for hydration
        await page.waitForLoadState('networkidle');
    });

    test('should display editor layout', async ({ page }) => {
        // Check toolbar elements
        await expect(page.getByRole('button', { name: /Run/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Lint/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();

        // Check project selector
        await expect(page.getByText(/Select Project/i)).toBeVisible();

        // Check file tree exists
        await expect(page.getByText(/Explorer/i)).toBeVisible();
    });

    test('should create project and file', async ({ page }) => {
        // Open project selector
        await page.getByText(/Select Project/i).click();

        // Click create button
        await page.getByRole('button', { name: /Create Project/i }).or(page.locator('button[title="Create Project"]')).click();

        // Type project name
        await page.getByPlaceholder(/Project name/i).fill('Test Project');
        await page.getByRole('button', { name: /Create/i }).click();

        // Project should be selected
        await expect(page.getByText('Test Project')).toBeVisible();

        // Create a file
        await page.getByRole('button', { name: /New File/i }).or(page.locator('button[title="New File"]')).click();
        await page.getByPlaceholder(/filename/i).fill('counter.v');
        await page.getByRole('button', { name: /Create/i }).click();

        // File should appear in tree
        await expect(page.getByText('counter.v')).toBeVisible();

        // File should open in editor
        await expect(page.locator('.monaco-editor')).toBeVisible();
    });

    test('should edit and save file', async ({ page }) => {
        // First create a project and file (reuse above flow)
        await page.getByText(/Select Project/i).click();
        await page.getByRole('button', { name: /Create Project/i }).or(page.locator('button[title="Create Project"]')).click();
        await page.getByPlaceholder(/Project name/i).fill('Save Test');
        await page.getByRole('button', { name: /Create/i }).click();

        await page.getByRole('button', { name: /New File/i }).or(page.locator('button[title="New File"]')).click();
        await page.getByPlaceholder(/filename/i).fill('test.v');
        await page.getByRole('button', { name: /Create/i }).click();

        // Wait for editor
        await page.waitForSelector('.monaco-editor');

        // Type content (Monaco editor)
        await page.click('.monaco-editor');
        await page.keyboard.press('Control+a');
        await page.keyboard.type('// Test content');

        // Save button should be enabled (dirty state)
        const saveButton = page.getByRole('button', { name: /Save/i });
        await expect(saveButton).toBeEnabled();

        // Press Ctrl+S to save
        await page.keyboard.press('Control+s');

        // Wait for save to complete (button should show success briefly)
        await page.waitForTimeout(500);
    });
});

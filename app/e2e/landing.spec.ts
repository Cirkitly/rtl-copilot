import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('should display hero section', async ({ page }) => {
        await page.goto('/');

        // Check page title
        await expect(page).toHaveTitle(/RTL Copilot/);

        // Check hero headline
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Design Hardware');

        // Check CTA buttons exist
        await expect(page.getByRole('link', { name: /Start Building/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /View on GitHub/i })).toBeVisible();
    });

    test('should have working navigation', async ({ page }) => {
        await page.goto('/');

        // Check navbar links
        await expect(page.getByRole('link', { name: /Launch IDE/i })).toBeVisible();

        // Click Launch IDE
        await page.getByRole('link', { name: /Launch IDE/i }).click();

        // Should navigate to editor
        await expect(page).toHaveURL('/editor');
    });

    test('should display feature cards', async ({ page }) => {
        await page.goto('/');

        // Check feature section exists
        await expect(page.getByText(/Visual FSM Design/i)).toBeVisible();
        await expect(page.getByText(/Intelligent Code Generation/i)).toBeVisible();
        await expect(page.getByText(/Real-time Simulation/i)).toBeVisible();
    });
});

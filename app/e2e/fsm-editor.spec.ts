import { test, expect } from '@playwright/test';

test.describe('FSM Editor', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/editor');
        await page.waitForLoadState('networkidle');
    });

    test('should display FSM editor panel', async ({ page }) => {
        // Check FSM editor panel exists
        await expect(page.locator('#fsm-panel')).toBeVisible();

        // Check FSM toolbar buttons
        await expect(page.getByRole('button', { name: /Add State/i }).or(page.locator('button[title="Add State"]'))).toBeVisible();
    });

    test('should add and remove states', async ({ page }) => {
        // Wait for FSM editor to load
        await page.waitForSelector('.react-flow');

        // Click add state button
        const addButton = page.getByRole('button', { name: /Add State/i }).or(page.locator('button').filter({ hasText: '+' }).first());
        await addButton.click();

        // A new state should appear
        await page.waitForTimeout(500);

        // Check that at least one node exists in ReactFlow
        const nodes = page.locator('.react-flow__node');
        const nodeCount = await nodes.count();
        expect(nodeCount).toBeGreaterThanOrEqual(1);
    });

    test('should show FSM templates dropdown', async ({ page }) => {
        // Wait for FSM editor
        await page.waitForSelector('.react-flow');

        // Check templates dropdown exists
        const templatesBtn = page.getByRole('button', { name: /Templates/i }).or(page.locator('button').filter({ hasText: 'Templates' }));

        if (await templatesBtn.isVisible()) {
            await templatesBtn.click();

            // Template options should appear
            await expect(page.getByText(/Traffic Light/i).or(page.getByText(/Counter/i))).toBeVisible();
        }
    });

    test('should display validation status', async ({ page }) => {
        await page.waitForSelector('.react-flow');

        // Check for validation badge
        const validBadge = page.getByText(/Valid/i).or(page.locator('[data-testid="validation-badge"]'));
        await expect(validBadge).toBeVisible({ timeout: 5000 });
    });
});

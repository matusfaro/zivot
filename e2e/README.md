# End-to-End (E2E) Tests

This directory contains comprehensive E2E tests for all user profile fields using Playwright.

## Purpose

E2E tests verify the complete user flow:
1. User inputs data into form fields
2. Data is persisted to IndexedDB with correct structure
3. Risk calculation is triggered
4. UI updates to reflect the new state

## Test Coverage

Every user profile field has corresponding E2E tests organized by section:

- **demographics.spec.ts** - Age, Sex, Ethnicity, Education
- **biometrics.spec.ts** - Height, Weight, Blood Pressure, Waist
- **labtests.spec.ts** - LDL, HDL, Total Cholesterol, Triglycerides, Glucose, HbA1c
- **lifestyle.spec.ts** - Smoking, Exercise, Alcohol, Diet, Driving Habits
- **medicalhistory.spec.ts** - Conditions, Family History, Medications, Mental Health, etc.

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with Playwright UI (interactive)
npm run test:e2e:ui

# Run in debug mode (headed browser, step through)
npm run test:e2e:debug

# View test report after running
npm run test:e2e:report
```

## Test Structure

### Test Fixtures (`fixtures/base.ts`)
- Automatically navigates to the app
- Clears IndexedDB before each test
- Waits for app to be ready

### Test Helpers (`helpers/test-helpers.ts`)
- `expandSection(page, name)` - Expand a collapsed section
- `setInputValue(page, label, value)` - Set input field value
- `setSelectValue(page, label, value)` - Set dropdown value
- `toggleCheckbox(page, label, checked)` - Toggle checkbox
- `waitForProfilePersistence(page, path, value)` - Wait for IndexedDB save
- `waitForRiskCalculation(page)` - Wait for calculation completion
- `getIndexedDBValue(page, storeName)` - Read from IndexedDB
- `getInputValue(page, label)` - Get current input value
- `isCheckboxChecked(page, label)` - Check checkbox state

## Test Environment

- **Debouncing**: Disabled (0ms) via `VITE_E2E_TEST_MODE=true` environment variable
- **Browser**: Chromium (headless by default)
- **Base URL**: http://localhost:5173
- **IndexedDB**: Cleared before each test for clean state

## Writing New Tests

When adding a new user profile field, you **MUST** add corresponding E2E tests:

```typescript
test('should persist and calculate risk when NewField is changed', async ({ page }) => {
  // 1. Expand the appropriate section
  await expandSection(page, 'SectionName');

  // 2. Set the field value
  await setInputValue(page, 'New Field Label', '100');

  // 3. Wait for persistence
  await page.waitForTimeout(500);

  // 4. Verify IndexedDB has the correct value
  const sectionData = await getIndexedDBValue(page, 'sectionName');

  // For TimeSeries fields:
  expect(sectionData.newField.mostRecent.value).toBe(100);

  // For DataPoint fields:
  // expect(sectionData.newField.value).toBe(100);

  // 5. Wait for risk calculation to complete
  await waitForRiskCalculation(page);

  // 6. Verify the UI shows the new value
  const currentValue = await getInputValue(page, 'New Field Label');
  expect(currentValue).toBe('100');
});
```

## Test Requirements

Each field test must verify:
1. ✅ Field value is persisted to IndexedDB
2. ✅ Correct data structure (DataPoint vs TimeSeries)
3. ✅ Risk calculation is triggered
4. ✅ UI updates to show the new value
5. ✅ Boundary values work correctly (optional)
6. ✅ Empty values are handled (optional)

## Debugging Tips

1. **Use UI Mode**: `npm run test:e2e:ui` shows test execution visually
2. **Use Debug Mode**: `npm run test:e2e:debug` lets you step through tests
3. **Check Screenshots**: Failed tests automatically capture screenshots
4. **Inspect IndexedDB**: Use browser DevTools → Application → IndexedDB
5. **Check Console Logs**: Look for `[PERSISTENCE]` and `[RISK CALC]` logs

## Configuration

Test configuration is in `playwright.config.ts` at the project root.

Key settings:
- Test directory: `./e2e`
- Base URL: `http://localhost:5173`
- Retries: 2 on CI, 0 locally
- Timeout: Default Playwright timeout
- Web server: Starts dev server automatically with `VITE_E2E_TEST_MODE=true`

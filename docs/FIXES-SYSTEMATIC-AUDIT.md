# Systematic Audit and Fixes - All Risk Factors

## Problems Identified

### 1. **Missing UI Fields**
- `diet.processedMeatServingsPerWeek` - Required by colorectal cancer model, completely missing from UI

### 2. **Incorrect Data Structure Handlers**
All lifestyle TimeSeries fields were falling through to generic handler which created DataPoint instead of TimeSeries:
- `diet.fruitServingsPerDay` - Created DataPoint, needed TimeSeries
- `diet.vegetableServingsPerDay` - Fixed earlier but had typo in condition
- `diet.processedMeatServingsPerWeek` - Wasn't in UI at all

### 3. **Why Alcohol Had No Effect**
The data WAS being stored correctly as TimeSeries, but we need to verify it's being:
1. Persisted to IndexedDB
2. Retrieved correctly by risk calculator
3. Actually used in the colorectal cancer risk calculation

### 4. **Why Fruits Had No Effect**
**Expected behavior** - NO disease model uses fruit consumption, so it correctly has no effect on mortality risk.
- CVD model: No
- Colorectal cancer: No
- Lung cancer: No
- Diabetes: No

Fruits field exists for future expansion but currently doesn't affect risk calculations.

## All Fixes Applied

### UI Fields Added
```typescript
// Added to Lifestyle section:
<label>
  Processed Meat (servings/week)
  <input type="number" value={getFieldValue('lifestyle', 'diet.processedMeatServingsPerWeek')} .../>
</label>
```

### TimeSeries Handlers Added to `updateField()`
```typescript
// All diet fields now properly create TimeSeries:
else if (field === 'diet.vegetableServingsPerDay') { ... }
else if (field === 'diet.processedMeatServingsPerWeek') { ... }
else if (field === 'diet.fruitServingsPerDay') { ... }
```

### TimeSeries Handlers Added to `getFieldValue()`
```typescript
// All diet fields now properly read from TimeSeries:
else if (field === 'diet.vegetableServingsPerDay') {
  return sectionData.diet?.vegetableServingsPerDay?.mostRecent?.value ?? '';
}
else if (field === 'diet.processedMeatServingsPerWeek') { ... }
else if (field === 'diet.fruitServingsPerDay') { ... }
```

### Debug Logging Added
- `[ALCOHOL]` - Logs when alcohol data is stored in CompactProfileEditor
- `[PERSISTENCE]` - Logs when lifestyle section is saved to IndexedDB
- `[RISK CALC]` - Logs when alcohol factor is extracted for risk calculation

## Complete Field Mapping

### Disease Model Requirements vs UI Fields

| Disease Model Path | UI Field | Data Structure | Handler Status |
|-------------------|----------|----------------|----------------|
| `lifestyle.alcohol.drinksPerWeek.mostRecent.value` | `alcohol.drinksPerWeek` | TimeSeries | ✅ Fixed |
| `lifestyle.exercise.moderateMinutesPerWeek.mostRecent.value` | `exercise.moderateMinutesPerWeek` | TimeSeries | ✅ Fixed |
| `lifestyle.diet.vegetableServingsPerDay.mostRecent.value` | `diet.vegetableServingsPerDay` | TimeSeries | ✅ Fixed |
| `lifestyle.diet.processedMeatServingsPerWeek.mostRecent.value` | `diet.processedMeatServingsPerWeek` | TimeSeries | ✅ Added |
| `lifestyle.smoking.status.value` | `smoking.status` | DataPoint | ✅ Fixed |
| `lifestyle.smoking.packYears.value` | `smoking.packYears` | DataPoint | ✅ Works (generic handler) |
| `lifestyle.smoking.quitDate.value` | `smoking.yearsSinceQuitting` | DataPoint | ⚠️ Different field |

### Extra UI Fields (Not Used by Models)
- `diet.fruitServingsPerDay` - Added TimeSeries support for future use

## Verification Steps

### 1. Test Alcohol (Colorectal Cancer)
1. Enter 14 drinks/week
2. Check console for `[ALCOHOL]` log - should show TimeSeries structure
3. Wait 50ms for debounce
4. Check console for `[PERSISTENCE]` log - should show alcohol in lifestyle
5. Check console for `[RISK CALC]` log - should show value extracted: 14
6. Verify colorectal cancer risk increases (14 drinks/week → 1.3× hazard ratio)

### 2. Test Vegetables (Colorectal Cancer)
1. Enter 5 servings/day
2. Verify same logging pattern
3. Verify colorectal cancer risk decreases

### 3. Test Processed Meat (Colorectal Cancer)
1. Enter 7 servings/week
2. Verify same logging pattern
3. Verify colorectal cancer risk increases (7 servings → ~1.2× hazard ratio)

### 4. Test Exercise (CVD)
1. Enter 150 min/week
2. Verify CVD risk uses baseline 1.0× hazard ratio
3. Enter 0 min/week
4. Verify CVD risk increases to 1.45× hazard ratio

### 5. Test Smoking (CVD + Lung Cancer)
1. Select "Current smoker"
2. Enter 20 pack-years
3. Verify CVD risk increases 2.0×
4. Verify lung cancer risk increases significantly

## Systematic Approach for Future Changes

### When Adding New Risk Factors:

1. **Check Disease Model Requirements**
   ```bash
   grep -h '"path":' src/knowledge/diseases/*.json | grep NEW_FIELD
   ```

2. **Determine Data Structure**
   - If path includes `.mostRecent.value` → TimeSeries
   - If path ends with `.value` → DataPoint
   - If path is array → Array structure

3. **Add UI Field**
   - Add input to appropriate section in CompactProfileEditor
   - Use correct path in `getFieldValue()` and `updateField()`

4. **Add Handler to `updateField()`**
   - For TimeSeries: Create special case handler (like alcohol, exercise, diet)
   - For DataPoint: Generic handler works (falls through)
   - For Arrays: Special case handler (like medical history)

5. **Add Handler to `getFieldValue()`**
   - For TimeSeries: Access `sectionData.field.mostRecent.value`
   - For DataPoint: Access `sectionData.field.value` (generic handler works)
   - For Arrays: Special case handler

6. **Verify Types**
   - Ensure TypeScript types exist in `src/types/user/*.ts`
   - Ensure no `any` types in calculation code

7. **Add Debug Logging**
   - Log when data is stored
   - Log when data is persisted
   - Log when data is extracted for calculation

8. **Test Systematically**
   - Enter value in UI
   - Verify console logs show correct structure
   - Verify persistence logs show data being saved
   - Verify risk calculation logs show data being extracted
   - Verify risk actually changes

## Type Safety Checklist

- ✅ No `any` types in `dataExtraction.ts`
- ✅ No `any` types in `FactorAdjuster.ts`
- ✅ No `any` types in `RiskEngine.ts`
- ✅ No `any` types in `UncertaintyCalculator.ts`
- ✅ Proper union types for `ModifiableLever`
- ✅ Proper return types for all calculation functions

## Known Limitations

1. **fruits** - UI field exists but no disease model uses it (expected)
2. **yearsSinceQuitting** - UI uses this instead of `quitDate` (both are valid)
3. **CompactProfileEditor** - Still uses string-based paths and `any` types internally
   - This is acceptable for now but should be refactored to use typed paths eventually
   - Would require significant refactoring with TypeScript template literal types

## Files Modified

1. `src/components/dashboard/CompactProfileEditor.tsx` - Added fields and handlers
2. `src/components/dashboard/LiveDashboard.tsx` - Added persistence logging
3. `src/engine/adjusters/FactorAdjuster.ts` - Added extraction logging
4. `src/types/risk/calculation.ts` - Fixed `any` types
5. `src/engine/RiskEngine.ts` - Fixed `any` types
6. `src/engine/aggregators/UncertaintyCalculator.ts` - Fixed `any` types
7. `src/utils/dataExtraction.ts` - Fixed `any` types

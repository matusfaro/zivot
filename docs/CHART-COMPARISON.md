# Mortality Risk Chart: Line vs. Stacked Area Comparison

## Current Implementation (Line Chart)

**File:** `src/components/results/MortalityRiskChart.tsx`

### What It Shows
- **3 separate lines:**
  1. **Solid red line:** Your validated 10-year mortality risk
  2. **Dashed red line:** Your extrapolated risk beyond 10 years
  3. **Gray line:** Average population risk for comparison

### Visual Example (Text Description)
```
100% ┤                                              ╱ (your risk)
     │                                          ╱╱╱
 75% ┤                                      ╱╱╱
     │                                  ╱╱╱
 50% ┤                              ╱╱╱
     │                      ╱╱╱╱╱╱╱╱         ╱ (average)
 25% ┤              ╱╱╱╱╱╱╱               ╱╱
     │      ____----                  ╱╱╱
  0% ┤──────────────────────────────────────────────
     age:  40    50    60    70    80    90   100
```

### Strengths
✅ **Clear comparison** to average population risk
✅ **Simple to understand** - one line shows your overall risk
✅ **Explicit validation boundary** - solid vs dashed clearly shows 10-year limit
✅ **Less visual clutter** - good for quick risk assessment

### Limitations
❌ **No disease breakdown** - can't see which diseases drive your risk
❌ **Less actionable** - doesn't show where to focus interventions
❌ **Misses the story** - at age 70, is your 30% risk mostly CVD or cancer?

---

## New Implementation (Stacked Area Chart)

**File:** `src/components/results/MortalityRiskChart_Stacked.tsx`

### What It Shows
- **Stacked colored areas** - each disease's contribution to total mortality
- **Height of each band** = that disease's risk contribution
- **Total height** = your overall cumulative mortality risk
- **12 different diseases** displayed with distinct colors

### Visual Example (Text Description)
```
100% ┤                                          ┌─────────┐
     │                                      ┌───┤Alzheimer│
 75% ┤                                  ┌───┤   └─────────┘
     │                              ┌───┤ COPD│
 50% ┤                          ┌───┤   └─────┘
     │                      ┌───┤ Stroke│
 25% ┤                  ┌───┤   └────────┘
     │              ┌───┤ Heart Disease │
  0% ┤──────────────┴───┴───────────────────────
     age:  40    50    60    70    80    90   100

     Colors stacked from bottom:
     🔴 Heart Disease (CVD)
     🟠 Stroke
     🟡 Lung Cancer
     🟢 Colorectal Cancer
     🔵 Type 2 Diabetes
     🟣 Prostate/Breast Cancer
     ... and 6 more diseases
```

### Strengths
✅ **Shows disease composition** - see which diseases dominate at each age
✅ **Highly actionable** - identify which interventions have biggest impact
✅ **Reveals trends** - watch CVD grow with age while cancer peaks earlier
✅ **Personalized insights** - for smokers, lung cancer band will be huge
✅ **Educational** - users understand their specific risk profile

### Limitations
❌ **More complex** - harder to read at first glance
❌ **No average comparison** - loses the "vs population" context
❌ **Legend can be crowded** - 12 diseases means 12 legend items
❌ **Color accessibility** - need careful color selection for colorblind users

---

## Side-by-Side Example Scenario

**User:** 45-year-old male, smoker, high cholesterol, family history of heart disease

### Line Chart Shows:
- Your 10-year risk: **15%** (vs 3% average)
- You're at **5× average risk**
- By age 80, your cumulative risk is **65%** (vs 45% average)

**Takeaway:** "You're at much higher risk than average."

### Stacked Chart Shows:
At age 45 (10-year risk = 15%):
- 🔴 **Heart Disease:** 6.5% (43% of total risk)
- 🟡 **Lung Cancer:** 4.2% (28% of total risk)
- 🟠 **Stroke:** 2.1% (14% of total risk)
- 🔵 **Diabetes:** 1.5% (10% of total risk)
- 🟢 **Other:** 0.7% (5% of total risk)

At age 70:
- 🔴 **Heart Disease:** 18% (dominant)
- 🟣 **Alzheimer's:** 8% (growing)
- 🟡 **Lung Cancer:** 6%
- Total: **42%**

**Takeaway:** "Focus on heart disease first (quit smoking, statins). Lung cancer is second priority. Alzheimer's will become important as you age."

---

## Recommendation: Hybrid Approach

**Why not have BOTH?**

### Option 1: Toggle Button
```typescript
const [viewMode, setViewMode] = useState<'line' | 'stacked'>('line');

<div className="chart-controls">
  <button onClick={() => setViewMode('line')}>Overall Risk</button>
  <button onClick={() => setViewMode('stacked')}>By Disease</button>
</div>

{viewMode === 'line' ? <LineChart /> : <StackedChart />}
```

**Benefits:**
- ✅ Quick overview (line) + detailed breakdown (stacked)
- ✅ Users can choose their preferred view
- ✅ Educational - compare both perspectives

### Option 2: Two Separate Charts
Display both charts on the dashboard:

1. **Primary chart:** Stacked area (more actionable)
2. **Comparison chart:** Small line chart showing "You vs Average"

**Benefits:**
- ✅ Best of both worlds
- ✅ No interaction required
- ✅ Complete information at a glance

---

## Implementation Complexity

### Line Chart (Current)
- ✅ Already implemented and working
- ✅ Well-tested methodology
- ✅ Simple data structure

### Stacked Chart (New)
- ✅ Code written and ready (`MortalityRiskChart_Stacked.tsx`)
- ⚠️ Needs testing with real disease risk data
- ⚠️ Requires `diseaseContributions` array in `OverallMortalityRisk`
- ⚠️ Color scheme needs accessibility review

**Estimated effort to integrate:** 30-60 minutes
1. Verify `diseaseContributions` data is populated correctly
2. Replace old chart import with new one (or add toggle)
3. Test with various user profiles
4. Adjust colors if needed for accessibility

---

## Color Scheme (Current Design)

The stacked chart uses 12 distinct colors optimized for differentiation:

| Disease | Color | Hex Code |
|---------|-------|----------|
| Heart Disease | Red | `#ef4444` |
| Stroke | Orange | `#f97316` |
| Lung Cancer | Yellow | `#eab308` |
| Colorectal Cancer | Lime | `#84cc16` |
| Type 2 Diabetes | Cyan | `#06b6d4` |
| Breast Cancer | Pink | `#ec4899` |
| Prostate Cancer | Purple | `#8b5cf6` |
| COPD | Indigo | `#6366f1` |
| Kidney Disease | Teal | `#14b8a6` |
| Pancreatic Cancer | Amber | `#f59e0b` |
| Liver Disease | Emerald | `#10b981` |
| Alzheimer's | Fuchsia | `#a855f7` |

**Note:** These colors should be tested with colorblind simulation tools.

---

## Data Requirements

The stacked chart requires:

```typescript
overallMortality: {
  estimatedRisk: 15,  // 10-year overall risk percentage
  diseaseContributions: [
    { diseaseId: 'cvd_10year', contribution: 6.5 },
    { diseaseId: 'lung_cancer_10year', contribution: 4.2 },
    { diseaseId: 'stroke_10year', contribution: 2.1 },
    // ... etc
  ]
}
```

**Current implementation status:**
✅ This data structure already exists in `/src/types/risk/calculation.ts`
✅ Populated by `/src/engine/aggregators/MortalityAggregator.ts`
✅ Should work out of the box!

---

## Next Steps

### To Switch to Stacked Chart:
1. Open `/src/components/results/RiskDashboard.tsx` (or wherever MortalityRiskChart is used)
2. Replace import:
   ```typescript
   // OLD:
   import { MortalityRiskChart } from './MortalityRiskChart';

   // NEW:
   import { MortalityRiskChart } from './MortalityRiskChart_Stacked';
   ```
3. Test and iterate on colors/styling

### To Add Toggle:
1. Create a wrapper component with state
2. Import both chart versions
3. Add toggle UI
4. Save user preference to localStorage

### To Have Both:
1. Rename components:
   - `MortalityRiskChart_Overall.tsx` (line chart)
   - `MortalityRiskChart_ByDisease.tsx` (stacked)
2. Display both on dashboard
3. Adjust heights to fit both

---

## Recommendation

**Start with stacked chart** because:
1. More informative and actionable
2. Shows the full picture of personalized risk
3. Aligns with the app's mission (12 diseases tracked)
4. Code is ready to go
5. Can always add line chart back as a toggle option

**But keep line chart available** because:
1. Some users prefer simplicity
2. "You vs Average" is powerful motivation
3. Good for quick risk check
4. Easier to understand for new users

**Ideal solution:** Toggle button or side-by-side display

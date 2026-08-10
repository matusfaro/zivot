# Next Phase Analysis & Recommendations

**Date**: January 4, 2026
**Current Status**: Phase 3 Complete, All Disease Models Implemented
**Analysis Type**: Next Phase Opportunity Assessment

---

## Current State

### Disease Models
- ✅ **21 disease models** implemented and active
- ✅ All calculators registered in RiskEngine
- ✅ All Phase 1-5 diseases complete

### Code Quality
- ⚠️ **61 TypeScript errors** remaining (non-blocking)
  - 48 in SwipeSurvey.tsx
  - 13 in other files
- ✅ **98.9% E2E test coverage** (94/95 tests passing)
- ✅ Build successful, ready for deployment

### Feature Completeness
- ✅ Risk calculation engine fully functional
- ✅ User input forms complete
- ✅ Data persistence working
- ⚠️ **Recommendations system** incomplete (TODO)
- ⚠️ **Risk interpretation** basic (TODO: comparison to average)
- ⚠️ **Modifiable levers** partially implemented (missing current/target values)

---

## Phase 4 Opportunities

### Option 1: Personalized Recommendations System 🎯 **RECOMMENDED**

**Impact**: HIGH | **Effort**: MEDIUM | **User Value**: HIGH

#### Current State
```typescript
// In RiskEngine.ts
return {
  ...
  interpretation,
  recommendations: [], // TODO: Phase 2 ⬅️ Empty!
}
```

#### What to Build
1. **Recommendation Engine**
   - Analyze disease risks and modifiable levers
   - Generate prioritized, actionable recommendations
   - Categorize by type: Screening, Lifestyle, Medical, Preventive

2. **Modifiable Levers Enhancement**
   - Extract `currentValue` from user profile (e.g., current BMI: 32)
   - Define `targetValue` based on evidence (e.g., target BMI: 25)
   - Calculate `potentialRiskReduction` (e.g., -8% mortality risk)
   - Estimate `effort` level (low/moderate/high)
   - Define `timeframe` to achieve (e.g., "6-12 months")

3. **Risk Comparison**
   - Add `comparisonToAverage` field
   - Calculate user risk vs. age/sex-matched population average
   - Display as percentage difference (e.g., "23% higher than average")

#### Implementation Plan
- [ ] Create `RecommendationEngine` class
- [ ] Build recommendation generation logic
- [ ] Extract current values from profile for top levers
- [ ] Define evidence-based target values
- [ ] Estimate effort and timeframes
- [ ] Add comparison to population average
- [ ] Create UI components to display recommendations
- [ ] Add E2E tests for recommendations

**Estimated Effort**: 400-600 lines of code, 2-3 hour implementation

**Files to Modify**:
- `src/engine/recommendations/RecommendationEngine.ts` (new)
- `src/engine/RiskEngine.ts` (update interpretation logic)
- `src/components/dashboard/RecommendationsPanel.tsx` (new)
- `src/types/risk/calculation.ts` (complete Recommendation interface)

---

### Option 2: Fix Remaining TypeScript Errors 🔧

**Impact**: MEDIUM | **Effort**: MEDIUM | **User Value**: LOW (technical debt)

#### Breakdown
- **48 errors** in SwipeSurvey.tsx
  - Survey questions reference non-existent fields
  - Need to either add fields to type system or disable questions

- **13 errors** in other files
  - Type assertions needed
  - Generic type issues
  - Interface mismatches

#### Implementation Plan
- [ ] Audit SwipeSurvey questions vs actual type definitions
- [ ] Decide: add missing fields OR remove invalid questions
- [ ] Fix type assertions in dataExtraction.ts
- [ ] Resolve generic type issues in useDebounceProp.ts
- [ ] Fix ProfileSectionComponents type mismatches

**Estimated Effort**: 200-300 lines of code changes, 1-2 hour implementation

**Impact**: Cleaner codebase, no new user-facing features

---

### Option 3: Enhanced UI Features 🎨

**Impact**: MEDIUM | **Effort**: HIGH | **User Value**: MEDIUM

#### Features to Build
1. **Educational Tooltips**
   - Add detailed explanations for complex fields (CAC score, Lp(a), etc.)
   - Risk factor education (why it matters, how to improve)
   - Citation links to source studies

2. **Crisis Resources**
   - Warning/resources for suicide-related questions
   - Mental health hotline information
   - Professional help recommendations

3. **Risk Visualization**
   - Interactive charts showing risk factor contributions
   - Timeline visualization (10-year, 20-year projections)
   - Before/after scenarios ("What if I quit smoking?")

4. **Progress Tracking**
   - Track changes in risk over time
   - Celebrate improvements
   - Show trend lines

#### Implementation Plan
- [ ] Design tooltip system architecture
- [ ] Create educational content for each field
- [ ] Add crisis resources modal for mental health
- [ ] Build risk factor contribution charts
- [ ] Implement scenario comparison tool
- [ ] Create progress tracking dashboard

**Estimated Effort**: 1000+ lines of code, 4-6 hour implementation

---

### Option 4: Data Quality & Validation 🛡️

**Impact**: MEDIUM | **Effort**: LOW | **User Value**: MEDIUM

#### Improvements
1. **Input Validation**
   - Add range validation warnings (e.g., "BMI of 15 is very low")
   - Detect conflicting inputs (e.g., never smoker with pack-years)
   - Suggest corrections

2. **Data Completeness**
   - Show profile completeness percentage
   - Suggest next fields to fill for better accuracy
   - Highlight missing critical data

3. **Confidence Scoring Enhancements**
   - Improve confidence level calculation
   - Show which fields would most improve confidence
   - Display uncertainty ranges

#### Implementation Plan
- [ ] Add validation rules to field definitions
- [ ] Create validation engine
- [ ] Build profile completeness calculator
- [ ] Enhance confidence scoring algorithm
- [ ] Add UI indicators for validation/completeness

**Estimated Effort**: 300-400 lines of code, 2-3 hour implementation

---

## Recommendation

### 🎯 **Option 1: Personalized Recommendations System**

**Rationale**:
1. **High User Value** - Users get actionable advice, not just numbers
2. **Partially Built** - Foundation exists in RiskEngine, just needs completion
3. **Natural Next Step** - Completes the risk calculation → interpretation → action pipeline
4. **Differentiating Feature** - Most risk calculators don't provide personalized recommendations
5. **Evidence-Based** - Can cite specific studies for each recommendation

**User Story**:
> "As a user who just learned my 10-year mortality risk is 18%, I want to know **what specific actions I can take** to reduce my risk, **how much each action would help**, and **how difficult each action would be**, so I can make informed decisions about my health."

**Example Output**:
```
Top Recommendations to Reduce Your Risk:

1. 🚬 Quit Smoking (High Priority)
   Current: 20 pack-years, current smoker
   Target: Quit within 6 months
   Potential Risk Reduction: -8.2%
   Effort: High
   Timeframe: 6-12 months
   Why: Smoking is your #1 modifiable risk factor, contributing to CVD, lung cancer, and COPD risk.

2. ⚖️ Reach Healthy Weight (High Priority)
   Current: BMI 32 (obese)
   Target: BMI 25 (healthy)
   Potential Risk Reduction: -3.1%
   Effort: Moderate to High
   Timeframe: 12-18 months
   Why: Affects diabetes, CVD, and cancer risk.

3. 🏃 Increase Physical Activity (Moderate Priority)
   Current: 0 minutes/week
   Target: 150 minutes/week moderate activity
   Potential Risk Reduction: -2.4%
   Effort: Moderate
   Timeframe: 3-6 months
   Why: Protective against CVD, diabetes, and all-cause mortality.
```

---

## Next Steps

If proceeding with **Option 1 (Recommendations System)**:

1. ✅ Create `RecommendationEngine.ts`
2. ✅ Implement current value extraction logic
3. ✅ Define evidence-based target values for common levers
4. ✅ Build effort/timeframe estimation logic
5. ✅ Generate prioritized recommendations
6. ✅ Add comparison to population average
7. ✅ Create UI component to display recommendations
8. ✅ Write E2E tests

**Timeline**: 2-3 hours for complete implementation

---

## Alternative: Hybrid Approach

Could combine multiple options:
1. **Phase 4A**: Recommendations System (2-3 hours)
2. **Phase 4B**: Fix critical TypeScript errors (1 hour)
3. **Phase 4C**: Add crisis resources modal (30 min)

**Total**: ~4 hours for comprehensive Phase 4

---

**Recommendation**: Start with **Option 1 (Recommendations System)** as it provides the highest user value and completes a natural feature pipeline.


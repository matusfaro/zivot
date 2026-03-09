# 💚 Swipe Survey Feature

## Overview

A Tinder-style swipe interface for completing the health survey in a fun, engaging way. Users swipe left for higher-risk options and right for lower-risk options, with immediate visual feedback showing the mortality impact of each choice.

## Access

Navigate to the "💚 Swipe Survey" tab in the header navigation.

## How It Works

### Interface

```
┌─────────────────────────────────────────┐
│          Swipe Survey                   │
│          Progress: 3 / 8                │
├─────────────────────────────────────────┤
│                                         │
│  ← Higher Risk    Lower Risk →         │
│                                         │
│  ┌───────────────────────────────┐    │
│  │   LIFESTYLE                    │    │
│  │                                │    │
│  │   Do you smoke cigarettes?    │    │
│  │                                │    │
│  │  ┌────────┐    ┌────────┐    │    │
│  │  │  🚬    │    │  🌬️   │    │    │
│  │  │Yes,I   │    │No, I   │    │    │
│  │  │ smoke  │    │don't   │    │    │
│  │  │        │    │smoke   │    │    │
│  │  │+2.5%   │    │-0.5%   │    │    │
│  │  └────────┘    └────────┘    │    │
│  └───────────────────────────────┘    │
│                                         │
│      [💀]          [💚]                │
│                                         │
└─────────────────────────────────────────┘
```

### Swipe Mechanics

**Left Swipe (💀)** - Higher Risk
- Selects the option that increases mortality risk
- Shows red indicator: "HIGHER RISK"
- Impact shown as positive number (e.g., +2.5%)

**Right Swipe (💚)** - Lower Risk
- Selects the option that decreases/maintains lower mortality risk
- Shows green indicator: "LOWER RISK"
- Impact shown as negative or zero (e.g., -0.5%)

### Input Methods

1. **Drag**: Click/touch and drag card left or right
2. **Buttons**: Tap the 💀 (left) or 💚 (right) buttons below
3. **Keyboard**: ← and → arrow keys (future enhancement)

## Features

### Visual Feedback

**During Drag:**
- Card rotates slightly based on drag direction
- Opacity decreases as you drag further
- Swipe indicator appears when dragged > 50px
  - Left: Red "💀 HIGHER RISK"
  - Right: Green "💚 LOWER RISK"

**After Swipe:**
- Card flies off screen in swipe direction
- Next card slides into view from behind
- Profile automatically updated

### Randomization

Questions are shuffled randomly each time to:
- Keep the experience fresh
- Prevent memorization
- Make it feel more like a game
- Encourage completion

### Progress Tracking

- Shows current question number (e.g., "3 / 8")
- Preview of next card visible behind current card
- Completion screen when all questions answered

## Questions

Currently includes 8 questions covering:

### Lifestyle (5 questions)
1. **Smoking** - Smoker (+2.5%) vs Non-smoker (-0.5%)
2. **Exercise** - No exercise (+1.2%) vs Regular exercise (-0.8%)
3. **Alcohol** - Heavy drinking (+1.8%) vs Moderate/None (-0.3%)
4. **Diet** - Junk food (+0.9%) vs Healthy diet (-0.6%)
5. **Sleep** - Poor sleep (+0.7%) vs Good sleep (-0.4%)

### Demographics (1 question)
6. **Biological Sex** - Male (+0.8%) vs Female (-0.8%)

### Medical History (2 questions)
7. **Diabetes** - Yes (+1.5%) vs No (0%)
8. **Hypertension** - Yes (+1.3%) vs No (0%)

## Mortality Impact

### How It's Calculated

The percentages shown are **estimated relative impacts** on 10-year mortality risk:
- **Positive numbers (+)**: Increase risk
- **Negative numbers (-)**: Decrease risk
- **Zero (0)**: Neutral/baseline

**Example:**
- Current risk: 5.0%
- Swipe left on smoking (+2.5%): Risk becomes ~7.5%
- Swipe right on exercise (-0.8%): Risk becomes ~4.2%

**Note:** These are approximations for UX purposes. The actual risk calculation in the engine uses precise hazard ratios and considers interactions between factors.

### Always Left = Higher Risk

The interface is designed so that:
- **Left swipe** always selects the riskier option
- **Right swipe** always selects the safer option

This creates a consistent mental model:
- Left = Bad = Red = 💀
- Right = Good = Green = 💚

## Profile Updates

Each swipe immediately updates the user profile:
- Changes saved to localStorage
- Risk recalculation triggered
- Dashboard reflects new values
- No explicit "Save" button needed

## Technical Implementation

### Components

**`SwipeSurvey.tsx`**
- Main swipe interface
- Handles drag/touch gestures
- Manages question flow
- Visual animations

**`SwipeSurveyPage.tsx`**
- Page wrapper
- Profile data integration
- Debug panel access
- Header navigation

### State Management

```typescript
interface SwipeQuestion {
  id: string;
  question: string;
  category: string;
  leftOption: {
    label: string;
    emoji: string;
    mortalityImpact: number;  // Always positive
    profileUpdate: (profile) => profile;
  };
  rightOption: {
    label: string;
    emoji: string;
    mortalityImpact: number;  // Always negative or zero
    profileUpdate: (profile) => profile;
  };
}
```

### Gesture Detection

- Mouse events: `onMouseDown`, `onMouseMove`, `onMouseUp`
- Touch events: `onTouchStart`, `onTouchMove`, `onTouchEnd`
- Threshold: 100px drag distance to trigger swipe
- Cancel if drag < 100px (snaps back)

## Responsive Design

### Desktop
- Card width: 400px max
- Button controls: 80px diameter
- Comfortable mouse dragging

### Mobile
- Full-width cards (with padding)
- Touch-optimized gesture area
- Larger tap targets
- Vertical stacking of options on small screens

## User Experience Goals

### Engagement
- **Fun**: Tinder-like mechanics are familiar and enjoyable
- **Visual**: Emojis and colors make it approachable
- **Immediate**: See impact instantly
- **Game-like**: Progress tracking, randomization

### Education
- **Transparent**: Shows mortality impact for each choice
- **Comparative**: Side-by-side options clarify tradeoffs
- **Quantified**: Percentages make abstract risk concrete

### Efficiency
- **Fast**: Quick swipes vs tedious form filling
- **Mobile-friendly**: Works great on phone
- **No thinking**: Binary choices, no text input

## Future Enhancements

### Potential Additions

1. **More Questions**
   - Expand to 20-30 questions
   - Add questions for all risk factors
   - Conditional questions (e.g., "How many cigarettes?" if smoker)

2. **Undo Feature**
   - Shake to undo last swipe
   - Button to go back one question
   - History of swipes

3. **Keyboard Support**
   - Arrow keys for swipe
   - Enter to confirm
   - ESC to cancel

4. **Animation Polish**
   - Card flip animation
   - Confetti on completion
   - Haptic feedback (mobile)

5. **Social Features**
   - Compare with friends
   - Share results
   - Challenge mode

6. **Smart Ordering**
   - Show high-impact questions first
   - Skip already-answered questions
   - Adaptive difficulty

7. **Explanations**
   - "Why?" button to explain impact
   - Links to research
   - Personalized tips

8. **Gamification**
   - Streaks for daily use
   - Achievements
   - Score based on risk reduction

## Comparison with Standard Form

### Swipe Survey
- ✅ Fun and engaging
- ✅ Mobile-optimized
- ✅ Quick (< 2 min)
- ✅ Visual feedback
- ❌ Limited to yes/no questions
- ❌ No precise numeric input

### Standard Dashboard
- ✅ Complete control
- ✅ Precise values (lab results, etc.)
- ✅ See all fields at once
- ✅ Professional interface
- ❌ More time-consuming
- ❌ Can feel overwhelming

**Both are available** - users can use whichever they prefer, or both!

## Accessibility

### Current
- Keyboard navigation (partial)
- High contrast colors
- Large touch targets
- Clear visual feedback

### Needs Improvement
- Screen reader support
- ARIA labels
- Focus management
- Reduced motion option

## Known Limitations

1. **Binary Choices Only**
   - Can't capture nuanced answers
   - No numeric ranges (e.g., "How many drinks?")
   - Some complexity lost for UX simplicity

2. **Approximate Impacts**
   - Percentages are estimates, not precise calculations
   - Actual risk calculation is more sophisticated
   - Impacts don't account for factor interactions

3. **No Validation**
   - Can swipe through quickly without thinking
   - No confirmation dialogs
   - Easy to make mistakes

4. **Limited Questions**
   - Currently only 8 questions
   - Doesn't cover all risk factors
   - May need expansion

## Summary

The Swipe Survey is a fun, engaging alternative to traditional form filling:

- **🎯 Purpose**: Make health surveys enjoyable
- **💡 Innovation**: Tinder-like UX for health data
- **📱 Platform**: Works great on mobile and desktop
- **⚡ Speed**: Complete survey in < 2 minutes
- **🎨 Design**: Visual, colorful, emoji-rich
- **🔄 Integration**: Seamlessly updates profile

Perfect for users who want a quick, fun way to get started with their health assessment!

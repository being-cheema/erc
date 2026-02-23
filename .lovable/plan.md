

# Bento Grid Home Page Redesign + Light/Dark Theme Polish

## What We're Building

Redesign the Home page to match the reference screenshot's **bento grid layout** with pill-shaped bar charts, activity category filters, and a friends/social widget. Both light and dark themes will be fully polished.

## Changes Overview

### 1. Home Page - Bento Grid Layout (`src/pages/Home.tsx`)

Restructure the current vertical stack into a mosaic bento grid:

- **Top row**: Two equal cards side by side
  - Left: **Distance card** -- large hero number (e.g. "42.5 km") with a mini weekly bar chart using pill-shaped (fully rounded) bars
  - Right: **Calories card** -- large hero number with a circular progress ring or mini chart
- **Full-width row**: **Activity card** -- shows "This Week" with category filter pills (All, Morning, Evening) and a list of recent runs
- **Bottom row**: Two cards
  - Left: **Next Race** countdown card
  - Right: **Streak / Rank** card

### 2. New Component: `src/components/home/BentoStatsGrid.tsx`

A new component replacing `GoalProgress` on the Home page:

- **Distance tile**: Large number + 7-day mini bar chart with pill-shaped bars (fully rounded `radius={[999,999,999,999]}`)
- **Calories tile**: Large number + simple visual indicator
- Uses existing hooks (`useMonthlyDistance`, `useWeeklyStats`, `useAllTimeStats`)

### 3. New Component: `src/components/home/ActivityFeed.tsx`

Replaces `RecentActivity` with a more polished version:

- Category filter pills at the top (All / Morning / Evening / Long Run)
- Activity list items with distance, pace, and date
- "View All" link to Stats page
- Uses existing `useRecentActivities` hook

### 4. Updated Weekly Chart Bars (`src/components/stats/WeeklyChart.tsx`)

- Change bar radius from `[4, 4, 0, 0]` to `[999, 999, 999, 999]` for the pill shape seen in the reference

### 5. Light Theme Polish (`src/index.css`)

The current light theme variables are basic. Updates:

- **`.glass-card` light mode variant**: Instead of `hsl(0 0% 100% / 0.06)`, use `hsl(0 0% 0% / 0.03)` with `border: 1px solid hsl(0 0% 0% / 0.06)` so cards are visible on white backgrounds
- Add a `.light .glass-card` rule so glassmorphism works in both themes
- Light mode stat labels, card backgrounds, and borders all get proper contrast

### 6. Theme Toggle Visibility (`src/pages/Settings.tsx`)

Ensure the existing theme toggle on the Settings page works and is prominent so users can switch between light/dark.

## Technical Details

### Bento Grid CSS

```text
+------------------+------------------+
|   Distance       |   Calories       |
|   42.5 km        |   1,250 kcal     |
|   [bar chart]    |   [ring/chart]   |
+------------------+------------------+
|   Recent Activity                   |
|   [All] [Morning] [Evening]         |
|   - Morning Run  5.2 km  5:30/km   |
|   - Evening Jog  3.1 km  6:15/km   |
+-------------------------------------+
|   Next Race      |   Streak & Rank  |
|   Mar 15         |   12 Days #4     |
+------------------+------------------+
```

Uses `grid grid-cols-2 gap-3` with `col-span-2` for the activity row.

### Light Mode Glass Card Fix

```css
/* Current (dark-only) */
.glass-card {
  background: hsl(0 0% 100% / 0.06);
  border: 1px solid hsl(0 0% 100% / 0.08);
}

/* New - theme-aware */
.glass-card {
  @apply backdrop-blur-xl rounded-2xl;
  background: hsl(0 0% 100% / 0.06);
  border: 1px solid hsl(0 0% 100% / 0.08);
}

:root .glass-card,
.light .glass-card {
  background: hsl(0 0% 100% / 0.7);
  border: 1px solid hsl(0 0% 0% / 0.08);
  box-shadow: 0 1px 3px hsl(0 0% 0% / 0.04);
}
```

### Pill Bar Chart

In all bar charts, change `radius` prop:
```text
Before: radius={[4, 4, 0, 0]}
After:  radius={[999, 999, 999, 999]}
```

### Files Modified

| File | Change |
|------|--------|
| `src/pages/Home.tsx` | Replace vertical layout with bento grid |
| `src/components/home/BentoStatsGrid.tsx` | NEW -- Distance + Calories bento tiles with mini charts |
| `src/components/home/ActivityFeed.tsx` | NEW -- Activity list with category filters |
| `src/components/home/GoalProgress.tsx` | Keep as-is (used on Stats page), no longer imported in Home |
| `src/components/home/RecentActivity.tsx` | Keep as-is, replaced by ActivityFeed on Home |
| `src/components/stats/WeeklyChart.tsx` | Pill-shaped bars |
| `src/index.css` | Light mode glass-card, theme-aware utilities |
| `src/components/layout/BottomNav.tsx` | Light mode border/bg adjustments |


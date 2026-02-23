
# Fix: Polish Bento Grid Layout + Light/Dark Theme Contrast

## Issues Found

From the screenshot, the current implementation has several visual quality gaps compared to the intended bento grid design:

1. **Cards lack depth in light mode** -- borders are barely visible, no shadows, everything looks flat
2. **Calorie ring is tiny** -- the SVG ring visual is too small (56x56) and looks orphaned
3. **Rank/Streak/Runs row is plain** -- no visual hierarchy, stats blend together
4. **Activity feed items lack polish** -- icon backgrounds are too subtle, spacing is tight
5. **Bottom nav active state** -- highlight is faint, label is barely readable
6. **Overall spacing and sizing** -- tiles feel cramped, numbers could be bolder

## Plan

### 1. Glass Card Light Mode Enhancement (`src/index.css`)

Strengthen the light mode `.glass-card` to have visible depth:

- Increase border opacity from `0.08` to `0.12`
- Add a stronger box-shadow: `0 2px 8px hsl(0 0% 0% / 0.06), 0 0 1px hsl(0 0% 0% / 0.08)`
- Slight background opacity bump from `0.7` to `0.75`
- Add subtle inner highlight

### 2. Bento Stats Grid Fix (`src/components/home/BentoStatsGrid.tsx`)

- Make the two tiles truly equal height with `min-h-[160px]`
- Enlarge the calorie ring from 56px to 72px viewbox for better visibility
- Add a subtle gradient background tint to each tile for visual interest
- Make numbers slightly larger (text-4xl instead of text-3xl) for impact
- Fix bar chart margins so it doesn't push boundaries

### 3. Rank/Streak/Runs Row Polish (`src/pages/Home.tsx`)

- Split into 3 separate mini glass cards instead of one card with dividers
- Each stat gets its own card in a `grid-cols-3` layout
- Add subtle icon or color accent to each stat
- Increase font weight and size of the numbers

### 4. Activity Feed Refinement (`src/components/home/ActivityFeed.tsx`)

- Make icon circles slightly larger (w-10 h-10)
- Add subtle separator lines between items
- Better spacing between activity rows
- Make the "View All" link more prominent with an arrow

### 5. Bottom Nav Contrast (`src/components/layout/BottomNav.tsx`)

- Increase active state background opacity from `primary/15` to `primary/20`
- Make inactive icons slightly more visible
- Add stronger border in light mode

## Files Modified

| File | Change |
|------|--------|
| `src/index.css` | Stronger light mode glass-card shadows and borders |
| `src/components/home/BentoStatsGrid.tsx` | Equal tile heights, bigger calorie ring, larger numbers |
| `src/pages/Home.tsx` | Split rank/streak/runs into 3 separate cards |
| `src/components/home/ActivityFeed.tsx` | Better spacing, larger icons, separators |
| `src/components/layout/BottomNav.tsx` | Stronger active state, better light mode contrast |

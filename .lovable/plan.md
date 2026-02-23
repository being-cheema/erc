

# Glassmorphism Athletic UI Overhaul -- Behance-Inspired Design

## What We're Adapting from the Behance Design

Key patterns visible in the "All Screen Preview" screenshot:

1. **Glassmorphism cards**: Translucent frosted-glass backgrounds with soft white/10 borders and large rounded corners (currently: solid dark cards with sharp edges)
2. **Floating pill bottom nav**: Detached from screen edges with rounded shape, active tab shows label + filled circle indicator (currently: flat bar flush to edges)
3. **Greeting + motivational headline**: "Hello, Jacob" with italic mixed-weight "Preparing for **the big move.**" (currently: standard greeting with no motivational copy)
4. **Goal Crusher horizontal scroll**: Stat cards ("Dis.Week 42.2 km", "Streak 7 Days") with small circular progress/emoji indicators, scrollable horizontally (currently: vertical stat blocks)
5. **Rounded activity rows**: Each activity in a rounded glass card with a circular icon on left, name+date, and distance on right (currently: square rows with sharp edges)
6. **Onboarding slide**: "You're in Good Company!" with runner silhouettes, "Start Tracking" button (currently: giant typography hero words)
7. **Warm charcoal palette**: Background is a dark gray (~10% lightness), not pure black (4%), with softer contrast
8. **Search bar on home**: Rounded search input below the motivational text

---

## Changes by File

### 1. Global Theme Shift -- `src/index.css`

- Dark background: `0 0% 4%` to `220 6% 10%` (warm charcoal)
- Card background: `0 0% 7%` to `220 6% 14%` with reduced opacity
- Border: `0 0% 16%` to `0 0% 20%` (slightly more visible)
- Radius: `0.25rem` to `1rem` (large rounded corners everywhere)
- Muted foreground: `0 0% 65%` to `0 0% 70%` (better readability)
- New `.glass-card` utility: `backdrop-blur-xl bg-white/[0.06] border border-white/[0.08] rounded-2xl`
- New `.glass-card-hover` for interactive glass cards
- Update `.athletic-card` to use rounded-2xl instead of rounded-sm
- Update `.progress-athletic` to use rounded-full

### 2. Floating Pill Bottom Nav -- `src/components/layout/BottomNav.tsx`

Matching the Behance nav exactly:
- Detach from edges: `mx-4 mb-4` margin
- Pill shape: `rounded-2xl`
- Glassmorphism: `backdrop-blur-xl bg-card/80 border border-white/10`
- Shadow: `shadow-lg shadow-black/20`
- Active tab: show label text below icon; inactive tabs: icon only (no label)
- Active indicator: filled circle behind icon instead of top dot
- Remove top border, add shadow instead

### 3. Layout Padding -- `src/components/layout/AppLayout.tsx`

- Increase `pb-20` to `pb-28` to accommodate the floating nav with margin

### 4. Home Page Redesign -- `src/pages/Home.tsx`

Matching the Behance "Home" screen:
- **Greeting**: Keep "Hello, [Name]" but add motivational mixed-weight text below: "Keep pushing" in regular weight, "**your limits.**" in bold italic -- dynamic based on user data (streak, goal progress)
- **Goal Crusher section**: Change GoalProgress + secondary stats into a horizontal scrollable row of glass stat cards (like the "Dis.Week 42.2 km", "Streak 7 Days", "Runs 24" cards in the screenshot)
- **Recent Activities header**: Add "View all" link on the right (matching Behance)
- **Quick action cards**: Apply glass-card styling with rounded-2xl
- Apply glass-card styling to all card containers

### 5. Goal Progress Component -- `src/components/home/GoalProgress.tsx`

- Convert from a single large card to a horizontal scrollable "Goal Crusher" row
- Each stat as a small glass pill card (~120px wide) with:
  - Small circular progress indicator or emoji
  - Stat label on top ("Dis.Week", "Streak", "Active")
  - Large value below ("42.2 km", "7 Days")
- Use horizontal scroll with `overflow-x-auto scrollbar-hide`
- Apply glass-card styling to each pill

### 6. Recent Activity Component -- `src/components/home/RecentActivity.tsx`

- Container: glass-card styling
- Each activity row: rounded-2xl glass sub-card (not square bg-secondary/50)
- Icon: circular background (`rounded-full`) with activity icon inside
- Keep distance on the right side
- Add "View all" text-button in header

### 7. Leaderboard -- `src/pages/Leaderboard.tsx`

- Podium blocks: rounded-2xl glass cards instead of square blocks
- 1st place: gradient border glow effect
- Runner list cards: glass-card styling with rounded-2xl
- Current user row: softer glow with glass border
- Tab triggers: rounded-xl pill style

### 8. Login Page -- `src/pages/Login.tsx`

- Wrap content in a glass-card container with rounded-3xl
- Strava button: rounded-xl instead of rounded-sm
- Keep existing typography improvements

### 9. Onboarding -- `src/components/onboarding/OnboardingSlide.tsx` and `OnboardingCarousel.tsx`

- Last slide: Change from "GOAL" hero word to "You're in Good Company!" style messaging (matching Behance bottom-right screen)
- Buttons: rounded-full pill shape instead of sharp
- Softer glow effects on hero words
- "Get Started" button becomes "Start Tracking" (matching Behance)

### 10. Card Component -- `src/components/ui/card.tsx`

- Update default Card class from `rounded-sm` to `rounded-2xl` to match the global rounded aesthetic

### 11. Tailwind Config -- `tailwind.config.ts`

- Ensure `borderRadius` values include `2xl` and `3xl` references properly

---

## Technical Details

### Files Modified

| File | Change Summary |
|------|---------------|
| `src/index.css` | Warm charcoal background, larger radius, glass-card utilities, improved contrast |
| `tailwind.config.ts` | Border radius values if needed |
| `src/components/ui/card.tsx` | `rounded-sm` to `rounded-2xl` |
| `src/components/layout/BottomNav.tsx` | Floating pill nav with glassmorphism, icon-only inactive tabs |
| `src/components/layout/AppLayout.tsx` | Increased bottom padding for floating nav |
| `src/pages/Home.tsx` | Motivational greeting, horizontal Goal Crusher section, glass styling |
| `src/components/home/GoalProgress.tsx` | Horizontal scrollable stat pills with glass styling |
| `src/components/home/RecentActivity.tsx` | Rounded glass activity rows, "View all" link |
| `src/pages/Leaderboard.tsx` | Glass podium cards, rounded list items, pill tabs |
| `src/pages/Login.tsx` | Glass container wrapper, rounded button |
| `src/components/onboarding/OnboardingSlide.tsx` | Softer glow, last-slide messaging update |
| `src/components/onboarding/OnboardingCarousel.tsx` | Pill-shaped buttons, "Start Tracking" CTA |

No database or backend changes needed. Pure frontend visual refinement.




# Premium UI/UX Overhaul -- Nike/Adidas-Level Athletic Design

## The Problem

The current UI has solid bones (dark theme, Strava orange accent, Inter font, sharp edges) but falls short of a premium athletic app in several key areas:

1. **Onboarding**: Stick-figure SVG illustrations look amateur -- Nike NRC uses full-bleed photography and bold typography-forward slides
2. **Typography hierarchy is flat**: Titles are bold but not dramatically sized; no contrast between hero numbers and supporting text like Nike/Adidas apps
3. **Onboarding description text is invisible**: Low contrast muted text barely readable on dark background (visible in the screenshot)
4. **Bottom nav is overcrowded**: 7 items (Home, Races, Ranks, Badges, Stats, Blog, Admin) -- Nike NRC uses 4, Strava uses 5
5. **Cards lack depth**: All cards look the same -- no visual differentiation between primary actions and secondary info
6. **No hero moments**: Missing large, dramatic stat displays that make Nike/Adidas apps feel powerful

## Design Philosophy

Inspired by Nike Run Club, Adidas Running, and Strava:
- **Typography IS the illustration** -- replace stick figures with massive, impactful type
- **Data as hero** -- oversized numbers with thin unit labels (like Nike's "24.3 KM" display)
- **Fewer, bolder elements** -- reduce visual noise, increase whitespace
- **Motion with purpose** -- subtle entrance animations, not constant particle effects

---

## Changes

### 1. Onboarding Redesign -- Typography-First Approach

**File: `src/components/onboarding/OnboardingSlide.tsx`**

Replace the RunnerIllustration component with massive typographic elements per slide:

- Slide 1 ("Track Every Mile"): Giant "TRACK" in 120px condensed uppercase with a gradient stroke, speed lines as simple CSS
- Slide 2 ("Join Your Tribe"): Large "TRIBE" with a row of minimal avatar circles below
- Slide 3 ("Chase Your Goals"): Oversized trophy emoji or "GOAL" with a progress bar animation

Remove the `RunnerIllustration` component import entirely. The title becomes the hero.

**File: `src/components/onboarding/OnboardingCarousel.tsx`**

- Remove `ParticleField` -- replace with a single subtle radial gradient that shifts color per slide
- Make the description text `text-foreground/70` instead of `text-muted-foreground` for better readability
- Increase title size to `text-5xl` with `font-black uppercase tracking-tighter`
- Remove the shimmer effect on the title (gimmicky)
- Simplify background to a clean dark gradient without animated orbs

### 2. Streamline Bottom Navigation to 5 Items

**File: `src/components/layout/BottomNav.tsx`**

Reduce from 7 to 5 core tabs:
- Home | Races | Ranks | Stats | Profile

Move "Badges" into the Profile/Settings section. Move "Blog" into Home as a card or into a dedicated section accessible from Home. Move "Admin" to Settings (only visible to admins).

This matches Nike NRC's clean 4-5 tab pattern.

### 3. Home Page -- Hero Stat Treatment

**File: `src/pages/Home.tsx`**

- Replace the 2-column stats grid with a single **hero stat banner**: the user's monthly distance in massive `text-6xl font-black` with "KM" in `text-lg font-medium text-muted-foreground`
- Below it, a horizontal row of secondary stats (Rank, Streak, Runs) in smaller `text-xl` with uppercase labels
- Increase card spacing from `space-y-4` to `space-y-6`
- Remove the "Strava Connected" status card at the bottom (unnecessary visual noise -- user already knows)

### 4. Leaderboard -- Podium Polish

**File: `src/pages/Leaderboard.tsx`**

- Make the 1st place podium block taller with the user's avatar larger (w-20 h-20)
- Add a subtle gradient border glow on the current user's row
- Use `text-5xl` for the 1st place rank number instead of `text-3xl`

### 5. Login Page -- Bolder

**File: `src/pages/Login.tsx`**

- Increase the tagline "Run to Live." to `text-5xl` or `text-6xl`
- Add a secondary line below in `text-sm uppercase tracking-widest text-muted-foreground`: "ERODE RUNNERS CLUB"
- Make the Strava button slightly taller (h-16) with more prominent text

### 6. Global CSS Refinements

**File: `src/index.css`**

- Add a utility class `.hero-stat` for oversized stat numbers: `text-6xl font-black tracking-tighter leading-none`
- Add `.stat-label` for the small uppercase labels beside hero stats
- Ensure dark mode description text has better contrast: bump `--muted-foreground` from `0 0% 55%` to `0 0% 65%`

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/onboarding/OnboardingSlide.tsx` | Replace illustration with typography-hero layout |
| `src/components/onboarding/OnboardingCarousel.tsx` | Remove ParticleField, simplify backgrounds, improve text contrast |
| `src/components/layout/BottomNav.tsx` | Reduce to 5 tabs, move Blog/Badges/Admin elsewhere |
| `src/pages/Home.tsx` | Hero stat banner, better spacing, remove Strava status card |
| `src/pages/Login.tsx` | Larger typography, bolder Strava button |
| `src/pages/Leaderboard.tsx` | Larger podium treatment, current-user glow |
| `src/index.css` | Hero stat utilities, improved muted-foreground contrast |
| `src/pages/Settings.tsx` | Add Blog link and Achievements section (moved from nav) |

No database changes. No edge function changes. Pure frontend refinement.


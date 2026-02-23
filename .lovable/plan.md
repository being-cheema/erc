

# Integrate `liquid-glass-react` Library

## What is `liquid-glass-react`?

A React component library (npm package) that creates Apple's Liquid Glass effect using SVG filters. It provides real refraction, chromatic aberration, elastic hover, and specular highlights -- all working on the web. Currently the app uses a manual `.glass-card` CSS class (simple backdrop-blur + translucent background). This upgrade replaces that with the real liquid glass effect.

## Integration Strategy

Install the package and apply `<LiquidGlass>` to key surfaces. Not every element needs it -- overuse would hurt performance and readability. We'll apply it to:

- **Bottom Navigation** (always visible, high impact)
- **Login card** (first impression)
- **Home page stats card** (secondary stats row)
- **Quick action cards** on Home
- **Leaderboard podium blocks** (1st, 2nd, 3rd place)
- **Onboarding CTA button area**

Individual small elements like GoalProgress pills and activity rows will keep the lightweight `.glass-card` CSS to avoid performance overhead from dozens of SVG filters.

---

## Changes

### 1. Install dependency

Add `liquid-glass-react` to `package.json`.

### 2. Bottom Navigation -- `src/components/layout/BottomNav.tsx`

Wrap the nav container `div` with `<LiquidGlass>`:

```
<LiquidGlass
  displacementScale={40}
  blurAmount={0.08}
  saturation={120}
  aberrationIntensity={1}
  cornerRadius={16}
>
  <div className="flex items-center h-16">...</div>
</LiquidGlass>
```

Remove the manual `backdrop-blur-xl bg-card/80 border border-white/10` classes from the inner div since LiquidGlass handles the glass effect. Keep `rounded-2xl shadow-lg` on the outer wrapper.

### 3. Login Page -- `src/pages/Login.tsx`

Replace the `.glass-card` class on the login container with a `<LiquidGlass>` wrapper:

```
<LiquidGlass
  displacementScale={48}
  blurAmount={0.1}
  saturation={130}
  aberrationIntensity={1.5}
  cornerRadius={24}
  padding="32px"
>
  {/* Logo, title, button content */}
</LiquidGlass>
```

### 4. Home Page Stats Card -- `src/pages/Home.tsx`

Wrap the secondary stats row (Rank / Streak / Runs) in `<LiquidGlass>` with subtle settings:

```
<LiquidGlass
  displacementScale={32}
  blurAmount={0.06}
  saturation={120}
  cornerRadius={16}
  padding="16px"
>
```

Also wrap each quick action card (Next Race, Training) in `<LiquidGlass>` with subtle settings.

### 5. Leaderboard Podium -- `src/pages/Leaderboard.tsx`

Wrap the 1st place podium block in `<LiquidGlass>` with medium intensity. The 2nd and 3rd place blocks get subtle intensity. This creates a hierarchy where the winner's card has the most dramatic glass effect.

### 6. Onboarding CTA -- `src/components/onboarding/OnboardingCarousel.tsx`

Wrap the "Start Tracking" / "Next" button area in a `<LiquidGlass>` container with subtle settings to give the bottom action area a premium floating feel.

### 7. Keep `.glass-card` CSS -- `src/index.css`

The existing `.glass-card` class stays unchanged for smaller elements (GoalProgress pills, activity rows, leaderboard list cards) that don't warrant the SVG filter overhead. This is a performance-conscious approach.

---

## Technical Details

### LiquidGlass Props Used

| Prop | Description | Values Used |
|------|-------------|-------------|
| `displacementScale` | Refraction strength | 32 (subtle), 48 (medium), 64 (strong) |
| `blurAmount` | Background blur | 0.06-0.12 |
| `saturation` | Color saturation boost | 120-140 |
| `aberrationIntensity` | Chromatic aberration | 1-2 |
| `cornerRadius` | Rounded corners | 16 (cards), 24 (login) |
| `padding` | Inner padding | Varies per use |
| `elasticity` | Hover liquid wobble | 0.25-0.35 |

### Browser Support Note

Safari and Firefox only partially support the displacement effect (the refraction won't be visible). The component falls back gracefully to a blurred glass look, which is still an improvement over the current flat CSS.

### Files Modified

| File | Change |
|------|--------|
| `package.json` | Add `liquid-glass-react` dependency |
| `src/components/layout/BottomNav.tsx` | Wrap nav in LiquidGlass |
| `src/pages/Login.tsx` | Replace glass-card with LiquidGlass |
| `src/pages/Home.tsx` | Wrap stats card and quick actions in LiquidGlass |
| `src/pages/Leaderboard.tsx` | Wrap podium blocks in LiquidGlass |
| `src/components/onboarding/OnboardingCarousel.tsx` | Wrap CTA area in LiquidGlass |

No database changes. No edge function changes.


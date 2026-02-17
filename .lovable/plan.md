
## Add Admin Icon to Bottom Navigation

### What Changes
The bottom navigation bar will show a 6th icon (shield icon) for admin users only. Non-admin users see the same 5 tabs as today.

### How It Works
1. **Create a reusable `useIsAdmin` hook** (`src/hooks/useIsAdmin.ts`) that queries the `user_roles` table for the current user's admin role. This replaces the inline check in `Admin.tsx` and can be reused anywhere.

2. **Update `BottomNav.tsx`** to:
   - Import and call `useIsAdmin()`
   - Conditionally append an "Admin" nav item (with `Shield` icon from lucide-react) to the nav list when the user is an admin
   - The admin icon appears as the last item in the nav bar

### Technical Details

**New file: `src/hooks/useIsAdmin.ts`**
- Uses `@tanstack/react-query` to query `user_roles` table
- Returns `{ isAdmin: boolean, isLoading: boolean }`
- Query key: `["isAdmin"]`
- Checks for `role = 'admin'` matching the current authenticated user

**Modified file: `src/components/layout/BottomNav.tsx`**
- Import `useIsAdmin` hook and `Shield` icon
- Build the nav items array dynamically: base 5 items + admin item if `isAdmin` is true
- No layout changes needed -- 6 items fit comfortably in the bottom nav

**Optional cleanup in `src/pages/Admin.tsx`**
- Replace the inline admin check with the new `useIsAdmin` hook for consistency

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useIsAdmin.ts` | New reusable hook to check admin role |
| `src/components/layout/BottomNav.tsx` | Conditionally show Admin nav item |
| `src/pages/Admin.tsx` | Refactor to use shared `useIsAdmin` hook |

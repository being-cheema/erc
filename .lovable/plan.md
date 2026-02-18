
## Fix Race Distance Field: Replace Dropdown with Free-Text Input

### The Problem
The race form uses a locked `<Select>` dropdown for the `distance_type` field, limiting admins to only 5 predefined options: 5K, 10K, Half Marathon, Marathon, Ultra. Since `distance_type` is a plain `text` column in the database, it can hold any value — but the UI prevents entering custom distances like 8K, 15K, 21.1K, 30K, trail races, etc.

### The Fix
Replace the `<Select>` dropdown with a standard text `<Input>` field that has a helpful placeholder, so admins can type any distance freely.

To preserve usability (discoverability of common values), a small hint below the field will suggest the most common formats. This is simpler and more reliable than a combobox.

### What Changes

**File: `src/pages/Admin.tsx`**

In the `RacesAdmin` component, lines ~257-269, replace:
```
<Select
  value={form.distance_type || ""}
  onValueChange={(v) => setForm({ ...form, distance_type: v })}
>
  <SelectTrigger><SelectValue placeholder="Distance" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="5K">5K</SelectItem>
    <SelectItem value="10K">10K</SelectItem>
    <SelectItem value="Half Marathon">Half Marathon</SelectItem>
    <SelectItem value="Marathon">Marathon</SelectItem>
    <SelectItem value="Ultra">Ultra</SelectItem>
  </SelectContent>
</Select>
```

With a plain text input:
```
<Input
  placeholder="Distance (e.g. 5K, 10K, Half Marathon)"
  value={form.distance_type || ""}
  onChange={(e) => setForm({ ...form, distance_type: e.target.value })}
/>
```

### Result
Admins can type any distance freely — "8K", "15K", "25K", "Trail 50K", "42.2K", anything — with no restrictions. The placeholder guides them on the expected format.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Replace `<Select>` with `<Input>` for race distance field |

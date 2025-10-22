# 🐛 Bug Fix: JSON Parsing Error

## Issue
```
GET /api/users/potential-matches 500 (Internal Server Error)
SyntaxError: "[object Object]" is not valid JSON
```

## Root Cause

PostgreSQL JSONB fields are **automatically parsed** by the `pg` library and returned as JavaScript objects, not strings.

The code was trying to parse them again with `JSON.parse()`, which caused the error:
```typescript
// ❌ WRONG - tries to parse an already-parsed object
const preferences = user.preferences ? JSON.parse(user.preferences as any) : {};
```

## Solution

Check if the value is already an object before parsing:

```typescript
// ✅ CORRECT - handles both string and object
let preferences = {};
if (user.preferences) {
  if (typeof user.preferences === 'string') {
    preferences = JSON.parse(user.preferences);
  } else {
    preferences = user.preferences as any;
  }
}
```

## Files Changed

- `backend/src/controllers/userController.ts` - Fixed `getPotentialMatches` method

## Testing

After the fix, the `/api/users/potential-matches` endpoint should work correctly:

```bash
# Test with a valid token
curl http://localhost:5000/api/users/potential-matches \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Why This Happens

PostgreSQL has two JSON types:
- **JSON** - Stored as text, needs parsing
- **JSONB** - Stored as binary, auto-parsed by pg library

Our database uses **JSONB** for `photos`, `interests`, and `preferences` columns, so they're automatically parsed.

## Prevention

When working with JSONB fields:
1. Always check the type before parsing
2. Or use a helper function:

```typescript
function parseJSONField(field: any): any {
  if (!field) return null;
  if (typeof field === 'string') return JSON.parse(field);
  return field;
}
```

## Status

✅ **FIXED** - The swipe page should now load potential matches without errors.

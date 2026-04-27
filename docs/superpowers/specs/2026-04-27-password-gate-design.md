# Password Gate — Design Spec

**Date:** 2026-04-27  
**Status:** Approved

## Overview

Add a password gate to the frontend so only users who know the fixed password `Zoombo2026!` can access the app. The unlocked state persists across page refreshes via `localStorage`.

## Architecture

A new `PasswordGate` component wraps `<App>` in `main.tsx`. It owns all authentication state and logic. `App.tsx` is not modified.

```
main.tsx
  └── <PasswordGate>
        └── <App />   (rendered only when authenticated)
```

## Component: PasswordGate

**File:** `packages/client/src/PasswordGate.tsx`

**Responsibilities:**
- On mount, check `localStorage.getItem('auth') === '1'`; if true, render children immediately
- Otherwise render the password screen
- On form submit, compare input against hardcoded `'Zoombo2026!'`
  - Match: `localStorage.setItem('auth', '1')`, set `authenticated = true`
  - No match: show inline error message, clear input

**Props:** `{ children: React.ReactNode }`

**State:**
- `authenticated: boolean` — initialized from localStorage
- `input: string` — controlled input value
- `error: boolean` — whether to show "密码错误" message

## UI

Centered card on a full-screen dark background matching the app theme (`#0d1117`). The card (`#161b22`, `1px solid #30363d`, `border-radius: 8px`) contains:

1. App title: "Batch Image Generator"
2. `<input type="password">` with placeholder "请输入访问密码"
3. Submit button (primary style, `#238636` green, same as existing `.btn--primary`)
4. Error line: "密码错误，请重试" (shown only when `error === true`, red `#f85149`)

Styles are inlined as a `<style>` tag inside the component — no new CSS file needed. Enter key submits the form.

## Data Flow

```
Page load
  → localStorage auth=1?  → yes → render App
                           → no  → render password screen
                                     ↓ user submits
                                   password correct?
                                     → yes → write localStorage → render App
                                     → no  → show error, clear input
```

## Changes

| File | Change |
|------|--------|
| `packages/client/src/PasswordGate.tsx` | New file |
| `packages/client/src/main.tsx` | Wrap `<App>` with `<PasswordGate>` |

No other files are modified.

## Out of Scope

- Logout / lock functionality
- Server-side enforcement
- Multiple passwords or user accounts

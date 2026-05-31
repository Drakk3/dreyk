# apps/companion

Phase 7 companion auth bootstrap status.

What exists now:

- Expo public Supabase env reader for companion-local auth setup.
- Mobile Supabase singleton with AsyncStorage session persistence.
- Companion-local auth feature types, Zustand store, pure session helpers, and bootstrap/sign-in/sign-out hooks.
- Expo Router root layout with `(auth)` and `(main)` guards, plus sign-in and authenticated landing screens.
- Expo SDK 52-aligned router/native dependency declarations needed for focused companion lint/typecheck verification.

What is intentionally deferred beyond Phase 7:

- GPS tracking, notifications, and background tasks.
- Full runtime/device validation still needs a real Expo harness and credentials-backed manual exercise.

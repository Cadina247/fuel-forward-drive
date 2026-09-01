# Fix new user registration and login

## What I verified first

I probed the live backend (project `fytksuhwheohqcobuzbk`) and ran the real signup flow in the app:

- Backend auth is healthy again — the earlier "Database error querying schema" is gone.
- Email + password signup **works end to end**: the app called signup, got a session, and landed on the home dashboard. Email auto-confirm is ON, so new users are signed in immediately.
- Sign-in with wrong credentials returns a normal "Invalid login credentials" error (not a crash).
- The `profiles` table exists and is readable.

So the failures users are hitting are on the paths that are **not** email+password:

- **Phone auth is disabled** in the backend (`phone: false`, no SMS provider verified). The Phone tab's "send code" / OTP sign-in cannot succeed — it errors out.
- **Google is disabled** in the backend (`google: false`). "Continue with Google" returns "Unsupported provider".
- The signup password field's label is not wired to its input, so tapping the label doesn't focus it and password managers/autofill behave inconsistently.
- The profile row is only created by a client-side upsert after login; if that call is blocked there is no server-side safety net, so a registered user can end up with a blank name.

## What I'll change

1. **Hide what the backend can't do.** Only show the Phone tab and "Continue with Google" when those providers are actually enabled (checked once at load from the auth settings endpoint). No more dead buttons that throw "Unsupported provider".
2. **Clear, human error messages** on both sign-in and sign-up: duplicate email, weak/short password, invalid email, network failure — each mapped to a plain sentence instead of a raw backend string, shown inline under the form as well as in a toast.
3. **Fix the signup form fields**: proper label/input association for password (and full name/phone), correct `autoComplete` and mobile keypad types, minimum password length validated before submitting.
4. **Guarantee the profile row** with a database trigger that inserts into `profiles` on new signup (full name, email, phone from signup metadata), plus the RLS policies for owner read/update and the required grants. The client upsert stays as a fallback.
5. **Post-signup routing**: since email confirmation is off, land straight on the customer home with the correct greeting; if confirmation is ever turned on, show a "check your email" state instead of pretending the user is logged in.
6. **Verify in-browser**: register a brand new account, confirm the greeting shows the name, refresh to confirm the session persists, log out, and log back in with the same credentials.

## Technical notes

- Provider availability read from `/auth/v1/settings` (public, no secret) and cached in the auth context.
- SQL migration: `handle_new_user()` security-definer trigger on `auth.users`, `profiles` RLS policies scoped to `auth.uid()`, and `GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated` / `GRANT ALL ... TO service_role`.
- Files touched: `src/components/AuthScreen.tsx`, `src/contexts/AuthContext.tsx`, and a new SQL file under `supabase/sql/`.

## If you want phone or Google login to actually work

They need to be enabled on the backend (SMS provider credentials for phone; a Google OAuth client ID/secret for Google). Tell me and I'll include the exact steps — otherwise those options stay hidden and email+password is the supported path.

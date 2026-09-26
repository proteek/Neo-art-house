# Neo Art House authentication activation

The redesigned site already contains:

- `sign-in.html`
- `account.html`
- Google / Apple / email magic-link UI
- Saved corridors
- Followed auction houses
- Saved auction alerts
- Buyer profile
- Dashboard counts
- Preview account mode using browser-local storage
- Supabase authentication adapter

## Recommended provider

Supabase Auth is used as the adapter because it supports:

- Google OAuth
- Sign in with Apple
- Passwordless email magic links
- Static-site deployments such as Cloudflare Pages

## Activation

1. Create a Supabase project.
2. In **Authentication → URL Configuration**, add:
   - Production site URL: `https://theneoarthouse.com`
   - Cloudflare preview URL(s) as redirect URLs while testing.
3. Enable **Google** under Authentication providers and configure the Google OAuth client.
4. Enable **Apple** and configure the Apple Services ID / key settings.
5. Leave email OTP / magic link enabled if desired.
6. Copy only the public Project URL and public anon key into:
   `assets/data/auth-config.json`
7. Set:
   `"enabled": true`

Example:

```json
{
  "provider": "supabase",
  "enabled": true,
  "projectUrl": "https://YOUR_PROJECT.supabase.co",
  "anonKey": "YOUR_PUBLIC_ANON_KEY",
  "redirectPath": "account.html",
  "providers": {
    "google": true,
    "apple": true,
    "emailMagicLink": true
  }
}
```

## Never commit

Do not put any of these in the repository:

- Supabase service-role key
- Google OAuth client secret
- Apple private key
- Apple client secret
- Any server-side admin credential

Those remain in the relevant provider dashboards / server environment.

## Data persistence

The preview currently stores profile/watchlist data in local browser storage so the interface can be tested before account infrastructure is connected.

After authentication is activated, the next data step is creating authenticated tables for:

- profiles
- saved_corridors
- followed_houses
- saved_alerts
- passport_history
- research_requests

Row-level security should restrict every private record to its owning user or authorised organisation/team.

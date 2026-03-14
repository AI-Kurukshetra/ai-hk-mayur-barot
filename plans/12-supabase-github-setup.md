# 12. Supabase GitHub Sign-In Setup

You already signed up to Supabase using GitHub. That is your **Supabase account login**, not automatically your app's end-user OAuth config.

## Required Steps for App Auth
1. In Supabase project dashboard go to `Authentication -> Sign In / Providers -> GitHub`.
2. Copy your Supabase callback URL from that screen.
3. In GitHub `Settings -> Developer settings -> OAuth Apps`, create an OAuth App:
- Homepage URL: your app URL (for local: `http://localhost:3000`)
- Authorization callback URL: Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`)
4. Paste GitHub Client ID + Client Secret into Supabase GitHub provider settings.
5. In Supabase `Authentication -> URL Configuration`:
- Site URL: `http://localhost:3000` (dev), then production URL on Vercel later
- Add Redirect URL: `http://localhost:3000/auth/callback`
- Add Redirect URL: `https://<your-prod-domain>/auth/callback`
6. Set env vars in project root `.env.local` from `.env.example`.
7. Run app and test `/login` -> `Continue with GitHub`.

## Common Mistakes
- Using wrong callback (must be Supabase callback, not Next.js callback) in GitHub OAuth App.
- Forgetting to add `/auth/callback` URLs in Supabase redirect allow list.
- Missing env vars in Vercel environment settings.

## References
- https://supabase.com/docs/guides/auth/social-login/auth-github
- https://supabase.com/docs/guides/auth/server-side/nextjs

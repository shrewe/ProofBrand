# ProofBrand authentication setup

## 1. Create the Supabase project

1. Open https://supabase.com/dashboard and create a project named `ProofBrand`.
2. Choose a region close to your users and save the database password securely.
3. In the project dashboard, open **Connect** or **Project Settings → API Keys** and copy the Project URL and the publishable key.

## 2. Configure local environment variables

Copy `.env.example` to `.env.local` in the project root, then replace the placeholders:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Do not put a service-role/secret key in a `NEXT_PUBLIC_` variable, commit `.env.local`, or share private keys in chat. `.env.local` is ignored by Git.

## 3. Set authentication URLs

In **Authentication → URL Configuration**:

- Set **Site URL** to `http://localhost:3000` while developing locally.
- Add `http://localhost:3000/auth/callback` to **Redirect URLs**.
- Before production, set the Site URL to your deployed HTTPS domain and add `https://YOUR_DOMAIN/auth/callback` to Redirect URLs.

## 4. Email/password

In **Authentication → Sign In / Providers**, enable Email. Keep email confirmation enabled for real accounts. The sign-up screen sends a confirmation email and the callback route exchanges the returned code for a session. If testing locally, make sure Supabase's email delivery settings permit sending to your address; configure custom SMTP before production for reliable delivery.

## 5. Google, Apple, Microsoft sign-in

The buttons are wired to Supabase OAuth, but each provider must be configured before it can work:

- **Google:** enable Google in Supabase Auth providers; create OAuth credentials in Google Cloud Console; register the Supabase callback URL shown by Supabase as an authorized redirect URI; paste the client ID and client secret into Supabase.
- **Apple:** configure Sign in with Apple for your Apple Developer account, create the required Service ID/key, and enter the credentials Supabase requests. Apple requires an appropriately configured developer account/domain.
- **Microsoft:** enable the Azure provider in Supabase; register an application in Microsoft Entra ID, configure its redirect URI using the callback URL Supabase displays, and enter the client ID/secret and tenant settings required for your app. The code uses Supabase's provider identifier `azure` for Microsoft.

Use the exact callback URI displayed by Supabase for each provider—do not guess it. Provider credentials belong in Supabase's provider settings, not in the frontend source code.

## 6. Install and run

From the project root in PowerShell:

```powershell
pnpm install
Copy-Item .env.example .env.local
# Edit .env.local with your actual URL and publishable key
pnpm dev
```

Then open http://localhost:3000. Visiting the dashboard while signed out should redirect to `/login`. Test email sign-up, confirmation, sign-in, a configured OAuth provider, page refresh, and sign-out.

## Important data note

This integration protects dashboard routes and creates authenticated sessions. The existing ProofBrand review/guideline services still use browser `localStorage`; that data is not yet stored in a per-user database and is not automatically private/synced across devices just because login exists. Before using real customer data or deploying publicly, move user-owned records to Supabase tables with Row Level Security (RLS) policies tied to `auth.uid()`, and verify server-side authorization for every data operation.

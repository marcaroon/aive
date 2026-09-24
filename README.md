# Aivé

Made for Aivel. A personal cycle and wellness companion for Aivel and Ammar.
The UI uses simple, casual English. Shared copy lives in `src/lib/copy.ts`;
labels live beside their types. Stored values and existing data stay unchanged.

## Run locally

```sh
npm install
npm run dev
```

Private links are the default. There is no account login, registration, password
reset, or sign-out flow. The original Firebase account implementation is retained.
Copy `.env.local.example` to `.env.local` and configure the server variables first.

```sh
npm run private-links -- http://localhost:3000
```

Open `PRIVATE_LINKS.local.md` locally and use the correct link on each device.
Aivel's link opens her tracker; Ammar's opens the full companion view. The browser remembers
access for 180 days. Clearing browser cookies requires reopening the original link.
Browser and installed-PWA storage can differ, so open the link in the browser used
to install the PWA. Keep both links private; each is an access credential.

## Deploy on Vercel

1. Import this Next.js project into Vercel.
2. In the project's Environment Variables, copy these values from `.env.local`:
   - `NEXT_PUBLIC_AUTH_ENABLED=false`
   - `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
   - `AIVE_PRIMARY_USER_ID`, `AIVE_PARTNER_USER_ID`
   - `AIVE_PRIMARY_LINK_KEY`, `AIVE_PARTNER_LINK_KEY`
3. Use two different random link keys, at least 32 characters each. Only the auth
   feature flag is public. Never prefix the IDs, private keys, or link keys with
   `NEXT_PUBLIC_`. Set the server variables for the intended Vercel environment.
4. Deploy. Private APIs use the Node.js runtime and Firebase Admin; no local files
   or in-memory database are used for persistence.
5. Generate links using the final domain:

```sh
npm run private-links -- https://your-app.vercel.app
```

Give each person only their own link. This command writes a local, gitignored file;
it does not deploy the app or send the links. The link keys in local `.env.local`
must match those configured in Vercel. Regenerate the links if the domain changes.

The existing Aivel and Ammar profile IDs are configured locally. Copy them into
Vercel to keep the same cycle history and relationship. If IDs are omitted, the
server selects the only profile for each role, refuses ambiguous matches, or
creates the named personal profile if none exists. Other profiles are untouched.

To invalidate a person's link and remembered access, replace their link key in
Vercel with a fresh random value and redeploy. Generate and share their new link.
Do not use the same link key for both people.

## Data and access

- Data stays in Firestore and syncs across devices through `/api/private/*`.
- Link secrets are URL fragments, removed immediately after opening. They are
  exchanged for signed, HttpOnly, SameSite=Strict cookies (Secure on HTTPS).
- API operations validate the signed role, user ID, relationship, and input on the
  server. Requests without private access are rejected. Cross-origin writes are
  rejected. API responses are not cached.
- Ammar can view Aivel's complete health history, daily check-ins (including all
  moods, sleep notes, and personal notes), calendar, insights, profile, and reminders.
  No field-sharing switches are used in private-link mode, even if old permission
  documents contain disabled flags. Aivel manages health records; Ammar's health
  view is read-only. Both can send notes and use support requests. Other profiles
  remain inaccessible. The old sharing routes redirect to the shared Us page.
- The shared view refreshes every 15 seconds while visible and on window focus.
  Editing forms do not poll over unsaved changes.
- Existing Firestore rules remain closed to unauthenticated browser access.
  Firebase Admin runs on the server; it does not require opening those rules.
- No test messages or health records should be written to the real pair for QA.
  Automated private API tests use a mocked database.
- Notifications are browser reminders while the app is open, not scheduled push.
- The service worker caches static assets only, never health data or API responses.

## Restore account login later

Set `NEXT_PUBLIC_AUTH_ENABLED=true` and rebuild/redeploy. Fill the six
`NEXT_PUBLIC_FIREBASE_*` values, enable Firebase Email/Password auth, and keep the
Firestore rules deployed. Private-link APIs are disabled in this mode. The original
login, password reset, role guards, onboarding, and sign-out flows return, along
with the original partner summary and Firestore permission model. The full
companion view described above belongs to private-link mode.
Registration stays hidden unless `NEXT_PUBLIC_ALLOW_REGISTRATION=true` is also set.
No health-data migration is needed when using the same user IDs.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Health information

Aivé provides personal cycle estimates from the information you record. It is not
a medical device and does not provide diagnosis, treatment, or contraceptive advice.
Do not use fertile-window estimates as contraception. Speak with a qualified
healthcare professional about severe, unusual, or persistent symptoms.

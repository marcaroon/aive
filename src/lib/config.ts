/**
 * Aivé is a closed app for two people. Both accounts already exist, so the
 * sign-up flow stays hidden: /register redirects to /login and no screen links
 * to it.
 *
 * Nothing is deleted — set NEXT_PUBLIC_ALLOW_REGISTRATION=true in .env.local to
 * bring it back temporarily (for example to recreate an account), then remove
 * the variable again.
 */
export const REGISTRATION_ENABLED =
  process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === "true";

/** Private links are the default. Set true and rebuild to restore account login. */
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

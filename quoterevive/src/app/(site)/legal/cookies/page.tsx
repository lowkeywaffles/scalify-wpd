import { LegalPage } from "@/components/LegalPage";
import { ClearThemeButton } from "@/components/ClearThemeButton";
export const metadata = { title: "Cookie Policy" };
export default function Cookies() {
  return (
    <LegalPage title="Cookie Policy">
      <p>QuoteRevive uses <strong>no analytics, advertising, tracking or third-party cookies</strong>, and loads no third-party scripts. Because we only use cookies that are strictly necessary or that you set by choosing a preference, we don&apos;t show a consent banner. If we ever add optional cookies, we will ask first, with &quot;Reject&quot; as easy as &quot;Accept&quot;.</p>
      <table><thead><tr><th>Name</th><th>Purpose</th><th>Duration</th><th>Party</th><th>Category</th></tr></thead><tbody>
        <tr><td><code>sb-[project-ref]-auth-token</code> (may be split into <code>.0</code>, <code>.1</code>…)</td><td>Keeps you signed in (Supabase Auth session). Set only when you sign in.</td><td>Until sign-out or session expiry [VERIFY your Supabase session settings]</td><td>First party</td><td>Strictly necessary</td></tr>
        <tr><td><code>sb-[project-ref]-auth-token-code-verifier</code></td><td>Secures email confirmation and password-reset links (PKCE).</td><td>Short-lived, until the link is used</td><td>First party</td><td>Strictly necessary</td></tr>
        <tr><td><code>qr_theme</code></td><td>Remembers light/dark theme — only set when you press the theme button.</td><td>1 year</td><td>First party</td><td>Preference (set at your request)</td></tr>
      </tbody></table>
      <p>We do not use localStorage, sessionStorage or IndexedDB. The demo keeps data in page memory only.</p>
      <h2>Cookie settings</h2>
      <p>You can clear the theme preference here. Sign-in cookies are removed when you sign out. You can also delete cookies in your browser settings.</p>
      <ClearThemeButton />
    </LegalPage>
  );
}

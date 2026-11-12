export const metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-12 text-sm leading-relaxed">
      <h1 className="mb-4 text-3xl font-bold">How Scalify Studio handles data</h1>
      <p className="mb-4">Scalify Studio is a private, internal tool used only by the Scalify Web Production &amp; Development team. It isn't offered to the public. Contact: skelifywpd@gmail.com.</p>
      <h2 className="mb-2 mt-6 text-lg font-bold">What it stores</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Team members' email addresses, to allow sign-in. We use one-time email codes, no passwords.</li>
        <li>Media files, captions and schedules the team creates.</li>
        <li>For connected Instagram accounts: the account ID, username, and an access token encrypted with AES-256-GCM. Studio requests only permission to read basic profile info and publish content.</li>
      </ul>
      <h2 className="mb-2 mt-6 text-lg font-bold">Where it goes</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>Supabase</strong> (database, sign-in, file storage; EU Frankfurt region) and <strong>Vercel</strong> (hosting).</li>
        <li><strong>Meta / Instagram</strong>: media and captions when a post is published.</li>
        <li><strong>Google Gemini</strong> (only if enabled): the brief typed into the assistant. On Google's free tier this content may be used to improve Google's products and may be reviewed by people, so the team never puts personal data in it.</li>
        <li>Sign-in codes are sent by email through our email provider (Brevo).</li>
      </ul>
      <h2 className="mb-2 mt-6 text-lg font-bold">What it doesn't do</h2>
      <p>No analytics, ads, tracking pixels or third-party cookies. The only cookies are the essential sign-in session cookies, plus a short-lived security cookie while you connect Instagram. Search engines are told not to index it.</p>
      <h2 className="mb-2 mt-6 text-lg font-bold">Deleting data</h2>
      <p>Disconnecting an account deletes its stored token. To also revoke access on Instagram's side, open Instagram → Settings → <em>Apps and websites</em>. Deleting a post or file removes it from Studio, but not anything already published on Instagram or TikTok. To have your team access removed, ask an owner.</p>
      <p className="mt-8"><a href="/login" className="underline">Back to sign in</a></p>
    </main>
  );
}

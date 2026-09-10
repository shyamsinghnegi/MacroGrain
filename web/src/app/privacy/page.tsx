import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — Macrograin",
}

// Same constraint as terms/page.tsx: must render for a signed-out visitor
// (linked from onboarding.tsx before any session exists), so no auth() or
// DB reads here - plain static server-rendered content only.
const LAST_UPDATED = "September 10, 2026"

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold text-text">Privacy Policy</h1>
        <p className="mt-1 font-mono text-xs text-text-faint">Last updated {LAST_UPDATED}</p>
      </div>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-text-muted">
        <Section title="1. Who this covers">
          <p>
            This policy explains what Macrograin collects and why. Macrograin
            is operated by Shyam Singh Negi, an individual based in India.
            For questions or data requests, contact{" "}
            <a href="mailto:shyamnegi0290@gmail.com" className="text-accent underline">
              shyamnegi0290@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="2. What we collect">
          <p>When you sign in with Google, we receive and store your:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Name, email address, and profile photo, from Google.</li>
            <li>
              Profile details you enter: height, sex, birth date, activity
              level, goal, timezone, and unit preference — used only to
              calculate your calorie/macro targets.
            </li>
            <li>
              Logs you create: food entries (with quantity and full
              nutrition breakdown), body weight entries, and water intake
              entries, each with a timestamp.
            </li>
            <li>
              A count of how many AI scans you&apos;ve used each day (for
              the daily rate limit) — this records that a scan happened, not
              the photo itself.
            </li>
            <li>
              If you enable reminders: a push-notification subscription
              (an endpoint URL and encryption keys your browser generates,
              not personal by itself, but tied to your account so we know
              where to send your reminders).
            </li>
          </ul>
        </Section>

        <Section title="3. Photos you scan">
          <p>
            When you use AI photo scanning (meal photos or nutrition
            labels), the photo is sent directly from our server to
            Google&apos;s Gemini API for analysis and is <strong>not saved</strong> to
            our database — we only keep the AI&apos;s text response (food
            name, estimated nutrition) after you review and confirm it, and
            a record that a scan happened (see above). The photo itself
            exists only for the few seconds it takes to process the request.
          </p>
          <p className="mt-2">
            Google&apos;s own terms govern how Gemini processes that image on
            their end — see{" "}
            <a
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Google&apos;s Gemini API terms
            </a>
            . Don&apos;t use this feature to photograph anything other than
            food, labels, or receipts.
          </p>
        </Section>

        <Section title="4. Why we collect it">
          <p>
            Solely to run the app: calculating your calorie/macro targets,
            showing your logs and history, enforcing the AI scan rate limit,
            and delivering reminders you&apos;ve opted into. We don&apos;t
            sell your data, and we don&apos;t use it for advertising.
          </p>
        </Section>

        <Section title="5. Where it's stored">
          <p>
            Your data is stored in a Cloudflare D1 database. The app itself
            runs on Vercel. Food searches also query Open Food Facts and
            USDA FoodData Central — those queries send only your search term
            or barcode, not anything that identifies you.
          </p>
        </Section>

        <Section title="6. Third parties involved">
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Google</strong> — sign-in (name, email, photo) and
              Gemini AI (food/label photos, processed transiently, not
              stored by us — see Section 3).
            </li>
            <li>
              <strong>Open Food Facts</strong> and{" "}
              <strong>USDA FoodData Central</strong> — public food databases
              we query by search term or barcode.
            </li>
            <li>
              <strong>Cloudflare</strong> (database) and{" "}
              <strong>Vercel</strong> (hosting) — infrastructure providers
              that store/serve the app and its data on our behalf.
            </li>
            <li>
              Your browser&apos;s own push service (e.g. Google&apos;s FCM,
              Mozilla&apos;s, or Apple&apos;s) if you enable reminders — it
              relays the notification, it doesn&apos;t see its content
              beyond delivering it.
            </li>
          </ul>
          <p className="mt-2">
            We don&apos;t share your data with anyone else, and we
            don&apos;t sell it.
          </p>
        </Section>

        <Section title="7. Deleting your data">
          <p>
            Settings → Delete account permanently and immediately deletes:
            your profile, every food/weight/water log entry, your AI scan
            usage history, your push notification subscriptions, and your
            account/session records. This is not reversible — once deleted,
            we don&apos;t retain a copy. Signing out (without deleting) just
            ends your session; your data stays until you either return or
            delete it.
          </p>
        </Section>

        <Section title="8. How long we keep data">
          <p>
            For as long as your account exists, so your history stays
            available to you. Deleting your account removes it immediately,
            as described above. AI photo/label images are never retained in
            the first place (Section 3).
          </p>
        </Section>

        <Section title="9. Your choices">
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Edit your profile details at any time in Settings → Profile.</li>
            <li>Turn off reminders/push notifications at any time in Settings.</li>
            <li>Delete your account and all associated data at any time.</li>
            <li>
              Revoke Macrograin&apos;s access to your Google account from
              your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                Google Account permissions page
              </a>{" "}
              — this stops future sign-ins but doesn&apos;t itself delete
              data already stored with us; use account deletion for that.
            </li>
          </ul>
        </Section>

        <Section title="10. Children">
          <p>
            Macrograin isn&apos;t intended for anyone under 13, and we
            don&apos;t knowingly collect data from children under that age.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            If how we handle data changes meaningfully, we&apos;ll update
            this page and its &quot;Last updated&quot; date.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions, or a request about your data:{" "}
            <a href="mailto:shyamnegi0290@gmail.com" className="text-accent underline">
              shyamnegi0290@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>

      <Link href="/terms" className="text-sm text-accent underline">
        ← Terms of Service
      </Link>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-sm font-semibold text-text">{title}</h2>
      {children}
    </section>
  )
}

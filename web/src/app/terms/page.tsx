import Link from "next/link"

export const metadata = {
  title: "Terms of Service — Macrograin",
}

// Kept as one plain server-rendered page (no client interactivity, no DB
// reads) since it must be reachable from onboarding.tsx before a session
// exists - it's linked from the "by continuing you accept the terms" line
// on the signed-out screen, so it can't depend on auth() or a profile row.
const LAST_UPDATED = "September 10, 2026"

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold text-text">Terms of Service</h1>
        <p className="mt-1 font-mono text-xs text-text-faint">Last updated {LAST_UPDATED}</p>
      </div>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-text-muted">
        <Section title="1. What this is">
          <p>
            Macrograin (&quot;the app&quot;, &quot;we&quot;, &quot;us&quot;) is a calorie and macro
            tracking tool operated by Shyam Singh Negi, an individual based in
            India. These terms govern your use of the app at whichever
            address it&apos;s currently hosted. By creating an account or
            signing in, you agree to them.
          </p>
        </Section>

        <Section title="2. Who can use it">
          <p>
            You must be at least 13 years old to use Macrograin. If you are
            under 18, you should have a parent or guardian&apos;s permission.
            We don&apos;t currently verify age beyond this — by signing in,
            you&apos;re confirming you meet this requirement.
          </p>
        </Section>

        <Section title="3. Your account">
          <p>
            You sign in with Google. You&apos;re responsible for keeping your
            Google account secure — anyone with access to it can access your
            Macrograin data. You can delete your account at any time from
            Settings; see Section 7 and the Privacy Policy for what that
            does.
          </p>
        </Section>

        <Section title="4. Not medical advice">
          <p>
            Macrograin estimates calories and macronutrients from food
            databases, barcode lookups, and AI-based photo recognition.
            These are estimates, not measurements — food databases can be
            inaccurate or incomplete, and AI photo/label recognition can
            misread quantities or misidentify food entirely. Calorie targets
            and TDEE estimates are generic formulas (Mifflin-St Jeor), not
            personalized medical guidance.
          </p>
          <p className="mt-2">
            Macrograin is not a medical device and does not provide medical,
            dietary, or health advice. Don&apos;t use it to manage a medical
            condition, eating disorder, or any situation where accurate
            nutrition tracking is medically critical, without consulting a
            qualified professional. Use the app&apos;s estimates at your own
            judgment and risk.
          </p>
        </Section>

        <Section title="5. AI photo scanning">
          <p>
            When you use the camera-based food or nutrition-label scanner,
            the photo you capture is sent to Google&apos;s Gemini API for
            analysis and is not stored by Macrograin afterward — see the
            Privacy Policy for details. Don&apos;t photograph anything other
            than food, nutrition labels, or receipts through this feature.
            Results are AI-generated estimates and may be wrong; you&apos;re
            responsible for reviewing them (the confirm screen exists for
            exactly this) before logging them.
          </p>
        </Section>

        <Section title="6. Acceptable use">
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Use the app for anything illegal, or to harass or harm anyone.</li>
            <li>
              Attempt to disrupt, overload, or gain unauthorized access to
              the app, its database, or its AI/food-data integrations.
            </li>
            <li>Use automated tools to scrape data or abuse the AI scan rate limits.</li>
            <li>Impersonate another person or misrepresent your identity.</li>
          </ul>
          <p className="mt-2">
            We may suspend or delete accounts that violate this section.
          </p>
        </Section>

        <Section title="7. Deleting your account">
          <p>
            Settings → Delete account permanently removes your profile,
            food/weight/water logs, AI usage history, and push notification
            subscriptions. This can&apos;t be undone and isn&apos;t recoverable
            — see the Privacy Policy for exactly what&apos;s deleted.
          </p>
        </Section>

        <Section title="8. Availability">
          <p>
            Macrograin is provided &quot;as is&quot;, without warranty of any
            kind. It may have bugs, downtime, or data loss — it&apos;s run by
            one person, not a company with an SLA. We don&apos;t guarantee
            the app will always be available, and we may change or shut it
            down at any time. To the extent permitted by law, we&apos;re not
            liable for any damages arising from your use of the app,
            including reliance on its nutrition estimates.
          </p>
        </Section>

        <Section title="9. Third-party services">
          <p>
            The app relies on Google (Sign-In and Gemini AI), Open Food
            Facts, USDA FoodData Central, and Cloudflare. Their own terms and
            availability apply to the parts of the service they provide, and
            we&apos;re not responsible for their outages or errors.
          </p>
        </Section>

        <Section title="10. Changes to these terms">
          <p>
            We may update these terms as the app changes. Continuing to use
            Macrograin after an update means you accept the revised terms.
            Material changes will update the &quot;Last updated&quot; date
            above.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p>
            These terms are governed by the laws of India, without regard to
            conflict-of-law principles.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these terms, or a request related to your data:{" "}
            <a href="mailto:shyamnegi0290@gmail.com" className="text-accent underline">
              shyamnegi0290@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>

      <Link href="/privacy" className="text-sm text-accent underline">
        Read the Privacy Policy →
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

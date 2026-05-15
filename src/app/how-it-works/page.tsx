import Link from "next/link";

export default function HowItWorks() {
  return (
    <main className="min-h-screen px-6 py-16 md:py-20">
      <div className="max-w-[720px] mx-auto flex flex-col gap-8">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← SchoolPath SF
        </Link>
        <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-semibold tracking-tight">
          How SchoolPath SF works
        </h1>
        <p className="text-muted text-[16px] leading-[1.7]">
          SFUSD&rsquo;s school lottery is overwhelming — over 70 elementary
          schools and a tangle of rules that decide who gets which seat. This
          tool turns the same public data SFUSD publishes into a personalized,
          plain-English ranking helper.
        </p>

        <section>
          <h2 className="text-[22px] font-semibold mb-3">
            Strong shot · Likely · Stretch
          </h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            Borrowed from college admissions. For every school × grade ×
            program, we look at how families with <em>your</em> tiebreaker
            profile fared over the last four years:
          </p>
          <ul className="mt-4 flex flex-col gap-3 text-[15px]">
            <li className="p-4 rounded-2xl bg-strong-soft">
              <strong className="text-strong">Strong shot</strong> — 80% or
              more of families like you got in.
            </li>
            <li className="p-4 rounded-2xl bg-likely-soft">
              <strong className="text-likely">Likely</strong> — between 40%
              and 80%. Solid odds, not a sure thing.
            </li>
            <li className="p-4 rounded-2xl bg-stretch-soft">
              <strong className="text-stretch">Stretch</strong> — under 40%.
              Popular school, oversubscribed.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-[22px] font-semibold mb-3">
            Why honest ranking wins
          </h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            SFUSD uses deferred acceptance — the same algorithm used in
            residency matches and many other school districts. With deferred
            acceptance, your best strategy is to rank schools by your real
            preference. The algorithm is &ldquo;strategy-proof&rdquo; for
            applicants: ranking a less-preferred school higher to game the
            system cannot help you, and may hurt you. The thing you{" "}
            <em>can</em> control is the <strong>composition</strong> of your
            list — do you have schools you&rsquo;d actually take if your top
            picks miss?
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-semibold mb-3">
            Why 15–18 schools
          </h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            SFUSD&rsquo;s own data shows families who rank 15 or more
            schools — and balance Strong / Likely / Stretch picks — almost
            always land on a school they ranked. Families who rank fewer than
            10, or who only rank popular Stretch schools, are the ones who
            end up assigned somewhere outside their list.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-semibold mb-3">
            Where the data comes from
          </h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            All odds are from SFUSD&rsquo;s published Annual Assignment
            Highlights: four-year success rates by school × grade × program ×
            tiebreaker tier, and two-year rank-of-choice breakdowns. We do
            not collect any personal information — your situation is stored
            only on your device.
          </p>
        </section>

        <section>
          <h2 className="text-[22px] font-semibold mb-3">
            The TK feeder system
          </h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            Starting 2026-27, every SF family has a guaranteed TK path: TK at
            your attendance-area elementary (if it offers TK) or at a
            designated Early Education site. TK students auto-promote to K
            at the connected elementary — no reapplication. We surface this
            path before anything else when you&rsquo;re applying for TK.
          </p>
        </section>

        <div className="mt-6 flex gap-3">
          <Link
            href="/start"
            className="h-12 px-6 rounded-full bg-ink text-paper font-medium flex items-center hover:opacity-90"
          >
            Build my list →
          </Link>
        </div>
      </div>
    </main>
  );
}

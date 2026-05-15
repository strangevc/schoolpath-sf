import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-[640px] w-full flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="text-sm font-medium tracking-wide uppercase text-muted">
            SchoolPath SF
          </div>
          <h1 className="text-[40px] md:text-[48px] leading-[1.1] font-semibold tracking-tight">
            A planning tool for SFUSD elementary applications.
          </h1>
          <p className="text-[17px] md:text-[18px] text-muted leading-[1.6]">
            Use SFUSD&rsquo;s published placement data to build a ranking
            informed by your family&rsquo;s specific situation: attendance
            area, sibling priority, current PreK or TK enrollment, and CTIP1
            eligibility. Currently supports Transitional Kindergarten and
            Kindergarten applications for the 2026-27 cycle.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/start"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-ink text-paper text-[16px] font-medium hover:opacity-90 transition-opacity"
          >
            Start your ranking
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-rule text-ink text-[16px] hover:bg-rule/40 transition-colors"
          >
            How it works
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="text-[12px] uppercase tracking-wide text-muted font-semibold">
            How schools are categorized
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-4 rounded-2xl bg-strong-soft">
              <div className="font-semibold text-strong">Likely</div>
              <div className="text-muted mt-1 leading-[1.5]">
                60% or more of applicants with your tiebreakers were admitted.
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-likely-soft">
              <div className="font-semibold text-likely">Possible</div>
              <div className="text-muted mt-1 leading-[1.5]">
                Between 30% and 60% of similar applicants were admitted.
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-stretch-soft">
              <div className="font-semibold text-stretch">Competitive</div>
              <div className="text-muted mt-1 leading-[1.5]">
                Fewer than 30% of similar applicants were admitted.
              </div>
            </div>
          </div>
          <p className="text-[12px] text-muted leading-[1.55] mt-2">
            Categories are based on SFUSD&rsquo;s four-year published
            placement rates by school, grade, program, and tiebreaker tier.
            All information is for planning only; the official application
            and placement process is at sfusd.edu.
          </p>
        </div>
      </div>
    </main>
  );
}

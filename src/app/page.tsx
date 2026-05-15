import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-[640px] w-full flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="text-sm font-medium tracking-wide uppercase text-muted">
            SchoolPath SF
          </div>
          <h1 className="text-[40px] md:text-[52px] leading-[1.05] font-semibold tracking-tight">
            Build a smart SFUSD ranking. Less random. Less stressful.
          </h1>
          <p className="text-[17px] md:text-[18px] text-muted leading-[1.55]">
            Drop in your address and a few details. We&rsquo;ll show which
            schools you have a real shot at — and help you build a list of
            15–18 that&rsquo;s balanced, not a gamble.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/start"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-ink text-paper text-[16px] font-medium hover:opacity-90 transition-opacity"
          >
            Start building →
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-rule text-ink text-[16px] hover:bg-rule/40 transition-colors"
          >
            How it works
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-2xl bg-strong-soft">
            <div className="font-semibold text-strong">Strong shot</div>
            <div className="text-muted mt-1">
              Schools where your situation gives you a near-guaranteed seat.
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-likely-soft">
            <div className="font-semibold text-likely">Likely</div>
            <div className="text-muted mt-1">
              Schools families like yours get into more often than not.
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-stretch-soft">
            <div className="font-semibold text-stretch">Stretch</div>
            <div className="text-muted mt-1">
              Popular schools. Worth ranking, but don&rsquo;t bet your list on
              them.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

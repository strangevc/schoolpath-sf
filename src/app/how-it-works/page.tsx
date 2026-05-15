import Link from "next/link";

export default function HowItWorks() {
  return (
    <main className="min-h-screen px-6 py-16 md:py-20">
      <div className="max-w-[720px] mx-auto flex flex-col gap-10">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← SchoolPath SF
        </Link>
        <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-semibold tracking-tight">
          How SchoolPath SF works
        </h1>
        <p className="text-muted text-[16px] leading-[1.7]">
          SchoolPath SF organizes SFUSD&rsquo;s published placement data into
          a clearer view of how families with different circumstances have
          been admitted at each elementary school. It is a planning tool. The
          official application is at sfusd.edu.
        </p>

        <section className="flex flex-col gap-3">
          <h2 className="text-[22px] font-semibold">School categories</h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            For each school, grade, and program, SchoolPath SF looks at how
            often applicants in your specific tiebreaker category were
            admitted over the past four years and groups schools into three
            categories.
          </p>
          <ul className="flex flex-col gap-3 text-[15px]">
            <li className="p-4 rounded-2xl bg-strong-soft">
              <strong className="text-strong">Likely</strong>: 60 percent or
              more of applicants in your tiebreaker category were admitted.
            </li>
            <li className="p-4 rounded-2xl bg-likely-soft">
              <strong className="text-likely">Possible</strong>: Between 30
              and 60 percent of applicants in your tiebreaker category were
              admitted.
            </li>
            <li className="p-4 rounded-2xl bg-stretch-soft">
              <strong className="text-stretch">Competitive</strong>: Fewer
              than 30 percent of applicants in your tiebreaker category were
              admitted. Demand for the school exceeds available seats.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[22px] font-semibold">
            How SFUSD assigns students
          </h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            SFUSD uses a deferred acceptance algorithm, the same approach
            used in medical residency matches and many other school
            districts. The algorithm prioritizes applicants according to a
            tiebreaker order: sibling enrollment, attendance area, CTIP1
            residency, and others. When more applicants apply than seats are
            available, applicants within each tiebreaker tier are placed in
            random order. The algorithm is strategy-proof for applicants,
            meaning ranking schools in your true order of preference is the
            most effective approach.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[22px] font-semibold">Why list length matters</h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            SFUSD recommends ranking 15 to 18 schools. Families who rank a
            balanced mix of Likely, Possible, and Competitive schools across
            this range almost always receive placement at a school they
            ranked. Families who rank fewer than 10 schools, or who rank only
            Competitive schools, are most at risk of being assigned outside
            their ranking.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[22px] font-semibold">Data sources</h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            Placement rates come from SFUSD&rsquo;s Annual Assignment
            Highlights: a four-year average of success rates by school,
            grade, program, and tiebreaker tier, plus a two-year breakdown
            of placements by rank. Attendance area boundaries come from
            DataSF&rsquo;s 2024-25 SFUSD school attendance area dataset.
            CTIP1 boundaries come from SFUSD&rsquo;s published shapefile.
            No personal information is collected or stored on any server.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[22px] font-semibold">
            Transitional Kindergarten in 2026-27
          </h2>
          <p className="text-muted text-[15px] leading-[1.7]">
            Beginning in 2026-27, SFUSD guarantees a TK seat for every
            eligible family through the TK Feeder Pattern: either at the
            attendance area elementary school (if it offers TK) or at a
            designated Early Education site. Students who accept TK
            automatically continue to Kindergarten at the connected
            elementary school. No second application is required.
          </p>
        </section>

        <div className="mt-2 flex gap-3">
          <Link
            href="/start"
            className="h-12 px-6 rounded-full bg-ink text-paper font-medium flex items-center hover:opacity-90"
          >
            Start your ranking
          </Link>
        </div>
      </div>
    </main>
  );
}

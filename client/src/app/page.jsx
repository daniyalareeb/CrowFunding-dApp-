import dynamic from "next/dynamic";
import FilterableGrid from "@/components/FilterableGrid";

// Canvas must be client-only — no SSR
const ParticleCanvas = dynamic(() => import("@/components/ParticleCanvas"), {
  ssr: false,
});

/* ── Data fetching ───────────────────────────────────── */
const fetchCampaigns = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns`, {
    method: "GET",
    cache: "no-cache",
  });
  const data = await res.json();
  let campaigns = data.campaigns || [];
  campaigns.sort((a, b) => b.collectedAmount - a.collectedAmount);
  const donationCount = campaigns.reduce((t, c) => t + c.donations.length, 0);
  return { campaigns: campaigns.slice(0, 9), donationCount, campaignCount: campaigns.length };
};

const fetchTotalCollected = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/total`, {
    method: "GET",
    cache: "no-cache",
  });
  const data = await res.json();
  return data.total || 0;
};

/* ── Page ────────────────────────────────────────────── */
const Home = async () => {
  const totalCollected = await fetchTotalCollected();
  const { campaigns, campaignCount, donationCount } = await fetchCampaigns();

  return (
    <div className="max-w-7xl mx-auto w-full space-y-10">

      {/* ═══════════════════════════════════════════
          HERO — particle network background
          ═══════════════════════════════════════════ */}
      <section
        className="relative rounded-2xl overflow-hidden border border-neon-violet/[0.18] min-h-[340px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.12) 50%, rgba(16,185,129,0.08) 100%)",
        }}
      >
        {/* Particle canvas — fills the whole hero */}
        <ParticleCanvas />

        {/* Dot-grid texture on top of canvas */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.22]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(139,92,246,0.35) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Top-left shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />

        {/* Content — z-10 sits above the canvas */}
        <div className="relative z-10 px-8 md:px-14 py-12 md:py-16 pointer-events-none">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge-violet rounded-full px-3 py-1.5 text-xs font-semibold mb-6 pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-violet animate-glow-pulse shadow-[0_0_6px_rgba(139,92,246,1)]" />
            Ethereum · Trustless · Decentralised
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.05] mb-5 drop-shadow-lg">
            <span className="gradient-text">Fund</span>
            <span className="text-text-primary"> the Future.</span>
          </h1>

          <p className="text-text-secondary text-base md:text-lg max-w-xl leading-relaxed mb-10 drop-shadow">
            Create campaigns, support bold ideas, and change the world —
            powered by smart contracts on Ethereum.
          </p>

          {/* Stats — large, no boxes */}
          <div className="flex flex-wrap items-center gap-8 md:gap-12">
            <div>
              <p className="text-3xl md:text-4xl font-black text-text-primary tabular-nums">
                {campaignCount}
              </p>
              <p className="text-[11px] text-text-muted uppercase tracking-[0.14em] mt-0.5">
                Campaigns
              </p>
            </div>

            <div className="w-px h-10 bg-white/[0.14] hidden sm:block" />

            <div>
              <p className="text-3xl md:text-4xl font-black gradient-text-emerald tabular-nums">
                Ξ {totalCollected}
              </p>
              <p className="text-[11px] text-text-muted uppercase tracking-[0.14em] mt-0.5">
                ETH Raised
              </p>
            </div>

            <div className="w-px h-10 bg-white/[0.14] hidden sm:block" />

            <div>
              <p className="text-3xl md:text-4xl font-black text-text-primary tabular-nums">
                {donationCount}
              </p>
              <p className="text-[11px] text-text-muted uppercase tracking-[0.14em] mt-0.5">
                Total Donors
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CAMPAIGNS — filterable client grid
          ═══════════════════════════════════════════ */}
      <FilterableGrid campaigns={campaigns} />
    </div>
  );
};

export default Home;

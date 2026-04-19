import Link from "next/link";
import { Card } from "@/components";

/* ── Data ─────────────────────────────────────────────── */
const fetchCampaigns = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns`, {
    method: "GET",
    cache: "no-cache",
  });
  const data = await res.json();
  return data.campaigns || [];
};

const sortCampaigns = (campaigns, sort) => {
  const arr = [...campaigns];
  if (sort === "most_funded") return arr.sort((a, b) => b.collectedAmount - a.collectedAmount);
  if (sort === "newest")      return arr.sort((a, b) => b.id - a.id);
  return arr;
};

const META = {
  most_funded: { title: "Most Funded",   sub: "Ranked by ETH raised"           },
  newest:      { title: "New Campaigns", sub: "Most recently created"          },
  all:         { title: "All Campaigns", sub: "Every campaign on the platform" },
};

const SORTS = [
  { label: "Most Funded", value: "most_funded" },
  { label: "Newest",      value: "newest"      },
  { label: "All",         value: "all"         },
];

/* ── Page ─────────────────────────────────────────────── */
export default async function CampaignsPage({ searchParams }) {
  const sort = SORTS.map(s => s.value).includes(searchParams?.sort)
    ? searchParams.sort
    : "most_funded";

  const campaigns = sortCampaigns(await fetchCampaigns(), sort);
  const { title, sub } = META[sort];

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">

      {/* ── Header + sort tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text leading-tight">{title}</h1>
          <p className="text-text-muted text-sm mt-1">
            {sub} ·{" "}
            <span className="text-text-secondary font-medium">{campaigns.length} total</span>
          </p>
        </div>

        {/* Sort pill tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 w-fit">
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={s.value === "all" ? "/campaigns" : `/campaigns?sort=${s.value}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                ${sort === s.value
                  ? "bg-gradient-violet text-white shadow-glow-sm"
                  : "text-text-muted hover:text-text-secondary"
                }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Campaign grid ── */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center glass rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">No campaigns yet</h3>
          <p className="text-text-muted text-sm">
            Be the first to{" "}
            <Link href="/create" className="text-neon-violet underline underline-offset-2">
              create one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((campaign) => (
            <Card campaign={campaign} key={campaign.id} />
          ))}
        </div>
      )}
    </div>
  );
}

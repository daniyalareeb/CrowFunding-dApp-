import { Card } from "@/components";
import { FaSearch } from "react-icons/fa";

/* ── Search logic (kept intact) ───────────────────────── */
const findCampaigns = async (query) => {
  if (!query) return null;

  const words = query.split(" ").filter(Boolean);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns`, {
    method: "GET",
    cache: "no-cache",
  });
  const data = await res.json();
  const campaigns = data.campaigns || [];

  // Exact phrase matches first, then word-level matches
  const priority = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase())
  );

  const secondary = campaigns.filter((c) => {
    if (priority.includes(c)) return false;
    return words.some(
      (w) =>
        c.title.toLowerCase().includes(w.toLowerCase()) ||
        c.description.toLowerCase().includes(w.toLowerCase())
    );
  });

  return [...priority, ...secondary];
};

/* ── Page ─────────────────────────────────────────────── */
export default async function SearchPage({ searchParams }) {
  const query     = searchParams?.q || "";
  const campaigns = await findCampaigns(query);

  /* ── No query yet ── */
  if (campaigns === null) {
    return (
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center glass rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-violet flex items-center justify-center mb-5 shadow-glow-violet">
            <FaSearch className="text-white text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Search Campaigns</h2>
          <p className="text-text-muted text-sm max-w-sm">
            Use the search bar above to find campaigns by title, description, or category.
          </p>
        </div>
      </div>
    );
  }

  /* ── Results ── */
  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary leading-tight">
          Results for{" "}
          <span className="gradient-text">"{query}"</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Empty */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center glass rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Nothing found</h3>
          <p className="text-text-muted text-sm max-w-md">
            No campaigns matched <span className="text-text-secondary">"{query}"</span>.
            Try different keywords.
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

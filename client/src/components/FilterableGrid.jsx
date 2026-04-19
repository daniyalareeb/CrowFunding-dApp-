"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components";

const CATEGORIES = ["All", "Tech", "Health", "Education", "Environment", "Community"];

const FilterableGrid = ({ campaigns }) => {
  const [active, setActive] = useState("All");

  const filtered = useMemo(() => {
    if (active === "All") return campaigns;
    return campaigns.filter((c) => c.category === active);
  }, [campaigns, active]);

  const [featured, ...rest] = filtered;

  return (
    <div className="space-y-8">
      {/* ── Category filter + count ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200
                ${active === cat
                  ? "btn-glass-emerald"
                  : "glass text-text-muted hover:text-text-primary hover:border-neon-violet/30"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted">
          {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center glass rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            No {active} campaigns
          </h3>
          <p className="text-text-muted text-sm">
            Try a different category or{" "}
            <button
              onClick={() => setActive("All")}
              className="text-neon-violet underline underline-offset-2"
            >
              view all
            </button>
            .
          </p>
        </div>
      )}

      {/* ── Featured top campaign ── */}
      {featured && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-bold text-neon-amber uppercase tracking-[0.12em]">
              ⭐ Top Campaign
            </span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>
          <Card campaign={featured} featured />
        </div>
      )}

      {/* ── Regular grid ── */}
      {rest.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-sm font-bold text-text-primary whitespace-nowrap">
              {active === "All" ? "All Campaigns" : `${active} Campaigns`}
            </h2>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((campaign) => (
              <Card campaign={campaign} key={campaign.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterableGrid;

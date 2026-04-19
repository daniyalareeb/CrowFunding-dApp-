"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Card } from "@/components";
import Logo from "/public/Logo.png";
import { useEthersContext } from "@/contexts/EthersContext";

const Account = () => {
  const { signer } = useEthersContext();
  const [createdCampaigns, setCreatedCampaigns] = useState(null);
  const [donatedCampaigns, setDonatedCampaigns] = useState(null);
  const [activeTab, setActiveTab] = useState("created");
  const [stats, setStats] = useState({ collected: 0, withdrawn: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns`);
      const data = await res.json();
      const all = data.campaigns || [];

      const created = all.filter(
        (c) => c.owner.toLowerCase() === signer?.address?.toLowerCase()
      );
      const donated = all.filter((c) =>
        c.donations?.some(
          (d) => d.donator.toLowerCase() === signer?.address?.toLowerCase()
        )
      );

      const totalCollected = created.reduce((a, c) => a + Number(c.collectedAmount), 0);
      const totalWithdrawn = created.reduce((a, c) => a + Number(c.withdrawedAmount), 0);

      setCreatedCampaigns(created);
      setDonatedCampaigns(donated);
      setStats({ collected: totalCollected, withdrawn: totalWithdrawn });
    };

    if (signer?.address) fetchData();
  }, [signer?.address]);

  // Loading skeleton
  if (!signer?.address || createdCampaigns === null)
    return (
      <div className="w-full h-[60vh] flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-violet flex items-center justify-center animate-glow-pulse shadow-glow-violet">
            <Image src={Logo} alt="fundseed" width={28} height={28} className="opacity-80" />
          </div>
          <p className="text-text-secondary font-semibold">Loading your profile…</p>
        </div>
      </div>
    );

  const displayed = activeTab === "created" ? createdCampaigns : donatedCampaigns;

  return (
    <main className="max-w-7xl mx-auto w-full pb-12">

      {/* ── Profile header ── */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-28 right-0 w-80 h-80 rounded-full bg-neon-violet/[0.08] blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 mb-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-violet flex items-center justify-center shadow-glow-violet flex-shrink-0">
            <Image src={Logo} alt="avatar" width={28} height={28} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold gradient-text mb-1">Your Profile</h1>
            <p className="text-text-muted font-mono text-sm truncate max-w-[240px] sm:max-w-md">
              {signer?.address}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/[0.07] pt-5 relative z-10">
          {[
            { label: "Created Campaigns",   value: createdCampaigns?.length ?? 0 },
            { label: "Total Collected",      value: `Ξ ${stats.collected}`        },
            { label: "Total Withdrawn",      value: `Ξ ${stats.withdrawn}`        },
          ].map((item) => (
            <div key={item.label} className="stat-card rounded-xl p-4">
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1.5">
                {item.label}
              </p>
              <p className="text-2xl font-bold gradient-text">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pill tab switcher ── */}
      <div className="flex items-center gap-1 glass rounded-xl p-1 w-fit mb-8">
        {[
          { key: "created", label: "Created"    },
          { key: "donated", label: "Donated To" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
              ${activeTab === tab.key
                ? "bg-gradient-violet text-white shadow-glow-sm"
                : "text-text-muted hover:text-text-secondary"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Campaign grid or empty state ── */}
      {displayed?.length === 0 ? (
        <div className="flex flex-col items-center justify-center glass rounded-2xl p-14 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="text-xl font-bold text-text-primary mb-2">No Campaigns Found</h1>
          <p className="text-text-muted text-sm max-w-md">
            You haven't {activeTab === "created" ? "created" : "donated to"} any campaigns yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed?.map((campaign) => (
            <Card campaign={campaign} key={campaign.id} user={signer?.address} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Account;

"use client";

import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaClock, FaUsers } from "react-icons/fa";

import getDaysLeft from "@/utils/getDaysLeft";
import { ClientButton, FormInput } from "@/components";
import { useEthersContext } from "@/contexts/EthersContext";

const CampaignDetails = () => {
  const router = useRouter();
  const { selectedCampaign: campaign, contract, signer } = useEthersContext();

  const [amount, setAmount] = useState(0);
  const [topDonations, setTopDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    if (campaign === null) return router.back();
    const sorted = [...campaign.donations].sort((a, b) => b.amount - a.amount);
    setTopDonations(sorted.slice(0, 3));
  }, [campaign, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount <= 0) return toast.error("Please enter a valid amount");
    if (getDaysLeft(campaign.deadline) <= 0) return toast.error("Campaign has ended");
    setLoading(true);
    try {
      await contract.donate(campaign.id, {
        value: ethers.parseEther(amount.toString()),
        gasLimit: 1000000,
      });
      toast.success("Donation Successful!");
      setAmount(0);
    } catch {
      toast.error("Donation Failed!");
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    setWithdrawLoading(true);
    try {
      await contract.withdraw(
        campaign.id,
        ethers.parseEther((campaign.collectedAmount - campaign.withdrawedAmount).toString())
      );
      toast.success("Withdraw Successful!");
    } catch {
      toast.error("Withdraw Failed!");
    }
    setWithdrawLoading(false);
  };

  const handleRefund = async () => {
    setRefundLoading(true);
    try {
      await contract.claimRefund(campaign.id);
      toast.success("Refund Claimed Successfully!");
    } catch {
      toast.error("Refund Failed!");
    }
    setRefundLoading(false);
  };

  if (!campaign) return null;

  const daysLeft   = getDaysLeft(campaign.deadline);
  const target     = parseFloat(campaign.target) || 1;
  const collected  = parseFloat(campaign.collectedAmount) || 0;
  const progress   = Math.min((collected / target) * 100, 100).toFixed(0);

  let statusText  = "Active";
  let statusClass = "badge-emerald";
  let barClass    = "progress-glow";

  if (collected >= target) {
    statusText  = "Funded";
    statusClass = "badge-violet";
    barClass    = "progress-glow-violet";
  } else if (daysLeft <= 0) {
    statusText  = "Expired";
    statusClass = "badge-red";
    barClass    = "progress-glow-red";
  }

  const isOwner  = signer?.address?.toLowerCase() === campaign.owner.toLowerCase();
  const canRefund = daysLeft <= 0 && collected < target;

  return (
    <main className="max-w-7xl mx-auto w-full pb-12">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ════ LEFT — 60% ════ */}
        <div className="w-full lg:w-[60%] flex flex-col gap-6">

          {/* Campaign image */}
          <div className="relative h-[300px] sm:h-[420px] rounded-2xl overflow-hidden">
            {campaign.imageUrl ? (
              <img
                className="w-full h-full object-cover"
                src={campaign.imageUrl}
                alt={campaign.title}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-neon-indigo/20 to-neon-violet/20 text-text-muted">
                No Image Provided
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-deep/65 via-transparent to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="badge-gray text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                {campaign.category || "General"}
              </span>
              <span className={`${statusClass} text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm`}>
                {statusText}
              </span>
            </div>
          </div>

          {/* Title + creator */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-4 leading-tight">
              {campaign.title}
            </h1>
            <div className="inline-flex items-center gap-3 glass px-4 py-2.5 rounded-xl">
              <div className="bg-neon-emerald/15 text-neon-emerald p-2 rounded-full">
                <FaUsers size={12} />
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Creator</p>
                <p className="text-sm font-medium text-text-primary font-mono">
                  {campaign.owner.slice(0, 8)}…{campaign.owner.slice(-6)}
                </p>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-base font-bold text-text-primary border-b border-white/[0.07] pb-4 mb-5">
              About this campaign
            </h2>
            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap text-sm">
              {campaign.description}
            </p>
          </div>

          {/* Top donors leaderboard */}
          <div className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-base font-bold border-b border-white/[0.07] pb-4 mb-5">
              <span className="text-text-primary">Top Donors </span>
              <span className="gradient-text">Leaderboard</span>
            </h2>
            {topDonations.length > 0 ? (
              <div className="flex flex-col gap-3">
                {topDonations.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between glass-light rounded-xl p-4 hover:border-neon-violet/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                      <span className="font-mono text-sm text-text-secondary">
                        {d.donator.slice(0, 8)}…{d.donator.slice(-6)}
                      </span>
                    </div>
                    <span className="font-bold gradient-text-emerald">Ξ {d.amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-text-muted text-sm">
                No donations yet — be the first!
              </p>
            )}
          </div>
        </div>

        {/* ════ RIGHT — sticky action panel ════ */}
        <div className="w-full lg:w-[40%]">
          <div className="sticky top-[100px] glass rounded-2xl p-6 sm:p-8 shadow-glass-hover relative overflow-hidden">
            {/* Ambient glow inside panel */}
            <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-neon-violet/[0.08] blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Amount raised */}
              <div className="mb-5">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold gradient-text-emerald">
                    Ξ {campaign.collectedAmount}
                  </span>
                  <span className="text-text-muted text-sm">raised</span>
                </div>
                <p className="text-xs text-text-muted">
                  of{" "}
                  <span className="text-text-secondary font-semibold">
                    Ξ {campaign.target}
                  </span>{" "}
                  goal
                </p>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-bold text-text-primary">{progress}% Funded</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${barClass}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats tiles */}
              <div className="flex gap-3 mb-8">
                <div className="flex-1 stat-card rounded-xl p-3 text-center">
                  <FaClock
                    className={`mx-auto mb-1.5 ${daysLeft < 3 && daysLeft > 0 ? "text-neon-amber animate-pulse" : "text-text-muted"}`}
                    size={13}
                  />
                  <p className="text-sm font-bold text-text-primary">
                    {daysLeft > 0 ? daysLeft : "—"}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {daysLeft > 0 ? "days left" : "Ended"}
                  </p>
                </div>
                <div className="flex-1 stat-card rounded-xl p-3 text-center">
                  <FaUsers className="mx-auto mb-1.5 text-text-muted" size={13} />
                  <p className="text-sm font-bold text-text-primary">
                    {campaign.donations?.length || 0}
                  </p>
                  <p className="text-[10px] text-text-muted">donors</p>
                </div>
              </div>

              {/* Donate form */}
              {daysLeft > 0 && collected < target && (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3 border-t border-white/[0.07] pt-6"
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm pointer-events-none">
                      Ξ
                    </span>
                    <input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.10"
                      className="glass-input w-full p-4 pl-10 rounded-xl font-semibold text-sm"
                    />
                  </div>
                  <ClientButton
                    type="submit"
                    loading={loading}
                    className="btn-glass-emerald w-full py-4 rounded-xl font-bold text-base"
                  >
                    Donate Now
                  </ClientButton>
                </form>
              )}

              {/* Owner withdraw */}
              {isOwner && collected > campaign.withdrawedAmount && (
                <div className="mt-4 border-t border-white/[0.07] pt-4">
                  <ClientButton
                    loading={withdrawLoading}
                    onClick={handleWithdraw}
                    className="btn-glass-primary w-full py-3 rounded-xl font-bold"
                  >
                    Withdraw Funds
                  </ClientButton>
                </div>
              )}

              {/* Refund */}
              {canRefund && !isOwner && (
                <div className="mt-4 border-t border-white/[0.07] pt-4">
                  <p className="text-xs text-text-muted mb-3 text-center">
                    Campaign failed to reach target. Claim your refund.
                  </p>
                  <ClientButton
                    loading={refundLoading}
                    onClick={handleRefund}
                    className="w-full py-3 badge-amber hover:bg-neon-amber/25 rounded-xl font-bold transition-all"
                  >
                    Claim Refund
                  </ClientButton>
                </div>
              )}

              {/* Success state */}
              {daysLeft <= 0 && collected >= target && (
                <div className="mt-6 text-center p-4 badge-emerald rounded-xl">
                  <p className="font-bold">🎉 Successfully Funded!</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};

export default CampaignDetails;

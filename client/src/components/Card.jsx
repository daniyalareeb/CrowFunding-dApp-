"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaClock, FaUsers } from "react-icons/fa";

import getDaysLeft from "@/utils/getDaysLeft";
import { useEthersContext } from "@/contexts/EthersContext";
import { AlertModal, ClientButton, WithdrawModal } from ".";

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
function useStatus(collected, target, daysLeft) {
  if (collected >= target)  return { text: "Funded",  badgeClass: "badge-violet", barClass: "progress-glow-violet" };
  if (daysLeft <= 0)        return { text: "Expired", badgeClass: "badge-red",    barClass: "progress-glow-red"    };
  if (daysLeft < 3)         return { text: "Active",  badgeClass: "badge-amber",  barClass: "progress-glow-amber"  };
  return                           { text: "Active",  badgeClass: "badge-emerald",barClass: "progress-glow"        };
}

/* ─────────────────────────────────────────────
   Shared image block (used in both variants)
   ───────────────────────────────────────────── */
function CampaignImage({ src, alt, badgeClass, statusText, category, zoom = true }) {
  return (
    <>
      {src ? (
        <img
          className={`w-full h-full object-cover ${zoom ? "transition-transform duration-500 group-hover:scale-[1.06]" : ""}`}
          loading="lazy"
          src={src}
          alt={alt}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-neon-indigo/20 to-neon-violet/20 flex items-center justify-center text-text-muted text-sm">
          No Image
        </div>
      )}
      {/* Dark overlay for badge readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-deep/70 via-transparent to-transparent" />
      <div className="absolute top-3 left-3 flex gap-2">
        <span className="badge-gray text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
          {category || "General"}
        </span>
        <span className={`${badgeClass} text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm`}>
          {statusText}
        </span>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Card component
   featured={true}  → horizontal wide-card layout
   featured={false} → default vertical grid card
   ───────────────────────────────────────────── */
const Card = ({ campaign, user, featured = false }) => {
  const router = useRouter();
  const { setSelectedCampaign } = useEthersContext();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const handleClickCard = () => {
    if (isAlertOpen || isWithdrawOpen) return;
    setSelectedCampaign(campaign);
    router.push(`/campaigns/${campaign.id}`);
  };

  const daysLeft  = getDaysLeft(campaign.deadline);
  const target    = parseFloat(campaign.target) || 1;
  const collected = parseFloat(campaign.collectedAmount) || 0;
  const progress  = Math.min((collected / target) * 100, 100).toFixed(0);
  const { text: statusText, badgeClass, barClass } = useStatus(collected, target, daysLeft);

  const modals = (
    <>
      {isAlertOpen && <AlertModal setIsOpen={setIsAlertOpen} campaignId={campaign.id} />}
      {isWithdrawOpen && (
        <WithdrawModal
          setIsOpen={setIsWithdrawOpen}
          campaignId={campaign.id}
          totalCollected={campaign.collectedAmount}
          totalWithdrawn={campaign.withdrawedAmount}
        />
      )}
    </>
  );

  /* ── FEATURED (horizontal) variant ─────── */
  if (featured) {
    return (
      <div
        onClick={handleClickCard}
        className="w-full cursor-pointer glass-card rounded-2xl overflow-hidden group flex flex-col sm:flex-row"
      >
        {/* Image — 42% on sm+ */}
        <div className="relative h-[220px] sm:h-auto sm:w-[42%] overflow-hidden flex-shrink-0">
          <CampaignImage
            src={campaign.imageUrl}
            alt={campaign.title}
            badgeClass={badgeClass}
            statusText={statusText}
            category={campaign.category}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between min-w-0">
          <div>
            <h5 className="text-xl sm:text-2xl font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-neon-violet transition-colors duration-200">
              {campaign.title}
            </h5>
            <p className="text-sm text-text-muted leading-relaxed line-clamp-2 mb-5">
              {campaign.description}
            </p>
          </div>

          <div>
            {/* Progress */}
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="font-semibold text-text-secondary">{progress}% funded</span>
              <span className="text-text-primary font-semibold">
                Ξ {campaign.collectedAmount}
                <span className="text-text-muted font-normal"> / {campaign.target}</span>
              </span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden mb-5">
              <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${progress}%` }} />
            </div>

            {/* Stats + CTA row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <FaClock className={daysLeft < 3 && daysLeft > 0 ? "text-neon-amber animate-pulse" : ""} />
                  {daysLeft > 0 ? `${daysLeft}d left` : "Ended"}
                </span>
                <span className="flex items-center gap-1.5">
                  <FaUsers />
                  {campaign.donations?.length || 0} donors
                </span>
              </div>
              <ClientButton className="btn-glass-emerald py-2 px-5 rounded-xl text-sm flex-shrink-0">
                Donate Now →
              </ClientButton>
            </div>
          </div>
        </div>

        {modals}
      </div>
    );
  }

  /* ── DEFAULT (vertical grid) variant ────── */
  return (
    <div
      onClick={handleClickCard}
      className="w-full cursor-pointer glass-card rounded-2xl overflow-hidden group flex flex-col"
    >
      {/* Image */}
      <div className="relative h-[200px] w-full overflow-hidden">
        <CampaignImage
          src={campaign.imageUrl}
          alt={campaign.title}
          badgeClass={badgeClass}
          statusText={statusText}
          category={campaign.category}
        />
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h5 className="text-base font-bold text-text-primary mb-1.5 line-clamp-1 group-hover:text-neon-violet transition-colors duration-200">
          {campaign.title}
        </h5>
        <p className="line-clamp-2 text-sm text-text-muted mb-4 leading-relaxed min-h-[40px]">
          {campaign.description}
        </p>

        {/* Progress */}
        <div className="mt-auto mb-3">
          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="font-semibold text-text-secondary">{progress}% funded</span>
            <span className="text-text-primary font-semibold">
              Ξ {campaign.collectedAmount}
              <span className="text-text-muted font-normal"> / {campaign.target}</span>
            </span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full transition-all duration-700 ${barClass}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-xs text-text-muted mb-4">
          <span className="flex items-center gap-1.5">
            <FaClock className={daysLeft < 3 && daysLeft > 0 ? "text-neon-amber animate-pulse" : ""} />
            {daysLeft > 0 ? `${daysLeft}d left` : "Ended"}
          </span>
          <span className="flex items-center gap-1.5">
            <FaUsers />
            {campaign.donations?.length || 0} donors
          </span>
        </div>

        <ClientButton className="btn-glass-emerald w-full py-2.5 rounded-xl text-sm">
          Donate Now →
        </ClientButton>
      </div>

      {modals}
    </div>
  );
};

export default Card;

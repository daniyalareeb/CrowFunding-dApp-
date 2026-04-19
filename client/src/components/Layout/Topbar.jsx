"use client";

import Link from "next/link";
import Image from "next/image";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { RiMenuFill } from "react-icons/ri";
import { useEffect, useRef, useState } from "react";

import Searchbar from "./Searchbar";
import Logo from "../../../public/Logo.png";
import { navLinks } from "@/utils/constants";
import { ClientButton, Navlink } from "@/components";
import { useEthersContext } from "@/contexts/EthersContext";

const Topbar = () => {
  const router = useRouter();
  const drawerRef = useRef(null);
  const { signer, loading, connectWallet, disconnectWallet } = useEthersContext();
  const [toggleDrawer, setToggleDrawer] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target))
        setToggleDrawer(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [drawerRef]);

  return (
    <div className="flex items-center sticky md:relative z-50 top-0 w-full justify-between flex-col-reverse sm:flex-row mb-5 py-2 bg-deep/80 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-b border-white/[0.06] md:border-none pb-4 md:pb-0">

      {/* Logo — visible on sm only */}
      <Link href="/" className="hidden sm:block md:hidden p-2 rounded-xl">
        <Image src={Logo} alt="fundseed" priority width={34} height={34} />
      </Link>

      <Searchbar />

      {/* ── Desktop actions ── */}
      <div className="md:flex hidden items-center gap-3">
        {signer ? (
          <>
            <ClientButton
              onClick={() => router.push("/create")}
              loading={loading}
              className="btn-glass-primary py-2.5 px-5 rounded-xl text-sm"
            >
              + New Campaign
            </ClientButton>

            <Link
              href="/account"
              className="flex items-center gap-2 glass rounded-full py-1.5 px-4 hover:border-neon-violet/40 transition-all duration-200"
            >
              {/* Live green dot */}
              <span className="w-2 h-2 rounded-full bg-neon-emerald shadow-[0_0_8px_rgba(16,185,129,0.9)] flex-shrink-0" />
              <span className="text-sm font-medium text-text-secondary">
                {signer.address
                  ? `${signer.address.slice(0, 6)}…${signer.address.slice(-4)}`
                  : "Wallet"}
              </span>
            </Link>
          </>
        ) : (
          <ClientButton
            onClick={connectWallet}
            loading={loading}
            className="btn-glass-primary py-2.5 px-6 rounded-xl"
          >
            Connect Wallet
          </ClientButton>
        )}
      </div>

      {/* ── Mobile drawer ── */}
      <div className="md:hidden flex justify-between sm:justify-end items-center relative w-full sm:w-auto sm:mb-0 mb-3 px-4 sm:px-0">
        <Link href="/" className="sm:hidden p-2 rounded-xl">
          <Image src={Logo} alt="fundseed" priority width={34} height={34} />
        </Link>

        {signer && (
          <div className="flex items-center gap-2 mr-4 sm:hidden glass rounded-full py-1 px-3">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-emerald shadow-[0_0_7px_rgba(16,185,129,0.9)] flex-shrink-0" />
            <span className="text-xs font-medium text-text-secondary">
              {signer.address
                ? `${signer.address.slice(0, 5)}…${signer.address.slice(-3)}`
                : ""}
            </span>
          </div>
        )}

        <ClientButton onClick={() => setToggleDrawer((prev) => !prev)}>
          <RiMenuFill className="text-xl text-text-secondary hover:text-text-primary transition-colors" />
        </ClientButton>

        {/* Dropdown drawer */}
        <div
          ref={drawerRef}
          className={`
            absolute w-[calc(100vw-32px)] sm:w-[58vw] transition-all duration-300 z-50
            flex flex-col gap-2 p-4 top-16 rounded-2xl right-0 mx-4 sm:mx-0
            glass shadow-glass-hover
            ${!toggleDrawer
              ? "opacity-0 invisible -translate-y-3 pointer-events-none"
              : "opacity-100 visible translate-y-0"}
          `}
        >
          {signer ? (
            <ClientButton
              loading={loading}
              onClick={() => { router.push("/create"); setToggleDrawer(false); }}
              className="btn-glass-emerald flex justify-center py-2.5 px-4 rounded-xl w-full"
            >
              + New Campaign
            </ClientButton>
          ) : (
            <ClientButton
              loading={loading}
              onClick={connectWallet}
              className="btn-glass-primary flex justify-center py-2.5 px-4 rounded-xl w-full"
            >
              Connect Wallet
            </ClientButton>
          )}

          {navLinks.map((link, index) =>
            signer || index < navLinks.length - 1 ? (
              <Navlink
                key={index}
                Icon={link.Icon}
                href={link.href}
                title={link.title}
                setToggleDrawer={setToggleDrawer}
              />
            ) : null
          )}

          {signer && (
            <ClientButton
              onClick={() => { disconnectWallet(); setToggleDrawer(false); }}
              className="flex gap-3 items-center p-3 mt-1 justify-start rounded-xl transition-all duration-200 hover:bg-red-500/10 text-text-muted hover:text-red-400 border-t border-white/[0.06]"
            >
              <FiLogOut className="text-base" />
              <span className="font-semibold text-sm">Logout</span>
            </ClientButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;

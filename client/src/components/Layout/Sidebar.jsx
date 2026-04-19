"use client";

import Link from "next/link";
import Image from "next/image";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";

import Logo from "/public/Logo.png";
import { navLinks } from "@/utils/constants";
import { ClientButton, Navlink } from "@/components";
import { useEthersContext } from "@/contexts/EthersContext";

const Sidebar = () => {
  const router = useRouter();
  const { signer, disconnectWallet } = useEthersContext();

  const handleDisconnect = () => {
    disconnectWallet();
    router.push("/");
  };

  return (
    /*
     * md (768-1024px): icon-only narrow sidebar  — w-[60px]
     * lg (1024px+):    icon + label wide sidebar  — w-[220px]
     */
    <aside className="sticky top-2 left-2 hidden md:flex flex-col md:w-[60px] lg:w-[220px] flex-shrink-0 transition-all duration-300 h-full">

      {/* Brand / logo */}
      <Link
        href="/"
        className="flex items-center md:justify-center lg:justify-start lg:px-4 p-3 rounded-2xl glass mb-3
                   hover:border-neon-violet/35 hover:shadow-glow-sm transition-all duration-200 gap-3 overflow-hidden"
      >
        <Image src={Logo} alt="fundseed" priority width={28} height={28} className="flex-shrink-0" />
        <span className="hidden lg:block text-sm font-black text-text-primary tracking-tight whitespace-nowrap">
          Fund Seed
        </span>
      </Link>

      {/* Nav panel */}
      <div className="flex flex-col glass p-2 rounded-2xl flex-1 min-h-0">
        <nav className="flex flex-col gap-1">
          {navLinks.map((link, index) =>
            signer || index < navLinks.length - 1 ? (
              <Navlink
                key={index}
                Icon={link.Icon}
                href={link.href}
                title={link.title}
                setToggleDrawer={() => {}}
              />
            ) : null
          )}
        </nav>

        {signer && (
          <div className="mt-auto pt-2 border-t border-white/[0.06]">
            <ClientButton
              onClick={handleDisconnect}
              className="flex items-center gap-3 p-2.5 rounded-xl w-full transition-all duration-200
                         hover:bg-red-500/10 text-text-muted hover:text-red-400
                         md:justify-center md:px-2.5 lg:justify-start lg:px-3.5"
            >
              <FiLogOut className="text-[1.1rem] flex-shrink-0" />
              <span className="hidden lg:block text-sm font-semibold">Logout</span>
            </ClientButton>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

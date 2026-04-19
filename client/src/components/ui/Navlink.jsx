"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const Navlink = ({ href, Icon, title, setToggleDrawer }) => {
  const path = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort");
  const isActive = sort ? path + `?sort=${sort}` === href : path === href;

  return (
    <Link
      onClick={() => setToggleDrawer(false)}
      href={href}
      className={`
        flex items-center rounded-xl gap-3 transition-all duration-200 p-2.5
        md:justify-center md:px-2.5
        lg:justify-start lg:px-3.5
        ${isActive
          ? "bg-neon-violet/15 text-neon-violet border border-neon-violet/25 shadow-[0_0_16px_rgba(139,92,246,0.18)]"
          : "text-text-muted hover:bg-white/[0.05] hover:text-text-secondary border border-transparent"
        }
      `}
    >
      <Icon className="text-[1.25rem] flex-shrink-0" />
      {/* Mobile drawer: always show. md: hide. lg: show again as sidebar label */}
      <span className="md:hidden lg:block text-sm font-semibold">{title}</span>
    </Link>
  );
};

export default Navlink;

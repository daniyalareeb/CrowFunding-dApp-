"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";

const Searchbar = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (search.length === 0) return;
    router.push(`/search?q=${search}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="md:max-w-[420px] sm:max-w-[280px] w-full flex items-center rounded-xl overflow-hidden glass transition-all duration-200 focus-within:border-neon-violet/50 focus-within:shadow-glow-sm"
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        type="text"
        className="w-full px-4 py-3 bg-transparent outline-none placeholder:text-text-muted text-text-primary text-sm"
        placeholder="Search campaigns…"
      />
      <button
        type="submit"
        className="bg-neon-violet/80 hover:bg-neon-violet transition-all duration-200 text-white py-3 px-5 border-l border-neon-violet/30 flex-shrink-0"
      >
        <FaSearch className="text-sm" />
      </button>
    </form>
  );
};

export default Searchbar;

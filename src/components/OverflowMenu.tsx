"use client";

import { useEffect, useRef, useState } from "react";

interface MenuItem {
  label: string;
  onClick: () => void;
  className?: string;
}

export default function OverflowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-[#ccc] hover:text-[#1a1a1a] transition-colors px-1 leading-none"
        title="More actions"
      >
        &#x22EE;
      </button>
      {open && (
        <div className="absolute right-0 top-5 bg-white border border-[#eee] shadow-sm rounded-md py-1 z-10 min-w-[160px]">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-[#f5f5f5] transition-colors ${
                item.className ?? "text-[#1a1a1a]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface HeaderMenuProps {
  onResetAll?: () => void;
}

export default function HeaderMenu({ onResetAll }: HeaderMenuProps) {
  const { data: session } = useSession();
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

  const avatar = session?.user?.image;
  const name = session?.user?.name ?? "Account";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-7 h-7 rounded-full overflow-hidden border border-[#eee] hover:border-[#ccc] transition-colors"
        title={name}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-[#999]">&#x2630;</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-white border border-[#eee] shadow-sm rounded-md py-1 z-20 min-w-[160px]">
          <Link
            href="/completed"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-3 py-1.5 text-xs text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
          >
            Completed Tasks
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-3 py-1.5 text-xs text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
          >
            Settings
          </Link>
          {onResetAll && (
            <>
              <div className="my-1 border-t border-[#eee]" />
              <button
                onClick={() => {
                  setOpen(false);
                  onResetAll();
                }}
                className="block w-full text-left px-3 py-1.5 text-xs text-[#c00] hover:bg-[#f5f5f5] transition-colors"
              >
                Reset Everything
              </button>
            </>
          )}
          <div className="my-1 border-t border-[#eee]" />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="block w-full text-left px-3 py-1.5 text-xs text-[#777] hover:bg-[#f5f5f5] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

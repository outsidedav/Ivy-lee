"use client";

import { useState, useCallback } from "react";
import { COFFEE_BREAK_COST } from "@/lib/points";
import dynamic from "next/dynamic";

const EspressoAnimation = dynamic(() => import("./EspressoAnimation"), {
  ssr: false,
});

interface CoffeeBreakButtonProps {
  balance: number;
  onRedeem: () => Promise<void>;
}

export default function CoffeeBreakButton({
  balance,
  onRedeem,
}: CoffeeBreakButtonProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const canAfford = balance >= COFFEE_BREAK_COST;

  async function handleRedeem() {
    if (!canAfford || isRedeeming) return;
    setIsRedeeming(true);
    try {
      await onRedeem();
      setShowAnimation(true);
    } finally {
      setIsRedeeming(false);
    }
  }

  const handleCloseAnimation = useCallback(() => {
    setShowAnimation(false);
  }, []);

  return (
    <>
      <div className="relative">
        <button
          onClick={handleRedeem}
          disabled={!canAfford || isRedeeming}
          className={`w-full py-3 text-sm font-medium tracking-wide border transition-all ${
            canAfford
              ? "border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
              : "border-[#e5e5e5] text-[#ccc] cursor-not-allowed"
          }`}
        >
          ☕ Take a Coffee Break ({COFFEE_BREAK_COST} pts)
        </button>
      </div>

      {showAnimation && <EspressoAnimation onClose={handleCloseAnimation} />}
    </>
  );
}

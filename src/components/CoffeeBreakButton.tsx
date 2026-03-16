"use client";

import { useState } from "react";
import { COFFEE_BREAK_COST } from "@/lib/points";

interface CoffeeBreakButtonProps {
  balance: number;
  onRedeem: () => Promise<void>;
}

export default function CoffeeBreakButton({
  balance,
  onRedeem,
}: CoffeeBreakButtonProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const canAfford = balance >= COFFEE_BREAK_COST;

  async function handleRedeem() {
    if (!canAfford || isRedeeming) return;
    setIsRedeeming(true);
    try {
      await onRedeem();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    } finally {
      setIsRedeeming(false);
    }
  }

  return (
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

      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#fafafa]/90 animate-fade-in">
          <span className="text-lg">☕ Enjoy your break!</span>
        </div>
      )}
    </div>
  );
}

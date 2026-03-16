"use client";

interface PointsDisplayProps {
  balance: number;
}

export default function PointsDisplay({ balance }: PointsDisplayProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-mono text-[#1a1a1a]">{balance}</span>
      <span className="text-xs text-[#999]">pts</span>
    </div>
  );
}

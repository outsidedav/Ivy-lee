export const COFFEE_BREAK_COST = 9;

const POINTS_BY_PRIORITY: Record<number, number> = {
  1: 4,
  2: 3.5,
  3: 3,
  4: 2.5,
  5: 2.5,
  6: 2,
};

export function pointsForPriority(priority: number): number {
  return POINTS_BY_PRIORITY[priority] ?? 2;
}

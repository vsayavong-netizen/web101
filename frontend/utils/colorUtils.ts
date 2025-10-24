// A palette of distinct, accessible colors.
const advisorColors = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#6366f1', // indigo-500
];

/**
 * Generates a consistent color for an advisor based on their name.
 * Uses a simple hashing function to map the name to a color in the palette.
 * @param advisorName The name of the advisor.
 * @returns A hex color string.
 */
export const getAdvisorColor = (advisorName: string): string => {
  if (!advisorName) {
    return '#64748b'; // slate-500 for fallback
  }

  let hash = 0;
  for (let i = 0; i < advisorName.length; i++) {
    const char = advisorName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % advisorColors.length;
  return advisorColors[index];
};

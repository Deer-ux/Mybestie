import colors from "@/constants/colors";

/**
 * Returns the neon dark design tokens.
 * The app exclusively uses the dark neon palette.
 */
export function useColors() {
  return { ...colors.light, radius: colors.radius };
}

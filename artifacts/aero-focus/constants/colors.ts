/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#F0F5E9',
    tint: '#C9FF55',
    background: '#080B08',
    foreground: '#F0F5E9',
    card: '#121711',
    cardForeground: '#F0F5E9',
    primary: '#C9FF55',
    primaryForeground: '#10150C',
    secondary: '#1C251B',
    secondaryForeground: '#D2DDCC',
    muted: '#182018',
    mutedForeground: '#889386',
    accent: '#FF6B78',
    accentForeground: '#210B0F',
    destructive: '#FF5E67',
    destructiveForeground: '#FFFFFF',
    border: '#293329',
    input: '#1A231A',
    brainHealthy: '#C9FF55',
    brainTired: '#E8D96B',
    brainStrained: '#F3AD52',
    brainCracked: '#FF744D',
    brainRotted: '#A8B081',
    cyan: '#68E5D2',
    overlay: '#050705',
  },

  dark: {
    text: '#F0F5E9',
    tint: '#C9FF55',
    background: '#080B08',
    foreground: '#F0F5E9',
    card: '#121711',
    cardForeground: '#F0F5E9',
    primary: '#C9FF55',
    primaryForeground: '#10150C',
    secondary: '#1C251B',
    secondaryForeground: '#D2DDCC',
    muted: '#182018',
    mutedForeground: '#889386',
    accent: '#FF6B78',
    accentForeground: '#210B0F',
    destructive: '#FF5E67',
    destructiveForeground: '#FFFFFF',
    border: '#293329',
    input: '#1A231A',
    brainHealthy: '#C9FF55',
    brainTired: '#E8D96B',
    brainStrained: '#F3AD52',
    brainCracked: '#FF744D',
    brainRotted: '#A8B081',
    cyan: '#68E5D2',
    overlay: '#050705',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;

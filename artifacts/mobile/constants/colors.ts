// Dark Neon palette — used exclusively across the entire app
const neon = {
  background:  '#050505',
  bgAlt:       '#0B0B0F',
  foreground:  '#FFFFFF',
  card:        'rgba(255,255,255,0.05)',
  cardForeground: '#FFFFFF',

  primary:     '#FF2D95',   // neon pink
  secondary:   '#D633FF',   // neon purple
  accent:      '#00D4FF',   // cyan
  lavender:    '#7B2CFF',   // deep violet

  primaryForeground:  '#FFFFFF',
  secondaryForeground:'#FFFFFF',
  accentForeground:   '#FFFFFF',

  lavenderLight:  'rgba(123,44,255,0.18)',
  muted:          'rgba(255,255,255,0.07)',
  mutedForeground:'rgba(255,255,255,0.50)',

  safeGreen:      '#00FF88',
  safeGreenLight: 'rgba(0,255,136,0.12)',

  destructive:            '#FF4455',
  destructiveForeground:  '#FFFFFF',

  border:       'rgba(255,255,255,0.09)',
  input:        'rgba(255,255,255,0.08)',
  warning:      '#FFB020',
  warningLight: 'rgba(255,176,32,0.12)',

  glass:        'rgba(255,255,255,0.05)',
  glassBorder:  'rgba(255,255,255,0.10)',

  // Neon glow blobs
  blobBlue:     'rgba(0,212,255,0.10)',
  blobPurple:   'rgba(214,51,255,0.12)',
  blobLavender: 'rgba(255,45,149,0.10)',

  // backward-compat
  text:         '#FFFFFF',
  tint:         '#FF2D95',
  blueDeep:     '#7B2CFF',
  blueLight:    'rgba(123,44,255,0.15)',
  purple:       '#D633FF',
  purpleLight:  'rgba(214,51,255,0.15)',
  greenSafe:    '#00FF88',
  greenLight:   'rgba(0,255,136,0.12)',
  surfaceAlt:   'rgba(255,255,255,0.06)',
};

const colors = {
  light: neon,
  dark:  neon,
  radius: 20,

  // Gradient arrays — import from here to avoid inline literals
  gradPrimary:  ['#FF2D95', '#D633FF', '#7B2CFF'] as [string, string, string],
  gradCyan:     ['#00D4FF', '#0066AA'] as [string, string],
  gradSuccess:  ['#00FF88', '#00AA55'] as [string, string],
  gradDanger:   ['#FF4455', '#CC0033'] as [string, string],
  gradDark:     ['#0B0B0F', '#050505'] as [string, string],
};

export default colors;

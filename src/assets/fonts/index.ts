import localFont from 'next/font/local';

/**
 * 1. Fonts Documentation
 * DreamClue AI docs/fonts
 *
 * 2. Fonts are committed locally so production builds do not need to download
 * Google Fonts at build time.
 */
export const fontNotoSans = localFont({
  src: './noto-sans-latin.woff2',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  variable: '--font-noto-sans',
  weight: '500 700',
});

export const fontNotoSerif = localFont({
  src: './noto-serif-latin.woff2',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
  variable: '--font-noto-serif',
  weight: '400',
});

export const fontNotoSansMono = localFont({
  src: './noto-sans-mono-latin.woff2',
  display: 'swap',
  fallback: ['Menlo', 'Consolas', 'monospace'],
  variable: '--font-noto-sans-mono',
  weight: '400',
});

export const fontBricolageGrotesque = localFont({
  src: './bricolage-grotesque-latin.woff2',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  variable: '--font-bricolage-grotesque',
  weight: '400 700',
});

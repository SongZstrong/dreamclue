import type { routing } from '@/i18n/routing';
import type messages from './messages/en.json';

/**
 * next-intl 4.0.0
 *
 * https://github.com/amannn/next-intl/blob/main/examples/example-app-router/global.d.ts
 */
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}

declare module 'markdown-it' {
  export default class MarkdownIt {
    constructor(...args: any[]);
    render(src: string): string;
  }
}

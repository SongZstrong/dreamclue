import { Logo } from '@/components/layout/logo';
import { buttonVariants } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export default function BuiltWithButton() {
  return (
    <LocaleLink
      href="/dreambook"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'border border-border px-4 rounded-md'
      )}
    >
      <span>Explore dreams with</span>
      <span>
        <Logo className="size-5 rounded-full" />
      </span>
      <span className="font-semibold">DreamClue AI</span>
    </LocaleLink>
  );
}

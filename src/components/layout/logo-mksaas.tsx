import { cn } from '@/lib/utils';
import Image from 'next/image';

export function DreamClueMark({ className }: { className?: string }) {
  return (
    <Image
      src="/dreamclue-mark.png"
      alt="DreamClue AI mark"
      title="DreamClue AI mark"
      width={96}
      height={96}
      className={cn('size-8 rounded-md', className)}
    />
  );
}

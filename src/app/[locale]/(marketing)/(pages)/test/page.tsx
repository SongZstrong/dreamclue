import Container from '@/components/layout/container';
import { ConsumeCreditsCard } from '@/components/test/consume-credits-card';
import { VerifyApiKeyCard } from '@/components/test/verify-apikey-card';
import { notFound } from 'next/navigation';

export default async function TestPage() {
  if (process.env.NEXT_PUBLIC_DEMO_WEBSITE !== 'true') {
    notFound();
  }

  return (
    <Container className="py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* credits test */}
        <ConsumeCreditsCard />

        {/* API key verification test */}
        <VerifyApiKeyCard />
      </div>
    </Container>
  );
}

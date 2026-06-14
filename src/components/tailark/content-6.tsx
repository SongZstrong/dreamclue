import Link from 'next/link'

export default function CommunitySection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <h2 className="text-3xl font-semibold">
                        Built for Reflective <br /> Dream Journaling
                    </h2>
                    <p className="mt-6">A quiet space for readers who want clearer dream notes and richer interpretations.</p>
                </div>
                <div className="mx-auto mt-12 flex max-w-lg flex-wrap justify-center gap-3">
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                    <Link href="/dreambook" target="_blank" title="DreamClue reader" className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover">
                        <img alt="DreamClue reader" src="/dreamclue-mark.png" loading="lazy" width={120} height={120} />
                    </Link>
                </div>
            </div>
        </section>
    )
}

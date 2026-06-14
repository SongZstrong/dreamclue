import { Cpu, Zap } from 'lucide-react'
import Image from 'next/image'

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">The Lyra ecosystem brings together our models.</h2>
                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
                    <div className="relative space-y-4">
                        <p className="text-muted-foreground">
                            DreamClue keeps dream interpretation grounded in your journal. <span className="text-accent-foreground font-bold">It supports a complete dream journal workflow</span> — from dream notes to recurring patterns.
                        </p>
                        <p className="text-muted-foreground">It supports a full dream workflow from quick capture to symbol review and personal reflection</p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">Faaast</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">It helps connect dream symbols with journal reflections.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="size-4" />
                                    <h3 className="text-sm font-medium">Powerful</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">It supports an entire helping dreamers and journal keepers.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative mt-6 sm:mt-0">
                        <div className="bg-linear-to-b aspect-67/34 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
                            <Image src="/exercice-dark.png" className="hidden rounded-2xl dark:block" alt="payments illustration dark" width={1206} height={612} />
                            <Image src="/exercice.png" className="rounded-2xl shadow dark:hidden" alt="payments illustration light" width={1206} height={612} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

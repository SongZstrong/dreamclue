import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-medium">The Lyra ecosystem brings together our models, products and platforms.</h2>
                    <div className="space-y-6">
                        <p>DreamClue turns scattered dream memories into structured symbols, emotions, and reflection notes.</p>
                        <p>
                            DreamClue. <span className="font-bold">It supports a complete dream journal workflow</span> — from dream notes to recurring patterns. Sit minus, quod debitis autem quia aspernatur delectus impedit modi, neque non id ad dignissimos? Saepe deleniti perferendis beatae.
                        </p>
                        <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="gap-1 pr-1.5">
                            <Link href="#">
                                <span>Learn More</span>
                                <ChevronRight className="size-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

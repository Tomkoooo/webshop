"use client"

import { CampList } from "@wse/plugin-camp-booking/storefront/CampList"

export function MineshowSessions({ title = "Turnusok" }: { title?: string }) {
  return (
    <section id="taborok" className="bg-[#b8d88a] px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-minecraft text-center text-sm md:text-base text-[#2d2817] mb-8">
          {title}
        </h2>
        <CampList variant="mineshow" />
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { EditableListInline } from "@wse/core/features/homepage-cms/components/primitives/EditableListInline"

const BLOCK_ID = "faq-mineshow"

type Accordion = { title: string; content: string }

export function MineshowFaq({ title, items }: { title: string; items: Accordion[] }) {
  const cms = useCmsEdit()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-[#b8d88a] px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-minecraft text-[#78B7FF] text-lg mb-6 drop-shadow-[2px_2px_0_#1a3d5c]">
          <EditableTextInline
            blockType="about"
            blockId={BLOCK_ID}
            field="title"
            value={title}
            className="text-[#78B7FF] text-lg font-minecraft"
          />
        </h2>
        <EditableListInline
          blockType="about"
          blockId={BLOCK_ID}
          field="accordions"
          items={items}
          onCreateItem={() => ({ title: "Új kérdés", content: "Új válasz" })}
          onRenderItem={(item, index, helpers) => {
            const open = openIndex === index
            return (
              <li key={index}>
                <button
                  type="button"
                  className="minecraft-faq-item w-full text-left px-4 py-3 flex items-center justify-between gap-3"
                  data-open={open}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  {cms.enabled ? (
                    <EditableTextInline
                      blockType="about"
                      blockId={BLOCK_ID}
                      field="accordions"
                      value={item.title}
                      className="font-minecraft text-[10px] text-white leading-relaxed flex-1"
                      onCommit={(value) => {
                        const next = items.map((row, idx) =>
                          idx === index ? { ...row, title: value } : row
                        )
                        cms.patchBlockData("about", { accordions: next }, BLOCK_ID)
                      }}
                    />
                  ) : (
                    <span className="font-minecraft text-[10px] text-white leading-relaxed">
                      {item.title}
                    </span>
                  )}
                  <span className="font-minecraft text-white shrink-0">{open ? "−" : "+"}</span>
                </button>
                {open ? (
                  <div className="minecraft-panel-inner mt-1 p-4 font-minecraft text-[10px] text-[#3d2817] leading-relaxed">
                    {cms.enabled ? (
                      <div className="space-y-2">
                        <EditableTextInline
                          blockType="about"
                          blockId={BLOCK_ID}
                          field="accordions"
                          value={item.content}
                          multiline
                          className="text-[#3d2817] text-[10px] font-minecraft leading-relaxed w-full"
                          onCommit={(value) => {
                            const next = items.map((row, idx) =>
                              idx === index ? { ...row, content: value } : row
                            )
                            cms.patchBlockData("about", { accordions: next }, BLOCK_ID)
                          }}
                        />
                        <button
                          type="button"
                          onClick={helpers.remove}
                          className="text-xs text-red-700 underline"
                        >
                          Törlés
                        </button>
                      </div>
                    ) : (
                      item.content
                    )}
                  </div>
                ) : null}
              </li>
            )
          }}
          className="space-y-3"
        />
      </div>
    </section>
  )
}

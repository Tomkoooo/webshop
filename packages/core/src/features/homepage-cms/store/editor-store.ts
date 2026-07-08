"use client"

import { create } from "zustand"
import type { HomepageBlock, HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import { getDefinition } from "@wse/core/features/homepage-cms/registry/block-registry"

type EditorState = {
  snapshot: HomepageSnapshot
  selectedBlockId: string | null
  device: "desktop" | "tablet" | "mobile"
  dirty: boolean
  past: HomepageSnapshot[]
  future: HomepageSnapshot[]
  setSnapshot: (snapshot: HomepageSnapshot) => void
  selectBlock: (blockId: string | null) => void
  setDevice: (device: "desktop" | "tablet" | "mobile") => void
  updateBlockField: (blockId: string, field: string, value: unknown) => void
  addBlock: (block: HomepageBlock, index: number) => void
  duplicateBlock: (blockId: string) => void
  removeBlock: (blockId: string) => void
  /** Merge multiple keys into `block.data` in one atomic update (avoids Zustand races). */
  updateBlockData: (blockId: string, patch: Record<string, unknown>) => void
  moveBlock: (from: number, to: number) => void
  markSaved: () => void
  undo: () => void
  redo: () => void
}

const EMPTY_SNAPSHOT: HomepageSnapshot = { blocks: [], meta: { seoTitle: "", seoDescription: "" } }

function cloneSnapshot(snapshot: HomepageSnapshot): HomepageSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as HomepageSnapshot
}

function withHistory(state: EditorState): Pick<EditorState, "past" | "future"> {
  return {
    past: [...state.past, cloneSnapshot(state.snapshot)],
    future: [],
  }
}

export const useHomepageEditorStore = create<EditorState>((set) => ({
  snapshot: EMPTY_SNAPSHOT,
  selectedBlockId: null,
  device: "desktop",
  dirty: false,
  past: [],
  future: [],
  setSnapshot: (snapshot) =>
    set(() => ({
      snapshot: cloneSnapshot(snapshot),
      selectedBlockId: snapshot.blocks[0]?.id ?? null,
      device: "desktop",
      dirty: false,
      past: [],
      future: [],
    })),
  selectBlock: (blockId) => set(() => ({ selectedBlockId: blockId })),
  setDevice: (device) => set(() => ({ device })),
  updateBlockField: (blockId, field, value) =>
    set((state) => ({
      ...withHistory(state),
      dirty: true,
      snapshot: {
        ...state.snapshot,
        blocks: state.snapshot.blocks.map((block) =>
          block.id === blockId
            ? field === "enabled"
              ? ({ ...block, enabled: Boolean(value) } as HomepageBlock)
              : ({ ...block, data: { ...block.data, [field]: value } } as HomepageBlock)
            : block
        ) as HomepageBlock[],
      },
    })),
  addBlock: (block, index) =>
    set((state) => {
      const blocks = [...state.snapshot.blocks]
      blocks.splice(index, 0, block)
      return {
        ...withHistory(state),
        dirty: true,
        snapshot: { ...state.snapshot, blocks },
        selectedBlockId: block.id,
      }
    }),
  duplicateBlock: (blockId) =>
    set((state) => {
      const idx = state.snapshot.blocks.findIndex((block) => block.id === blockId)
      if (idx < 0) return state
      const original = state.snapshot.blocks[idx]
      const copy: HomepageBlock = { ...original, id: `${original.type}-${Date.now()}` } as HomepageBlock
      const blocks = [...state.snapshot.blocks]
      blocks.splice(idx + 1, 0, copy)
      return {
        ...withHistory(state),
        dirty: true,
        snapshot: { ...state.snapshot, blocks },
        selectedBlockId: copy.id,
      }
    }),
  removeBlock: (blockId) =>
    set((state) => ({
      ...withHistory(state),
      dirty: true,
      snapshot: {
        ...state.snapshot,
        blocks: state.snapshot.blocks.filter((block) => block.id !== blockId),
      },
      selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
    })),
  updateBlockData: (blockId, patch) =>
    set((state) => ({
      ...withHistory(state),
      dirty: true,
      snapshot: {
        ...state.snapshot,
        blocks: state.snapshot.blocks.map((block) =>
          block.id === blockId
            ? ({ ...block, data: { ...block.data, ...patch } } as HomepageBlock)
            : block
        ),
      },
    })),
  moveBlock: (from, to) =>
    set((state) => {
      const blocks = [...state.snapshot.blocks]
      const [item] = blocks.splice(from, 1)
      blocks.splice(to, 0, item)
      return {
        ...withHistory(state),
        dirty: true,
        snapshot: { ...state.snapshot, blocks },
      }
    }),
  markSaved: () => set(() => ({ dirty: false })),
  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        snapshot: previous,
        selectedBlockId: previous.blocks[0]?.id ?? null,
        dirty: true,
        past: state.past.slice(0, -1),
        future: [cloneSnapshot(state.snapshot), ...state.future],
      }
    }),
  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        snapshot: next,
        selectedBlockId: next.blocks[0]?.id ?? null,
        dirty: true,
        past: [...state.past, cloneSnapshot(state.snapshot)],
        future: state.future.slice(1),
      }
    }),
}))

export function createDefaultBlock(type: HomepageBlock["type"]): HomepageBlock {
  return getDefinition(type).create()
}

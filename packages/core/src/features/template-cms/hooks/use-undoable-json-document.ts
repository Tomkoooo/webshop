"use client"

import { useCallback, useEffect, useMemo, useReducer, useState } from "react"
import { setAtPath } from "@wse/core/lib/immutable-set-path"

function clone<T>(x: T): T {
  return structuredClone(x) as T
}

type State<T> = {
  draft: T
  past: T[]
  future: T[]
}

type Action<T> =
  | { type: "reset"; value: T }
  | { type: "setPath"; path: string; value: unknown }
  | { type: "undo" }
  | { type: "redo" }

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "reset":
      return { draft: clone(action.value), past: [], future: [] }
    case "setPath": {
      const next = setAtPath(state.draft, action.path, action.value)
      if (JSON.stringify(next) === JSON.stringify(state.draft)) return state
      return {
        draft: next,
        past: [...state.past, clone(state.draft)].slice(-50),
        future: [],
      }
    }
    case "undo": {
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]
      return {
        draft: prev,
        past: state.past.slice(0, -1),
        future: [clone(state.draft), ...state.future],
      }
    }
    case "redo": {
      if (state.future.length === 0) return state
      const nxt = state.future[0]
      return {
        draft: nxt,
        past: [...state.past, clone(state.draft)],
        future: state.future.slice(1),
      }
    }
    default:
      return state
  }
}

export function useUndoableJsonDocument<T>(initial: T, hydrationKey: string) {
  const [checkpoint, setCheckpoint] = useState(() => clone(initial))

  const [state, dispatch] = useReducer(reducer<T>, undefined as never, (): State<T> => ({
    draft: clone(initial),
    past: [],
    future: [],
  }))

  useEffect(() => {
    dispatch({ type: "reset", value: clone(initial) })
    setCheckpoint(clone(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `initial` bumps with `hydrationKey` from server; avoid resetting on object identity noise
  }, [hydrationKey])

  const resetTo = useCallback((value: T) => {
    dispatch({ type: "reset", value: clone(value) })
    setCheckpoint(clone(value))
  }, [])

  const setPath = useCallback((path: string, value: unknown) => {
    dispatch({ type: "setPath", path, value })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: "undo" })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: "redo" })
  }, [])

  /** Marks working copy as synced with last saved persistence (cheap autosave bar). Undo stacks stay intact. */
  const markSynced = useCallback(() => {
    setCheckpoint(clone(state.draft))
  }, [state.draft])

  const dirty = useMemo(
    () => JSON.stringify(state.draft) !== JSON.stringify(checkpoint),
    [checkpoint, state.draft]
  )

  return {
    draft: state.draft,
    setPath,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    dirty,
    markSynced,
    resetTo,
  }
}

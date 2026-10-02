import {
  endAt,
  equalTo,
  onValue,
  orderByChild,
  query,
  ref,
  startAt,
  type Query,
  type QueryConstraint,
} from 'firebase/database'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import type { WithId } from '@/lib/types'

export interface QueryOpts {
  orderBy: string
  equalTo?: string
  startAt?: string
  endAt?: string
}

interface State<T> {
  key: string | null
  data: T | null
  error: Error | null
}

/** Realtime value at `path` (null path = paused). */
export function useDbValue<T>(path: string | null, opts?: QueryOpts) {
  const key = path ? `${path}?${JSON.stringify(opts ?? {})}` : null
  const [state, setState] = useState<State<T>>({ key: null, data: null, error: null })

  useEffect(() => {
    if (!path) return
    let q: Query = ref(db, path)
    if (opts) {
      const cs: QueryConstraint[] = [orderByChild(opts.orderBy)]
      if (opts.equalTo !== undefined) cs.push(equalTo(opts.equalTo))
      if (opts.startAt !== undefined) cs.push(startAt(opts.startAt))
      if (opts.endAt !== undefined) cs.push(endAt(opts.endAt))
      q = query(q, ...cs)
    }
    return onValue(
      q,
      (snap) => setState({ key, data: snap.val() as T | null, error: null }),
      (error) => setState({ key, data: null, error }),
    )
    // `key` fully describes path + opts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const fresh = state.key === key
  return { data: fresh ? state.data : null, loading: key !== null && !fresh, error: fresh ? state.error : null }
}

export function toList<T>(obj: Record<string, T> | null | undefined): WithId<T>[] {
  return obj ? Object.entries(obj).map(([id, v]) => ({ ...v, id })) : []
}

export function useDbList<T>(path: string | null, opts?: QueryOpts) {
  const { data, ...rest } = useDbValue<Record<string, T>>(path, opts)
  return { ...rest, items: toList(data) }
}

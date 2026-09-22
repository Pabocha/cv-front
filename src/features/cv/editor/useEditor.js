import { useCallback, useEffect, useRef, useState } from 'react'
import { previewCv } from '../../../api/cvs'
import { useCv, useUpdateCv } from '../useCvs'
import {
  defaultStyleFor,
  normalizeEditorLayout,
} from './editorConfigs'

const HISTORY_LIMIT = 50
const SNAPSHOT_DEBOUNCE = 800
const SAVE_DEBOUNCE = 600

const clone = (value) => JSON.parse(JSON.stringify(value))

export default function useEditor(id) {
  const { data: cv, isLoading } = useCv(id)
  const updateCv = useUpdateCv()

  const [draft, setDraft] = useState(null)
  const [liveHtml, setLiveHtml] = useState('')
  const [saveState, setSaveState] = useState('idle')
  const [saveError, setSaveError] = useState('')
  const [paywall, setPaywall] = useState(false)

  const draftRef = useRef(null)
  const past = useRef([])
  const future = useRef([])
  const saveTimer = useRef(null)
  const saveInFlight = useRef(false)
  const requeue = useRef(false)
  const lastSavedKey = useRef('')
  const mounted = useRef(true)

  const setBoth = (next) => {
    const snap = { ...next }
    draftRef.current = snap
    setDraft(snap)
  }

  const pushHistory = (hard = false) => {
    if (!draftRef.current) return
    const snap = { ...clone(draftRef.current), at: Date.now() }
    const top = past.current[past.current.length - 1]
    const mergeable = top && !hard && Date.now() - (top.at || 0) < SNAPSHOT_DEBOUNCE
    if (mergeable) {
      past.current[past.current.length - 1] = snap
    } else {
      past.current.push(snap)
      if (past.current.length > HISTORY_LIMIT) past.current.shift()
    }
    future.current = []
  }

  const flushSave = async () => {
    window.clearTimeout(saveTimer.current)
    if (saveInFlight.current) {
      requeue.current = true
      return
    }
    const state = draftRef.current
    if (!state || !cv) return
    const payload = {
      generated_content: state.content,
      layout: {
        sections: state.layout.sections,
        page_breaks: state.layout.page_breaks,
      },
      style: state.style,
      template: state.template,
      language: state.language || 'fr',
    }
    const key = JSON.stringify(payload)
    if (key === lastSavedKey.current) {
      setSaveState('saved')
      return
    }
    saveInFlight.current = true
    setSaveState('saving')
    setSaveError('')
    try {
      const { data } = await updateCv.mutateAsync({ id: cv.id, ...payload })
      lastSavedKey.current = key
      if (data.preview_html) setLiveHtml(data.preview_html)
      setSaveState('saved')
    } catch (err) {
      setSaveState('error')
      if (err?.response?.status === 402) setPaywall(true)
      const detail = err?.response?.data?.detail
      setSaveError(detail || 'Enregistrement impossible. Réessayez.')
    } finally {
      saveInFlight.current = false
      if (requeue.current) {
        requeue.current = false
        flushSave()
      }
    }
  }

  const scheduleSave = () => {
    setSaveState('dirty')
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      flushSave()
    }, SAVE_DEBOUNCE)
  }

  const mutate = (hard, fn) => {
    if (!draftRef.current) return
    pushHistory(hard)
    fn(draftRef.current)
    setBoth(draftRef.current)
    scheduleSave()
  }

  const applyPast = (next, isRedo) => {
    if (!next) return
    if (isRedo) past.current.push({ ...clone(draftRef.current), at: Date.now() })
    else future.current.push({ ...clone(draftRef.current), at: Date.now() })
    setBoth(next)
    scheduleSave()
  }

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      window.clearTimeout(saveTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!cv) return
    const slug = cv.template || 'professionnel'
    const content = cv.generated_content || {
      header: {},
      summary: '',
      experiences: [],
      educations: [],
      skills: [],
      languages: [],
      certifications: [],
      projects: [],
      interests: [],
    }
    const hasLayout =
      cv.layout && typeof cv.layout === 'object' && Object.keys(cv.layout).length > 0
    const hasStyle =
      cv.style && typeof cv.style === 'object' && Object.keys(cv.style).length > 0
    const initial = {
      content: clone(content),
      layout: normalizeEditorLayout(hasLayout ? cv.layout : null, slug),
      style: defaultStyleFor(slug, hasStyle ? cv.style : null),
      template: slug,
      language: cv.language || 'fr',
      at: Date.now(),
    }
    draftRef.current = initial
    past.current = [initial]
    future.current = []
    setDraft(initial)
    setSaveState('idle')
    setSaveError('')
    setPaywall(false)
    lastSavedKey.current = ''
    previewCv(cv.id)
      .then(({ data }) => mounted.current && setLiveHtml(data))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv?.id])

  const canUndo = (draft && past.current.length > 1) || false
  const canRedo = future.current.length > 0

  const undo = () => {
    if (past.current.length <= 1) return
    const prev = past.current.pop()
    applyPast(prev, false)
  }

  const redo = () => {
    const next = future.current.pop()
    if (!next) return
    applyPast(next, true)
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target
      const isField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      const mod = e.ctrlKey || e.metaKey
      if (!mod || isField) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      } else if (key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const updateHeader = useCallback(
    (field, value) => mutate(false, (d) => (d.content.header[field] = value)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const updateSummary = useCallback(
    (value) => mutate(false, (d) => (d.content.summary = value)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const addSectionItem = useCallback(
    (key, item) =>
      mutate(true, (d) => {
        if (key === 'interests') {
          const value = typeof item === 'string' ? item : item?.text
          if (value !== undefined) d.content.interests = [...d.content.interests, value]
        } else {
          d.content[key] = [...d.content[key], item]
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const updateSectionItem = useCallback(
    (key, index, item) =>
      mutate(false, (d) => {
        const list = [...d.content[key]]
        if (key === 'interests') list[index] = item?.text ?? item
        else list[index] = { ...list[index], ...item }
        d.content[key] = list
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const removeSectionItem = useCallback(
    (key, index) =>
      mutate(true, (d) => {
        d.content[key] = d.content[key].filter((_, i) => i !== index)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const moveSectionItem = useCallback(
    (key, from, to) =>
      mutate(true, (d) => {
        const list = [...d.content[key]]
        if (to < 0 || to >= list.length || from === to) return
        const [item] = list.splice(from, 1)
        list.splice(to, 0, item)
        d.content[key] = list
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const moveSection = useCallback(
    (key, direction) =>
      mutate(true, (d) => {
        const list = d.layout.sections
        const index = list.findIndex((s) => s.key === key)
        const target = index + direction
        if (index < 0 || target < 0 || target >= list.length) return
        const [sec] = list.splice(index, 1)
        list.splice(target, 0, sec)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const moveSectionTo = useCallback(
    (fromKey, toKey) =>
      mutate(true, (d) => {
        if (fromKey === toKey) return
        const list = d.layout.sections
        const from = list.findIndex((s) => s.key === fromKey)
        const to = list.findIndex((s) => s.key === toKey)
        if (from < 0 || to < 0) return
        const [sec] = list.splice(from, 1)
        list.splice(to, 0, sec)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const setTemplate = useCallback(
    (slug) =>
      mutate(true, (d) => {
        d.template = slug
        d.layout = normalizeEditorLayout(d.layout, slug)
        d.style = defaultStyleFor(slug, {
          font_size: d.style?.font_size,
          line_height: d.style?.line_height,
        })
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const toggleSectionVisibility = useCallback(
    (key) =>
      mutate(true, (d) => {
        const sec = d.layout.sections.find((s) => s.key === key)
        if (sec) sec.visible = !sec.visible
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const setSectionColumn = useCallback(
    (key, column) =>
      mutate(true, (d) => {
        const sec = d.layout.sections.find((s) => s.key === key)
        if (sec) sec.column = column
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const togglePageBreak = useCallback(
    (key) =>
      mutate(true, (d) => {
        const has = d.layout.page_breaks.includes(key)
        d.layout.page_breaks = has
          ? d.layout.page_breaks.filter((k) => k !== key)
          : [...d.layout.page_breaks, key]
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const updateStyle = useCallback(
    (partial) => mutate(false, (d) => (d.style = { ...d.style, ...partial })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const updateLanguage = useCallback(
    (language) => mutate(false, (d) => (d.language = language)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const clearPaywall = useCallback(() => setPaywall(false), [])

  const flushNow = useCallback(async () => {
    if (draftRef.current) await flushSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    cv,
    isLoading,
    draft,
    liveHtml,
    saveState,
    saveError,
    paywall,
    canUndo,
    canRedo,
    undo,
    redo,
    updateHeader,
    updateSummary,
    addSectionItem,
    updateSectionItem,
    removeSectionItem,
    moveSectionItem,
    moveSection,
    moveSectionTo,
    setTemplate,
    toggleSectionVisibility,
    setSectionColumn,
    togglePageBreak,
    updateStyle,
    updateLanguage,
    clearPaywall,
    flushNow,
  }
}
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Bot,
  User,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  BarChart3,
  AlertCircle,
  Zap,
  Loader2,
  Plus,
  MessageSquare,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

type Provider = 'claude' | 'gemini'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export interface DBMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface ConversationSummary {
  id: string
  title: string
  ai_provider: 'claude' | 'gemini'
  updated_at: string
}

interface InitialData {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  totalMonthlyIncome: number
  totalMonthlyExpenses: number
  monthlyCashFlow: number
  cashAssets: number
  totalInvestments: number
  debtToIncomeRatio: number
  emergencyFundMonths: number
  hasData: boolean
  profileRiskTolerance: 'low' | 'moderate' | 'high' | null
  profileAge: number | null
}

interface AdvisorChatProps {
  financialContext: string
  initialData: InitialData
  userId: string
  initialConversationId: string | null
  initialMessages: DBMessage[]
  recentConversations: ConversationSummary[]
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  {
    icon: BarChart3,
    label: 'Full financial analysis',
    prompt: 'Analyze my complete financial situation and provide a comprehensive diagnosis.',
  },
  {
    icon: AlertCircle,
    label: 'Biggest financial risk',
    prompt: 'What is my biggest financial risk right now, and how should I address it?',
  },
  {
    icon: Zap,
    label: 'Double income in 4-6 months',
    prompt:
      'How can I realistically double my income in 4-6 months? Be direct about whether this is achievable.',
  },
  {
    icon: TrendingUp,
    label: '30-day action plan',
    prompt:
      'Create a specific 30-day action plan with prioritized steps I can take immediately to improve my financial position.',
  },
  {
    icon: Wallet,
    label: 'Best use of cash',
    prompt:
      'What is the best use of my available cash right now — pay down debt, invest, or keep as emergency fund?',
  },
]

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  let html = text

  // Escape HTML entities first (basic safety)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (``` ... ```)
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_match, code) => {
    return `<pre class="code-block"><code>${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // H1 headings (# )
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')

  // H2 headings (## )
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')

  // H3 headings (### )
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')

  // Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic (*text*)
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr class="md-hr" />')

  // Unordered list items (- item)
  html = html.replace(/^[-*] (.+)$/gm, '<li class="md-li">$1</li>')

  // Ordered list items (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-li md-oli">$1</li>')

  // Wrap consecutive <li> into <ul>
  html = html.replace(/(<li class="md-li">[^]*?<\/li>(\n|$))+/g, (match) => {
    return `<ul class="md-ul">${match}</ul>`
  })

  // Double newlines to paragraphs (avoid wrapping block elements)
  html = html.replace(/\n\n(?!<(?:h[1-3]|ul|ol|li|pre|hr))/g, '</p><p class="md-p">')

  // Single newlines to <br> (within paragraphs)
  html = html.replace(/(?<!\>)\n(?!<)/g, '<br />')

  // Wrap in paragraph if not already block-level
  if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<pre')) {
    html = `<p class="md-p">${html}</p>`
  }

  return html
}

// ─── Utility: currency formatter ──────────────────────────────────────────────

function fmt(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function fmtPercent(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`
}

// ─── Stat item ────────────────────────────────────────────────────────────────

interface StatItemProps {
  label: string
  value: string
  positive?: boolean | null
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

function StatItem({ label, value, positive, icon: Icon }: StatItemProps) {
  const isPositive = positive === true
  const isNegative = positive === false
  const color = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#e2e8f0'

  return (
    <div
      className="flex items-start justify-between gap-2 py-3"
      style={{ borderBottom: '1px solid #1e2a3a' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={13} className="shrink-0 text-[#64748b]" />}
        <span className="text-xs text-[#64748b] leading-tight">{label}</span>
      </div>
      <span className="text-xs font-semibold shrink-0" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

// ─── Provider logo SVG helpers ────────────────────────────────────────────────

function AnthropicLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48h4.496z" />
    </svg>
  )
}

function GeminiLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 2c2.657 0 5.077 1.029 6.9 2.705L4.705 18.9A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2zm0 20c-2.657 0-5.077-1.029-6.9-2.705L19.295 5.1A9.945 9.945 0 0 1 22 12c0 5.523-4.477 10-10 10z" />
    </svg>
  )
}

// ─── Animated dots loader ─────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="AI is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"
          style={{
            animation: 'bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdvisorChat({
  financialContext,
  initialData,
  userId,
  initialConversationId,
  initialMessages,
  recentConversations: initialRecentConversations,
}: AdvisorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({ id: m.id, role: m.role, content: m.content }))
  )
  const [input, setInput] = useState('')
  const [provider, setProvider] = useState<Provider>('gemini')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId)
  const [recentConvs, setRecentConvs] = useState<ConversationSummary[]>(initialRecentConversations)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [input])

  // Load messages for a conversation
  async function loadConversation(convId: string) {
    if (convId === conversationId || isLoadingConversation) return
    setIsLoadingConversation(true)
    setMessages([])
    setError(null)

    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('id, role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data.map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })))
    }
    setConversationId(convId)
    setIsLoadingConversation(false)
  }

  function startNewConversation() {
    setConversationId(null)
    setMessages([])
    setError(null)
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      setError(null)

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
      }

      const assistantId = `assistant-${Date.now()}`
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setInput('')
      setIsStreaming(true)

      abortControllerRef.current = new AbortController()

      try {
        // Build messages array for API (exclude the empty streaming message)
        const apiMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            provider,
            financialContext,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
          throw new Error(errorData.error ?? `HTTP ${response.status}`)
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          )
        }

        // Mark streaming complete
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        )

        // ── Persist to database ──────────────────────────────────────────────
        if (accumulated) {
          const supabase = createClient()
          let activeConvId = conversationId

          if (!activeConvId) {
            // Create a new conversation titled from the first message
            const title =
              content.trim().length > 60
                ? content.trim().slice(0, 60) + '…'
                : content.trim()
            const { data: conv } = await supabase
              .from('conversations')
              .insert({ user_id: userId, title, ai_provider: provider })
              .select('id')
              .single()
            if (conv) {
              activeConvId = conv.id
              setConversationId(conv.id)
              const newConv: ConversationSummary = {
                id: conv.id,
                title,
                ai_provider: provider,
                updated_at: new Date().toISOString(),
              }
              setRecentConvs((prev) => [newConv, ...prev].slice(0, 10))
            }
          } else {
            // Update updated_at on existing conversation
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', activeConvId)
            setRecentConvs((prev) =>
              prev
                .map((c) =>
                  c.id === activeConvId
                    ? { ...c, updated_at: new Date().toISOString() }
                    : c
                )
                .sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                )
            )
          }

          if (activeConvId) {
            await supabase.from('messages').insert([
              { conversation_id: activeConvId, role: 'user', content: content.trim() },
              { conversation_id: activeConvId, role: 'assistant', content: accumulated },
            ])
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content || '_(Response cancelled)_', streaming: false }
                : m
            )
          )
        } else {
          const errMsg = err instanceof Error ? err.message : 'An error occurred'
          setError(errMsg)
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        }
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [messages, provider, financialContext, isStreaming, conversationId, userId]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleStop() {
    abortControllerRef.current?.abort()
  }

  const showWelcome = messages.length === 0 && !isLoadingConversation

  return (
    <>
      {/* Bounce animation keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        .md-h1 { font-size: 1.25rem; font-weight: 700; color: #e2e8f0; margin: 1.25rem 0 0.5rem; line-height: 1.3; }
        .md-h2 { font-size: 1.05rem; font-weight: 700; color: #e2e8f0; margin: 1rem 0 0.35rem; line-height: 1.3; padding-bottom: 0.25rem; border-bottom: 1px solid #1e2a3a; }
        .md-h3 { font-size: 0.95rem; font-weight: 600; color: #cbd5e1; margin: 0.75rem 0 0.25rem; }
        .md-p { margin: 0.4rem 0; line-height: 1.65; }
        .md-ul { margin: 0.4rem 0 0.4rem 1.25rem; list-style-type: disc; }
        .md-li { margin: 0.2rem 0; line-height: 1.6; }
        .md-oli { list-style-type: decimal; }
        .md-hr { border: none; border-top: 1px solid #1e2a3a; margin: 0.75rem 0; }
        .code-block { background: #0a0f1e; border: 1px solid #1e2a3a; border-radius: 6px; padding: 0.75rem 1rem; overflow-x: auto; font-size: 0.8rem; margin: 0.5rem 0; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
        .inline-code { background: #1e2a3a; border-radius: 3px; padding: 0.1em 0.35em; font-size: 0.85em; font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #38bdf8; }
      `}</style>

      {/*
        The advisor page uses a special full-height layout.
        We need to break out of the parent's overflow-y-auto + padding.
        Use -m-6 to cancel the parent's p-6, then set our own height.
      */}
      <div
        className="-m-6 flex"
        style={{ height: 'calc(100vh - 0px)', maxWidth: 'none' }}
      >
        {/* ── Left sidebar: financial stats ─────────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col shrink-0 border-r border-[#1e2a3a] overflow-y-auto"
          style={{ width: '260px', background: '#0d1424' }}
        >
          {/* Header */}
          <div className="px-4 py-4 border-b border-[#1e2a3a]">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: '28px',
                  height: '28px',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.2))',
                  border: '1px solid rgba(59,130,246,0.3)',
                }}
              >
                <Bot size={14} className="text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#e2e8f0]">AI Advisor</p>
                <p className="text-[10px] text-[#64748b]">Financial context</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="px-4 py-3">
            {!initialData.hasData ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle size={28} className="text-[#f59e0b]" />
                <p className="text-xs text-[#64748b]">
                  No financial data found. Add your assets, liabilities, and income in Setup to get
                  personalized advice.
                </p>
              </div>
            ) : (
              <>
                {/* Net worth */}
                <div
                  className="rounded-lg p-3 mb-3"
                  style={{ background: '#111827', border: '1px solid #1e2a3a' }}
                >
                  <p className="text-[10px] text-[#64748b] mb-1">Net Worth</p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: initialData.netWorth >= 0 ? '#10b981' : '#ef4444' }}
                  >
                    {fmt(initialData.netWorth)}
                  </p>
                </div>

                <div>
                  <StatItem
                    label="Total Assets"
                    value={fmt(initialData.totalAssets)}
                    positive={true}
                    icon={TrendingUp}
                  />
                  <StatItem
                    label="Total Liabilities"
                    value={fmt(initialData.totalLiabilities)}
                    positive={false}
                    icon={TrendingDown}
                  />
                  <StatItem
                    label="Monthly Income"
                    value={fmt(initialData.totalMonthlyIncome)}
                    positive={true}
                    icon={Wallet}
                  />
                  <StatItem
                    label="Monthly Expenses"
                    value={fmt(initialData.totalMonthlyExpenses)}
                    positive={false}
                  />
                  <StatItem
                    label="Cash Flow"
                    value={fmt(initialData.monthlyCashFlow)}
                    positive={initialData.monthlyCashFlow >= 0}
                  />
                  <StatItem
                    label="Liquid Cash"
                    value={fmt(initialData.cashAssets)}
                    positive={null}
                    icon={PiggyBank}
                  />
                  <StatItem
                    label="Investments"
                    value={fmt(initialData.totalInvestments)}
                    positive={null}
                    icon={BarChart3}
                  />
                  <StatItem
                    label="Emergency Fund"
                    value={`${initialData.emergencyFundMonths.toFixed(1)} mo`}
                    positive={initialData.emergencyFundMonths >= 3 ? true : false}
                  />
                  <StatItem
                    label="Debt-to-Income"
                    value={fmtPercent(initialData.debtToIncomeRatio)}
                    positive={initialData.debtToIncomeRatio <= 36 ? true : false}
                  />
                </div>
              </>
            )}
          </div>

          {/* Recent Conversations */}
          <div className="px-4 py-3 border-t border-[#1e2a3a] flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Conversations</p>
              <button
                onClick={startNewConversation}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#3b82f6] transition-colors"
                style={{ border: '1px solid rgba(59,130,246,0.3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                type="button"
                title="Start a new conversation"
              >
                <Plus size={10} />
                New
              </button>
            </div>
            {recentConvs.length === 0 ? (
              <p className="text-[10px] text-[#64748b] py-2">No conversations yet.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {recentConvs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className="w-full text-left px-2 py-2 rounded-md transition-all duration-100"
                    style={
                      conv.id === conversationId
                        ? { background: 'rgba(59,130,246,0.12)', color: '#e2e8f0' }
                        : { color: '#94a3b8' }
                    }
                    onMouseEnter={(e) => {
                      if (conv.id !== conversationId)
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      if (conv.id !== conversationId)
                        e.currentTarget.style.background = 'transparent'
                    }}
                    type="button"
                  >
                    <div className="flex items-start gap-1.5">
                      <MessageSquare size={11} className="shrink-0 mt-0.5 opacity-60" />
                      <span className="text-[11px] leading-snug line-clamp-2">{conv.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Provider selector (sidebar version) */}
          <div className="px-4 py-4 border-t border-[#1e2a3a] shrink-0">
            <p className="text-[10px] text-[#64748b] mb-2 uppercase tracking-wider">AI Provider</p>
            <div
              className="flex rounded-lg p-0.5 gap-0.5"
              style={{ background: '#111827', border: '1px solid #1e2a3a' }}
              role="radiogroup"
              aria-label="Select AI provider"
            >
              <button
                onClick={() => setProvider('claude')}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={
                  provider === 'claude'
                    ? { background: '#1e2a3a', color: '#e2e8f0' }
                    : { color: '#64748b' }
                }
                role="radio"
                aria-checked={provider === 'claude'}
                type="button"
              >
                <AnthropicLogo size={12} />
                Claude
              </button>
              <button
                onClick={() => setProvider('gemini')}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={
                  provider === 'gemini'
                    ? { background: '#1e2a3a', color: '#e2e8f0' }
                    : { color: '#64748b' }
                }
                role="radio"
                aria-checked={provider === 'gemini'}
                type="button"
              >
                <GeminiLogo size={12} />
                Gemini
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main chat area ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar (mobile provider selector + title) */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[#1e2a3a]"
            style={{ background: '#0a0f1e' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.15))',
                  border: '1px solid rgba(59,130,246,0.25)',
                }}
                aria-hidden="true"
              >
                <Bot size={16} className="text-[#3b82f6]" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[#e2e8f0]">AI Capital Advisor</h1>
                <p className="text-[11px] text-[#64748b]">
                  Personal finance strategist &amp; planner
                </p>
              </div>
            </div>

            {/* Mobile provider selector */}
            <div
              className="flex lg:hidden rounded-lg p-0.5 gap-0.5"
              style={{ background: '#111827', border: '1px solid #1e2a3a' }}
              role="radiogroup"
              aria-label="Select AI provider"
            >
              <button
                onClick={() => setProvider('claude')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={
                  provider === 'claude'
                    ? { background: '#1e2a3a', color: '#e2e8f0' }
                    : { color: '#64748b' }
                }
                role="radio"
                aria-checked={provider === 'claude'}
                type="button"
              >
                <AnthropicLogo size={12} />
                Claude
              </button>
              <button
                onClick={() => setProvider('gemini')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={
                  provider === 'gemini'
                    ? { background: '#1e2a3a', color: '#e2e8f0' }
                    : { color: '#64748b' }
                }
                role="radio"
                aria-checked={provider === 'gemini'}
                type="button"
              >
                <GeminiLogo size={12} />
                Gemini
              </button>
            </div>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto" style={{ background: '#0a0f1e' }}>
            <div className="max-w-3xl mx-auto px-4 py-6">

              {/* Loading conversation state */}
              {isLoadingConversation && (
                <div className="flex items-center justify-center gap-2 py-16 text-[#64748b]">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Loading conversation…</span>
                </div>
              )}

              {/* Welcome / empty state */}
              {showWelcome && (
                <div className="flex flex-col items-center gap-6 mb-8 text-center pt-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.15))',
                      border: '1px solid rgba(59,130,246,0.25)',
                    }}
                    aria-hidden="true"
                  >
                    <Bot size={32} className="text-[#3b82f6]" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-[#e2e8f0] mb-2">
                      Your AI Capital Advisor
                    </h2>
                    <p className="text-sm text-[#64748b] max-w-md leading-relaxed">
                      I analyze your complete financial picture — assets, liabilities, cash flow,
                      income, and risk — and give you fiduciary-grade advice with no hype.
                    </p>
                  </div>

                  {!initialData.hasData && (
                    <div
                      className="flex items-start gap-3 rounded-lg p-4 text-left max-w-md"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
                    >
                      <AlertCircle size={16} className="text-[#f59e0b] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#f59e0b] leading-relaxed">
                        No financial data found. For personalized advice, add your assets,
                        liabilities, and income in{' '}
                        <a href="/setup" className="underline font-semibold">
                          Setup
                        </a>
                        . You can still ask general questions.
                      </p>
                    </div>
                  )}

                  {/* Suggested prompts */}
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-left">
                    {SUGGESTED_PROMPTS.map((sp) => {
                      const Icon = sp.icon
                      return (
                        <button
                          key={sp.label}
                          onClick={() => sendMessage(sp.prompt)}
                          disabled={isStreaming}
                          className="group flex items-start gap-3 rounded-xl p-3.5 text-left transition-all duration-150"
                          style={{
                            background: '#111827',
                            border: '1px solid #1e2a3a',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(59,130,246,0.4)'
                            e.currentTarget.style.background = 'rgba(59,130,246,0.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.border = '1px solid #1e2a3a'
                            e.currentTarget.style.background = '#111827'
                          }}
                          type="button"
                        >
                          <Icon
                            size={15}
                            className="text-[#3b82f6] shrink-0 mt-0.5 transition-colors"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#e2e8f0] mb-0.5">
                              {sp.label}
                            </p>
                            <p className="text-[11px] text-[#64748b] leading-snug line-clamp-2">
                              {sp.prompt}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Message list */}
              <div className={`flex flex-col gap-6 ${isLoadingConversation ? 'hidden' : ''}`}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className="flex items-center justify-center rounded-full shrink-0 self-start mt-0.5"
                      style={{
                        width: '28px',
                        height: '28px',
                        background:
                          msg.role === 'user'
                            ? '#1d4ed8'
                            : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.2))',
                        border:
                          msg.role === 'user'
                            ? 'none'
                            : '1px solid rgba(59,130,246,0.3)',
                      }}
                      aria-hidden="true"
                    >
                      {msg.role === 'user' ? (
                        <User size={13} className="text-white" />
                      ) : (
                        <Bot size={13} className="text-[#3b82f6]" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={
                        msg.role === 'user'
                          ? {
                              background: '#1d4ed8',
                              color: '#ffffff',
                              borderBottomRightRadius: '4px',
                            }
                          : {
                              background: '#111827',
                              color: '#e2e8f0',
                              border: '1px solid #1e2a3a',
                              borderBottomLeftRadius: '4px',
                            }
                      }
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : msg.streaming && msg.content === '' ? (
                        <ThinkingDots />
                      ) : (
                        <div
                          className="prose-reset"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                      )}

                      {/* Streaming cursor */}
                      {msg.streaming && msg.content !== '' && (
                        <span
                          className="inline-block w-0.5 h-4 ml-0.5 align-middle rounded-full bg-[#3b82f6]"
                          style={{ animation: 'bounce 1s ease-in-out infinite' }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mx-4 mb-2 flex items-start gap-2 rounded-lg p-3 text-sm shrink-0"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5',
              }}
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-[#fca5a5] hover:text-white transition-colors"
                type="button"
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {/* Input area */}
          <div
            className="shrink-0 px-4 py-4 border-t border-[#1e2a3a]"
            style={{ background: '#0a0f1e' }}
          >
            <div className="max-w-3xl mx-auto">
              <div
                className="flex items-end gap-2 rounded-2xl p-2"
                style={{
                  background: '#111827',
                  border: '1px solid #1e2a3a',
                }}
                onFocus={(e) => {
                  const el = e.currentTarget
                  el.style.border = '1px solid rgba(59,130,246,0.5)'
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    const el = e.currentTarget
                    el.style.border = '1px solid #1e2a3a'
                  }
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your financial situation… (Ctrl+Enter to send)"
                  className="flex-1 bg-transparent text-sm text-[#e2e8f0] placeholder-[#64748b] resize-none outline-none py-2 px-2 leading-relaxed"
                  style={{ minHeight: '40px', maxHeight: '180px' }}
                  rows={1}
                  aria-label="Chat message input"
                  disabled={isStreaming}
                />

                {/* Stop / Send button */}
                {isStreaming ? (
                  <button
                    onClick={handleStop}
                    className="flex items-center justify-center rounded-xl w-9 h-9 shrink-0 transition-all duration-150"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                    type="button"
                    aria-label="Stop generation"
                    title="Stop generating"
                  >
                    <Loader2 size={16} className="text-[#ef4444] animate-spin" />
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isStreaming}
                    className="flex items-center justify-center rounded-xl w-9 h-9 shrink-0 transition-all duration-150"
                    style={
                      input.trim()
                        ? { background: '#3b82f6', color: '#ffffff' }
                        : { background: '#1e2a3a', color: '#64748b', cursor: 'not-allowed' }
                    }
                    type="button"
                    aria-label="Send message"
                    title="Send (Ctrl+Enter)"
                  >
                    <Send size={15} />
                  </button>
                )}
              </div>

              <p className="text-[10px] text-[#64748b] text-center mt-2">
                Using{' '}
                <span className="text-[#e2e8f0] font-medium">
                  {provider === 'claude' ? 'Claude Sonnet 4.6' : 'Gemini 2.0 Flash'}
                </span>{' '}
                · AI advice is informational, not a substitute for licensed financial advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

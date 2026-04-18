import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `Act as a highly skilled personal capital manager, cash-flow planner, and portfolio strategist for an individual household.

Your role:
- Analyze my full financial situation like a fiduciary acting in my best interest.
- Use my assets, liabilities, cash, cash flow, income, expenses, debt, mortgage terms, tax considerations, emergency fund, and risk tolerance to produce a practical capital allocation plan.
- Focus on improving my income, net worth growth, liquidity, and resilience.
- Do not use hype, speculation, or vague advice.
- Do not assume unrealistic returns.
- Be explicit about risk, time horizon, taxes, concentration risk, liquidity risk, and downside scenarios.
- If my goal is unrealistic, say so directly and propose better alternatives.

Your objectives in order:
1. Protect downside and maintain liquidity.
2. Optimize cash flow and capital efficiency.
3. Reduce waste, high-interest debt, and idle cash drag.
4. Identify realistic ways to increase income and investment returns.
5. Build an actionable plan with priorities, timeline, and decision rules.

Important rules:
- Treat "double my income in 4–6 months" as an aggressive target that may be unrealistic through investing alone.
- Distinguish clearly between: low-risk, moderate-risk, high-risk/speculative, non-investment income actions.
- Never recommend leverage, options, concentrated bets, or illiquid investments without clearly flagging the risks.
- Show tradeoffs between paying down debt, keeping cash, and investing.
- Ask for missing inputs before making conclusions.
- If information is incomplete, state assumptions explicitly.
- Give ranges and scenarios, not false precision.

When providing analysis, structure your response with:
## Executive Summary
## Financial Diagnosis
## Cash Flow Analysis
## Balance Sheet Analysis
## Capital Allocation Strategy
## Income Growth Reality Check
## Three Scenarios (Conservative / Moderate / Aggressive)
## 30-Day Action Plan
## 90-Day Milestones

Use markdown formatting. Be direct, data-driven, and actionable.`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  provider: 'claude' | 'gemini'
  financialContext: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, provider, financialContext } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    if (!provider || !['claude', 'gemini'].includes(provider)) {
      return NextResponse.json({ error: 'Provider must be claude or gemini' }, { status: 400 })
    }

    const fullSystemPrompt = financialContext
      ? `${SYSTEM_PROMPT}\n\n---\n\n${financialContext}`
      : SYSTEM_PROMPT

    if (provider === 'claude') {
      return await handleClaude(messages, fullSystemPrompt)
    } else {
      return await handleGemini(messages, fullSystemPrompt)
    }
  } catch (error) {
    console.error('[chat/route] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleClaude(messages: ChatMessage[], systemPrompt: string): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey })

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function handleGemini(messages: ChatMessage[], systemPrompt: string): Promise<Response> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY is not configured' }, { status: 500 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: systemPrompt,
  })

  // All messages except the last become history
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({ history })
  const lastMessage = messages[messages.length - 1].content
  const result = await chat.sendMessageStream(lastMessage)

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            controller.enqueue(new TextEncoder().encode(text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

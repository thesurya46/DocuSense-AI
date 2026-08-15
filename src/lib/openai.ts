export async function createEmbedding(
  text: string,
  apiKey: string,
  model = 'text-embedding-3-small'
): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ input: text.slice(0, 8000), model }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `OpenAI embeddings error ${res.status}`)
  }
  const data = await res.json() as { data: { embedding: number[] }[] }
  return data.data[0].embedding
}

export async function chatCompletionStream(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  onDelta: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: true, temperature: 0.1, max_tokens: 1024 }),
    signal,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `OpenAI chat error ${res.status}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      const trimmed = line.replace(/^data: /, '').trim()
      if (!trimmed || trimmed === '[DONE]') continue
      try {
        const parsed = JSON.parse(trimmed) as { choices: { delta: { content?: string } }[] }
        const delta = parsed.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          full += delta
          onDelta(delta)
        }
      } catch { /* skip malformed chunks */ }
    }
  }

  return full
}

export async function testConnection(apiKey: string): Promise<void> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `Auth failed (${res.status})`)
  }
}

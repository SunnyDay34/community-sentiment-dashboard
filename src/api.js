const ENDPOINTS = {
  core: import.meta.env.VITE_CORE_WEBHOOK || 'https://primary-production-f47d.up.railway.app/webhook/7299494f-edab-48f5-8a17-38e9762939f9',
  chat: import.meta.env.VITE_CHAT_WEBHOOK || 'https://primary-production-f47d.up.railway.app/webhook/c908fef7-778e-446b-b0d4-bb525809f97a',
  spikes: import.meta.env.VITE_SPIKES_WEBHOOK || 'https://primary-production-f47d.up.railway.app/webhook/b9b79872-abc5-4958-9b1b-dadc757949d7',
}

export const isDemoMode = !Object.values(ENDPOINTS).some(Boolean)

const demo = {
  core: { sentiment_score: 38, sentiment_label: 'POSITIVE', positive_count: 745, neutral_count: 334, negative_count: 205, total_messages: 1284, trend: '+8.4' },
  spikes: [{ keyword: 'updates', type: 'upward', last_week: 142, previous_week: 96 }, { keyword: 'combat', type: 'upward', last_week: 118, previous_week: 81 }, { keyword: 'server', type: 'downward', last_week: 74, previous_week: 103 }, { keyword: 'castle', type: 'upward', last_week: 91, previous_week: 77 }, { keyword: 'balance', type: 'downward', last_week: 62, previous_week: 88 }, { keyword: 'clan', type: 'upward', last_week: 53, previous_week: 38 }],
}

const keys = (...names) => names.map((n) => n.toLowerCase().replace(/[^a-z0-9]/g, ''))
function get(obj, variants, fallback = undefined) {
  const wanted = keys(...variants)
  const entry = Object.entries(obj || {}).find(([key]) => wanted.includes(key.toLowerCase().replace(/[^a-z0-9]/g, '')))
  return entry?.[1] ?? fallback
}
function rows(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.result)) return data.result
  return data && typeof data === 'object' ? [data] : []
}
function num(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }

async function post(url, body = {}) {
  if (!url || url.includes('your-n8n-or-railway-url')) throw new Error('Webhook URL is not configured. Add it in your Vercel project settings.')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 600000)
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal })
    if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`)
    return await response.json()
  } finally { clearTimeout(timer) }
}
function err(error) { return { source: 'error', error: error?.name === 'AbortError' ? 'Request timed out after 10 minutes.' : (error?.message || 'Request failed.') } }

export async function fetchCoreMetrics() {
  if (isDemoMode) return { source: 'demo', ...demo.core }
  try {
    const row = rows(await post(ENDPOINTS.core))[0] || {}
    const score = num(get(row, ['sentiment_score', 'Overall Sentiment Score (-100 to +100)', 'overall_sentiment_score', 'score']))
    const pCount = num(get(row, ['Total Positive Comments Count', 'positive_count', 'positive_comments']))
    const nCount = num(get(row, ['Total Negative Comments Count', 'negative_count', 'negative_comments']))
    const uCount = num(get(row, ['Total Neutral Comments Count', 'neutral_count', 'neutral_comments']))
    const total = num(get(row, ['Total Comments', 'total_messages', 'total_comments', 'total_comments_count']), pCount + nCount + uCount)
    const label = score >= 20 ? 'POSITIVE' : score <= -20 ? 'NEGATIVE' : 'NEUTRAL'
    return { source: 'webhook', sentiment_score: score, sentiment_label: label, positive_count: pCount, negative_count: nCount, neutral_count: uCount, total_messages: total, trend: get(row, ['trend', 'trend_delta']) }
  } catch (error) { return err(error) }
}
export async function fetchKeywordSpikes() {
  if (isDemoMode) return { source: 'demo', spikes: demo.spikes }
  try {
    const spikes = rows(await post(ENDPOINTS.spikes)).map((row) => ({ keyword: String(get(row, ['Keyword', 'keyword', 'word'], '')).trim(), type: String(get(row, ['Spike Type', 'Type', 'type', 'spike_type'], '')).trim().toLowerCase(), last_week: num(get(row, ['Last Week Count', 'last_week', 'last_week_count', 'current_count'])), previous_week: num(get(row, ['Previous Week Count', 'previous_week', 'previous_week_count', 'prior_count'])) })).filter((item) => item.keyword)
    return { source: 'webhook', spikes }
  } catch (error) { return { ...err(error), spikes: [] } }
}
export async function sendChat(message, history) {
  if (isDemoMode) return { source: 'demo', reply: `Demo connection is active. Once your chat webhook is configured, I can answer questions about the community feed. You asked: “${message}”` }
  try {
    const payload = await post(ENDPOINTS.chat, { message, history })
    const candidates = [...rows(payload), ...(payload?.data ? rows(payload.data) : [])]
    const reply = candidates.map((item) => get(item, ['reply', 'message', 'response', 'answer', 'text', 'output', 'result'])).find((value) => typeof value === 'string' && value.trim())
    if (!reply) throw new Error('The chat webhook response did not contain a reply field.')
    return { source: 'webhook', reply }
  } catch (error) { return err(error) }
}

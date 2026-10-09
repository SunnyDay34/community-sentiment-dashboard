import { useEffect, useRef, useState } from 'react'
import { Activity, Gamepad2, Radio, RefreshCw, Send, Signal, Wifi } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchCoreMetrics, fetchKeywordSpikes, isDemoMode, sendChat } from './api.js'

function CrtPanel({ title, action, onAction, loading, className = '', children }) {
  return <section className={`panel ${className}`}><header className="panel-head"><span className="live-dot" /><h2>{title}</h2>{action && <button className="action" onClick={onAction} disabled={loading}><RefreshCw size={13} className={loading ? 'spin' : ''} />{loading ? 'UPDATING...' : action}</button>}</header><div className="panel-body crt-scanlines">{children}</div></section>
}

function Gauge({ data }) {
  const score = Math.max(-100, Math.min(100, Number(data?.sentiment_score) || 0))
  const color = score >= 20 ? '#4ade80' : score <= -20 ? '#f87171' : '#facc15'
  const label = score >= 20 ? 'POSITIVE' : score <= -20 ? 'NEGATIVE' : 'NEUTRAL'
  const polar = (angle, radius) => [150 + radius * Math.cos(angle * Math.PI / 180), 145 + radius * Math.sin(angle * Math.PI / 180)]
  const arc = (from, to, radius) => { const a = polar(from, radius), b = polar(to, radius); return `M ${a[0]} ${a[1]} A ${radius} ${radius} 0 0 1 ${b[0]} ${b[1]}` }
  return <div className="gauge-wrap"><svg viewBox="0 0 300 178" className="gauge-svg" aria-label={`Sentiment score ${score}`}>
    <path d={arc(180, 240, 112)} className="gauge-track red"/><path d={arc(240, 300, 112)} className="gauge-track yellow"/><path d={arc(300, 360, 112)} className="gauge-track green"/>
    {Array.from({ length: 21 }, (_, i) => { const a = 180 + i * 9, [x1, y1] = polar(a, 96), [x2, y2] = polar(a, i % 5 === 0 ? 82 : 88); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={`tick ${i % 5 === 0 ? 'major' : ''}`} /> })}
    <line x1="150" y1="145" x2="150" y2="44" className="needle" style={{ transform: `rotate(${score / 100 * 90}deg)`, transformOrigin: '150px 145px', stroke: color }} /><circle cx="150" cy="145" r="6" fill={color} />
    <text x="27" y="166" className="gauge-end">-100</text><text x="139" y="166" className="gauge-end">0</text><text x="248" y="166" className="gauge-end">+100</text>
  </svg><div className="score-block" style={{ color, textShadow: `0 0 20px ${color}88` }}><strong>{score > 0 ? '+' : ''}{score}</strong><span>{label}</span></div>
    {data?.trend && <div className="trend">TREND <b>{String(data.trend).startsWith('+') || String(data.trend).startsWith('-') ? data.trend : `+${data.trend}`}</b> VS LAST PERIOD</div>}
  </div>
}

function CommentStat({ label, value, color }) { return <div className="comment-stat"><span style={{ color }}>{label}</span><b>{Number(value || 0).toLocaleString()}</b></div> }
function ErrorState({ error }) { return <div className="error-state"><b>⚠ LINK ERROR</b><span>{error}</span><small>PRESS UPDATE TO RETRY</small></div> }
function Tip({ active, payload, label }) { if (!active || !payload?.length) return null; return <div className="tooltip"><b>{label}</b>{payload.map((p) => <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</div>)}</div> }

function Chat() {
  const [messages, setMessages] = useState([]), [input, setInput] = useState(''), [loading, setLoading] = useState(false)
  const end = useRef(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])
  async function submit(event) {
    event.preventDefault(); const message = input.trim(); if (!message || loading) return
    const next = [...messages, { role: 'user', content: message }]; setMessages(next); setInput(''); setLoading(true)
    const result = await sendChat(message, next.map(({ role, content }) => ({ role, content })))
    setMessages((current) => [...current, result.error ? { role: 'error', content: result.error } : { role: 'assistant', content: result.reply }]); setLoading(false)
  }
  return <><div className="transcript" aria-live="polite">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}><small>{message.role === 'user' ? 'YOU' : message.role === 'error' ? 'LINK ERROR' : 'SENTIMENT-COMMS'}</small><p>{message.content}</p></div>)}{loading && <div className="transmitting"><RefreshCw size={14} className="spin" /> TRANSMITTING QUERY...</div>}<div ref={end} /></div><form className="chat-form" onSubmit={submit}><Radio size={16} /><span className="prompt">&gt;</span><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question about the V Rising community..." aria-label="Ask the community dashboard" /><button disabled={!input.trim() || loading} aria-label="Send message"><Send size={16} /><span>SEND</span></button></form></>
}

export default function App() {
  const [core, setCore] = useState(null), [spikes, setSpikes] = useState(null)
  const [busy, setBusy] = useState({ core: true, spikes: true })
  async function loadCore() { setBusy((v) => ({ ...v, core: true })); setCore(await fetchCoreMetrics()); setBusy((v) => ({ ...v, core: false })) }
  async function loadSpikes() { setBusy((v) => ({ ...v, spikes: true })); setSpikes(await fetchKeywordSpikes()); setBusy((v) => ({ ...v, spikes: false })) }
  useEffect(() => { loadCore(); loadSpikes() }, [])
  const chartRows = spikes?.spikes || []
  return <main className="crt-scanlines-page"><div className="crt-grid"/><div className="crt-vignette"/><div className="app-shell">
    <header className="topbar"><div className="brand"><Gamepad2 size={25} strokeWidth={1.6} /><div><span className="eyebrow">COMMUNITY INTELLIGENCE SYSTEM</span><h1>CROSS-TEAM COMMUNITY SENTIMENT DASHBOARD PROTOTYPE</h1></div></div><div className="status"><span className="status-pill"><span className="live-dot"/>{isDemoMode ? 'DEMO FEED' : 'SYSTEM ONLINE'}</span><span className="status-pill"><Wifi size={14}/> LIVE LINK</span></div></header>
    {isDemoMode && <div className="demo-banner"><Activity size={14}/> DEMO DATA ACTIVE <span>Connect your four webhook URLs in Vercel environment variables to use live data.</span></div>}
    <div className="section-label"><span>01</span><b>CORE METRICS</b><i/></div>
    <div className="metrics-grid"><CrtPanel title="Sentiment Score · -100 TO +100" action="UPDATE DATA" onAction={loadCore} loading={busy.core} className="gauge-panel">{busy.core ? <div className="loading"><RefreshCw className="spin"/> CALIBRATING...</div> : core?.source === 'error' ? <ErrorState error={core.error}/> : <><Gauge data={core}/><div className="comment-stats"><CommentStat label="POSITIVE COMMENTS" value={core?.positive_count} color="#4ade80"/><CommentStat label="NEUTRAL COMMENTS" value={core?.neutral_count} color="#facc15"/><CommentStat label="NEGATIVE COMMENTS" value={core?.negative_count} color="#f87171"/></div><div className="panel-foot"><span>TOTAL COMMENTS</span><b>{(core?.total_messages || 0).toLocaleString()}</b></div></>}</CrtPanel>
      <CrtPanel title="Keyword Spikes" action="UPDATE SPIKES" onAction={loadSpikes} loading={busy.spikes} className="spikes-panel">{busy.spikes ? <div className="loading"><RefreshCw className="spin"/> SCANNING SPIKES...</div> : spikes?.source === 'error' ? <ErrorState error={spikes.error}/> : chartRows.length ? <><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartRows} margin={{ top: 14, right: 12, left: -14, bottom: 36 }} barGap={3}><CartesianGrid stroke="#4ade80" strokeOpacity={.1} vertical={false}/><XAxis dataKey="keyword" tickFormatter={(value, index) => `${value} ${chartRows[index]?.type === 'upward' ? '▲' : chartRows[index]?.type === 'downward' ? '▼' : ''}`} tick={{ fill: '#86b99a', fontSize: 10, fontFamily: 'monospace' }} angle={-25} textAnchor="end" interval={0} axisLine={{ stroke: '#4ade8055' }} tickLine={false}/><YAxis tick={{ fill: '#639177', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false}/><Tooltip content={<Tip/>} cursor={{ fill: '#4ade8010' }}/><Bar dataKey="previous_week" name="PREV WK" fill="#facc15" radius={[2, 2, 0, 0]}/><Bar dataKey="last_week" name="LAST WK" fill="#4ade80" radius={[2, 2, 0, 0]}/></BarChart></ResponsiveContainer></div><div className="chart-legend"><span><i className="legend-green"/> LAST WK</span><span><i className="legend-yellow"/> PREV WK</span></div></> : <div className="empty-cloud">NO SPIKE DATA RECEIVED</div>}</CrtPanel></div>
    <div className="section-label second"><span>02</span><b>COMMUNITY SIGNAL INTERFACE</b><i/></div>
    <div className="social-grid"><CrtPanel title="Natural Language Query" className="chat-panel"><Chat/></CrtPanel></div>
    <footer><span><Signal size={13}/> SENTIMENT-COMMS TERMINAL <span className="footer-dot">·</span> BUILD 1.0</span><span>FEED STATUS: <b>{isDemoMode ? 'SIMULATED' : 'AWAITING SIGNAL'}</b></span></footer>
  </div></main>
}

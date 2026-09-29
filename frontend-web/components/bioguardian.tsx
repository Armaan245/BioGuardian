'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Activity, AlertOctagon, ArrowRight, Bell, Check, ChevronRight, CircleDot, FlaskConical, Gauge, Menu, Microscope, Radio, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, Waves, Wifi, X, Zap } from 'lucide-react'
import { useTelemetry } from '@/lib/telemetry/TelemetryContext'

export const team = [
  ['Armaan Mujawar', 'Artificial Intelligence and Data Science', 'AI / Data & Intelligence'],
  ['Rehan Bagwan', 'Electrical and Computer Engineering', 'Embedded Systems / Software'],
  ['Sumit Patil', 'Instrumentation and Control Engineering', 'Instrumentation / Control Systems'],
  ['Sakshi Nilate', 'Instrumentation and Control Engineering', 'Instrumentation / Monitoring'],
  ['Yahvii Bohra', 'Electronics and Telecommunication Engineering', 'Electronics / Hardware'],
  ['Nisha Kachare', 'Chemical Engineering', 'Microfluidics / Biological Systems'],
]

export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`flex items-center gap-2 font-semibold tracking-[-0.03em] ${light ? 'text-white' : 'text-slate-950'}`}><span className="grid size-8 place-items-center rounded-full bg-teal text-white"><span className="size-2.5 rounded-full border-2 border-white" /></span><span>BioGuardian</span></Link>
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const links = [['Product', '#product'], ['How it works', '#workflow'], ['Technology', '#technology'], ['Monitoring', '#monitoring'], ['Team', '#team']]
  return <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><Brand /><nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">{links.map(([label, href]) => <a key={label} href={href} className="transition-colors hover:text-foreground">{label}</a>)}</nav><div className="hidden items-center gap-4 lg:flex"><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link><Link href="/dashboard" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5">Open dashboard <ArrowRight className="ml-1 inline size-3.5" /></Link></div><button className="lg:hidden" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>{open && <nav className="flex flex-col gap-4 border-t border-border px-5 py-5 lg:hidden">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}<Link href="/dashboard" className="font-medium text-teal">Open dashboard</Link></nav>}</header>
}

export function FlowVisual({ compact = false }: { compact?: boolean }) {
  return <div className={`relative overflow-hidden rounded-[2rem] border border-teal/20 bg-[#eef8f6] ${compact ? 'h-52' : 'min-h-[450px]'}`}><div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(0,174,156,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,174,156,.08)_1px,transparent_1px)] [background-size:32px_32px]" /><svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 450" fill="none" aria-label="Microfluidic channel visualization" role="img"><path d="M-20 120C120 120 105 300 245 300S350 120 470 120h150" stroke="#a7ddd5" strokeWidth="38" strokeLinecap="round"/><path d="M-20 120C120 120 105 300 245 300S350 120 470 120h150" stroke="#fff" strokeWidth="26" strokeLinecap="round"/><path d="M-20 120C120 120 105 300 245 300S350 120 470 120h150" stroke="#00ae9c" strokeWidth="2" strokeDasharray="5 12" className="flow-line"/><circle cx="160" cy="217" r="44" stroke="#00ae9c" strokeDasharray="3 8"/><circle cx="160" cy="217" r="9" fill="#00ae9c"/><circle cx="400" cy="120" r="44" stroke="#f08b6d" strokeDasharray="3 8"/><circle cx="400" cy="120" r="9" fill="#f08b6d"/><circle cx="400" cy="120" r="18" stroke="#f08b6d" opacity=".25" className="pulse"/><circle cx="85" cy="120" r="5" fill="#00ae9c" className="particle p1"/><circle cx="260" cy="290" r="5" fill="#00ae9c" className="particle p2"/><circle cx="520" cy="120" r="5" fill="#00ae9c" className="particle p3"/></svg><div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-teal/20 bg-white/80 px-3 py-1.5 text-xs font-medium text-teal"><span className="size-2 rounded-full bg-teal" /> Live observation</div><div className="absolute bottom-6 right-6 rounded-xl border border-border bg-white/90 p-3 text-xs shadow-sm"><div className="mb-1 text-muted-foreground">Detection node A2</div><div className="flex items-center gap-2 font-medium"><span className="size-2 rounded-full bg-coral" /> Anomaly classified</div></div></div>
}

export function SectionLabel({ children }: { children: React.ReactNode }) { return <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal"><span className="size-2 rounded-full bg-teal" />{children}</div> }
export function Metric({ label, value, detail, alert = false }: { label: string; value: string; detail?: string; alert?: boolean }) { return <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground"><span>{label}</span><span className={`size-2 rounded-full ${alert ? 'bg-coral' : 'bg-teal'}`} /></div><div className="text-3xl font-semibold tracking-tight">{value}</div>{detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}</div> }

export function Process() { const steps = [['01','Observe','Camera and sensors continuously watch the system.'],['02','Detect','Patterns are compared against normal operation.'],['03','Diagnose','The system estimates the fault condition.'],['04','Intervene','A corrective action can be initiated.'],['05','Verify','Recovery is checked before the loop closes.']]; return <div className="grid gap-5 md:grid-cols-5">{steps.map(([n,title,desc], i) => <div key={title} className="relative"><div className="mb-5 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full border border-teal bg-teal-light text-sm font-semibold text-teal">{n}</span>{i < 4 && <span className="hidden h-px flex-1 bg-border md:block" />}</div><h3 className="mb-2 font-semibold">{title}</h3><p className="text-sm leading-6 text-muted-foreground">{desc}</p></div>)}</div> }

import { DigitalTwinView } from './twin/DigitalTwinView'
import VirtualLabView from './virtual-lab/VirtualLabView'

export function Twin({ dashboard = false }: { dashboard?: boolean }) { return <div className={`relative rounded-3xl border border-border bg-white ${dashboard ? 'p-5' : 'p-8'}`}><div className="mx-auto flex aspect-square max-w-[330px] items-center justify-center"><div className="relative grid size-32 place-items-center rounded-full border border-teal/40 bg-teal-light text-center"><div><div className="text-3xl font-semibold">98%</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">system health</div></div><div className="absolute -inset-5 rounded-full border border-dashed border-teal/30" /></div><div className="absolute left-0 top-10 rounded-xl border border-border bg-white p-3 text-xs shadow-sm"><div className="text-muted-foreground">Flow</div><strong>96.8%</strong></div><div className="absolute right-0 top-10 rounded-xl border border-border bg-white p-3 text-xs shadow-sm"><div className="text-muted-foreground">Pressure</div><strong>98.1%</strong></div><div className="absolute bottom-8 left-5 rounded-xl border border-border bg-white p-3 text-xs shadow-sm"><div className="text-muted-foreground">Bubble probability</div><strong>1.8%</strong></div><div className="absolute bottom-8 right-5 rounded-xl border border-border bg-white p-3 text-xs shadow-sm"><div className="text-muted-foreground">Pump</div><strong className="text-teal">ACTIVE</strong></div></div>{dashboard && <div className="mt-4 pt-3 border-t border-border flex items-center justify-between"><span className="text-xs text-muted-foreground">3D Microfluidic Twin</span><Link href="/dashboard/twin" className="text-xs font-semibold text-teal hover:underline flex items-center gap-1">Launch 3D Twin <ArrowRight className="size-3" /></Link></div>}</div> }

export function DashboardPreview() { return <div className="rounded-3xl border border-border bg-white p-3 shadow-xl shadow-slate-200/60"><div className="flex items-center justify-between border-b border-border px-3 pb-3 text-xs"><span className="font-semibold">BioGuardian / Overview</span><span className="flex items-center gap-2 text-teal"><span className="size-2 rounded-full bg-teal" />Operational</span></div><div className="grid gap-3 p-2 sm:grid-cols-4"><Metric label="System health" value="98.4%" detail="+0.6% today" /><Metric label="Flow" value="96.8%" detail="Within range" /><Metric label="Pressure" value="98.1%" detail="Stable" /><Metric label="Active faults" value="1" detail="Being investigated" alert /></div><div className="grid gap-3 p-2 lg:grid-cols-[1.4fr_1fr]"><FlowVisual compact /><div className="rounded-2xl border border-border p-4"><div className="mb-4 text-sm font-semibold">Recent events</div>{['Bubble detected · Channel A2','Fault classified · Air bubble','Recovery verified · Channel A2'].map((x,i)=><div key={x} className="flex gap-3 border-t border-border py-3 text-xs"><span className="font-mono text-muted-foreground">09:{42-i*4}:2{i}</span><span>{x}</span></div>)}</div></div></div> }

export function TeamGrid() { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{team.map(([name,dept,role], i)=><div key={name} className="group rounded-2xl border border-border bg-white p-5 transition hover:-translate-y-1 hover:border-teal/50"><div className="mb-5 grid size-14 place-items-center rounded-full bg-teal-light text-lg font-semibold text-teal">{name.split(' ').map(x=>x[0]).join('')}</div><h3 className="font-semibold">{name}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{dept}</p><div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs"><span>{role}</span><a href="#team" aria-label={`LinkedIn placeholder for ${name}`} className="text-teal hover:text-ink"><span className="text-xs font-semibold">in</span></a></div></div>)}</div> }

export function DashboardShell() {
  const [active, setActive] = useState('Overview');
  const {
    telemetry,
    status,
    providerMode,
    setProviderMode,
    triggerBubbleSpot,
    clearBubbleSpot,
    showBubbleSpotVisual,
    fetchLatestFromApi,
    isApiFetching,
    setSimulationFlowRate,
    backendUrl,
  } = useTelemetry();

  const isBubbleSpotted = telemetry.bubble_detected || showBubbleSpotVisual;
  const probPercent = Math.round(telemetry.bubble_probability * 100);

  const items = [
    ['Overview', Gauge],
    ['Live System', Waves],
    ['Faults', Zap],
    ['Digital Twin', CircleDot],
    ['Devices', Microscope],
    ['Logs', Activity],
    ['Settings', SlidersHorizontal],
  ] as const;

  return (
    <div className="min-h-screen bg-[#f5f8f7] lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-white p-5 lg:flex lg:flex-col">
        <Brand />
        <div className="mt-12 space-y-1">
          {items.map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${
                active === label ? 'bg-teal-light font-medium text-teal' : 'text-muted-foreground hover:bg-slate-50'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Virtual Lab — dedicated in-silico simulation studio */}
        <div className="mt-4 border-t border-border pt-4">
          <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            In-Silico Simulation
          </p>
          <Link
            href="/dashboard/virtual-lab"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 transition shadow-sm border border-purple-200/60"
          >
            <FlaskConical className="size-4 text-purple-600" />
            <span>Virtual Lab Studio</span>
            <span className="ml-auto rounded-full bg-purple-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-800">
              SIM
            </span>
          </Link>
        </div>

        <div className="mt-auto rounded-2xl bg-teal-light p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-teal">
            <span className="size-2 rounded-full bg-teal" />
            System status
          </div>
          <p className="text-sm font-medium">All systems operational</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {providerMode === 'mock' ? 'Demo simulation engine' : 'Live hardware gateway'}
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-5 py-3.5 lg:px-8">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm font-semibold">{active}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                BioGuardian Rig · <span className="text-teal font-medium">Operational</span>
              </div>
            </div>

            {/* Dual Mode Switcher Button */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-border">
              <button
                onClick={() => setProviderMode('mock')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition ${
                  providerMode === 'mock'
                    ? 'bg-white font-semibold text-amber-800 shadow-sm border border-amber-200'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Sparkles className="size-3.5 text-amber-500" />
                Simulation (Fake Data)
              </button>
              <button
                onClick={() => setProviderMode('real')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition ${
                  providerMode === 'real'
                    ? 'bg-white font-semibold text-teal shadow-sm border border-teal/30'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Wifi className="size-3.5 text-teal" />
                Real-Time APIs
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status Badge */}
            {providerMode === 'mock' ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-amber-50 border border-amber-200 text-amber-800">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                SYNTHETIC MODE
              </span>
            ) : (
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                  status === 'CONNECTED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    status === 'CONNECTED' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                  }`}
                />
                <span title={`API Base: ${backendUrl}`}>
                  {status === 'CONNECTED' ? 'LIVE APIS CONNECTED' : status === 'CONNECTING' ? 'CONNECTING...' : 'API OFFLINE'}
                </span>
              </span>
            )}
            <Bell className="size-4 text-muted-foreground" />
            <div className="grid size-8 place-items-center rounded-full bg-teal text-xs text-white font-semibold">
              BG
            </div>
          </div>
        </div>

        {active === 'Digital Twin' ? (
          <div className="mx-auto max-w-7xl p-5 lg:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-teal">
                  Real-Time Microfluidic Physics & Optical Twin
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">Organ-on-Chip Digital Twin</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Direct observation of incoming fluid line and upstream bubble intercept zone.
                </p>
              </div>
              <Link
                href="/dashboard/twin"
                className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 flex items-center gap-1.5"
              >
                Open Full Screen <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <DigitalTwinView />
          </div>
        ) : (
          <div className="mx-auto max-w-7xl p-5 lg:p-8">
            {/* 1. SYSTEM CRITICAL ALERT MESSAGE (When Bubble Spotted) */}
            {isBubbleSpotted && (
              <div className="mb-6 rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 sm:p-5 shadow-lg shadow-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="rounded-xl bg-rose-600 p-2.5 text-white shrink-0 shadow">
                    <AlertOctagon className="size-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-rose-950">
                        CRITICAL ANOMALY: Air Bubble Spotted in Optical Inspection Zone
                      </h2>
                      <span className="rounded-full bg-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                        Channel A2 · Risk {probPercent}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-rose-700">
                      Upstream optical detection triggered at -20mm observation spot. Autonomous valve intercept sequence armed to protect downstream Organ-on-Chip cell culture.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setActive('Digital Twin')}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition flex items-center gap-1.5 shadow"
                  >
                    <Radio className="size-3.5 animate-pulse" /> View Spot in 3D Twin
                  </button>
                  <button
                    onClick={clearBubbleSpot}
                    className="rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    Clear Anomaly
                  </button>
                </div>
              </div>
            )}

            {/* 2. Interactive Control Bar for Simulation / Real-Time */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Telemetry Mode</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      providerMode === 'mock'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {providerMode === 'mock' ? 'SIMULATION (FAKE DATA)' : 'REAL-TIME APIS (FASTAPI & MQTT)'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {providerMode === 'mock'
                    ? 'Physics simulation engine with controllable bubble injection and flow rates.'
                    : `Streaming live telemetry for device ${telemetry.device_id} over WebSocket.`}
                </p>
              </div>

              {/* Simulation Quick Controls */}
              {providerMode === 'mock' ? (
                <div className="flex flex-wrap items-center gap-2">
                  {!isBubbleSpotted ? (
                    <button
                      onClick={() => triggerBubbleSpot(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition flex items-center gap-1.5 shadow-sm"
                      title="Spot an air bubble in the observation zone and trigger system alert"
                    >
                      <Radio className="size-3.5 text-rose-500 animate-pulse" />
                      Show Bubble Spot
                    </button>
                  ) : (
                    <button
                      onClick={clearBubbleSpot}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-sm"
                      title="Clear bubble and restore normal flow"
                    >
                      <Check className="size-3.5 text-emerald-600" />
                      Clear Bubble Spot
                    </button>
                  )}
                  <button
                    onClick={() => setSimulationFlowRate(telemetry.flow_rate > 300 ? 120 : 450)}
                    className="px-3 py-2 rounded-xl text-xs font-medium border border-border bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                  >
                    Flow: {telemetry.flow_rate.toFixed(0)} µL/min (Toggle)
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={fetchLatestFromApi}
                    disabled={isApiFetching}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal text-white hover:bg-teal/90 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <RotateCcw className={`size-3.5 ${isApiFetching ? 'animate-spin' : ''}`} />
                    {isApiFetching ? 'Fetching...' : 'Fetch from API Now'}
                  </button>
                  <span className="text-xs font-mono text-muted-foreground" title="Configured via NEXT_PUBLIC_API_BASE_URL">
                    {backendUrl}
                  </span>
                </div>
              )}
            </div>

            {/* Live Monitoring Heading */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live telemetry</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">System Overview</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Source: <span className="font-semibold text-teal">{telemetry.source}</span> · Last updated:{' '}
                  {new Date(telemetry.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => {
                  if (providerMode === 'mock') {
                    clearBubbleSpot();
                  } else {
                    fetchLatestFromApi();
                  }
                }}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium hover:border-teal transition"
              >
                <Sparkles className="mr-2 inline size-4 text-teal" />
                Run health check
              </button>
            </div>

            {/* Dynamic Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="System health"
                value={isBubbleSpotted ? '76.4%' : '98.8%'}
                detail={isBubbleSpotted ? 'Anomaly spotted · Active intercept' : '+0.6% nominal'}
                alert={isBubbleSpotted}
              />
              <Metric
                label="Flow rate"
                value={`${telemetry.flow_rate.toFixed(1)} µL/min`}
                detail={telemetry.flow_rate < 200 ? 'Low flow alert' : 'Target: 450 µL/min'}
                alert={telemetry.flow_rate < 150}
              />
              <Metric
                label="Pressure"
                value={`${telemetry.pressure.toFixed(1)} mbar`}
                detail={telemetry.pressure > 1025 ? 'High resistance' : 'Stable isobaric'}
                alert={telemetry.pressure > 1025}
              />
              <Metric
                label="Active faults"
                value={isBubbleSpotted ? '1 (Bubble Spot)' : '0'}
                detail={isBubbleSpotted ? 'Inlet observation spot' : 'All channels verified'}
                alert={isBubbleSpotted}
              />
            </div>

            {/* Secondary Physiochemical Readings Strip */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground uppercase font-mono text-[10px]">pH:</span>
                <strong className={telemetry.ph < 7.2 || telemetry.ph > 7.6 ? 'text-amber-600' : 'text-slate-900'}>
                  {telemetry.ph.toFixed(2)}
                </strong>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground uppercase font-mono text-[10px]">Temperature:</span>
                <strong>{telemetry.temperature.toFixed(1)} °C</strong>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground uppercase font-mono text-[10px]">Dissolved O₂:</span>
                <strong>{telemetry.oxygen.toFixed(1)} mg/L</strong>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground uppercase font-mono text-[10px]">Glucose:</span>
                <strong>{telemetry.glucose.toFixed(1)} mg/dL</strong>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground uppercase font-mono text-[10px]">Bubble Probability:</span>
                <strong className={isBubbleSpotted ? 'text-rose-600' : 'text-teal'}>{probPercent}%</strong>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
              <section className="rounded-2xl border border-border bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Live microfluidic system</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Channel network · camera + sensor view</p>
                  </div>
                  <span className="rounded-full bg-teal-light px-3 py-1 text-xs font-medium text-teal">Flow normal</span>
                </div>
                <FlowVisual compact />
              </section>
              <section className="rounded-2xl border border-border bg-white p-5">
                <h2 className="font-semibold">Fault monitor</h2>
                <div className="mt-4 space-y-4">
                  {[
                    ['09:42:18', 'Bubble detected', 'Channel A2', 'Detected'],
                    ['09:38:04', 'Flow deviation', 'Channel B1', 'Investigating'],
                    ['09:21:45', 'Pressure normalized', 'Channel A1', 'Verified'],
                  ].map(([time, title, channel, status]) => (
                    <div key={time} className="flex gap-3 border-b border-border pb-4 last:border-0">
                      <span className="font-mono text-xs text-muted-foreground">{time}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{channel}</div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] ${
                          status === 'Detected'
                            ? 'bg-coral-light text-coral'
                            : status === 'Verified'
                            ? 'bg-teal-light text-teal'
                            : 'bg-amber-light text-amber-700'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">Operational digital twin</h2>
                  <span className="text-xs text-muted-foreground">Model state · live</span>
                </div>
                <Twin dashboard />
              </section>
              <section className="rounded-2xl border border-border bg-white p-5">
                <h2 className="font-semibold">Recent events</h2>
                <div className="mt-5 space-y-0">
                  {[
                    ['09:42:18', 'Bubble detected', 'Channel A2'],
                    ['09:42:20', 'Fault classified', 'Air bubble'],
                    ['09:42:22', 'Recovery action initiated', 'Pressure pulse'],
                    ['09:42:25', 'Flow restored', 'Within range'],
                    ['09:42:26', 'Recovery verified', 'Closed loop'],
                  ].map(([time, title, desc], i) => (
                    <div className="relative flex gap-4 pb-5" key={time}>
                      <div className="relative z-10 mt-1 size-3 rounded-full border-2 border-white bg-teal ring-1 ring-teal/30" />
                      {i < 4 && <div className="absolute left-[5px] top-4 h-full w-px bg-border" />}
                      <div>
                        <div className="text-sm font-medium">{title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {time} · {desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function LoginForm() { const [demo,setDemo]=useState(false); return <form onSubmit={(e)=>{e.preventDefault();setDemo(true)}} className="rounded-3xl border border-border bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-10"><Brand /><h1 className="mt-12 text-3xl font-semibold tracking-tight">Welcome back.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to continue to your monitoring workspace.</p><div className="mt-8 space-y-4"><label className="block text-sm font-medium">Email<input type="email" required placeholder="you@lab.example" className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20" /></label><label className="block text-sm font-medium">Password<input type="password" required placeholder="••••••••" className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20" /></label></div><button className="mt-6 w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white hover:bg-slate-700">{demo?'Signed in':'Sign in'}</button><Link href="/dashboard" className="mt-3 block w-full rounded-xl border border-border px-4 py-3 text-center text-sm font-medium hover:border-teal">Continue with demo</Link></form> }

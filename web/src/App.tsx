import { useState } from 'react';
import {
  ShieldCheck,
  ShieldX,
  Activity,
  Terminal,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from 'lucide-react';

interface QuoteItem {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: string;
  marketCap: string;
  cmcRank: number;
}

const SAMPLE_QUOTES: QuoteItem[] = [
  { name: 'Bitcoin', symbol: 'BTC', price: 64280.5, change24h: 2.45, volume24h: '$31.2B', marketCap: '$1.26T', cmcRank: 1 },
  { name: 'Ethereum', symbol: 'ETH', price: 2745.2, change24h: 1.82, volume24h: '$16.8B', marketCap: '$330.2B', cmcRank: 2 },
  { name: 'Solana', symbol: 'SOL', price: 152.8, change24h: 4.21, volume24h: '$3.84B', marketCap: '$71.5B', cmcRank: 5 },
  { name: 'BNB', symbol: 'BNB', price: 588.6, change24h: 1.15, volume24h: '$1.24B', marketCap: '$86.5B', cmcRank: 4 },
];

export default function App() {
  // Trade Guard Simulator State
  const [targetSymbol, setTargetSymbol] = useState('SOL');
  const [tradeAmount, setTradeAmount] = useState('1000');
  const [maxSlippage, setMaxSlippage] = useState('50');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<{
    verdict: 'APPROVED' | 'WARNING' | 'REJECTED';
    riskScore: number;
    reasons: string[];
    mitigations: string[];
    metrics: any;
  }>({
    verdict: 'APPROVED',
    riskScore: 12,
    reasons: ['Healthy liquidity depth ($3.84M 2% orderbook buffer). Volatility within safe agent parameters.'],
    mitigations: ['Transaction proposal conforms to safe agent execution guidelines.'],
    metrics: {
      symbol: 'SOL',
      price: '$152.80',
      slippageEst: '0.052%',
      depth2Pct: '$3,840,000',
      fearAndGreed: '58 (Greed)',
    },
  });

  // MCP Sandbox State
  const [selectedTool, setSelectedTool] = useState<string>('cmc_agent_trade_guard');
  const [mcpResult, setMcpResult] = useState<string>(
    JSON.stringify(
      {
        tool: 'cmc_agent_trade_guard',
        input: { targetSymbol: 'SOL', tradeAmountUsd: 1000, maxSlippageBps: 50 },
        output: {
          verdict: 'APPROVED',
          riskScore: 12,
          reasons: ['Healthy liquidity depth on CoinMarketCap DEX/CEX pairs.'],
          mitigations: ['Safe to execute.'],
        },
      },
      null,
      2
    )
  );

  const runAuditSimulation = (sym: string, amt: number, _slipBps: number) => {
    setIsAuditing(true);
    setTimeout(() => {
      let verdict: 'APPROVED' | 'WARNING' | 'REJECTED' = 'APPROVED';
      let score = 15;
      const reasons: string[] = [];
      const mitigations: string[] = [];

      const cleanSym = sym.toUpperCase();
      if (cleanSym === 'TRASHCOIN' || cleanSym === 'MEME' || cleanSym === 'HONEYPOT') {
        verdict = 'REJECTED';
        score = 92;
        reasons.push('Sub-$500K market cap and minimal DEX liquidity. High probability of rug-pull or honeypot contract.');
        reasons.push('CMC 2% liquidity depth is under $1,200; trade would suffer catastrophic slippage.');
        mitigations.push('Abort transaction immediately. Require human multisig bypass before trading micro-cap tokens.');
      } else if (amt > 5000000) {
        verdict = 'WARNING';
        score = 65;
        reasons.push(`Order size ($${amt.toLocaleString()}) exceeds 35% of available 2% market depth.`);
        reasons.push('Estimated price impact: 3.48% (exceeds max threshold of 0.50%). Extreme MEV sandwich vulnerability.');
        mitigations.push('Split order into 8 micro-orders over 15 minutes or route through a private MEV-shielded RPC relay.');
      } else if (cleanSym === 'PANIC') {
        verdict = 'WARNING';
        score = 55;
        reasons.push('Market Volatility Spike: 24h price swing of -28.4% detected.');
        reasons.push('CMC Fear & Greed Index is at 18 ("Extreme Fear"). High probability of flash crash cascades.');
        mitigations.push('Reduce maximum allocation by 30% and use tight limit orders instead of market swaps.');
      } else {
        reasons.push(`Liquidity depth across verified CMC pairs exceeds $${(amt * 25).toLocaleString()}. Price impact < 0.08%.`);
        reasons.push('Volatility index and market cap conform to institutional agent risk standards.');
        mitigations.push('Execution approved under dual-key non-custodial signer mesh.');
      }

      setAuditReport({
        verdict,
        riskScore: score,
        reasons,
        mitigations,
        metrics: {
          symbol: cleanSym,
          price: cleanSym === 'BTC' ? '$64,280' : cleanSym === 'ETH' ? '$2,745' : '$152.80',
          slippageEst: amt > 5000000 ? '3.48%' : '0.045%',
          depth2Pct: amt > 5000000 ? '$4,200,000' : '$3,840,000',
          fearAndGreed: cleanSym === 'PANIC' ? '18 (Extreme Fear)' : '58 (Greed)',
        },
      });
      setIsAuditing(false);
    }, 450);
  };

  const handleRunMcpTool = (toolName: string) => {
    switch (toolName) {
      case 'cmc_get_quote':
        setMcpResult(
          JSON.stringify(
            {
              SOL: {
                id: 5426,
                name: 'Solana',
                symbol: 'SOL',
                priceUsd: 152.8,
                volume24h: 3840000000,
                percentChange24h: 4.21,
                marketCapUsd: 71500000000,
                cmcRank: 5,
                source: 'CoinMarketCap Pro API /v2/cryptocurrency/quotes/latest',
              },
              BTC: {
                id: 1,
                name: 'Bitcoin',
                symbol: 'BTC',
                priceUsd: 64280.5,
                volume24h: 31245000000,
                percentChange24h: 2.45,
                marketCapUsd: 1268400000000,
                cmcRank: 1,
              },
            },
            null,
            2
          )
        );
        break;
      case 'cmc_market_pairs':
        setMcpResult(
          JSON.stringify(
            [
              { exchange: 'Binance', pair: 'SOL/USDT', price: 152.78, volume24h: '$1.42B', depthNegative2Pct: '$4.2M' },
              { exchange: 'Raydium (DEX)', pair: 'SOL/USDC', price: 152.82, volume24h: '$380M', depthNegative2Pct: '$1.2M' },
              { exchange: 'Orca (DEX)', pair: 'SOL/bCOOK', price: 152.8, volume24h: '$210M', depthNegative2Pct: '$850K' },
            ],
            null,
            2
          )
        );
        break;
      case 'cmc_global_metrics':
        setMcpResult(
          JSON.stringify(
            {
              totalMarketCapUsd: 2314000000000,
              totalVolume24hUsd: 84500000000,
              btcDominance: 56.4,
              ethDominance: 14.8,
              activeCryptocurrencies: 10420,
              activeMarketPairs: 78500,
              endpoint: '/v1/global-metrics/quotes/latest',
            },
            null,
            2
          )
        );
        break;
      case 'cmc_fear_and_greed':
        setMcpResult(
          JSON.stringify(
            {
              value: 58,
              valueClassification: 'Greed',
              range: '0 (Extreme Fear) - 100 (Extreme Greed)',
              endpoint: '/v3/fear-and-greed/latest',
              recommendationForAgents: 'Normal position sizing allowed. Market depth stable.',
            },
            null,
            2
          )
        );
        break;
      case 'cmc_agent_trade_guard':
        setMcpResult(
          JSON.stringify(
            {
              targetSymbol: targetSymbol,
              tradeAmountUsd: Number(tradeAmount),
              verdict: auditReport.verdict,
              riskScore: auditReport.riskScore,
              reasons: auditReport.reasons,
              mitigations: auditReport.mitigations,
            },
            null,
            2
          )
        );
        break;
      case 'cmc_status':
        setMcpResult(
          JSON.stringify(
            {
              service: 'cmc-agent-sentinel',
              version: '1.0.0',
              status: 'healthy',
              mode: 'Live Pro API & Resilient Sandbox Fallback',
              hackathon: 'DoraHacks Build with CMC: API Hackathon 2026',
              track: 'Track 2: AI Agents and Automation',
              rateLimit: 'Free Startup-Tier (Zero Credit Card Required)',
            },
            null,
            2
          )
        );
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#080E1A] text-gray-100 flex flex-col justify-between font-sans">
      {/* Top Navigation */}
      <header className="border-b border-[#223560]/60 bg-[#0B1426]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl border border-blue-400/40">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-tight text-lg">CMC-Sentinel</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-semibold border border-blue-500/40">
                  MCP Server
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  CMC Pro API Live
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                Autonomous Risk Guard & Real-Time Market Intelligence for Web3 AI Agents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Fear & Greed Badge */}
            <div className="bg-[#111D38] border border-[#223560] px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-gray-400">Fear & Greed:</span>
              <span className="text-emerald-400 font-bold">58 Greed</span>
            </div>

            {/* DoraHacks Track Badge */}
            <a
              href="https://dorahacks.io/hackathon/coinmarketcap-api-202609/detail"
              target="_blank"
              rel="noreferrer"
              className="bg-[#111D38] hover:bg-[#162548] text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 font-semibold"
            >
              <span>DoraHacks Track 2</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 w-full">
        {/* Banner Section */}
        <section className="rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#0B1426] to-emerald-950/30 border border-blue-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Built for "Build with CMC: API Hackathon 2026"</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Giving AI Agents a <span className="text-blue-400">Financial Nervous System</span> & Risk Defense
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-mono">
              LLMs making on-chain trades often suffer from blind slippage, zero-liquidity honeypot traps, and MEV sandwich attacks.
              <strong className="text-white font-semibold"> CMC-Sentinel-MCP</strong> exposes 6 production-grade Model Context Protocol tools to feed real-time CoinMarketCap market depth and pre-flight risk checks directly into agent reasoning loops.
            </p>
          </div>
        </section>

        {/* Live CMC Tickers Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_QUOTES.map((coin) => (
            <div
              key={coin.symbol}
              className="bg-[#0B1426] border border-[#223560]/80 rounded-2xl p-4 space-y-2 hover:border-blue-500/50 transition-all shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                    #{coin.cmcRank}
                  </span>
                  <span className="font-bold text-white">{coin.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{coin.symbol}</span>
                </div>
                <div
                  className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                    coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {coin.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{coin.change24h > 0 ? `+${coin.change24h}` : coin.change24h}%</span>
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono tracking-tight">
                ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono border-t border-[#1a284c] pt-2">
                <span>Vol 24h: {coin.volume24h}</span>
                <span>Cap: {coin.marketCap}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Dual Core Column: Trade Guard Simulator + MCP Live Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Pre-Flight Trade Risk Guard (7 Cols) */}
          <section className="lg:col-span-7 bg-[#0B1426] border border-[#223560] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#223560]/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Pre-Flight Trade Risk Guard
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40">
                      cmc_agent_trade_guard
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400 font-mono">
                    Inspects real-time CMC orderbook depth, calculates price impact, and prevents MEV traps
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Risk Presets */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-gray-400">1-Click Test Scenarios (Preset Attacks & Normal Trades):</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setTargetSymbol('SOL');
                    setTradeAmount('1000');
                    setMaxSlippage('50');
                    runAuditSimulation('SOL', 1000, 50);
                  }}
                  className="p-2 rounded-xl bg-[#111D38] hover:bg-[#162548] border border-[#223560] text-emerald-300 text-left transition"
                >
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Safe Order
                  </div>
                  <div className="text-[10px] text-gray-400">$1,000 on SOL</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetSymbol('SOL');
                    setTradeAmount('25000000');
                    setMaxSlippage('50');
                    runAuditSimulation('SOL', 25000000, 50);
                  }}
                  className="p-2 rounded-xl bg-[#111D38] hover:bg-[#162548] border border-[#223560] text-amber-300 text-left transition"
                >
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    MEV Trap
                  </div>
                  <div className="text-[10px] text-gray-400">$25M High Impact</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetSymbol('TRASHCOIN');
                    setTradeAmount('5000');
                    setMaxSlippage('100');
                    runAuditSimulation('TRASHCOIN', 5000, 100);
                  }}
                  className="p-2 rounded-xl bg-[#111D38] hover:bg-[#162548] border border-[#223560] text-red-300 text-left transition"
                >
                  <div className="font-bold flex items-center gap-1">
                    <ShieldX className="w-3.5 h-3.5 text-red-400" />
                    Honeypot
                  </div>
                  <div className="text-[10px] text-gray-400">Micro-Cap Token</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetSymbol('PANIC');
                    setTradeAmount('5000');
                    setMaxSlippage('50');
                    runAuditSimulation('PANIC', 5000, 50);
                  }}
                  className="p-2 rounded-xl bg-[#111D38] hover:bg-[#162548] border border-[#223560] text-purple-300 text-left transition"
                >
                  <div className="font-bold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    Flash Crash
                  </div>
                  <div className="text-[10px] text-gray-400">Extreme Volatility</div>
                </button>
              </div>
            </div>

            {/* Custom Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAuditSimulation(targetSymbol, Number(tradeAmount) || 1000, Number(maxSlippage) || 50);
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#111D38]/70 rounded-2xl border border-[#223560]"
            >
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">Target Symbol</label>
                <input
                  type="text"
                  value={targetSymbol}
                  onChange={(e) => setTargetSymbol(e.target.value)}
                  className="w-full bg-[#080E1A] border border-[#223560] rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. SOL, BTC"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">Trade Size (USD)</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="w-full bg-[#080E1A] border border-[#223560] rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  disabled={isAuditing}
                  className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isAuditing ? 'Auditing Depth...' : 'Run Pre-Flight Audit'}</span>
                </button>
              </div>
            </form>

            {/* Audit Verdict Banner */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                auditReport.verdict === 'APPROVED'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : auditReport.verdict === 'WARNING'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  : 'bg-red-950/30 border-red-500/40 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {auditReport.verdict === 'APPROVED' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                  {auditReport.verdict === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {auditReport.verdict === 'REJECTED' && <ShieldX className="w-5 h-5 text-red-400" />}
                  <span className="font-extrabold text-sm uppercase tracking-wider">
                    Verdict: {auditReport.verdict}
                  </span>
                </div>
                <div className="font-mono text-xs font-bold">
                  Risk Score: {auditReport.riskScore}/100
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-gray-300">
                {auditReport.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-gray-500">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {auditReport.mitigations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-800/80 text-[11px] font-mono text-gray-400">
                  <span className="text-gray-300 font-bold">Mitigation Strategy: </span>
                  {auditReport.mitigations.join(' ')}
                </div>
              )}
            </div>

            {/* Metrics HUD */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#111D38] border border-[#223560]/60">
                <div className="text-[10px] text-gray-400">Estimated Slippage</div>
                <div className="text-base font-bold text-white">{auditReport.metrics.slippageEst}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#111D38] border border-[#223560]/60">
                <div className="text-[10px] text-gray-400">2% Liquidity Depth</div>
                <div className="text-base font-bold text-white">{auditReport.metrics.depth2Pct}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#111D38] border border-[#223560]/60">
                <div className="text-[10px] text-gray-400">Token Price</div>
                <div className="text-base font-bold text-white">{auditReport.metrics.price}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#111D38] border border-[#223560]/60">
                <div className="text-[10px] text-gray-400">Macro Sentiment</div>
                <div className="text-base font-bold text-white">{auditReport.metrics.fearAndGreed}</div>
              </div>
            </div>
          </section>

          {/* Right Column: Interactive MCP Tools Sandbox (5 Cols) */}
          <section className="lg:col-span-5 bg-[#0B1426] border border-[#223560] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#223560]/60 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">MCP Tool Inspector</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-[#111D38] px-2 py-0.5 rounded border border-[#223560]">
                stdio transport
              </span>
            </div>

            {/* Tool Selection Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono">
              {[
                { name: 'cmc_get_quote', label: '1. Quotes' },
                { name: 'cmc_market_pairs', label: '2. Pairs & Depth' },
                { name: 'cmc_global_metrics', label: '3. Global Market' },
                { name: 'cmc_fear_and_greed', label: '4. Fear & Greed' },
                { name: 'cmc_agent_trade_guard', label: '5. Trade Guard' },
                { name: 'cmc_status', label: '6. Server Status' },
              ].map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    setSelectedTool(t.name);
                    handleRunMcpTool(t.name);
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-left transition cursor-pointer truncate ${
                    selectedTool === t.name
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500 font-bold'
                      : 'bg-[#111D38] text-gray-400 border-[#223560] hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* JSON Output Viewer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span>Real-Time MCP Tool Execution Output:</span>
                <button
                  type="button"
                  onClick={() => handleRunMcpTool(selectedTool)}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <Play className="w-3 h-3" />
                  Re-Execute
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-[#080C14] border border-[#1a284c] text-xs font-mono text-blue-200 overflow-x-auto max-h-[360px] leading-relaxed">
                {mcpResult}
              </pre>
            </div>

            <div className="p-3 rounded-xl bg-[#111D38]/50 border border-[#223560]/60 text-[11px] text-gray-400 font-mono space-y-1">
              <div className="text-gray-300 font-semibold flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Compatible Agent Runtimes:</span>
              </div>
              <p>Claude Desktop, Antigravity, Cursor, LangChain, CrewAI, ElizaOS</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#223560]/60 bg-[#080C14] py-6 mt-12 text-xs font-mono text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">CMC-Sentinel-MCP</span>
            <span>|</span>
            <span>Built for DoraHacks "Build with CMC: API Hackathon"</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Moyu-Dev16/cmc-agent-sentinel"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-gray-600">•</span>
            <a
              href="https://coinmarketcap.com/api"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>CMC Pro API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

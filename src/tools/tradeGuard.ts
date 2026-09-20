import { CoinMarketCapClient, cmcClient } from '../cmcClient.js';

export interface TradeGuardInput {
  targetSymbol: string;
  tradeAmountUsd: number;
  maxSlippageBps?: number;
  chain?: string;
  sourceSymbol?: string;
}

export interface TradeGuardReport {
  verdict: 'APPROVED' | 'WARNING' | 'REJECTED';
  riskScore: number; // 0 (safest) to 100 (extreme danger)
  reasons: string[];
  mitigations: string[];
  metrics: {
    symbol: string;
    currentPriceUsd: number;
    volume24hUsd: number;
    marketCapUsd: number;
    estimatedSlippagePercent: number;
    fearAndGreedValue: number;
    fearAndGreedClassification: string;
    depthTwoPercentUsd: number;
  };
  auditTimestamp: string;
}

export async function evaluateTradeRisk(
  input: TradeGuardInput,
  client: CoinMarketCapClient = cmcClient
): Promise<TradeGuardReport> {
  const symbol = input.targetSymbol.toUpperCase().trim();
  const tradeSize = input.tradeAmountUsd;
  const maxSlippageBps = input.maxSlippageBps || 50; // Default 0.5% (50 bps)

  // 1. Fetch CMC market quotes, pairs, and sentiment
  const [quotes, pairs, sentiment] = await Promise.all([
    client.getQuotes([symbol]),
    client.getMarketPairs(symbol),
    client.getFearAndGreed(),
  ]);

  const quote = quotes[symbol];
  if (!quote) {
    return {
      verdict: 'REJECTED',
      riskScore: 95,
      reasons: [`Token symbol ${symbol} not recognized in CoinMarketCap verified registry.`],
      mitigations: ['Abort transaction immediately. Do not trade unverified or unregistered contract addresses.'],
      metrics: {
        symbol,
        currentPriceUsd: 0,
        volume24hUsd: 0,
        marketCapUsd: 0,
        estimatedSlippagePercent: 100,
        fearAndGreedValue: sentiment.value,
        fearAndGreedClassification: sentiment.valueClassification,
        depthTwoPercentUsd: 0,
      },
      auditTimestamp: new Date().toISOString(),
    };
  }

  // 2. Aggregate 2% liquidity depth across top DEX/CEX pairs
  const totalDepth2Pct = pairs.reduce((acc, p) => acc + (p.depthNegativeTwoPercent || 0), 0);
  const effectiveDepth = totalDepth2Pct > 0 ? totalDepth2Pct : Math.max(10000, quote.volume24h * 0.02);

  // 3. Estimate Price Impact / Slippage
  // Approximate slippage: (tradeSize / effectiveDepth) * 2%
  const slippageEstimatePct = Number(((tradeSize / effectiveDepth) * 2.0).toFixed(3));

  const reasons: string[] = [];
  const mitigations: string[] = [];
  let riskScore = 10; // Baseline low risk

  // Check 1: Liquidity exhaustion & MEV vulnerability
  if (slippageEstimatePct > (maxSlippageBps / 100)) {
    riskScore += 40;
    reasons.push(
      `Estimated slippage (${slippageEstimatePct}%) exceeds agent's maximum threshold of ${(maxSlippageBps / 100)}%. High MEV sandwich risk.`
    );
    mitigations.push(
      `Split order into smaller tranches of <= $${Math.floor(effectiveDepth * (maxSlippageBps / 100) * 0.5)} or route through a private MEV-shielded RPC relay.`
    );
  }

  // Check 2: Low-Cap / Illiquid honeypot risk
  if (quote.marketCapUsd < 1000000 && quote.volume24h < 100000) {
    riskScore += 45;
    reasons.push(
      `Extremely low market capitalization ($${quote.marketCapUsd.toLocaleString()}) and 24h volume ($${quote.volume24h.toLocaleString()}). Suspected illiquid pool or honeypot.`
    );
    mitigations.push('Require human multisig or developer confirmation before interacting with sub-$1M pools.');
  }

  // Check 3: Flash volatility alert
  if (Math.abs(quote.percentChange24h) > 25) {
    riskScore += 20;
    reasons.push(`Extreme 24h volatility detected (${quote.percentChange24h > 0 ? '+' : ''}${quote.percentChange24h}%).`);
    mitigations.push('Enable tight limit orders instead of market swaps during periods of abnormal price volatility.');
  }

  // Check 4: Macro market panic
  if (sentiment.value < 25) {
    riskScore += 10;
    reasons.push(`Macro Market Sentiment is in "${sentiment.valueClassification}" (${sentiment.value}/100). Higher probability of liquidity evaporation.`);
    mitigations.push('Reduce maximum position sizes by 30% under Extreme Fear market conditions.');
  }

  // Final Verdict assignment
  let verdict: 'APPROVED' | 'WARNING' | 'REJECTED' = 'APPROVED';
  if (riskScore >= 70) {
    verdict = 'REJECTED';
  } else if (riskScore >= 40) {
    verdict = 'WARNING';
  }

  if (reasons.length === 0) {
    reasons.push(`Healthy liquidity buffer ($${Math.round(effectiveDepth).toLocaleString()} 2% depth). Price volatility within safe operating margins.`);
    mitigations.push('Transaction proposal conforms to safe agent execution guidelines.');
  }

  return {
    verdict,
    riskScore: Math.min(100, riskScore),
    reasons,
    mitigations,
    metrics: {
      symbol,
      currentPriceUsd: quote.priceUsd,
      volume24hUsd: quote.volume24h,
      marketCapUsd: quote.marketCapUsd,
      estimatedSlippagePercent: slippageEstimatePct,
      fearAndGreedValue: sentiment.value,
      fearAndGreedClassification: sentiment.valueClassification,
      depthTwoPercentUsd: Math.round(effectiveDepth),
    },
    auditTimestamp: new Date().toISOString(),
  };
}

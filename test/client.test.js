import test from 'node:test';
import assert from 'node:assert';
import { CoinMarketCapClient } from '../dist/cmcClient.js';
import { evaluateTradeRisk } from '../dist/tools/tradeGuard.js';

test('CoinMarketCapClient fetches quotes for top assets', async () => {
  const client = new CoinMarketCapClient();
  const quotes = await client.getQuotes(['BTC', 'SOL']);

  assert.ok(quotes.BTC, 'BTC quote should exist');
  assert.ok(quotes.SOL, 'SOL quote should exist');
  assert.strictEqual(quotes.BTC.symbol, 'BTC');
  assert.ok(quotes.BTC.priceUsd > 10000, 'BTC price should be realistic');
  assert.ok(quotes.SOL.priceUsd > 10, 'SOL price should be realistic');
});

test('CoinMarketCapClient retrieves market pairs and depth', async () => {
  const client = new CoinMarketCapClient();
  const pairs = await client.getMarketPairs('SOL');

  assert.ok(Array.isArray(pairs), 'Pairs should be an array');
  assert.ok(pairs.length > 0, 'Should have at least 1 pair');
  assert.ok(pairs[0].volume24hUsd > 0, 'Pair volume should be positive');
});

test('CoinMarketCapClient retrieves global metrics and fear & greed', async () => {
  const client = new CoinMarketCapClient();
  const globalMetrics = await client.getGlobalMetrics();
  const sentiment = await client.getFearAndGreed();

  assert.ok(globalMetrics.totalMarketCapUsd > 1000000000, 'Global market cap should be > $1B');
  assert.ok(globalMetrics.btcDominance > 0, 'BTC dominance should be > 0');
  assert.ok(sentiment.value >= 0 && sentiment.value <= 100, 'Fear & greed should be 0-100');
});

test('TradeGuard approves safe normal trade on liquid token', async () => {
  const report = await evaluateTradeRisk({
    targetSymbol: 'SOL',
    tradeAmountUsd: 500, // Safe $500 swap
    maxSlippageBps: 50,  // 0.5% max slippage
  });

  assert.strictEqual(report.verdict, 'APPROVED');
  assert.ok(report.riskScore < 40, 'Risk score should be low');
  assert.strictEqual(report.metrics.symbol, 'SOL');
});

test('TradeGuard intercepts excessive slippage / low depth trade', async () => {
  const report = await evaluateTradeRisk({
    targetSymbol: 'SOL',
    tradeAmountUsd: 50000000, // $50M swap on 2% depth of ~$2M
    maxSlippageBps: 20,       // 0.2% max slippage
  });

  assert.ok(report.verdict === 'REJECTED' || report.verdict === 'WARNING');
  assert.ok(report.riskScore >= 40, 'Risk score should reflect high slippage');
  assert.ok(report.reasons.some((r) => r.includes('slippage')), 'Reason should mention slippage');
});

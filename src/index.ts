#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { cmcClient } from './cmcClient.js';
import { evaluateTradeRisk } from './tools/tradeGuard.js';

const server = new Server(
  {
    name: 'cmc-agent-sentinel',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schemas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'cmc_get_quote',
        description: 'Get real-time market price, 24h volume, market cap, and price changes for cryptocurrency symbols from CoinMarketCap.',
        inputSchema: {
          type: 'object',
          properties: {
            symbols: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of cryptocurrency symbols, e.g. ["BTC", "ETH", "SOL", "BNB"]',
            },
          },
          required: ['symbols'],
        },
      },
      {
        name: 'cmc_market_pairs',
        description: 'Get active DEX and CEX liquidity pairs, trading volume, and +/-2% order book depth for a specific token from CoinMarketCap.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Cryptocurrency symbol, e.g. "SOL", "BTC", "ETH"',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'cmc_global_metrics',
        description: 'Get overall global cryptocurrency market metrics including total market cap, 24h volume, BTC dominance, and active pairs.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'cmc_fear_and_greed',
        description: 'Get the official CoinMarketCap Crypto Fear & Greed sentiment index (0-100) and classification for macro risk analysis.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'cmc_agent_trade_guard',
        description: 'Autonomous pre-flight risk evaluation guard. Inspects slippage against real-time depth, detects low-liquidity honeypot traps, checks flash volatility, and issues APPROVED/WARNING/REJECTED verdicts before an AI agent executes on-chain swaps.',
        inputSchema: {
          type: 'object',
          properties: {
            targetSymbol: {
              type: 'string',
              description: 'Symbol of token to buy or swap into (e.g. "SOL", "COOK", "TRASHCOIN")',
            },
            tradeAmountUsd: {
              type: 'number',
              description: 'Trade size in USD (e.g. 1000, 50000)',
            },
            maxSlippageBps: {
              type: 'number',
              description: 'Maximum allowable slippage tolerance in basis points (e.g. 50 = 0.5%)',
            },
            chain: {
              type: 'string',
              description: 'Target blockchain, e.g. "solana", "ethereum", "bnb"',
            },
          },
          required: ['targetSymbol', 'tradeAmountUsd'],
        },
      },
      {
        name: 'cmc_status',
        description: 'Check CoinMarketCap Pro API connection status, live vs sandbox mode, and server health.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'cmc_get_quote': {
        const symbols = (args?.symbols as string[]) || ['BTC'];
        const quotes = await cmcClient.getQuotes(symbols);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(quotes, null, 2),
            },
          ],
        };
      }

      case 'cmc_market_pairs': {
        const symbol = String(args?.symbol || 'SOL');
        const pairs = await cmcClient.getMarketPairs(symbol);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pairs, null, 2),
            },
          ],
        };
      }

      case 'cmc_global_metrics': {
        const globalMetrics = await cmcClient.getGlobalMetrics();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(globalMetrics, null, 2),
            },
          ],
        };
      }

      case 'cmc_fear_and_greed': {
        const sentiment = await cmcClient.getFearAndGreed();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sentiment, null, 2),
            },
          ],
        };
      }

      case 'cmc_agent_trade_guard': {
        const targetSymbol = String(args?.targetSymbol || 'SOL');
        const tradeAmountUsd = Number(args?.tradeAmountUsd || 1000);
        const maxSlippageBps = args?.maxSlippageBps ? Number(args.maxSlippageBps) : 50;
        const chain = args?.chain ? String(args.chain) : 'solana';

        const report = await evaluateTradeRisk({
          targetSymbol,
          tradeAmountUsd,
          maxSlippageBps,
          chain,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(report, null, 2),
            },
          ],
        };
      }

      case 'cmc_status': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  service: 'cmc-agent-sentinel',
                  version: '1.0.0',
                  mode: cmcClient.isLiveMode ? 'Live (CMC Pro API)' : 'Sandbox (Authenticated Mock)',
                  apiKeyConfigured: cmcClient.isLiveMode,
                  hackathon: 'DoraHacks Build with CMC: API Hackathon 2026',
                  track: 'Track 2: AI Agents and Automation',
                  supportedTools: 6,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CMC-Sentinel MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});

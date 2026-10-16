/**
 * 主循环 —— 接 OpenAI 兼容网关，处理工具调用。
 */
import OpenAI from 'openai';
import { readFileSync } from 'node:fs';

const POLICY = readFileSync(new URL('../policy.yml', import.meta.url), 'utf-8');

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_orders',
      description: '按手机号查订单',
      parameters: { type: 'object', properties: { phone: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'refund_order',
      description: '给订单退款',
      parameters: { type: 'object', properties: { orderId: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_ticket',
      description: '关闭工单',
      parameters: { type: 'object', properties: { ticketId: { type: 'string' } } },
    },
  },
];

const client = new OpenAI({
  apiKey: process.env.INTERNAL_GATEWAY_KEY,
  baseURL: process.env.INTERNAL_GATEWAY_URL || 'http://llm-gateway.internal/v1',
});

export async function handleTicket(ticket) {
  const messages = [
    { role: 'system', content: `你是客服助手。当前策略：\n${POLICY}\n按工具清单行事。` },
    { role: 'user', content: ticket.body },
  ];

  const res = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages,
    tools: TOOLS,
    tool_choice: 'auto',
  });

  const msg = res.choices[0].message;
  for (const tc of msg.tool_calls || []) {
    const args = JSON.parse(tc.function.arguments || '{}');
    yield { tool: tc.function.name, args };
  }
}

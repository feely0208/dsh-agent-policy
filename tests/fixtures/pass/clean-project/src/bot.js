/**
 * ticket-bot 主循环。
 * 声明与实现一致：不访问公网（见 policy.yml outbound.allow=false），
 * 出站只走内网网关，工具清单与策略文件里的 allowed_tools 一致。
 */
import { DeepSeekClient } from '@deepseek-ai/sdk';
import { searchOrders, closeTicket, escalateToHuman } from './tools.js';
import { loadPolicy } from './config.js';

const policy = loadPolicy();

const client = new DeepSeekClient({
  apiKey: process.env.INTERNAL_GATEWAY_KEY,
  baseURL: policy.runtime.gateway,
});

export const TOOL_SCHEMA = [
  {
    name: 'search_orders',
    description: '按手机号查订单',
    parameters: { type: 'object', properties: { phone: { type: 'string' } } },
  },
  {
    name: 'close_ticket',
    description: '关闭工单',
    parameters: { type: 'object', properties: { ticketId: { type: 'string' } } },
  },
  {
    name: 'escalate_to_human',
    description: '转人工坐席',
    parameters: { type: 'object', properties: { ticketId: { type: 'string' } } },
  },
];

const HANDLERS = {
  search_orders: searchOrders,
  close_ticket: closeTicket,
  escalate_to_human: escalateToHuman,
};

/** 工具名必须在策略白名单里，否则拒绝执行 —— 代码里显式核对 */function assertAllowed(name) {
  if (!policy.permissions.allowed_tools.includes(name)) {
    throw new Error(`工具 ${name} 不在策略白名单内，已拒绝`);
  }
}

export async function handleTicket(ticket) {
  const messages = [
    { role: 'system', content: '你是客服助手，只能用白名单内的工具。' },
    { role: 'user', content: ticket.body },
  ];

  const res = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages,
    tools: TOOL_SCHEMA.map((t) => ({ type: 'function', function: t })),
    tool_choice: 'auto',
  });

  const calls = res.choices[0].message.tool_calls || [];
  const results = [];
  for (const call of calls) {
    assertAllowed(call.function.name);
    const args = JSON.parse(call.function.arguments || '{}');
    results.push(await HANDLERS[call.function.name](args));
  }
  return results;
}

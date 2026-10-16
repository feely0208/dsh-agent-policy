/**
 * 最小可运行的 agent：接 OpenAI 兼容网关，执行 tool_calls。
 * 注意：仓库里没有任何策略声明文件 —— 能干什么只存在于这份代码里。
 */
import OpenAI from 'openai';
import { readFile, writeFile } from 'node:fs/promises';

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: process.env.GATEWAY_URL,
});

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: '读一个文件',
      parameters: { type: 'object', properties: { path: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: '写一个文件',
      parameters: { type: 'object', properties: { path: { type: 'string' }, body: { type: 'string' } } },
    },
  },
];

async function runTool(name, args) {
  if (name === 'read_file') return readFile(args.path, 'utf-8');
  if (name === 'write_file') return writeFile(args.path, args.body);
  throw new Error(`未知工具 ${name}`);
}

export async function ask(prompt) {
  const res = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    tools: TOOLS,
  });
  const calls = res.choices[0].message.tool_calls || [];
  return Promise.all(calls.map((c) => runTool(c.function.name, JSON.parse(c.function.arguments || '{}'))));
}

/**
 * 读策略文件。运行时使用的白名单直接来自 policy.yml —— 单一出处，
 * 代码不另外硬编码一份，避免两边漂移。
 */
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const POLICY_PATH = new URL('../policy.yml', import.meta.url);

export function loadPolicy() {
  const raw = readFileSync(POLICY_PATH, 'utf-8');
  const doc = parse(raw);
  return {
    permissions: doc.permissions,
    approval: doc.approval,
    runtime: {
      gateway: 'http://llm-gateway.internal/v1',
      tools: doc.permissions.allowed_tools,
    },
  };
}

/**
 * 工具实现。全部走内网，没有公网调用。
 * 关闭工单和转人工都在权限清单内（policy.yml permissions.allowed_tools）。
 */
const DB = 'http://ticket-db.internal/api';

export async function searchOrders({ phone }) {
  const res = await fetch(`${DB}/orders?phone=${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error(`查询失败 ${res.status}`);
  return res.json();
}

export async function closeTicket({ ticketId }) {
  const res = await fetch(`${DB}/tickets/${ticketId}/close`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ closedAt: new Date().toISOString() }),
  });
  return res.json();
}

export async function escalateToHuman({ ticketId }) {
  const res = await fetch(`${DB}/tickets/${ticketId}/escalate`, { method: 'POST' });
  return res.json();
}

/** 需要退款或删单的工单：agent 不执行，交给后台人工审批流程 */
export async function requestManualReview({ ticketId, action }) {
  const res = await fetch(`${DB}/reviews`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ticketId, action, requestedBy: 'ticket-bot' }),
  });
  return res.json();
}

/**
 * 工单相关操作。
 * 策略声明：本 agent 不出网，只访问内网工单库（见 policy.yml outbound.allow=false）。
 */
import { createHmac } from 'node:crypto';

const TICKET_DB = process.env.TICKET_DB_URL || 'http://ticket-db.internal/api';

export async function searchOrders(phone) {
  const res = await fetch(`${TICKET_DB}/orders?phone=${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error(`工单库查询失败 ${res.status}`);
  return res.json();
}

export async function closeTicket(ticketId, reason) {
  const res = await fetch(`${TICKET_DB}/tickets/${ticketId}/close`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

/** 退款金额超过阈值时必须人工确认 —— 这条在实现里是真的接了闸门的 */
export async function refundOrder(orderId, amount) {
  if (amount > 500) {
    const ok = await confirmRequired({ action: 'refund', orderId, amount });
    if (!ok) throw new Error('人工未批准，已中止退款');
  }
  const res = await fetch(`${TICKET_DB}/orders/${orderId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return res.json();
}

async function confirmRequired(payload) {
  const res = await fetch(`${TICKET_DB}/approvals`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.approved === true;
}

export function signPayload(body, secret) {
  return createHmac('sha256', secret).update(body).digest('hex');
}

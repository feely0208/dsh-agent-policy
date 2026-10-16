# support-agent

内部客服工单 agent。接入 OpenAI 兼容网关（`deepseek-chat`），按工单内容调用工具。

## 目录

- `policy.yml` —— 运行策略声明（出网、工具清单、审批要求）
- `src/bot.js` —— 主循环：组装 messages、发模型请求、处理 tool_calls
- `src/userService.js` —— 工单库读写、退款
- `src/sync.js` —— 定时把未结工单摘要推到客服群
- `src/batch.js` —— 每月批量注销长期未登录账号

## 运行

```bash
INTERNAL_GATEWAY_KEY=... npm start
DRY_RUN=1 npm run batch
```

## 维护须知

- 策略文件（`policy.yml`）是评审依据，改代码前请先确认策略是否还成立。
- 退款金额超过 500 元的路径已接入审批接口。
- 批量注销走 `npm run batch`，由运维在月初手动触发。

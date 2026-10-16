# ticket-bot

内部客服工单助手。模型走内网网关，工具走白名单。

## 策略与实现如何对齐

| 策略声明（`policy.yml`） | 代码位置 |
| --- | --- |
| `outbound.allow: false`，出站仅内网 | `src/tools.js`、`src/config.js` 里的地址全部是 `*.internal` |
| `permissions.allowed_tools` 三项 | `src/bot.js` 的 `TOOL_SCHEMA` 同样三项，且执行前 `assertAllowed()` 逐次核对 |
| 退款 / 删单需人工 | agent 不实现，`requestManualReview()` 只创建待审记录 |
| `sync.mode: manual` | 没有定时任务，纯调用触发 |

## 运行

```bash
npm start
```

## 维护须知

- 白名单只有 `policy.yml` 一处出处，`src/config.js` 读它，不要在代码里再抄一份。
- 新增工具时先改 `policy.yml`，再改 `TOOL_SCHEMA`，两边同时提交。
- 内网地址改动请同步更新 `egress.allowed_domains`。

# @deepwhale-cn/dsh-agent-policy

**说好不干的事干了没，干了的有没有说。**

**关键词**：策略声明 · agent 权限 · 一致性核对 · 不出网 · 通配符放权 · 人工确认 · 过度代理 · 最小权限

---

## 先说清楚它是什么、不是什么

**是**：把项目的**策略声明**和**实际代码**摆在一起比 —— 策略文件（`policy.yml` / `agent.yml` / 权限配置）写了什么，代码里是不是真的那么干。

**不是**：
- ❌ **不是运行时拦截** —— 不拦请求、不挡工具调用，只做静态比对
- ❌ **不是权限扫描器** —— 单看「权限是不是太宽」是 `dsh-agent-scope` 的活；这里只问「和声明对得上吗」
- ❌ **不是合规认证** —— 不判断你能不能过审
- ❌ **不下「安全 / 不安全」的结论** —— 只列事实：声明说 A，代码里是 B

**一句话分界**：
```
agent-scope   = 单看【权限本身】宽不宽（通配符、根目录、无限制出网）
agent-policy  = 看【声明】与【实现】是否一致 —— 说好不干的事干了没
```

同一个 `allow: "*"`，两边都可能提；但 agent-scope 说的是「这权限太宽」，agent-policy 说的是「你声明了允许一切，而你大概以为自己在声明白名单」。

---

## 它查什么（5 条）

| 规则 | 查什么 | 级别 |
|---|---|---|
| `POLICY-EGRESS-PROMISE` | 策略里写了「不出网」，同一项目里却有网络调用 | 🔴 |
| `POLICY-CONFIRM-MISSING` | 代码里写着「需人工确认」，同一文件里却直接执行高风险动作 | 🔴 |
| `POLICY-WILDCARD-ALLOW` | 策略里把权限写成通配符（`allow: "*"` / `tools: ["*"]` / `permissions: all`）| 🔴 |
| `POLICY-DECL-EMPTY` | 策略声明里的工具清单是空的（`tools: []` / `tools: null`）| 🟡 |
| `POLICY-NO-DECLARATION` | 有 agent 代码（调模型 / 工具）却找不到任何策略声明文件 | 🟡 |

**每条都会给出：哪个文件、第几行、那行长什么样、依据是哪条标准。**

### 第 5 条为什么带 `when`

`POLICY-NO-DECLARATION` 是「找不到」类判据，如果对所有项目都跑，一个只有 `index.js` 的普通小工具也会被报「没有策略声明」——那是误报。所以它只在项目里出现 agent 特征时才跑：`openai` / `anthropic` / `@deepseek-ai` / `tool_call` / `tool_use` / `AgentExecutor` 等。看到 `notApplicable` 里有它，说明这个项目没有 agent 代码，本来就不该跑。

---

## 安装

```bash
dsh plugin --profile web add @deepwhale-cn/dsh-agent-policy
```

## 用法

```bash
# 核对一个项目
dsh-agent-policy --root /path/to/your-agent

# 看内置演示（一个「策略说不出网、代码里却在往外发」的假项目）
dsh-agent-policy --demo

# 列出规则与依据
dsh-agent-policy --list-rules

# 出 HTML 报告 / 给 CI 用
dsh-agent-policy --root . --html
dsh-agent-policy --root . --json
```

退出码：有 high 命中 → `1`（可以挂 CI 卡口）。

---

## 一个例子

`policy.yml` 里写着：

```yaml
outbound:
  allow: false
  note: 本 agent 不出网，只访问内网工单库
```

而 `src/sync.js` 里：

```js
const WEBHOOK = 'https://hooks.slack.com/services/T000/B000/XXXX';
export async function pushSummary(items) {
  const res = await fetch(WEBHOOK, { ... });
}
```

报出来是这样：

```
POLICY-EGRESS-PROMISE  src/sync.js:9
  策略里写明了不准出网，同一个项目里却有网络调用
```

**注意**：这不是说「出网就有罪」。是说到时候出事，大家会拿着这份 `policy.yml` 说「我们规定了不出网」——而实际上它在出。改代码或者改声明，让两边对上，是这份报告唯一的诉求。

---

## 判据出处

- **OWASP Top 10 for LLM Applications 2025 · LLM06 Excessive Agency** —— 智能体的能力应与其声明的边界一致；human-in-the-loop 控制
- **CIS Controls v8 · Control 6（Access Control Management）** —— 授权必须显式列出，最小权限
- **NIST AI RMF 1.0 · GOVERN 1.1 / 1.2、MANAGE 2.2、MAP 1.1** —— AI 系统的策略、责任与边界应明确且与执行一致
- **NIST SP 800-53 Rev.5 · AC-6 Least Privilege**

---

## 双向验证

```bash
bash tests/run.sh
```

- 正例 `tests/fixtures/fail/demo-project/`：一个有策略文件、但代码处处和它拧着的客服 agent
- 反例 `tests/fixtures/pass/clean-project/`：策略和实现逐条对得上的项目
- 空缺样本 `tests/fixtures/absent/minimal/`：有 agent 代码、完全没有策略文件

## 许可

MIT

---

## 深鲸网安守护系列（共 38 个）

> 一个插件做一件事。**安全问题是链式的** —— 配套用才完整。

**国内合规**（12）｜ [等保对照](https://github.com/feely0208/dsh-cn-mlps) · [日志留存](https://github.com/feely0208/dsh-cn-log-retention) · [备案公示](https://github.com/feely0208/dsh-cn-filing) · [用户同意](https://github.com/feely0208/dsh-consent-guard) · [个人信息权利](https://github.com/feely0208/dsh-data-rights) · [未成年人保护](https://github.com/feely0208/dsh-minor-guard) · [影响评估](https://github.com/feely0208/dsh-pipia) · [数据分类分级](https://github.com/feely0208/dsh-data-classify) · [算法备案](https://github.com/feely0208/dsh-algorithm-filing) · [数据出境](https://github.com/feely0208/dsh-cn-data-export) · [国密合规](https://github.com/feely0208/dsh-cn-crypto) · [AI 内容标识](https://github.com/feely0208/dsh-cn-ai-labeling)

**AI 与 Agent 治理**（6）｜ [AI 输出信任](https://github.com/feely0208/dsh-ai-output-trust) · [外部内容信任](https://github.com/feely0208/dsh-content-trust) · [MCP 安全](https://github.com/feely0208/dsh-mcp-audit) · [Agent 权限](https://github.com/feely0208/dsh-agent-scope) · [策略核对](https://github.com/feely0208/dsh-agent-policy) · [可疑指令](https://github.com/feely0208/dsh-phishing-guard)

**数据与凭据**（5）｜ [敏感数据](https://github.com/feely0208/dsh-data-scan) · [密钥轮换](https://github.com/feely0208/dsh-key-rotate) · [数据留存](https://github.com/feely0208/dsh-data-lifecycle) · [配置审计](https://github.com/feely0208/dsh-env-audit) · [密钥扫描](https://github.com/feely0208/dsh-secret-scan)

**供应链与构建**（5）｜ [开源许可](https://github.com/feely0208/dsh-license-guard) · [依赖投毒](https://github.com/feely0208/dsh-dep-audit) · [CI 安全](https://github.com/feely0208/dsh-ci-guard) · [工具审查](https://github.com/feely0208/dsh-tool-vet) · [物料清单](https://github.com/feely0208/dsh-sbom)

**权限与应急**（3）｜ [最小权限](https://github.com/feely0208/dsh-least-privilege) · [告警外发](https://github.com/feely0208/dsh-alert-relay) · [应急证据包](https://github.com/feely0208/dsh-incident-package)

**行业专项**（4）｜ [医疗行业专项](https://github.com/feely0208/dsh-industry-medical) · [教育行业专项](https://github.com/feely0208/dsh-industry-education) · [金融行业专项](https://github.com/feely0208/dsh-industry-finance) · [地方数据条例](https://github.com/feely0208/dsh-local-regulation)

**编排与交付**（3）｜ [一键体检](https://github.com/feely0208/dsh-guard-suite) · [改前改后复核](https://github.com/feely0208/dsh-fix-verify) · [合规可交付文档](https://github.com/feely0208/dsh-compliance-doc)

都在 DSH 插件市场（dsh-plugin.org）、npm 和 deepwhale.org.cn/guard.html 上。

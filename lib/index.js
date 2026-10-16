import { createPlugin, pkgRootFrom } from '@deepwhale-cn/dsh-guard-core/plugin';

export const { name, inject, apply } = createPlugin({
  name: 'agent-policy',
  pkgRoot: pkgRootFrom(import.meta.url),
  skillFile: 'skill/agent-policy.md',
  binFile: 'bin/cli.mjs',
  description: '说好不干的事干了没，干了的有没有说',
  whenToUse: '当你要核对一个 agent / 自动化项目的【策略声明】与【实际代码】是否一致时使用：策略写了不出网、代码里却有 fetch/http.request；策略用 allow: "*" / tools: ["*"] 放开一切；有 agent 代码却根本没有策略声明文件；策略里的工具清单是空的或缺字段；策略说某个动作要人工确认，代码却直接执行。用户会说：「策略和实现对不上」「说好不出网的」「agent 权限声明」「策略文件核对」「允许一切是不是有问题」「这个操作要不要人工确认」。只对含 agent 特征（调模型、tool_calls、tool_use）的项目有意义，普通项目不必跑。',
});

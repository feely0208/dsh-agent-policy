#!/bin/bash
# @deepwhale-cn/dsh-agent-policy · 双向验证
# 正例（tests/fixtures/fail/demo-project）：5 条规则必须全部报出
# 反例（tests/fixtures/pass/clean-project）：0 命中
# 空缺样本（tests/fixtures/absent/minimal）：absence 规则要有「该报」的场景
set -uo pipefail
export PATH="/usr/local/bin:$PATH"
cd "$(dirname "$0")/.."
PASS=0; FAIL=0
ok(){ echo "  ✅ $1"; PASS=$((PASS+1)); }
bad(){ echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo ""
echo "  @deepwhale-cn/dsh-agent-policy · 双向验证"
echo "  ────────────────────────────────────────────────"

echo ""; echo "  【正例】违规样本（每一条在场规则都必须报出）"
# POLICY-NO-DECLARATION 是 absence 规则：有策略文件的项目上它【按设计】不该报
# （在不在场由 _shared/check-dead-rules.py 用 absent/minimal 样本判定，见下）
J=$(node bin/cli.mjs --root tests/fixtures/fail/demo-project --json 2>&1)
for rid in POLICY-EGRESS-PROMISE POLICY-WILDCARD-ALLOW POLICY-DECL-EMPTY POLICY-CONFIRM-MISSING; do
  c=$(echo "$J" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    print(len([f for f in d.get('findings',[]) if f.get('ruleId')=='$rid']))
except Exception: print(0)" 2>/dev/null)
  [ "${c:-0}" -gt 0 ] && ok "$rid 报出（$c 处）" || bad "$rid 未报出"
done

echo ""; echo "  【空缺样本】有 agent 代码、没有策略声明（absence 规则该报）"
A=$(node bin/cli.mjs --root tests/fixtures/absent/minimal --json 2>&1)
ca=$(echo "$A" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    print(len([f for f in d.get('findings',[]) if f.get('ruleId')=='POLICY-NO-DECLARATION']))
except Exception: print(0)" 2>/dev/null)
[ "${ca:-0}" -gt 0 ] && ok "POLICY-NO-DECLARATION 报出（$ca 处）" || bad "POLICY-NO-DECLARATION 未报出"

echo ""; echo "  【反例】合规样本（必须 0 命中）"
M=$(node bin/cli.mjs --root tests/fixtures/pass/clean-project --quiet 2>&1 | grep -oE '^[0-9]+' | head -1)
[ "${M:-1}" = "0" ] && ok "干净样本 0 命中" || bad "误报 ${M} 条"

echo ""; echo "  【溯源】每条规则必须带 source"
python3 - <<'PY' && ok "全部规则均有 source" || bad "有规则缺 source"
import json,glob,sys
bad=[json.load(open(f,encoding='utf-8')).get('id') for f in glob.glob('rules/*.json') if not json.load(open(f,encoding='utf-8')).get('source')]
if bad: print('缺 source:',bad,file=sys.stderr); sys.exit(1)
PY

echo ""; echo "  ────────────────────────────────────────────────"
echo "  通过 $PASS · 失败 $FAIL"; echo ""
[ "$FAIL" -eq 0 ] || exit 1

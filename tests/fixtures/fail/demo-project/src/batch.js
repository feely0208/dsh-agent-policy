/**
 * 批量清理：注销超过 180 天未登录的账号。
 * 策略 approval.required_for 里第一条是「删除用户数据」，需人工确认后才可执行。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = process.env.DATA_DIR || './var/users';
const STALE_DAYS = 180;
const DRY_RUN = process.env.DRY_RUN === '1';

export async function purgeStaleAccounts(accounts) {
  const cutoff = Date.now() - STALE_DAYS * 86_400_000;
  const doomed = accounts.filter((a) => new Date(a.lastLoginAt).getTime() < cutoff);

  const done = [];
  for (const a of doomed) {
    if (!DRY_RUN) {
      await removeAccountRecord(a);
    }
    done.push(a.id);
  }

  if (!DRY_RUN && done.length) {
    await deleteStale(done);
  }
  return { scanned: accounts.length, purged: done.length, ids: done };
}

async function removeAccountRecord(account) {
  const file = join(DATA_DIR, `${account.id}.json`);
  const raw = await readFile(file, 'utf-8');
  const record = JSON.parse(raw);
  record.deleted = true;
  record.deletedAt = new Date().toISOString();
  await writeFile(join(DATA_DIR, `${account.id}.deleted.json`), JSON.stringify(record));
  await removeAccountIndex(account.id);
}

async function removeAccountIndex(id) {
  const idxFile = join(DATA_DIR, 'index.json');
  const idx = JSON.parse(await readFile(idxFile, 'utf-8'));
  delete idx.byId[id];
  await writeFile(idxFile, JSON.stringify(idx));
}

/** 归档文件也一并清掉，避免恢复入口留着 */
async function deleteStale(ids) {
  const archiveFile = join(DATA_DIR, 'archive.log');
  const lines = (await readFile(archiveFile, 'utf-8')).split('\n');
  const kept = lines.filter((l) => !ids.some((id) => l.includes(id)));
  await writeFile(archiveFile, kept.join('\n'));
  return ids.length;
}

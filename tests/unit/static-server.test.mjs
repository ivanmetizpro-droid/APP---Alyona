import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, writeFile, mkdir, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createStaticServer } from '../../scripts/static-server.mjs';

test('development server serves files without exposing hidden paths or symlink targets', async t => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'elektrosmeta-'));
  const root = path.join(temporary, 'public');
  await mkdir(root);
  await writeFile(path.join(root, 'index.html'), '<h1>Электросмета</h1>');
  await writeFile(path.join(temporary, 'outside.txt'), 'private');
  await symlink(path.join(temporary, 'outside.txt'), path.join(root, 'linked.txt'));
  const server = createStaticServer({ root });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(temporary, { recursive: true, force: true }); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  await t.test('GET and HEAD', async () => {
    const response = await fetch(origin);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /Электросмета/);
    const head = await fetch(origin, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  });
  await t.test('private paths and symlink escape are denied', async () => {
    for (const url of ['/.git/config', '/node_modules/a.js', '/linked.txt', '/%2e%2e%2foutside.txt']) {
      assert.equal((await fetch(origin + url)).status, 403, url);
    }
  });
  await t.test('malformed URL, missing file and mutation requests', async () => {
    assert.equal((await fetch(origin + '/%XX')).status, 400);
    assert.equal((await fetch(origin + '/missing.txt')).status, 404);
    assert.equal((await fetch(origin, { method: 'POST' })).status, 405);
  });
});

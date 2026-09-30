import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
test('API events, idempotency and refresh recovery', async () => {
  const server=spawn(process.execPath,['backend/server.mjs'],{env:{...process.env,PORT:'3109'},stdio:['ignore','pipe','pipe']});
  try {
    await Promise.race([once(server.stdout,'data'),once(server,'exit').then(()=>{throw new Error('Server failed to start');})]);
    const base='http://127.0.0.1:3109';
    const initial=await fetch(base+'/api/session');const cookie=initial.headers.get('set-cookie').split(';')[0];const before=await initial.json();
    const headers={'Content-Type':'application/json',cookie};const payload={bet:10,requestId:crypto.randomUUID()};
    const stream=await fetch(base+'/api/events',{headers:{cookie}});const reader=stream.body.getReader();await reader.read();
    const first=await fetch(base+'/api/spin',{method:'POST',headers,body:JSON.stringify(payload)}).then(r=>r.json());
    const event=await reader.read();assert.match(new TextDecoder().decode(event.value),/spin:result/);await reader.cancel();
    const duplicate=await fetch(base+'/api/spin',{method:'POST',headers,body:JSON.stringify(payload)}).then(r=>r.json());assert.deepEqual(first,duplicate);
    const after=await fetch(base+'/api/session',{headers:{cookie}}).then(r=>r.json());assert.equal(after.credits,before.credits-10+first.totalWin);assert.equal(after.lastSpin.spinId,first.spinId);
    const invalid=await fetch(base+'/api/spin',{method:'POST',headers,body:JSON.stringify({bet:-10,requestId:crypto.randomUUID()})});assert.equal(invalid.status,400);
    const unchanged=await fetch(base+'/api/session',{headers:{cookie}}).then(r=>r.json());assert.equal(unchanged.credits,after.credits);
    const other=await fetch(base+'/api/session').then(r=>r.json());assert.equal(other.credits,1000);
  } finally { server.kill(); await once(server,'exit'); }
});

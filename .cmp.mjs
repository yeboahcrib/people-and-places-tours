import {webkit, chromium, devices} from 'playwright';
import {serveDist} from './tests/serve-dist.js';
const hosted=await serveDist();
const probe = async (engine,name,dev) => {
  const b=await engine.launch(); const ctx=await b.newContext(dev); const p=await ctx.newPage();
  await p.goto(hosted.origin+'/contact.html',{waitUntil:'load'}); await p.waitForTimeout(500);
  const m=await p.evaluate(()=>{
    const out=[];
    for (const id of ['travel-date','departure-date','group-size','first-name']) {
      const el=document.getElementById(id); if(!el) continue;
      const g=el.closest('.form-group'); const lb=g.querySelector('.form-label');
      const r=el.getBoundingClientRect(), lr=lb.getBoundingClientRect();
      const cs=getComputedStyle(el);
      out.push({id, h:Math.round(r.height), app:cs.appearance||cs.webkitAppearance,
        lh:cs.lineHeight, gap:Math.round(r.top-lr.bottom),
        overlapsLabel: r.top < lr.bottom - 0.5});
    }
    return out;});
  console.log(`  ${name}`);
  for (const r of m) console.log(`    ${r.id.padEnd(15)} h=${String(r.h).padEnd(4)} appearance=${String(r.app).padEnd(6)} line-height=${String(r.lh).padEnd(8)} label→input=${r.gap}px  overlap=${r.overlapsLabel}`);
  await b.close();
};
await probe(webkit,'WebKit / iPhone 14 Pro', devices['iPhone 14 Pro']);
await probe(chromium,'Chromium 1440 (desktop)', {viewport:{width:1440,height:900}});
hosted.server.close();

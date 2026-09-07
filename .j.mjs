import {chromium} from 'playwright';
import {serveDist} from './tests/serve-dist.js';
const hosted=await serveDist(); const b=await chromium.launch();
for (const [w,dsf,name] of [[1440,2,'desktop'],[390,3,'mobile']]) {
  const p=await b.newPage({viewport:{width:w,height:900},deviceScaleFactor:dsf,isMobile:w<430});
  await p.goto(hosted.origin+'/contact.html',{waitUntil:'networkidle'}); await p.waitForTimeout(600);
  const box=await p.evaluate(()=>{
    const faq=document.querySelector('.faq-section');
    faq.scrollIntoView({block:'start'});
    return null;});
  await p.waitForTimeout(400);
  const clip=await p.evaluate(()=>{
    const faq=document.querySelector('.faq-section').getBoundingClientRect();
    const top=Math.max(0, faq.top-260);
    return {x:0, y:top, width:Math.min(window.innerWidth,1440), height:Math.min(520, window.innerHeight-top)};});
  await p.screenshot({path:`/tmp/junction-${name}.png`, clip});
  await p.close();
}
await b.close(); hosted.server.close(); console.log('  captured both');

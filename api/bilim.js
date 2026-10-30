// Same-origin bridge: credentials never enter the HTML or browser JavaScript.
module.exports = async function handler(req, res) {
 res.setHeader('Cache-Control','no-store');
 const action = String(req.query.action || '');
 const allowed = new Set(['session','me','logout','result','results','teacher','teacher-login','teacher-logout','health']);
 if (!allowed.has(action)) return res.status(404).json({error:'Not found'});
 if (!['GET','POST'].includes(req.method)) return res.status(405).json({error:'Method not allowed'});
 if (req.method==='POST') {
  const origin=req.headers.origin;
  if (origin && !['https://ai-bilim.kz','https://www.ai-bilim.kz','https://'+req.headers.host].includes(origin)) return res.status(403).json({error:'Forbidden'});
  if (!String(req.headers['content-type']).startsWith('application/json')) return res.status(415).json({error:'JSON required'});
 }
 const secret=process.env.BILIM_BACKEND_SECRET;
 if(!secret) return res.status(503).json({error:'Дерекқор байланысы бапталмаған.'});
 try {
  const body=req.method==='POST'?JSON.stringify(req.body||{}):undefined;
  if(body && body.length>40000) return res.status(413).json({error:'Жауап тым ұзын.'});
  const upstream=await fetch('https://dvbhikzyyrrooixigvka.supabase.co/functions/v1/bilim-api/'+action,{
   method:req.method,headers:{'Content-Type':'application/json','X-Bilim-Bridge':secret,
    'X-Bilim-IP':String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0],
    'Cookie':req.headers.cookie||''},body,signal:AbortSignal.timeout(20000)
  });
  const cookies=upstream.headers.getSetCookie();
  if(cookies.length)res.setHeader('Set-Cookie',cookies);
  res.status(upstream.status).setHeader('Content-Type','application/json; charset=utf-8');
  res.end(await upstream.text());
 } catch { console.error('bilim_backend_unavailable'); res.status(502).json({error:'Байланыс үзілді. Қайта сақтап көріңіз.'}); }
};

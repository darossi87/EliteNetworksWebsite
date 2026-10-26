const ALLOWED = new Set(['Managed IT Services','Cybersecurity','Microsoft 365 & Cloud','Networks & Infrastructure','Backup & Disaster Recovery','Business Phone Systems','General IT / Other']);
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const clean = (value,max) => typeof value==='string' ? value.trim().slice(0,max) : '';
export default {async fetch(request,env,ctx){
  const url = new URL(request.url);
  if(url.pathname!=='/api/contact') return env.ASSETS.fetch(request);
  if(request.method!=='POST') return json({error:'Method not allowed.'},405);
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'Expected JSON.'},415);
  if(!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) return json({error:'Contact form is not yet configured. Please email us directly.'},503);
  if(Number(request.headers.get('content-length')||0)>10000)return json({error:'Message too large.'},413);
  let data; try{data=await request.json();}catch{return json({error:'Invalid submission.'},400)}
  const name=clean(data.name,100),email=clean(data.email,254),company=clean(data.company,120),message=clean(data.message,4000),service=clean(data.service,100),token=clean(data['cf-turnstile-response'],4000);
  if(name.length<2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<10||!ALLOWED.has(service)||!token)return json({error:'Please complete all required fields and spam verification.'},400);
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  if(env.CONTACT_RATE_LIMITER){const {success}=await env.CONTACT_RATE_LIMITER.limit({key:ip});if(!success)return json({error:'Too many submissions. Please try again later.'},429)}
  const fd=new FormData();fd.set('secret',env.TURNSTILE_SECRET_KEY);fd.set('response',token);fd.set('remoteip',ip);
  let verified;try{const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:fd});verified=await response.json()}catch{return json({error:'Spam verification temporarily unavailable.'},503)}
  if(!verified.success || (verified.hostname && verified.hostname!==url.hostname))return json({error:'Spam verification failed. Please retry.'},400);
  const safe = s=>s.replace(/[\r\n]/g,' ').trim();
  const subject=`Website Inquiry - ${safe(service)}`;
  const textBody=`New Elite Networks website inquiry\n\nService: ${safe(service)}\nName: ${safe(name)}\nBusiness email: ${safe(email)}\nCompany: ${safe(company)||'Not provided'}\n\nMessage:\n${message}\n`;
  try{const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.CONTACT_FROM_EMAIL,to:[env.CONTACT_TO_EMAIL||'sales@elitenetworks.net'],reply_to:email,subject,text:textBody})});if(!sent.ok){console.error('Email delivery error',sent.status);return json({error:'Unable to send the message at this time.'},502)}}catch{return json({error:'Email delivery temporarily unavailable.'},503)}
  return json({ok:true});
}};

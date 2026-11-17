/**
 * Worker for /bus/ on adriendoespostrock.github.io
 * Cloudflare secrets required: IDFM_API_KEY and APP_ACCESS_CODE.
 * Do not commit secret values to GitHub.
 */
const STOPS = {
  cosmo: {
    monitoringRef: "STIF:StopArea:SP:63147:",
    lineRefs: {
      "199": "STIF:Line::C01218:",
      "4503": "STIF:Line::C00691:",
      "4613": "STIF:Line::C00676:",
      "4614": "STIF:Line::C00075:"
    }
  },
  massy: {
    monitoringRef: "STIF:StopArea:SP:63244:",
    lineRefs: {
      "199": "STIF:Line::C01218:",
      "4503": "STIF:Line::C00691:",
      "4613": "STIF:Line::C00676:",
      "4614": "STIF:Line::C00075:"
    }
  }
};
const cors = {
  "Access-Control-Allow-Origin": "https://adriendoespostrock.github.io",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-App-Code",
  "Vary": "Origin"
};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
function walk(obj,out=[]){if(!obj||typeof obj!=="object")return out;if(Array.isArray(obj)){for(const x of obj)walk(x,out);return out}if(obj.MonitoredCall||obj.MonitoredVehicleJourney||obj.MonitoredStopVisit)out.push(obj);for(const [k,v] of Object.entries(obj))if(k!=="Extensions")walk(v,out);return out}
function extract(data){const output=[];for(const v of walk(data)){const visit=v.MonitoredStopVisit||v;const call=visit.MonitoredCall||visit.MonitoredVehicleJourney?.MonitoredCall||{};const journey=visit.MonitoredVehicleJourney||{};const when=call.ExpectedDepartureTime||call.ExpectedArrivalTime||call.AimedDepartureTime||call.AimedArrivalTime;if(!when)continue;const date=new Date(when);if(Number.isNaN(+date))continue;const dest=journey.DestinationName;const destination=Array.isArray(dest)?dest.map(x=>x.value||x).join(" "):typeof dest==="string"?dest:"";output.push({minutes:Math.max(0,Math.round((+date-Date.now())/60000)),realtime:!!call.ExpectedDepartureTime||!!call.ExpectedArrivalTime,time:date.toISOString(),destination})}return output.sort((a,b)=>a.minutes-b.minutes)}
function servesDirection(stop,line,destination){const d=(destination||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();if(stop==="cosmo")return d.includes("massy");const targets={"199":["hopital paris-saclay","roccade","rocade"],"4503":["porte d'etampes","porte d etampes"],"4613":["gravigny","la creusiere"],"4614":["polytechnique","vauve"]};return (targets[line]||[]).some(x=>d.includes(x))}
export default {async fetch(request,env){
  if(request.method==="OPTIONS")return new Response(null,{headers:cors});
  const url=new URL(request.url);if(url.pathname!=="/api/departures"||request.method!=="GET")return json({error:"Not found"},404);
  if(!env.IDFM_API_KEY||!env.APP_ACCESS_CODE)return json({error:"Configure IDFM_API_KEY et APP_ACCESS_CODE comme secrets Cloudflare."},503);
  if(request.headers.get("X-App-Code")!==env.APP_ACCESS_CODE)return json({error:"Code d’accès incorrect."},401);
  const stopKey=url.searchParams.get("stop"),stop=STOPS[stopKey];if(!stop)return json({error:"Arrêt inconnu."},400);
  const results=await Promise.all(Object.entries(stop.lineRefs).map(async([line,lineRef])=>{try{
    const api=new URL("https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring");api.searchParams.set("MonitoringRef",stop.monitoringRef);api.searchParams.set("LineRef",lineRef);
    const res=await fetch(api,{headers:{apikey:env.IDFM_API_KEY,Accept:"application/json"}});if(!res.ok)return[line,{}];
    const body=await res.json();const next=extract(body).filter(x=>servesDirection(stopKey,line,x.destination)).slice(0,3);
    return[line,next.length?{minutes:next[0].minutes,realtime:next[0].realtime,destination:next[0].destination,next:next.map(x=>new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Paris"}).format(new Date(x.time)))}:{}]
  }catch{return[line,{}]}}));
  return json({updated:new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Paris"}).format(new Date()),lines:Object.fromEntries(results)});
}};

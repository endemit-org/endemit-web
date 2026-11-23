/** Uses the read-only export-festival-reference snapshot; writes only local preview files. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const raw=JSON.parse(await readFile('/tmp/endemit-festival-reference.json','utf8'));
const folder='public/images/festival';await mkdir(folder,{recursive:true});
const assets=[];
const text=v=>Array.isArray(v)?v.map(b=>b.text||'').filter(Boolean):[];
const image=(url,name,width=1000)=>{if(!url)return '';const u=new URL(url);u.searchParams.set('w',String(width));u.searchParams.set('fm','webp');u.searchParams.set('q','78');assets.push({url:u.href,name});return '/images/festival/'+name+'.webp';};
const artists=raw.event.artists.map(row=>{
 const a=raw.artists.find(a=>a.id===row.artist?.id);if(!a)return null;
 return {uid:a.uid,name:row.name_override||a.data.name,image:image(row.image_override?.url||a.data.image?.url,'artist-'+a.uid,600),stage:{en:row.stage||'Dome',sl:row.stage_sl||'Kupola'},description:{en:text(row.description_override?.length?row.description_override:a.data.description),sl:text(row.description_override_sl?.length?row.description_override_sl:a.data.description_sl)}};
}).filter(Boolean);
const gallery=raw.event.slices.find(s=>s.slice_type==='image_gallery').items.map((item,i)=>({src:image(item.image.url,'vibe-'+i,1200),caption:{en:item.caption||'Endemit · from the archive',sl:item.caption_sl||'Endemit · iz arhiva'}}));
function sections(uid,loc){const page=raw.pages.find(p=>p.uid===uid);const blocks=page.data.slices.find(s=>s.slice_type==='content_section').primary[loc==='sl'?'content_sl':'content'];const result=[];let section;
 for(const block of blocks||[]){if(block.type.startsWith('heading')){section={title:block.text,paragraphs:[],images:[],links:[]};result.push(section);}if(!section){section={title:'',paragraphs:[],images:[],links:[]};result.push(section);}if(block.type==='paragraph'||block.type==='list-item')section.paragraphs.push(block.text);if(block.type==='image')section.images.push(image(block.url,uid+'-'+loc+'-'+section.images.length+'-'+result.length,900));for(const span of block.spans||[])if(span.type==='hyperlink'&&span.data?.url)section.links.push({label:block.text.slice(span.start,span.end),url:span.data.url});}return result;
}
const lodging={en:sections('festival-2026-accommodation','en'),sl:sections('festival-2026-accommodation','sl')};
const food={en:sections('festival-2026-food-drinks','en'),sl:sections('festival-2026-food-drinks','sl')};
const orientation=raw.pages.find(p=>p.uid==='festival-2026-orientation').data.slices[0].primary;
const maps={};for(const loc of ['en','sl']){const b=orientation[loc==='sl'?'content_sl':'content'].find(b=>b.type==='image');maps[loc]=image(b.url,'map-'+loc,1500);}
const hero=raw.event.slices.find(s=>s.slice_type==='hero').primary;
const data={sourceEdition:2026,artists,gallery,lodging,food,maps,video:{vimeoId:hero.vimeo_video_id,poster:image(hero.backgroundImage.url,'film-poster',1200)},venue:{image:image(raw.venue.image.url,'river',1200),description:{en:text(raw.venue.description),sl:text(raw.venue.description_sl)},address:raw.venue.address,mapUrl:raw.venue.map_location_url.url}};
for(let i=0;i<assets.length;i+=5){await Promise.all(assets.slice(i,i+5).map(async a=>{const response=await fetch(a.url);if(!response.ok)throw new Error('Asset fetch failed: '+a.name);await writeFile(folder+'/'+a.name+'.webp',Buffer.from(await response.arrayBuffer()));}));}
await writeFile('src/app/_components/festival/reference.json',JSON.stringify(data,null,2)+'\n');
await writeFile(folder+'/reference-sources.json',JSON.stringify({source:'Published 2026 festival content; read-only snapshot for the design preview.',assets},null,2)+'\n');
console.log('Prepared '+artists.length+' artist profiles, '+gallery.length+' gallery photographs, lodging, food, bilingual maps, and video poster.');

/** Read-only snapshot of public 2026 editorial content for the local festival design preview. */
import 'dotenv/config';
import * as prismic from '@prismicio/client';
import { writeFile } from 'node:fs/promises';
const client = prismic.createClient(process.env.PRISMIC_REPOSITORY_NAME || 'endemit', { accessToken: process.env.PRISMIC_ACCESS_TOKEN });
const event = await client.getByUID('event', 'endemit-festival-2026');
const [artists, pages, products, venue] = await Promise.all([
  client.getAllByType('artist'), client.getAllByType('inner_content'), client.getAllByType('product'), client.getByUID('venue','libelice'),
]);
const ids = new Set(event.data.artists.map(row => row.artist?.id).filter(Boolean));
const data = {
  event: event.data,
  artists: artists.filter(a => ids.has(a.id)).map(a => ({id:a.id,uid:a.uid,data:a.data})),
  pages: pages.filter(p=>p.uid?.startsWith('festival-2026-')).map(p=>({uid:p.uid,data:p.data})),
  products: products.filter(p=>p.data.related_to_event?.id===event.id).map(p=>({uid:p.uid,data:p.data})),
  venue: venue.data,
};
await writeFile('/tmp/endemit-festival-reference.json',JSON.stringify(data,null,2));
console.log(JSON.stringify({artists:data.artists.length,pages:data.pages.map(p=>p.uid),products:data.products.map(p=>({uid:p.uid,name:p.data.name,price:p.data.price,ticketQuantity:p.data.ticket_quantity})),eventFields:Object.keys(event.data),artistFields:Object.keys(data.artists[0]?.data||{})},null,2));

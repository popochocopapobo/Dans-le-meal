'use strict';
const BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));
const $ = id => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const root = document.body.dataset.root || '';
const standalone = document.body.dataset.standalone === 'true';
const files = { recipes:'index.html', menu:'menu.html', shopping:'courses.html', kitchen:'cuisine.html' };
const ALL_TOOLS = ['plaques','four','micro-ondes','air fryer','mixeur'];
const clamp = (n, max = 30) => Math.max(1, Math.min(max, Math.round(Number(n)||1)));
const fmt = n => Number(n.toFixed(2)).toLocaleString('fr-FR');
const esc = s => String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
let saved = {};
let storageAvailable = true;
try { saved = JSON.parse(localStorage.getItem('atable-v7') || '{}') || {}; } catch(e) { storageAvailable = false; }
let state = {
  tools: Array.isArray(saved.tools) ? saved.tools.filter(t=>ALL_TOOLS.includes(t)) : ['plaques','four'],
  menu: Array.isArray(saved.menu) ? saved.menu.filter(x=>x && BY_ID[x.id]).map(x=>({id:Number(x.id),p:clamp(x.p)})) : [],
  people: clamp(saved.people || 2),
  fav: Array.isArray(saved.fav) ? saved.fav.filter(x=>BY_ID[x]) : [],
  checked: saved.checked && typeof saved.checked === 'object' ? saved.checked : {},
  compatibleOnly: saved.compatibleOnly === true,
  layout: saved.layout==='list'?'list':'grid',
  catalogCompatible: saved.catalogCompatible===true
};
let filter = 'all';
// Le filtre est réactivé à chaque arrivée sur un catalogue.
let showUnavailable = false;
const category = r => r.category || 'savory';
let catalogCategory = document.body.dataset.category || 'savory';
let catalogRecipes = RECIPES.filter(r=>category(r)===catalogCategory);
function selectCategory(cat, updateURL=false) {
  if (!$('catalog') || !['sweet','savory'].includes(cat)) return;
  catalogCategory=cat;
  catalogRecipes=RECIPES.filter(r=>category(r)===cat);
  document.body.dataset.category=cat;
  $$('[data-catalog-category]').forEach(a=>{
    const active=a.dataset.catalogCategory===cat;
    a.classList.toggle('active',active);
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  if($('catalog-heading'))$('catalog-heading').textContent=cat==='sweet'?'Pause sucrée':'On mange quoi aujourd’hui ?';
  if($('catalog-intro'))$('catalog-intro').textContent=cat==='sweet'?'Desserts, goûters et petits déjeuners.':'Des recettes salées adaptées à ta cuisine.';
  document.title=(cat==='sweet'?'Sucré':'Salé')+' · À table !';
  filter='all';showUnavailable=false;
  $('search').value='';$('duration').value='1440';
  if(updateURL){
    try { const url=new URL(location.href);url.searchParams.set('category',cat);history.pushState(null,'',url); } catch(e) { /* Les onglets restent utilisables dans un aperçu local. */ }
  }
  filterCatalog();
}
function initialCategory(){const query=new URLSearchParams(location.search).get('category');return ['sweet','savory'].includes(query)?query:(location.pathname.endsWith('/sucre.html')?'sweet':document.body.dataset.initialCategory||'savory');}
function eligible(r, cat='all'){return compatible(r)&&(cat==='all'||category(r)===cat);}
function surprisePool(){const available=catalogRecipes.filter(r=>eligible(r,catalogCategory)&&!r.side);const quick=available.filter(r=>r.time<=25);return quick.length?quick:available;}
let toastTimer;
let lastView = '';
let catalogScroll=0;
const lastPortions = {};
function save() {
  try { localStorage.setItem('atable-v7', JSON.stringify(state)); } catch(e) { storageAvailable = false; }
  const count = $('menu-count'); if(count) count.textContent = state.menu.length || '';
}
function notify(message) {
  $('toast').textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ $('toast').textContent=''; }, 2600);
}
function link(page) { return standalone ? '#'+page : root+files[page]; }
function recipeLink(id) { return standalone ? '#r-'+id : root+'recettes/'+id+'.html'; }
function navigate(page) { location.href = link(page); }
function compatible(r) { return r.tools.every(t=>state.tools.includes(t)); }
function matches(r, type) {
  return type==='compatible' ? compatible(r) : type==='fav' ? state.fav.includes(r.id) : type==='veg' ? r.veg : type==='express' ? r.time<=15 : type==='quick' ? r.time<=25 : type==='nocook' ? r.tools.every(t=>t==='mixeur') : type==='new' ? RECIPES.slice(-15).some(x=>x.id===r.id) : type==='quick30' ? r.time<=30 : type==='balanced' ? r.health>=80 : type==='gourmet' ? r.taste>=90 : true;
}
function refreshCommon() {
  save();
  $$('[data-fav]').forEach(b=>{ const on=state.fav.includes(+b.dataset.fav); b.textContent=on?'♥':'♡'; b.setAttribute('aria-pressed',String(on)); b.setAttribute('aria-label',on?'Retirer des favoris':'Ajouter aux favoris'); });
  $$('[data-compat]').forEach(el=>{const r=BY_ID[+el.dataset.compat];const missing=r.tools.filter(t=>!state.tools.includes(t));el.classList.toggle('missing',missing.length>0);el.textContent=missing.length?'Manque : '+missing.join(', '):(r.tools.join(' · ')||'Sans cuisson');});
  $$('[data-add]').forEach(b=>{b.disabled=!compatible(BY_ID[+b.dataset.add]);});
}
function filterCatalog() {
  if (!$('catalog')) return;
  const available = catalogRecipes.filter(r=>eligible(r,catalogCategory));
  if($('hero-count'))$('hero-count').textContent=available.length+' recettes réalisables';
  if($('hero-quick'))$('hero-quick').textContent=available.filter(r=>r.time<=25).length+' en ≤ 25 min';
  $$('[data-shortcut]').forEach(b=>{const n=available.filter(r=>matches(r,b.dataset.shortcut)).length;b.querySelector('b').textContent=n;});
  if($('surprise'))$('surprise').disabled=!available.some(r=>!r.side);
  if($('equipment-notice'))$('equipment-notice').innerHTML=available.length+' recette(s) réalisable(s) sur '+catalogRecipes.length+' dans cet univers. <a href="cuisine.html">Modifier ma cuisine →</a>';
  const normalize = s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const q=normalize($('search').value.trim());
  const duration=Number($('duration').value); const sort=$('sort').value;
  const cards=$$('.recipe-card',$('catalog'));
  cards.sort((a,b)=>{const x=BY_ID[+a.dataset.id],y=BY_ID[+b.dataset.id];return sort==='name'?x.name.localeCompare(y.name,'fr'):['time','kcal'].includes(sort)?x[sort]-y[sort]:y[sort]-x[sort];});
  let n=0;
  const needsReorder=cards.some((card,i)=>card!==$('catalog').querySelectorAll('.recipe-card')[i]);
  cards.forEach(card=>{const r=BY_ID[+card.dataset.id];const ok=category(r)===catalogCategory&&matches(r,filter)&&(showUnavailable||compatible(r))&&r.time<=duration&&normalize(r.name+' '+r.ing.map(i=>i.n).join(' ')).includes(q);card.hidden=!ok;if(ok)n++;if(needsReorder)$('catalog').append(card);});
  $('results').textContent=n+' recette'+(n>1?'s':'');
  $('catalog').classList.toggle('list-mode',state.layout==='list');
  $$('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layout===state.layout)));
  if($('only-compatible'))$('only-compatible').checked=!showUnavailable;
  $$('[data-shortcut]').forEach(b=>b.classList.toggle('active',b.dataset.shortcut===filter));
  $$('[data-filter]').forEach(b=>{b.classList.toggle('selected',b.dataset.filter===filter);b.setAttribute('aria-pressed',String(b.dataset.filter===filter));});
  let empty=$('catalog-empty'); if(!empty) { empty=document.createElement('p');empty.className='empty';empty.id='catalog-empty';$('catalog').append(empty); }
  empty.replaceChildren();
  if(!n){
    const message=document.createElement('span');message.textContent=available.length?'Aucune recette ne correspond. Réinitialise les filtres.':'Aucune recette réalisable avec tes équipements dans cette catégorie.';empty.append(message);
    if(catalogRecipes.length&&!showUnavailable){const btn=document.createElement('button');btn.type='button';btn.id='show-unavailable';btn.textContent='Consulter toutes les recettes de cette catégorie';empty.append(document.createElement('br'),btn);}
  }
  empty.hidden=!!n;
}
function adjustDetail(section,p) {
  const r=BY_ID[+section.dataset.detail]; p=clamp(p); lastPortions[r.id]=p;
  section.querySelector('.portions').value=p;
  $$('.portion-label',section).forEach(x=>x.textContent=p);
  $$('[data-q]',section).forEach(x=>{ x.textContent=fmt(Number(x.dataset.q)*p)+' '+x.parentElement.querySelector('[data-unit]').dataset.unit; });
  section.querySelector('.total-kcal').textContent=fmt(r.kcal*p);
}
function progressSteps(section) {
  const boxes=$$('.step-check',section);section.querySelector('.step-progress').textContent=boxes.filter(x=>x.checked).length+'/'+boxes.length;
}
function addToMenu(id,p,shopping=false) {
  if(!compatible(BY_ID[id])){notify('Il manque un appareil pour cette recette.');return;}
  state.menu.push({id,p:clamp(p)});state.checked={};save();refreshCommon();renderMenu();renderShopping();
  if(shopping) navigate('shopping');else notify(BY_ID[id].name+' ajouté au menu');
}
function randomMenu() {
  const type=$('random-style').value;const n=clamp($('random-count').value,RECIPES.length);const p=clamp($('random-people').value);const sides=$('random-sides').checked;
  const cat=$('random-category')?.value||'savory';
  const pool=RECIPES.filter(r=>eligible(r,cat)&&matches(r,type)&&(sides||!r.side));
  if (!pool.length) { $('random-message').textContent='Aucun plat compatible avec ces critères. Change ta préférence ou tes appareils.';return; }
  if(state.menu.length&&!confirm('Remplacer le menu actuel ?'))return;
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  state.menu=pool.slice(0,n).map(r=>({id:r.id,p}));state.checked={};save();renderMenu();renderShopping();
  $('random-message').textContent=state.menu.length+' plat(s) généré(s).'+(pool.length<n?' Seulement '+pool.length+' plats différents correspondent.':'');
  notify('Menu prêt !');
}
function renderMenu(updateItems = true) {
  if(!$('menu-items'))return;
  $('menu-summary').textContent=state.menu.length+' plat(s) · '+state.menu.reduce((s,x)=>s+x.p,0)+' portion(s)';
  if(updateItems) $('menu-items').innerHTML=state.menu.map((x,i)=>{const r=BY_ID[x.id];return `<article class="menu-item"><a href="${recipeLink(r.id)}"><img class="food" src="${esc(r.image)}" referrerpolicy="no-referrer" alt="${esc(r.name)}" width="110" height="73"></a><div><a href="${recipeLink(r.id)}">${esc(r.name)}</a><p class="muted">${category(r)==='sweet'?'Sucré':'Salé'} · ${r.time} min · ${r.kcal} kcal/pers.${compatible(r)?'':' · ⚠ appareil manquant'}</p></div><div class="menu-control"><label><small>Pers.</small><input type="number" min="1" max="30" value="${x.p}" data-menu-p="${i}" aria-label="Nombre de personnes pour ${esc(r.name)}"></label><button data-remove="${i}" aria-label="Retirer ${esc(r.name)}">×</button></div></article>`;}).join('')||'<p class="empty">Ton menu est vide. Ajoute des plats depuis le catalogue ou lance un tirage.</p>';
  const totals=state.menu.reduce((a,x)=>{const r=BY_ID[x.id];['kcal','p','c','f','b'].forEach(k=>a[k]+=r[k]*x.p);return a;},{kcal:0,p:0,c:0,f:0,b:0});
  $('menu-total').innerHTML=state.menu.length?`<section class="panel"><h2>Nutrition du menu entier</h2><p class="muted">Somme de toutes les portions, pas une journée type.</p><div class="macros">${[['kcal',totals.kcal],['Protéines',totals.p+' g'],['Glucides',totals.c+' g'],['Lipides',totals.f+' g'],['Fibres',totals.b+' g']].map(x=>`<div><b>${x[1]}</b><small>${x[0]}</small></div>`).join('')}</div></section>`:'';
}
function aisle(name) {
  if(/poulet|bœuf|guanciale|lardons|jambon|saumon|cabillaud|thon|crevettes/.test(name))return 'Viandes, poissons et conserves de poisson';
  if(/œufs|pecorino|crème|lait$|emmental|cheddar|reblochon|feta|mozzarella|parmesan|burrata|yaourt|béchamel|fromage|beurre|chèvre|kiri|crottin/.test(name)&&name!=='lait de coco')return 'Produits frais et œufs';
  if(/pommes de terre|^tomate$|tomates cerises|oignon|ail|poivron|concombre|avocat|^salade$|champignons|courgette|citron|carotte|patate douce|aubergine|épinards|poire|pomme|banane|framboise|fraise|kiwi|orange|mangue|basilic|ciboulette|aneth/.test(name))return 'Fruits et légumes';
  if(/pain|bagel|tortillas/.test(name))return 'Boulangerie';
  return 'Épicerie et autres';
}
function shoppingItems() {
  const grouped=new Map();
  for(const x of state.menu)for(const ing of BY_ID[x.id].ing){const name=ing.n;const key=name+'|'+ing.u;const line=grouped.get(key)||{key,n:name,u:ing.u,q:0,group:aisle(name)};line.q+=ing.q*x.p;grouped.set(key,line);}
  return Array.from(grouped.values()).sort((a,b)=>a.group.localeCompare(b.group,'fr')||a.n.localeCompare(b.n,'fr'));
}
function renderShopping() {
  if(!$('shopping-items'))return;
  const items=shoppingItems();const done=items.filter(x=>state.checked[x.key]).length;
  $('shopping-summary').textContent=items.length+' ingrédient(s)';$('shopping-progress').textContent=done+'/'+items.length+' cochés';$('shopping-bar').max=items.length||1;$('shopping-bar').value=done;
  const groups=Array.from(new Set(items.map(x=>x.group)));
  $('shopping-items').innerHTML=groups.map(g=>`<section class="shop-group"><h3>${esc(g)}</h3>${items.filter(x=>x.group===g).map(x=>`<label class="shop-line ${state.checked[x.key]?'done':''}"><input type="checkbox" data-shop="${esc(x.key)}" ${state.checked[x.key]?'checked':''}><span>${esc(x.n)}</span><b>${fmt(x.q)} ${esc(x.u)}</b></label>`).join('')}</section>`).join('')||'<p class="empty">Ajoute des plats à ton menu pour obtenir la liste de courses.</p>';
}
function renderKitchen() {
  if(!$('compat-count'))return;
  $$('[data-tool]').forEach(x=>x.checked=state.tools.includes(x.dataset.tool));
  if($('default-compatible'))$('default-compatible').checked=true;
  $('compat-count').textContent=RECIPES.filter(compatible).length+' recettes réalisables sur '+RECIPES.length;
}
async function copyList() {
  const text=shoppingItems().map(x=>(state.checked[x.key]?'✓':'☐')+' '+x.n+' : '+fmt(x.q)+' '+x.u).join('\n');
  if(!text){notify('La liste est vide.');return;}
  try { await navigator.clipboard.writeText(text);notify('Liste copiée.'); } catch(e) { const ta=$('copy-fallback');ta.hidden=false;ta.value=text;ta.rows=8;ta.focus();ta.select();notify('Sélectionne et copie le texte.'); }
}
function showView() {
  if(!standalone)return;
  let id=location.hash.slice(1)||'recipes';if(!$(id)||!$(id).classList.contains('view'))id='recipes';
  $$('.view').forEach(el=>el.classList.toggle('current',el.id===id));
  $$('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(id.startsWith('r-')?'recipes':id)));
  const section=$(id);if(section.dataset.detail!==undefined)adjustDetail(section,lastPortions[section.dataset.detail]||state.people);
  if(id==='menu')renderMenu();if(id==='shopping')renderShopping();if(id==='kitchen')renderKitchen();if(id==='recipes')filterCatalog();
  if(lastView!==id){const restore=id==='recipes'&&lastView.startsWith('r-');window.scrollTo(0,restore?catalogScroll:0);lastView=id;}
}
// Optional external photos: local image stays in place unless the replacement loads.
function initImages() {
  const load=img=>{if(img.dataset.tried)return;img.dataset.tried='1';const test=new Image();test.referrerPolicy='no-referrer';test.onload=()=>{img.src=test.src;};test.src=img.dataset.remote;};
  if('IntersectionObserver' in window){const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){o.unobserve(e.target);load(e.target);}}));$$('[data-remote]').forEach(el=>o.observe(el));}else $$('[data-remote]').forEach(load);
}
document.addEventListener('click', e=>{
  const a=e.target.closest('a');
  if(a?.dataset.catalogCategory && $('catalog') && $('catalog').querySelector('[data-category="'+a.dataset.catalogCategory+'"]') && !e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();selectCategory(a.dataset.catalogCategory,true);return;}
  if(a&&lastView==='recipes'&&a.getAttribute('href')?.startsWith('#r-'))catalogScroll=window.scrollY;
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='show-unavailable'){filter='all';showUnavailable=true;$('search').value='';$('duration').value='1440';filterCatalog();}
  if(b.dataset.shortcut){filter=b.dataset.shortcut; showUnavailable=false; $('duration').value='1440';$('search').value='';$('sort').value='time';filterCatalog();$('searchbox').scrollIntoView({block:'start',behavior:'smooth'});}
  if(b.dataset.layout){state.layout=b.dataset.layout;save();filterCatalog();}
  if(b.id==='reset-filters'){filter='all';showUnavailable=false;$('search').value='';$('duration').value='1440';$('sort').value='rating';save();filterCatalog();}
  if(b.id==='surprise'){const pool=surprisePool();if(!pool.length){notify('Aucune recette compatible.');return;} catalogScroll=window.scrollY;location.href=recipeLink(pool[Math.floor(Math.random()*pool.length)].id);}
  if(b.dataset.jump){const sec=b.closest('[data-detail]');sec.querySelector(b.dataset.jump)?.scrollIntoView({block:'start',behavior:'smooth'});}
  if(b.dataset.filter!==undefined){filter=b.dataset.filter;if(filter==='new'||filter==='quick'||filter==='gourmet'||filter==='balanced')showUnavailable=false;filterCatalog();}
  if(b.dataset.fav!==undefined){const id=+b.dataset.fav;state.fav=state.fav.includes(id)?state.fav.filter(x=>x!==id):[...state.fav,id];refreshCommon();filterCatalog();}
  if(b.dataset.add!==undefined){const section=b.closest('[data-detail]');const p=section?section.querySelector('.portions').value:state.people;addToMenu(+b.dataset.add,p,b.hasAttribute('data-go-shopping'));}
  if(b.dataset.portion!==undefined){const sec=b.closest('[data-detail]');adjustDetail(sec,Number(sec.querySelector('.portions').value)+Number(b.dataset.portion));}
  if(b.hasAttribute('data-reset-steps')){const sec=b.closest('[data-detail]');$$('.step-check,.ingredient-check',sec).forEach(x=>x.checked=false);progressSteps(sec);}
  if(b.dataset.remove!==undefined){state.menu.splice(+b.dataset.remove,1);state.checked={};save();renderMenu();renderShopping();}
  if(b.id==='random-btn')randomMenu();
  if(b.id==='clear-menu'&&confirm('Vider le menu ?')){state.menu=[];state.checked={};save();renderMenu();renderShopping();}
  if(b.id==='copy-list')copyList();
  if(b.id==='uncheck-all'){state.checked={};save();renderShopping();}
  if(b.id==='reset-data'&&confirm('Effacer les menus, favoris et préférences ?')){state={tools:['plaques','four'],menu:[],people:2,fav:[],checked:{},compatibleOnly:true};filter='all';showUnavailable=false;save();refreshCommon();renderKitchen();renderMenu();renderShopping();filterCatalog();notify('Données réinitialisées.');}
});
document.addEventListener('input',e=>{if(e.target.id==='search')filterCatalog();});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='people'){state.people=clamp(t.value);t.value=state.people;save();}
  if(t.id==='only-compatible'){showUnavailable=!t.checked;filterCatalog();}
  if(t.id==='sort'||t.id==='duration')filterCatalog();
  if(t.classList.contains('portions'))adjustDetail(t.closest('[data-detail]'),t.value);
  if(t.classList.contains('step-check'))progressSteps(t.closest('[data-detail]'));
  if(t.dataset.menuP!==undefined){const item=state.menu[+t.dataset.menuP];if(!item)return;const n=clamp(t.value);t.value=n;if(item.p!==n){item.p=n;state.checked={};save();renderMenu(false);renderShopping();}}
  if(t.dataset.shop!==undefined){state.checked[t.dataset.shop]=t.checked;save();renderShopping();}
  if(t.dataset.tool!==undefined){state.tools=t.checked?[...new Set([...state.tools,t.dataset.tool])]:state.tools.filter(x=>x!==t.dataset.tool);save();refreshCommon();renderKitchen();renderMenu();filterCatalog();}
  if(t.id==='default-compatible'){state.compatibleOnly=t.checked;filter=t.checked?'compatible':'all';save();filterCatalog();}
});
if($('people'))$('people').value=state.people;
if($('random-people'))$('random-people').value=state.people;
$$('[data-detail]').forEach(el=>adjustDetail(el,state.people));
refreshCommon();renderMenu();renderShopping();renderKitchen();
if($('catalog')){document.body.dataset.initialCategory=document.body.dataset.category||'savory';selectCategory(initialCategory());window.addEventListener('popstate',()=>selectCategory(initialCategory()));}
initImages();
if(standalone){document.body.classList.add('js');window.addEventListener('hashchange',showView);showView();}
if(!storageAvailable)notify('Stockage local indisponible : les données ne seront pas conservées après fermeture.');


// Images du CDN Marmiton : aucune requête fetch/CORS requise.
document.addEventListener('error',e=>{const im=e.target;if(im.tagName==='IMG'&&im.classList.contains('food')&&im.src.startsWith('https:')){im.dataset.failed='true';im.src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20720%20480%22%3E%3Crect%20width%3D%22720%22%20height%3D%22480%22%20fill%3D%22%23e8eee5%22/%3E%3Ctext%20x%3D%22360%22%20y%3D%22230%22%20font-family%3D%22sans-serif%22%20font-size%3D%2227%22%20text-anchor%3D%22middle%22%20fill%3D%22%23375748%22%3EPhoto%20inaccessible%3C/text%3E%3Ctext%20x%3D%22360%22%20y%3D%22270%22%20font-family%3D%22sans-serif%22%20font-size%3D%2217%22%20text-anchor%3D%22middle%22%20fill%3D%22%23375748%22%3EOuvrir%20la%20recette%20Marmiton%3C/text%3E%3C/svg%3E";}},true);

// Prend également en charge les photos qui ont échoué avant le chargement de JavaScript.
$$(`img.food`).forEach(im => { if (im.complete && !im.naturalWidth && im.src.startsWith("https:")) im.dispatchEvent(new Event("error")); });

window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});

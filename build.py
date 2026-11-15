"""Construit le site statique depuis recettes/*.json. Python 3, sans dépendances."""
from pathlib import Path
import html, json, math, shutil, sys, re
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
OUT = ROOT / '_site'
TOOLS = {'plaques','four','micro-ondes','air fryer','mixeur'}
def e(x): return html.escape(str(x), quote=True)
def num(x): return f'{x:g}'.replace('.', ',')
def valid_num(x): return type(x) in (int, float) and math.isfinite(x)
def check(r, path):
    assert type(r['id']) is int and r['id'] >= 0 and path.stem == str(r['id']), 'le nom du fichier doit être son identifiant numérique'
    for k in ('name','source','image'): assert isinstance(r[k],str) and r[k].strip(), k
    for k in ('source','image'): assert urlparse(r[k]).scheme == 'https' and urlparse(r[k]).hostname, k
    for k in ('time','taste','health','rating','reviews','p','c','f','b','kcal'): assert valid_num(r[k]) and r[k]>=0, k
    assert r['time']>0 and r['rating']<=5 and r['taste']<=100 and r['health']<=100, 'scores/durée'
    assert isinstance(r['tools'],list) and set(r['tools'])<=TOOLS, 'appareils inconnus'
    assert r.get('category','savory') in ('savory','sweet'), 'catégorie inconnue'
    assert type(r['veg']) is bool and type(r['side']) is bool, 'veg/side'
    assert isinstance(r['ing'],list) and r['ing'], 'ingrédients manquants'
    for i in r['ing']: assert isinstance(i['n'],str) and i['n'] and isinstance(i['u'],str) and i['u'] and valid_num(i['q']) and i['q']>0, 'ingrédient invalide'
    assert isinstance(r['steps'],list) and r['steps'] and all(isinstance(s,str) and s.strip() for s in r['steps']), 'étapes manquantes'

def category(r): return r.get('category', 'savory')
def category_label(r): return 'Recette sucrée' if category(r)=='sweet' else ('Accompagnement' if r['side'] else 'Plat salé')
def photo(r, eager=False):
    return f'<img class="food" src="{e(r["image"])}" alt="{e(r["name"])} — photo Marmiton" width="720" height="480" decoding="async" loading="{"eager" if eager else "lazy"}" referrerpolicy="no-referrer">'
def rating(r):
    return f'<div class="marm-rating" aria-label="{e(r["rating"])} sur 5, {e(r["reviews"])} avis Marmiton"><span class="startrack" aria-hidden="true">★★★★★<span style="width:{r["rating"]*20:g}%">★★★★★</span></span><b>{num(r["rating"])}/5</b><small>({r["reviews"]} avis Marmiton)</small></div>'
def marks(r):
    return f'<div class="marks"><span class="taste">♥ {r["taste"]}/100 gourmandise</span><span class="health">✦ {r["health"]}/100 nutrition</span></div>'
def tools(r): return e(' · '.join(r['tools']) or 'Sans cuisson')
def card(r):
    i=r['id']; name=e(r['name']); href=f'recettes/{i}.html'
    return f'''<article class="recipe-card" data-id="{i}">
  <div class="cover"><a href="{href}">{photo(r)}</a><button class="favorite" data-fav="{i}" aria-label="Ajouter aux favoris">♡</button><span class="duration">{r['time']} min</span></div>
  <div class="card-body"><a class="recipe-title" href="{href}">{name}</a>{rating(r)}{marks(r)}
  <p class="subline">{r['kcal']} kcal · {r['p']} g prot. · {category_label(r)}</p><p class="compat" data-compat="{i}">{tools(r)}</p><button class="add" data-add="{i}">＋ Ajouter au menu</button></div>
</article>'''
def detail(r):
    i=r['id']; ing='\n'.join(f'<label class="ingredient"><input type="checkbox" class="ingredient-check"><span>{e(x["n"].capitalize())}</span><strong data-q="{x["q"]}">{num(x["q"]*2)} {e(x["u"])}</strong><span data-unit="{e(x["u"])}" hidden></span></label>' for x in r['ing'])
    steps='\n'.join(f'<li><label><input class="step-check" type="checkbox"><span class="step-number">{j}</span><span>{e(s)}</span></label></li>' for j,s in enumerate(r['steps'],1))
    macros=''.join(f'<div><b>{r[k]}{" g" if k!="kcal" else ""}</b><small>{label}</small></div>' for k,label in [('kcal','kcal'),('p','Protéines'),('c','Glucides'),('f','Lipides'),('b','Fibres')])
    return f'''<section class="view detail" data-detail="{i}" id="r-{i}">
<a class="back" href="../{'sucre.html' if category(r)=='sweet' else 'index.html'}">← {'Recettes sucrées' if category(r)=='sweet' else 'Recettes salées'}</a>
<div class="detail-top"><div class="detail-cover">{photo(r,True)}<button class="favorite" data-fav="{i}" aria-label="Ajouter aux favoris">♡</button></div>
<div class="detail-head"><p class="eyebrow">{category_label(r).upper()} · {r['time']} MIN</p><h1>{e(r['name'])}</h1>{rating(r)}{marks(r)}<p class="compat" data-compat="{i}">{tools(r)}</p>
<a class="primary marm-link" href="{e(r['source'])}" target="_blank" rel="noopener noreferrer">Voir la recette sur Marmiton ↗</a>
<p class="muted image-note">Photo et note : Marmiton. <a href="{e(r['image'])}" target="_blank" rel="noopener noreferrer">Ouvrir la photo originale ↗</a></p>
<p class="muted">Note relevée lors de la constitution du catalogue. Recette adaptée, quantités estimées.</p></div></div>
<div class="detail-jump"><button data-jump=".detail-layout .panel">Ingrédients</button><button data-jump=".steps">Préparation</button><button data-jump="aside">Nutrition</button></div>
<div class="detail-layout"><div><section class="panel" style="scroll-margin-top:100px"><div class="section-heading"><h2>Ingrédients</h2><div class="stepper"><button data-portion="-1" aria-label="Une personne de moins">−</button><input class="portions" type="number" min="1" max="30" value="2" aria-label="Nombre de personnes"><button data-portion="1" aria-label="Une personne de plus">+</button></div></div><p class="muted">Quantités pour <b class="portion-label">2</b> personne(s).</p>
{ing}<p class="muted">{'Pour les fractions d’œuf, battre un œuf puis peser la quantité utile (environ 50 g par œuf). Adapter le moule aux portions et prévoir un réfrigérateur si repos au frais.' if category(r)=='sweet' else 'Sel, poivre et eau selon besoin. Féculents secs sauf indication contraire; conserves égouttées.'} Portions adaptées, pas une reproduction exacte.</p></section>
<section class="panel" style="scroll-margin-top:100px"><div class="section-heading"><h2>Préparation</h2><span class="step-progress">0/{len(r['steps'])}</span></div><ol class="steps" style="scroll-margin-top:100px">{steps}</ol><button class="secondary" data-reset-steps>Réinitialiser les étapes</button></section></div>
<aside style="scroll-margin-top:100px"><section class="panel"><h2>Nutrition</h2><p class="muted">Estimations maison par portion, hors accompagnement non listé.</p><div class="macros">{macros}</div><p class="muted">Total pour <span class="portion-label">2</span> personne(s) : <b class="total-kcal">{r['kcal']*2}</b> kcal.</p>
<div class="rating"><span>Gourmandise <b>{r['taste']}/100</b></span><progress max="100" value="{r['taste']}"></progress></div><div class="rating nutrition"><span>Équilibre nutritionnel <b>{r['health']}/100</b></span><progress max="100" value="{r['health']}"></progress></div><small>Indices maison subjectifs, non officiels. Macros approximatives; note Marmiton distincte.</small></section>
<section class="panel"><h2>Équipement</h2><p>{tools(r)}</p><a class="small-link" href="../cuisine.html">Modifier ma cuisine →</a></section><button class="primary wide" data-add="{i}" data-detail-add>＋ Ajouter au menu</button><button class="secondary wide" data-add="{i}" data-detail-add data-go-shopping>Ajouter et faire les courses →</button></aside></div></section>'''
def template(name, replacements):
    s=(ROOT/'templates'/name).read_text(encoding='utf-8')
    for k,v in replacements.items(): s=s.replace('{{'+k+'}}',str(v))
    assert not re.search(r'\{\{[A-Z]+\}\}',s), f'Variable non résolue : {name}'
    return s

def build():
    recipes=[]; seen=set(); sources=set()
    for path in (ROOT/'recettes').glob('*.json'):
        try:
            r=json.loads(path.read_text(encoding='utf-8')); check(r,path)
            assert r['id'] not in seen, 'ID dupliqué'
            assert r['source'] not in sources, 'Source dupliquée'
        except (AssertionError, KeyError, TypeError, ValueError) as exc: raise ValueError(f'{path.name} : {exc}') from exc
        seen.add(r['id']); sources.add(r['source']); recipes.append(r)
    recipes.sort(key=lambda r:r['id']); assert recipes,'Catalogue vide'
    if OUT.exists(): shutil.rmtree(OUT)
    (OUT/'recettes').mkdir(parents=True)
    def write(path,s): (OUT/path).write_text(s,encoding='utf-8')
    for f in ('app.js','style.css','courses.html','cuisine.html'): shutil.copy2(ROOT/f,OUT/f)
    write('data.js','const RECIPES = '+json.dumps(recipes,ensure_ascii=False,indent=2)+';\n')
    for cat,page in [('savory','index.html'),('sweet','sucre.html')]:
        subset=[r for r in recipes if category(r)==cat]
        write(page,template('index.html',dict(CATEGORY=cat,HEADING='Pause sucrée' if cat=='sweet' else 'On mange quoi aujourd’hui ?',INTRO='Desserts, goûters et petits déjeuners.' if cat=='sweet' else 'Des recettes salées adaptées à ta cuisine.', CARDS='\n'.join(map(card,subset)),COUNT=len(subset),QUICK=sum(r['time']<=25 for r in subset),EXPRESS=sum(r['time']<=15 for r in subset),NOCOOK=sum(set(r['tools']) <= {'mixeur'} for r in subset),SAVORY=sum(category(r)=='savory' for r in recipes),SWEET=sum(category(r)=='sweet' for r in recipes),SAVORYACTIVE='active' if cat=='savory' else '',SWEETACTIVE='active' if cat=='sweet' else '')))
    write('menu.html',template('menu.html',dict(COUNT=len(recipes))))
    for r in recipes: write(f'recettes/{r["id"]}.html',template('detail.html',dict(NAME=e(r['name']),DETAIL=detail(r))))
    write('.nojekyll','')
    print(f'{len(recipes)} recettes, {sum(r["time"]<=25 for r in recipes)} rapides; site généré dans {OUT}')
if __name__=='__main__':
    try: build()
    except Exception as exc: sys.exit(f'ERREUR catalogue : {exc}')

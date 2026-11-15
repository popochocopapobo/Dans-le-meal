# À table ! V10 — Salé et Sucré

97 recettes : 67 salées de la V9 inchangées et 30 sucrées (ID 67 à 96). Le site final reste en HTML/CSS/JS natif. Python intervient uniquement à la génération, jamais sur l'iPhone.

## Mise à jour depuis la V9

Utiliser le pack de mise à jour : copier les fichiers modifiés à la racine (app.js, build.py, style.css, cuisine.html, LISEZ-MOI.md et les deux templates) et ajouter les 30 nouveaux JSON dans recettes/. Ne rien supprimer des 67 anciennes recettes. Si le dépôt a déjà des identifiants 67 à 96, renommer les nouveaux fichiers concernés et modifier leur champ id avant de les ajouter. Le workflow V9 publie automatiquement le nouveau site après le commit. Ne pas transmettre le dossier _site au dépôt source. Si tu as personnalisé ces fichiers, sauvegarder et fusionner tes changements.

Deux univers : index.html (salé) et sucre.html (sucré). L'accueil et les raccourcis excluent les appareils manquants par défaut. Les tirages aléatoires respectent toujours les équipements, même si le catalogue a été élargi manuellement. Un menu déjà enregistré n'est pas effacé par le changement d'équipement ; les entrées incompatibles portent un avertissement et peuvent être retirées. Les ustensiles basiques et le réfrigérateur sont supposés disponibles ; les recettes impliquant du froid précisent le repos. Les durées et macros des nouvelles recettes correspondent aux adaptations maison, et non aux temps/valeurs officielles de Marmiton. Les scores maison sont indicatifs.

## Première installation sur GitHub Pages

1. Sauvegarder le dépôt actuel (en particulier les modifications personnelles). Décompresser l'archive et copier **son contenu à la racine du dépôt existant**. Inclure les dossiers `recettes`, `templates`, et le dossier caché `.github/workflows` (le fichier `pages.yml` doit être à cet emplacement exact). En cas de dépôt configuré avec un autre workflow Pages, désactiver ce dernier pour éviter les publications concurrentes.
2. Dans Settings > Pages > Build and deployment > Source, choisir **GitHub Actions**. Ne pas choisir Deploy from a branch. Conserver la même adresse GitHub Pages pour les favoris et menus en local.
3. Dans Actions, sélectionner « À table — publication automatique », Run workflow sur la branche par défaut, puis vérifier que la publication est terminée avec succès. Le workflow se déclenchera ensuite à chaque commit sur cette branche. Si le dépôt n'autorise pas Actions, les activer.

## Ajouter de nouvelles recettes

Dorénavant, un seul fichier JSON par recette, dans `recettes/`. Par exemple `recettes/97.json` (ou tout identifiant libre). Pour une recette sucrée, ajouter `"category": "sweet"` dans le JSON ; pour une recette salée, utiliser `"category": "savory"` ou omettre ce champ. Aucun changement de HTML ou JS n'est nécessaire. Les nouvelles fiches HTML, cartes, compteurs et données sont générés par le workflow après le commit. Pour modifier une recette existante, modifier son JSON. Si un fichier est invalide, la génération échoue explicitement et la version déployée précédente reste disponible.

Utiliser un identifiant entier positif ou nul inédit, correspondant exactement au nom du fichier. Ne pas recycler un identifiant supprimé, pour ne pas confondre les anciens favoris. Les trous dans les identifiants sont acceptés. Chaque source doit être unique. Les unités et quantités sont **par personne**, les scores taste/health sur 100, rating sur 5, reviews le nombre de commentaires relevé à la source, time en minutes (repos inclus si nécessaire), p/c/f/b les protéines/glucides/lipides/fibres en grammes par personne, kcal par personne, side indique un accompagnement seul, veg végétarien. Les appareils autorisés sont plaques, four, micro-ondes, air fryer, mixeur; [] pour une recette ne nécessitant aucun de ces appareils. Les URL des photos doivent être en HTTPS. Les notes et images ne sont pas actualisées automatiquement depuis Marmiton. Les macro-nutriments et indices restent des estimations.

Copier une fiche existante, donner un nouvel identifiant et remplacer toutes les données par les vraies informations de la nouvelle recette. Les anciens fichiers .html que tu avais dans recettes/ peuvent être laissés dans le dépôt : le générateur ne les lit pas. Il ne lit que les .json. Le dossier `_site` est un résultat de génération, pas une source.

## Test local

`python3 build.py` (ou `py -3 build.py` sous Windows), puis ouvrir `_site/index.html` ou servir `_site` par `python3 -m http.server 8000 --directory _site` puis visiter http://localhost:8000. Une archive d’aperçu statique séparée est fournie, prête à ouvrir. Aucun paquet Python externe nécessaire.

Le stockage des favoris et menus utilise la même clé `atable-v7` ; il reste propre au navigateur et à l'origine. Les URL de photos sont externes et nécessitent Internet. Les nouvelles URL sont celles des vignettes Marmiton consultées séparément (souvent 225 × 225 px), et les fiches ont des instructions reformulées. GitHub Actions doit être configuré par le propriétaire du dépôt ; son exécution réelle dans ce dépôt n'a pas été testée ici.

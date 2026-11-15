# À table ! V9 — catalogue automatique

67 recettes, dont les 56 de la V8 + extension, mêmes identifiants et mêmes données. Le site final reste en HTML/CSS/JS natif. Python intervient uniquement à la génération, jamais sur l'iPhone.

## Première installation sur GitHub Pages

1. Sauvegarder le dépôt actuel (en particulier les modifications personnelles). Décompresser l'archive et copier **son contenu à la racine du dépôt existant**. Inclure les dossiers `recettes`, `templates`, et le dossier caché `.github/workflows` (le fichier `pages.yml` doit être à cet emplacement exact). En cas de dépôt configuré avec un autre workflow Pages, désactiver ce dernier pour éviter les publications concurrentes.
2. Dans Settings > Pages > Build and deployment > Source, choisir **GitHub Actions**. Ne pas choisir Deploy from a branch. Conserver la même adresse GitHub Pages pour les favoris et menus en local.
3. Dans Actions, sélectionner « À table — publication automatique », Run workflow sur la branche par défaut, puis vérifier que la publication est terminée avec succès. Le workflow se déclenchera ensuite à chaque commit sur cette branche. Si le dépôt n'autorise pas Actions, les activer.

## Ajouter de nouvelles recettes

Dorénavant, un seul fichier JSON par recette, dans `recettes/`. Par exemple `recettes/67.json`. Aucun changement de HTML ou JS n'est nécessaire. Les nouvelles fiches HTML, cartes, compteurs et données sont générés par le workflow après le commit. Pour modifier une recette existante, modifier son JSON. Si un fichier est invalide, la génération échoue explicitement et la version déployée précédente reste disponible.

Utiliser un identifiant entier positif ou nul inédit, correspondant exactement au nom du fichier. Ne pas recycler un identifiant supprimé, pour ne pas confondre les anciens favoris. Les trous dans les identifiants sont acceptés. Chaque source doit être unique. Les unités et quantités sont **par personne**, les scores taste/health sur 100, rating sur 5, reviews le nombre de commentaires relevé à la source, time en minutes (repos inclus si nécessaire), p/c/f/b les protéines/glucides/lipides/fibres en grammes par personne, kcal par personne, side indique un accompagnement seul, veg végétarien. Les appareils autorisés sont plaques, four, micro-ondes, air fryer, mixeur; [] pour sans cuisson. Les URL des photos doivent être en HTTPS. Les notes et images ne sont pas actualisées automatiquement depuis Marmiton. Les macro-nutriments et indices restent des estimations.

Copier une fiche existante, donner un nouvel identifiant et remplacer toutes les données par les vraies informations de la nouvelle recette. Les anciens fichiers .html que tu avais dans recettes/ peuvent être laissés dans le dépôt : le générateur ne les lit pas. Il ne lit que les .json. Le dossier `_site` est un résultat de génération, pas une source.

## Test local

`python3 build.py` (ou `py -3 build.py` sous Windows), puis ouvrir `_site/index.html` ou servir `_site` par `python3 -m http.server 8000 --directory _site` puis visiter http://localhost:8000. Une archive d’aperçu statique séparée est fournie, prête à ouvrir. Aucun paquet Python externe nécessaire.

Le stockage des favoris et menus utilise la même clé `atable-v7` ; il reste propre au navigateur et à l'origine. Les URL de photos sont externes et nécessitent Internet. Les nouvelles URL ont été consultées séparément, et les fiches ont des instructions reformulées. GitHub Actions doit être configuré par le propriétaire du dépôt ; son exécution réelle dans ce dépôt n'a pas été testée ici.

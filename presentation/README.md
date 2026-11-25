# Presentation KronosPI — GPU Challenge 2026

`index.html` est la presentation autonome (une seule page, navigation aux fleches,
espace, molette ou glisser). Aucune dependance a installer : tout le CSS et le JS sont
dans le fichier, seules les polices viennent de Google Fonts.

## Ouvrir en local

Ouvrir `presentation/index.html` dans un navigateur, ou servir le dossier :

    python3 -m http.server -d presentation 8080

## Mise en ligne

Site statique Render, decrit par `render.yaml` a la racine du depot
(`staticPublishPath: ./presentation`). Chaque push sur `main` redeploie.

## Logos

`logos/` contient les marques citees dans le schema du consortium. Les balises `img`
portent un `onerror` qui retire l'image : si un fichier manque, le nom s'affiche en
texte et la presentation reste lisible.

# Patchacha, maquette v1

Maquette du futur site de Patchacha (Sylviane Caradec), artiste plasticienne à Quimper.
Direction « Couches & effacements ». Site statique, sans étape de construction, prêt pour Vercel.

## Pages
- `index.html` : accueil
- `tableaux.html` : salles d'accrochage, filtres et toutes les œuvres
- `oeuvre.html#slug` : fiche d'une œuvre (ex. `oeuvre.html#arbre-girafe`)

## Données
- `assets/js/data-oeuvres.js` : œuvres, prix, formats, disponibilités, descriptions et images (relevé du site actuel, 23 octobre 2026)
- `assets/js/data-site.js` : contact, témoignages, expositions (triées automatiquement entre à venir et passées), formations

## Démonstration
Panier, paiement, inscription et formulaires sont simulés : rien n'est envoyé.
Les images d'ambiance (`assets/img/grok`) sont générées avec Grok : papiers, pièces, salle d'exposition, paysages, textures. Aucune ne montre d'œuvre de l'artiste ni de lieu réel, et elles sont signalées « Image d'ambiance » à l'écran.
Les pièces de « voir au mur » (salon, bureau, alcôve) sont calées à l'échelle dans `assets/js/data-site.js` : les œuvres y apparaissent à leur taille réelle par rapport au mobilier.

## Bibliothèques hébergées avec le site
GSAP 3.15 (ScrollTrigger, SplitText, Flip, CustomEase), Lenis 1.3, OGL, polices Gloock et Instrument Sans (licence OFL).

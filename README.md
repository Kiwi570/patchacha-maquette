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
Les pièces de « voir au mur » sont dessinées en code en attendant les images Grok.

## Bibliothèques hébergées avec le site
GSAP 3.15 (ScrollTrigger, SplitText, Flip, CustomEase), Lenis 1.3, OGL, polices Gloock et Instrument Sans (licence OFL).

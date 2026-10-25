/* Patchacha — galerie des tableaux et totems */
(function () {
  'use strict';
  const P = window.Patchacha;
  const g = window.gsap;
  const ST = window.ScrollTrigger;
  const { $, $$, esc } = P;

  /* ---------- Le mur d'ouverture : les œuvres viennent s'accrocher ---------- */
  function murOuverture() {
    const mur = $('[data-mur-ouverture]');
    const liste = ['souffle-clair', 'arbre-girafe', 'les-rochers', 'cascade-de-lumiere', 'embruns'].map((s) => P.parSlug[s]);
    const larg = mur.clientWidth - 40, haut = Math.max(260, mur.clientHeight - 110);
    const somme = liste.reduce((t, o) => t + P.dims(o)[0], 0);
    const gap = Math.min(40, larg * .04);
    const k = Math.max(2.2, Math.min(6.5, (larg - gap * (liste.length - 1)) / somme, haut / Math.max(...liste.map((o) => P.dims(o)[1]))));
    mur.innerHTML = liste.map((o) => '<a href="' + P.lienOeuvre(o) + '" data-curseur="Voir" aria-label="' + esc(o.titre) + '" style="text-decoration:none">' + P.cadreHTML(o, k, { eager: true }) + '</a>').join('');
    if (!g || P.calme) return;
    const pieces = $$('.cadre, .toile', mur);
    g.from(pieces, { y: -160, opacity: 0, rotation: (i) => (i % 2 ? 7 : -6), duration: 1.1, stagger: .12, ease: 'power3.out', delay: .35 });
    g.to(pieces, { rotation: (i) => (i % 2 ? -1.2 : 1), duration: .5, stagger: .12, delay: 1.25, ease: 'sine.inOut', yoyo: true, repeat: 1 });
  }

  /* ---------- Les salles ---------- */
  function salles() {
    const mur = $('[data-salles]');
    const section = $('[data-salle-section]');
    const parSerie = Object.keys(P.series).map((cle) => ({ cle, s: P.series[cle], oeuvres: P.oeuvres.filter((o) => o.serie === cle && o.oeuvre) }));
    const maxH = Math.max(...P.oeuvres.filter((o) => o.oeuvre).map((o) => P.dims(o)[1]));
    const tete = $('.salle__entete', section).offsetHeight;
    const k = Math.max(3, Math.min(7, (innerHeight - tete - 48 - 150 - 56) / maxH, (innerWidth * .6) / 60));
    const zone = maxH * k;
    let html = '<div class="salle__axe" style="top:' + (48 + zone / 2) + 'px"><span>Axe d’accrochage, à 155 cm du sol</span></div><div class="salle__piste" data-piste>';
    parSerie.forEach((p, i) => {
      const t = p.oeuvres[0] ? p.oeuvres[0].teinte : '';
      if (i) html += '<span class="salle__separateur" aria-hidden="true"></span>';
      html += '<div class="salle__titre-mur" data-teinte="' + t + '" style="height:' + zone + 'px;align-content:center"><span>' + esc(p.s.titre) + '</span><small>' + esc(p.s.texte) + ' ' + p.oeuvres.length + ' œuvres.</small></div>';
      html += p.oeuvres.map((o) => '<a class="accroche" href="' + P.lienOeuvre(o) + '" data-curseur="Voir" data-teinte="' + o.teinte + '"><div style="height:' + zone + 'px;display:grid;place-items:center">' + P.cadreHTML(o, k) + '</div>' + P.cartelHTML(o) + '</a>').join('');
    });
    html += '</div>';
    mur.innerHTML = html;
    const piste = $('[data-piste]', mur);
    const reperes = $$('.accroche, .salle__titre-mur', piste);
    const accroches = $$('.accroche', piste);
    const compteur = $('[data-compteur]'), jauge = $('[data-jauge]');
    const maj = () => {
      const c = innerWidth / 2; let best = 0, d = 1e9;
      reperes.forEach((a, i) => { const r = a.getBoundingClientRect(); const dd = Math.abs(r.left + r.width / 2 - c); if (dd < d) { d = dd; best = i; } });
      const el = reperes[best];
      if (el.dataset.teinte) section.style.setProperty('--mur-salle', el.dataset.teinte);
      const idx = accroches.indexOf(el.classList.contains('accroche') ? el : reperes.slice(best).find((x) => x.classList.contains('accroche')));
      compteur.textContent = 'Œuvre ' + (Math.max(0, idx) + 1) + ' sur ' + accroches.length;
    };
    if (!g || P.calme || P.mobile()) {
      section.classList.add('sans-pin');
      mur.addEventListener('scroll', () => { maj(); jauge.style.transform = 'scaleX(' + (mur.scrollLeft / Math.max(1, mur.scrollWidth - mur.clientWidth)) + ')'; }, { passive: true });
      maj();
      return;
    }
    const distance = () => Math.max(0, piste.scrollWidth - innerWidth);
    const skew = g.quickTo(piste, 'skewX', { duration: .5, ease: 'power3' });
    g.to(piste, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: section, start: 'top top', end: () => '+=' + distance() * .9, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => { jauge.style.transform = 'scaleX(' + s.progress + ')'; maj(); skew(-Math.max(-1, Math.min(1, s.getVelocity() / 4000)) * 2); },
        onScrubComplete: () => skew(0)
      }
    });
    maj();
  }

  /* ---------- Filtres et grille ---------- */
  const FILTRES = {
    serie: [['tout', 'Toutes']].concat(Object.entries(P.series).map(([k, s]) => [k, s.titre])),
    format: [['tout', 'Tous'], ['mini', '20 × 20 cm'], ['petit', '33 × 20 cm'], ['moyen', '30 × 30 et 30 × 40 cm'], ['grand', '40 × 50 cm et plus']],
    prix: [['tout', 'Tous'], ['bas', 'Jusqu’à 80 €'], ['moyen', '81 à 200 €'], ['haut', 'Plus de 200 €']]
  };
  const etat = { serie: 'tout', format: 'tout', prix: 'tout', dispo: false, tri: 'atelier' };
  const classeFormat = (o) => {
    const [a, b] = P.dims(o).slice().sort((x, y) => x - y);
    if (b <= 20) return 'mini';
    if (b <= 33 && a <= 20) return 'petit';
    if (b <= 40 && a <= 30) return 'moyen';
    return 'grand';
  };
  const classePrix = (o) => (o.prix <= 80 ? 'bas' : o.prix <= 200 ? 'moyen' : 'haut');

  function carte(o) {
    const bouton = o.dispo
      ? '<button class="btn ajouter" type="button" data-adopter="' + o.slug + '">Adopter</button>'
      : '';
    return '<article class="carte-oeuvre" data-oeuvre-carte data-slug="' + o.slug + '" style="--teinte:' + o.teinte + '">' +
      '<a class="carte-oeuvre__scene" href="' + P.lienOeuvre(o) + '" data-curseur="Voir" style="container-type:size" aria-label="' + esc(o.titre) + ', voir la fiche">' + P.cadreHTML(o, P.kAjuste(o, 74, 78, 7)) + '</a>' +
      '<div class="carte-oeuvre__corps">' + P.cartelHTML(o) + '<div class="carte-oeuvre__ligne"><a class="lien" href="' + P.lienOeuvre(o) + '">Voir la fiche</a>' + bouton + '</div></div></article>';
  }

  function grille() {
    const zone = $('[data-grille]');
    zone.innerHTML = P.oeuvres.map(carte).join('');
    Object.entries(FILTRES).forEach(([cle, opts]) => {
      const c = $('[data-filtre="' + cle + '"]');
      c.innerHTML = opts.map(([v, l]) => '<button type="button" data-v="' + v + '" aria-pressed="' + (etat[cle] === v) + '">' + esc(l) + '</button>').join('');
      c.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; etat[cle] = b.dataset.v; appliquer(); });
    });
    $('[data-dispo]').addEventListener('click', (e) => { etat.dispo = !etat.dispo; e.currentTarget.setAttribute('aria-pressed', etat.dispo); appliquer(); });
    $('[data-tri]').addEventListener('change', (e) => { etat.tri = e.target.value; appliquer(); });
    $('[data-deplier]').addEventListener('click', (e) => { const b = $('[data-barre]'); const o = !b.classList.contains('est-deplie'); b.classList.toggle('est-deplie', o); e.currentTarget.setAttribute('aria-expanded', o); });
    P.incliner($$('.carte-oeuvre', zone), 4);
    appliquer(true);
  }

  function appliquer(initial) {
    const zone = $('[data-grille]');
    const cartes = $$('.carte-oeuvre', zone);
    const etatFlip = g && window.Flip && !initial && !P.calme ? window.Flip.getState(cartes) : null;
    const garde = (o) => (etat.serie === 'tout' || o.serie === etat.serie) && (etat.format === 'tout' || classeFormat(o) === etat.format) && (etat.prix === 'tout' || classePrix(o) === etat.prix) && (!etat.dispo || o.dispo);
    let liste = P.oeuvres.filter(garde);
    const surf = (o) => P.dims(o)[0] * P.dims(o)[1];
    if (etat.tri === 'prix-asc') liste.sort((a, b) => a.prix - b.prix);
    if (etat.tri === 'prix-desc') liste.sort((a, b) => b.prix - a.prix);
    if (etat.tri === 'format') liste.sort((a, b) => surf(a) - surf(b));
    const ordre = new Map(liste.map((o, i) => [o.slug, i]));
    cartes.forEach((c) => { const i = ordre.get(c.dataset.slug); c.hidden = i == null; c.style.order = i == null ? 999 : i; });
    let vide = $('.vide', zone);
    if (!liste.length) {
      if (!vide) { vide = document.createElement('div'); vide.className = 'vide'; zone.appendChild(vide); }
      vide.innerHTML = '<p>Aucune œuvre ne correspond à ces critères.</p><div><button class="btn btn--ligne" type="button" data-raz>Afficher toutes les œuvres</button></div>';
      $('[data-raz]', vide).addEventListener('click', () => { Object.assign(etat, { serie: 'tout', format: 'tout', prix: 'tout', dispo: false }); $('[data-dispo]').setAttribute('aria-pressed', 'false'); appliquer(); });
    } else if (vide) vide.remove();
    Object.keys(FILTRES).forEach((cle) => $$('[data-filtre="' + cle + '"] [data-v]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === etat[cle] ? 'true' : 'false')));
    const dispo = liste.filter((o) => o.dispo).length;
    $('[data-resultat]').textContent = liste.length + (liste.length > 1 ? ' œuvres' : ' œuvre') + ', ' + dispo + (dispo > 1 ? ' disponibles' : ' disponible');
    if (etatFlip) window.Flip.from(etatFlip, { duration: .7, ease: 'power3.inOut', absolute: false, nested: true, onEnter: (els) => g.fromTo(els, { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .5 }), onLeave: (els) => g.to(els, { opacity: 0, duration: .3 }) });
    ST && ST.refresh();
  }

  function selonAncre() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (P.series[h]) {
      etat.serie = h; appliquer(true);
      setTimeout(() => P.allerA('#oeuvres'), 250);
    }
  }

  P.pret(() => {
    murOuverture();
    salles();
    grille();
    selonAncre();
    window.addEventListener('hashchange', selonAncre);
    P.encre();
  });
})();

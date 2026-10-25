/* Patchacha — galerie des tableaux et totems */
(function () {
  'use strict';
  const P = window.Patchacha;
  const g = window.gsap;
  const ST = window.ScrollTrigger;
  const { $, $$, esc } = P;

  /* ---------- Le mur d'ouverture : une salle d'exposition, les œuvres viennent s'accrocher à l'échelle ---------- */
  // Calage des images d'ambiance (pixels de l'image d'origine) : cm → px sur le mur du fond, ligne du sol, bords du mur
  const SALLE = {
    paysage: { image: 'galerie-ouverture-salle', cmPx: 1.6, solY: 580, mur: [262, 918], x0: 120, x1: 1060, sol: .1,
      oeuvres: ['souffle-clair', 'arbre-girafe', 'les-rochers', 'cascade-de-lumiere', 'embruns'] },
    portrait: { image: 'galerie-ouverture-salle-mobile', cmPx: 3.1, solY: 925, mur: [100, 755], x0: 60, x1: 755, sol: .09,
      oeuvres: ['arbre-girafe', 'embruns', 'les-rochers'], grappe: true }
  };
  const AXE_CM = 150, ECART_CM = 22;

  function murOuverture() {
    const mur = $('[data-mur-ouverture]');
    let premier = true;
    const dessiner = () => {
      const R = mur.getBoundingClientRect();
      if (!R.width) return;
      const cfg = SALLE[R.width < R.height ? 'portrait' : 'paysage'];
      const ph = P.grok[cfg.image];
      if (!ph) { mur.classList.add('mur-ouverture--simple'); return murSimple(mur); }
      // l'image couvre le cadre, le mur du fond occupe la largeur utile, le sol reste visible en bas
      let s = Math.max(R.width / (cfg.x1 - cfg.x0), R.height / ph.h);
      const offX = Math.min(0, Math.max(R.width - ph.w * s, -cfg.x0 * s));
      const offY = Math.min(0, Math.max(R.height - ph.h * s, R.height * (1 - cfg.sol) - cfg.solY * s));
      const k = cfg.cmPx * s;
      const cx = offX + (cfg.mur[0] + cfg.mur[1]) / 2 * s;
      const axe = offY + (cfg.solY - AXE_CM * cfg.cmPx) * s;
      const liste = cfg.oeuvres.map((sl) => P.parSlug[sl]).filter(Boolean);
      const pos = [];
      if (cfg.grappe && liste.length === 3) {
        // accrochage en grappe : une grande œuvre, deux petites empilées à sa droite
        const [a, b, c] = liste.map((o) => P.dims(o));
        const e = 8;
        const largeur = a[0] + e + Math.max(b[0], c[0]);
        const x0 = -largeur / 2;
        pos.push([x0 + a[0] / 2, 0]);
        const hCol = b[1] + e + c[1];
        pos.push([x0 + a[0] + e + b[0] / 2, -hCol / 2 + b[1] / 2]);
        pos.push([x0 + a[0] + e + c[0] / 2, hCol / 2 - c[1] / 2]);
      } else {
        const tot = liste.reduce((t, o) => t + P.dims(o)[0], 0) + ECART_CM * (liste.length - 1);
        let x = -tot / 2;
        liste.forEach((o) => { const w = P.dims(o)[0]; pos.push([x + w / 2, 0]); x += w + ECART_CM; });
      }
      const src = R.width > 900 ? ph.src : ph.sm;
      mur.innerHTML = '<img class="mur-ouverture__salle" src="' + src + '" alt="" style="left:' + offX.toFixed(1) + 'px;top:' + offY.toFixed(1) + 'px;width:' + (ph.w * s).toFixed(1) + 'px;height:' + (ph.h * s).toFixed(1) + 'px">' +
        liste.map((o, i) => {
          const [w, h] = P.dims(o);
          const l = cx + pos[i][0] * k - (w * k) / 2, t = axe + pos[i][1] * k - (h * k) / 2;
          return '<a class="mur-ouverture__oeuvre" href="' + P.lienOeuvre(o) + '" data-curseur="Voir" aria-label="' + esc(o.titre) + ', voir la fiche" style="left:' + l.toFixed(1) + 'px;top:' + t.toFixed(1) + 'px">' + P.cadreHTML(o, k, { eager: true }) + '</a>';
        }).join('') +
        '<p class="mur-ouverture__legende">Image d’ambiance. Œuvres à l’échelle, centrées à ' + AXE_CM + ' cm du sol.</p>';
      // la lumière vient de la fenêtre, à gauche : les ombres partent vers la droite
      $$('.cadre, .toile', mur).forEach((c) => { c.style.setProperty('--ombre-x', '7'); c.style.setProperty('--ombre-y', '9'); });
      if (premier && g && !P.calme) {
        const pieces = $$('.cadre, .toile', mur);
        g.from(pieces, { y: -160, opacity: 0, rotation: (i) => (i % 2 ? 7 : -6), duration: 1.1, stagger: .12, ease: 'power3.out', delay: .35 });
        g.to(pieces, { rotation: (i) => (i % 2 ? -1.2 : 1), duration: .5, stagger: .12, delay: 1.25, ease: 'sine.inOut', yoyo: true, repeat: 1 });
        g.fromTo($('.mur-ouverture__salle', mur), { scale: 1.06 }, { scale: 1, duration: 2.2, ease: 'power2.out' });
      }
      premier = false;
    };
    dessiner();
    let l = 0, taille = mur.clientWidth + 'x' + mur.clientHeight;
    new ResizeObserver(() => {
      const t = mur.clientWidth + 'x' + mur.clientHeight;
      if (t === taille) return;
      taille = t; cancelAnimationFrame(l); l = requestAnimationFrame(dessiner);
    }).observe(mur);
  }

  // Repli sans image d'ambiance : mur uni
  function murSimple(mur) {
    const liste = ['souffle-clair', 'arbre-girafe', 'les-rochers', 'cascade-de-lumiere', 'embruns'].map((s) => P.parSlug[s]);
    const larg = mur.clientWidth - 40, haut = Math.max(260, mur.clientHeight - 110);
    const somme = liste.reduce((t, o) => t + P.dims(o)[0], 0);
    const gap = Math.min(40, larg * .04);
    const k = Math.max(2.2, Math.min(6.5, (larg - gap * (liste.length - 1)) / somme, haut / Math.max(...liste.map((o) => P.dims(o)[1]))));
    mur.innerHTML = liste.map((o) => '<a href="' + P.lienOeuvre(o) + '" data-curseur="Voir" aria-label="' + esc(o.titre) + '" style="text-decoration:none">' + P.cadreHTML(o, k, { eager: true }) + '</a>').join('');
  }

  /* ---------- Les salles ---------- */
  // Une image d'ambiance (Grok) ouvre chaque salle ; les totems gardent un panneau uni
  const AMBIANCES = { arbres: ['galerie-salle-arbres', '18% 72%'], fleurs: ['galerie-salle-fleurs', '58% 60%'], mer: ['galerie-salle-mer', '40% 50%'], miniatures: ['galerie-salle-petits-formats', '30% 62%'] };
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
      const [cleAmb, cadrage] = AMBIANCES[p.cle] || [];
      const amb = P.grok[cleAmb];
      html += '<div class="salle__titre-mur' + (amb ? ' a-ambiance' : '') + '" data-teinte="' + t + '" style="height:' + zone + 'px;align-content:' + (amb ? 'end' : 'center') + '">' +
        (amb ? '<img class="salle__ambiance" src="' + amb.sm + '" srcset="' + amb.sm + ' 900w, ' + amb.src + ' ' + amb.w + 'w" sizes="400px" alt="" loading="lazy" style="object-position:' + cadrage + '">' : '') +
        '<span>' + esc(p.s.titre) + '</span><small>' + esc(p.s.texte) + ' ' + p.oeuvres.length + ' œuvres.</small></div>';
      html += p.oeuvres.map((o) => '<a class="accroche" href="' + P.lienOeuvre(o) + '" data-curseur="Voir" data-teinte="' + o.teinte + '"><div style="height:' + zone + 'px;display:grid;place-items:center">' + P.cadreHTML(o, k) + '</div>' + P.cartelHTML(o) + '</a>').join('');
    });
    html += '</div>';
    mur.innerHTML = html;
    const piste = $('[data-piste]', mur);
    const reperes = $$('.accroche, .salle__titre-mur', piste);
    const accroches = $$('.accroche', piste);
    const compteur = $('[data-compteur]'), jauge = $('[data-jauge]');
    const ambiances = $$('.salle__ambiance', piste);
    const fond = $('.salle__fond', section);
    const maj = () => {
      // léger décalage de l'image dans son panneau : effet de profondeur
      ambiances.forEach((im) => { const r = im.parentNode.getBoundingClientRect(); const rel = (r.left + r.width / 2 - innerWidth / 2) / innerWidth; im.style.transform = 'translateX(' + (rel * -36).toFixed(1) + 'px) scale(1.14)'; });
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
    const tl = g.timeline({
      scrollTrigger: {
        trigger: section, start: 'top top', end: () => '+=' + distance() * .9, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => { jauge.style.transform = 'scaleX(' + s.progress + ')'; maj(); skew(-Math.max(-1, Math.min(1, s.getVelocity() / 4000)) * 2); },
        onScrubComplete: () => skew(0)
      }
    });
    tl.to(piste, { x: () => -distance(), ease: 'none' }, 0);
    // le mur de la galerie glisse plus lentement que les œuvres
    if (fond) tl.to(fond, { xPercent: -18, ease: 'none' }, 0);
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
    const h = P.ancre();
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

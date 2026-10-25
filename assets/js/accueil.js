/* Patchacha — page d'accueil */
(function () {
  'use strict';
  const P = window.Patchacha;
  const g = window.gsap;
  const ST = window.ScrollTrigger;
  const { $, $$, esc } = P;

  /* ---------- Ouverture orchestrée (< 3 s) ---------- */
  function ouverture() {
    return new Promise((fini) => {
      if (P.calme || !g) { const pre = $('.ouverture-pre'); pre && pre.remove(); fini(); return; }
      const dejaVu = P.session.get('ouverture') === '1';
      P.session.set('ouverture', '1');
      const o = document.createElement('div');
      o.className = 'ouverture'; o.setAttribute('aria-hidden', 'true');
      o.innerHTML = '<div class="ouverture__voile"></div>' +
        '<div class="ouverture__centre"><svg viewBox="0 0 420 300"><g fill="none" stroke="#1C1A17" stroke-width="1.4" stroke-linecap="round">' +
        '<path d="M210,300 C206,240 214,190 210,140 C207,104 196,80 172,58"/><path d="M210,170 C236,150 262,140 300,138 C330,137 352,124 370,100"/>' +
        '<path d="M208,120 C184,110 160,112 132,124 C110,134 86,132 62,118"/><path d="M300,138 C306,118 318,102 338,92 M172,58 C168,40 170,24 182,8 M132,124 C126,104 112,92 92,86"/>' +
        '<path d="M250,146 C256,128 268,116 286,110 M190,96 C178,80 160,74 140,76"/></g></svg></div>' +
        '<img class="ouverture__logo" src="' + P.photos.logo.src + '" alt="">';
      document.body.appendChild(o);
      const fondVoile = $('.ouverture__voile', o);
      Object.assign(fondVoile.style, { position: 'absolute', inset: '0' });
      const voile = new P.Voile(fondVoile, { progress: 0, graine: 3.3 });
      const traits = $$('path', o);
      traits.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
      const logo = $('.ouverture__logo', o);
      const retirerPre = () => { const pre = $('.ouverture-pre'); pre && pre.remove(); };
      const tl = g.timeline({ onComplete: () => { voile.detruire(); o.remove(); } });
      if (dejaVu) {
        g.set($('.ouverture__centre', o), { opacity: 0 });
        tl.add(() => { retirerPre(); voile.vers(1, 1.0, 'power2.inOut'); }, .05).add(() => fini(), .15).to({}, { duration: 1.1 });
        return;
      }
      tl.add(retirerPre, 0).to(traits, { strokeDashoffset: 0, duration: 1.0, stagger: .08, ease: 'power2.inOut' }, 0)
        .fromTo(logo, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: .45, ease: 'back.out(2)' }, .75)
        .to([$('.ouverture__centre', o), logo], { opacity: 0, duration: .5, ease: 'power1.in' }, 1.45)
        .add(() => fini(), 1.35)
        .add(() => { voile.vers(1, 1.25, 'power2.inOut'); }, 1.4)
        .to({}, { duration: 1.3 }, 1.4);
    });
  }

  /* ---------- Héros ---------- */
  function heros() {
    const o = P.parSlug['arbre-girafe'];
    const lien = $('[data-heros-cadre]');
    const largeur = Math.min(lien.closest('.heros__scene').clientWidth - 40, 620);
    const k = Math.max(4, largeur / o.cadreCm[0]);
    lien.innerHTML = P.cadreHTML(o, k, { grand: true, eager: true });
    $('[data-heros-cartel]').innerHTML = P.cartelHTML(o) + '<a class="lien discret" href="' + P.lienOeuvre(o) + '">Découvrir l’histoire de cette œuvre</a>';
    // feuilles de papier déchiré derrière le cadre, en parallaxe
    const feuilles = $$('.feuilles-fond i');
    feuilles.forEach((f, i) => { f.style.clipPath = P.dechire(17 + i * 31); });
    if (!P.calme && !P.tactile() && g) {
      const qs = feuilles.map((f, i) => [g.quickTo(f, 'x', { duration: 1.2, ease: 'power3' }), g.quickTo(f, 'y', { duration: 1.2, ease: 'power3' }), (i + 1) * 9]);
      window.addEventListener('pointermove', (e) => {
        const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
        qs.forEach(([qx, qy, f]) => { qx(-x * f); qy(-y * f); });
      }, { passive: true });
    }
    if (g && !P.calme) {
      ST.create({ trigger: '.heros', start: 'top top', end: 'bottom top', scrub: true, animation: g.timeline().to(feuilles, { yPercent: (i) => -8 - i * 6, rotation: (i) => (i - 1) * 2, ease: 'none' }, 0).to(lien, { yPercent: -6, ease: 'none' }, 0) });
    }
  }

  function herosEntree() {
    if (!g || P.calme) return;
    const nom = $('.heros__nom');
    const sp = window.SplitText ? new window.SplitText(nom, { type: 'chars', charsClass: 'lettre' }) : null;
    const tl = g.timeline();
    if (sp) tl.from(sp.chars, { opacity: .25, filter: 'blur(10px)', yPercent: 12, duration: 1.4, stagger: .05, ease: 'power3.out', clearProps: 'filter' }, 0);
    tl.from('.heros__texte > :not(h1)', { opacity: .4, y: 16, duration: 1, stagger: .08 }, .2)
      .from('.feuilles-fond i', { opacity: .2, scale: .94, rotation: (i) => (i - 1) * 6, duration: 1.4, stagger: .1, ease: 'power3.out' }, 0)
      .from('[data-heros-cadre] .cadre', { y: -28, rotation: -1.2, duration: 1.3, ease: 'elastic.out(1, .55)' }, .15);
  }

  /* ---------- Une peinture de la lenteur ---------- */
  function lenteur() {
    const pile = $('[data-pile]');
    const finie = P.parSlug['les-doigts-geles'];
    const images = [
      P.grok['accueil-lenteur-table-atelier']
        ? { ...P.grok['accueil-lenteur-table-atelier'], alt: 'Papiers faits main, encres et pinceau posés sur une table en bois, image d’ambiance', legende: 'Papiers, encres, pinceau : la matière avant le geste.' }
        : { ...P.photos['main-dessin'], legende: 'L’arbre commence à l’encre, à main levée.' },
      { ...P.photos['detail-echinacees'], legende: 'Détail : papiers superposés, lavis, transparences.' },
      { src: finie.vues[0].src, w: finie.vues[0].w, h: finie.vues[0].h, alt: finie.vues[0].alt, legende: 'Les doigts gelés, encadré, ' + finie.dimTexte.cadre + '.' }
    ];
    pile.innerHTML = images.map((im, i) => '<figure data-couche="' + i + '"' + (i ? ' style="opacity:' + (P.mobile() || P.calme ? 1 : 0) + '"' : '') + '><img src="' + im.src + '" alt="' + esc(im.alt) + '" width="' + im.w + '" height="' + im.h + '" loading="lazy"><figcaption>' + esc(im.legende) + '</figcaption></figure>').join('');
    const grille = $('[data-lenteur]');
    if (!g || P.calme || P.mobile()) return;
    grille.classList.add('js-pin');
    const voileEl = document.createElement('div'); voileEl.className = 'voile';
    pile.appendChild(voileEl);
    const voile = new P.Voile(voileEl, { progress: 1, graine: 8.1 });
    const couches = $$('[data-couche]', pile), etapes = $$('[data-etape]');
    let courant = 0, enCours = Promise.resolve();
    const montrer = (i) => {
      if (i === courant) return;
      const cible = i; courant = i;
      etapes.forEach((e, j) => e.classList.toggle('est-active', j === cible));
      enCours = enCours.then(async () => {
        await voile.vers(.12, .55, 'power2.in');
        couches.forEach((c, j) => { c.style.opacity = j === cible ? 1 : 0; });
        await voile.vers(1, 1.1, 'power2.out');
      });
    };
    // Ralentir : le défilement devient plus doux dans la section
    const lettres = window.SplitText ? new window.SplitText($('[data-ralentir]'), { type: 'chars', charsClass: 'lettre' }).chars : [];
    g.set(lettres, { opacity: 0 });
    ST.create({
      trigger: grille, start: 'top top', end: '+=180%', pin: true, scrub: .6,
      onUpdate: (s) => {
        montrer(Math.min(2, Math.floor(s.progress * 3)));
        lettres.forEach((l, j) => { l.style.opacity = Math.max(0, Math.min(1, s.progress * 9 - j * .9)); });
      },
      onToggle: (s) => { if (P.lenis) P.lenis.options.lerp = s.isActive ? .035 : .085; }
    });
  }

  /* ---------- Salle horizontale ---------- */
  const SELECTION = ['arbre-girafe', 'embruns', 'elan-sauvage', 'les-doigts-geles', 'murmure-des-herbes', 'clairiere-haute', 'veille-silencieuse', 's-evader', 'offrande', 'arbre-bleu'];
  function salle() {
    const mur = $('[data-salle]');
    const liste = SELECTION.map((s) => P.parSlug[s]).filter(Boolean);
    const maxH = Math.max(...liste.map((o) => P.dims(o)[1]));
    const tete = $('[data-salle-section] .salle__entete').offsetHeight;
    const k = Math.max(3.2, Math.min(9.5, (innerHeight - tete - 48 - 150 - 56) / maxH, (innerWidth * .62) / 50));
    const hautZone = maxH * k;
    mur.innerHTML = '<div class="salle__axe" style="top:' + (48 + hautZone / 2) + 'px"><span>Axe d’accrochage, à 155 cm du sol</span></div>' +
      '<div class="salle__piste" data-piste>' + liste.map((o) =>
        '<a class="accroche" href="' + P.lienOeuvre(o) + '" data-curseur="Voir" data-teinte="' + o.teinte + '"><div style="height:' + hautZone + 'px;display:grid;place-items:center">' + P.cadreHTML(o, k) + '</div>' + P.cartelHTML(o) + '</a>').join('') + '</div>';
    const piste = $('[data-piste]', mur);
    const section = $('[data-salle-section]');
    const accroches = $$('.accroche', piste);
    const compteur = $('[data-compteur]'), jauge = $('[data-jauge]');
    const majTeinte = () => {
      const c = innerWidth / 2; let best = 0, d = 1e9;
      accroches.forEach((a, i) => { const r = a.getBoundingClientRect(); const dd = Math.abs(r.left + r.width / 2 - c); if (dd < d) { d = dd; best = i; } });
      section.style.setProperty('--mur-salle', accroches[best].dataset.teinte);
      compteur.textContent = (best + 1) + ' sur ' + accroches.length;
      return best;
    };
    if (!g || P.calme || P.mobile()) {
      section.classList.add('sans-pin');
      mur.addEventListener('scroll', () => { majTeinte(); jauge.style.transform = 'scaleX(' + (mur.scrollLeft / Math.max(1, mur.scrollWidth - mur.clientWidth)) + ')'; }, { passive: true });
      majTeinte();
      return;
    }
    const distance = () => Math.max(0, piste.scrollWidth - innerWidth);
    const skew = g.quickTo(piste, 'skewX', { duration: .5, ease: 'power3' });
    g.to(piste, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: section, start: 'top top', end: () => '+=' + distance(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => {
          jauge.style.transform = 'scaleX(' + s.progress + ')';
          majTeinte();
          const v = Math.max(-1, Math.min(1, s.getVelocity() / 4000));
          skew(-v * 2.2);
        },
        onScrubComplete: () => skew(0)
      }
    });
    majTeinte();
  }

  /* ---------- Séries ---------- */
  function series() {
    const zone = $('[data-series]');
    const vitrines = { arbres: 'clairiere-haute', fleurs: 'souffle-clair', mer: 'embruns', miniatures: 'les-rochers', totems: 'cercle-de-lumiere' };
    zone.innerHTML = Object.entries(P.series).map(([cle, s]) => {
      const oeuvres = P.oeuvres.filter((o) => o.serie === cle);
      const dispo = oeuvres.filter((o) => o.dispo);
      const prix = dispo.map((o) => o.prix);
      const v = P.parSlug[vitrines[cle]];
      const fourchette = prix.length ? (Math.min(...prix) === Math.max(...prix) ? P.euro(prix[0]) : 'de ' + P.euro(Math.min(...prix)) + ' à ' + P.euro(Math.max(...prix))) : '';
      return '<a class="serie-carte" href="tableaux.html#' + cle + '" data-page style="--teinte:' + v.teinte + '" data-curseur="Entrer">' +
        '<div class="serie-carte__scene" style="container-type:size">' + P.cadreHTML(v, P.kAjuste(v, 70, 74, 6)) + '</div>' +
        '<div><h3>' + esc(s.titre) + '</h3><p>' + esc(s.texte) + '</p></div>' +
        '<p class="compte">' + oeuvres.length + ' œuvres, dont ' + dispo.length + ' disponibles' + (fourchette ? ', ' + fourchette : '') + '</p></a>';
    }).join('');
    P.incliner($$('.serie-carte', zone), 6);
  }

  /* ---------- Regards ---------- */
  function regards() {
    $('[data-regards]').innerHTML = P.site.temoignages.map((t) => '<blockquote><p data-encre>« ' + esc(t.texte) + ' »</p><footer>' + esc(t.nom) + ', ' + esc(t.ville) + '</footer></blockquote>').join('');
  }

  /* ---------- Textiles et formations ---------- */
  function textiles() {
    const libelles = { 'grande-etole-soie-sauvage': 'Grande étole en soie sauvage, environ 60 × 190 cm', 'foulard-coton-kala': 'Foulard en coton kala, 45 × 180 cm', 'carnet-soie': 'Carnet A5, couverture en soie' };
    $('[data-textiles]').innerHTML = P.textiles.map((t) => '<div><span>' + esc(libelles[t.slug] || t.titre) + '</span><b>' + (t.dispo ? P.euro(t.prix) : 'Épuisé') + '</b></div>').join('');
    $('[data-formations]').innerHTML = P.site.formations.map((f) => '<li>' + esc(f) + '</li>').join('');
  }

  /* ---------- Rendez-vous ---------- */
  const MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
  const jour = (s) => new Date(s + 'T12:00:00');
  function periode(r) {
    if (r.periode) return r.periode;
    const a = jour(r.debut), b = jour(r.fin);
    if (r.debut === r.fin) return a.getDate() + ' ' + MOIS.format(a) + ' ' + a.getFullYear();
    if (a.getMonth() === b.getMonth()) return 'du ' + a.getDate() + ' au ' + b.getDate() + ' ' + MOIS.format(b) + ' ' + b.getFullYear();
    return 'du ' + a.getDate() + ' ' + MOIS.format(a) + ' au ' + b.getDate() + ' ' + MOIS.format(b) + ' ' + b.getFullYear();
  }
  function rendezvous() {
    const auj = new Date(); auj.setHours(0, 0, 0, 0);
    const L = P.site.lieux;
    const tous = P.site.rendezvous.map((r) => ({ ...r, fini: jour(r.fin) < auj, enCours: jour(r.debut) <= auj && jour(r.fin) >= auj }));
    const avenir = tous.filter((r) => !r.fini).sort((a, b) => a.debut.localeCompare(b.debut));
    const passes = tous.filter((r) => r.fini).sort((a, b) => b.fin.localeCompare(a.fin));
    const prochain = avenir[0];
    let html = '';
    if (prochain) {
      const jours = Math.round((jour(prochain.debut) - auj) / 864e5);
      const quand = prochain.enCours ? 'En ce moment' : jours === 0 ? 'Aujourd’hui' : jours === 1 ? 'Demain' : 'Dans ' + jours + ' jours';
      html += '<div class="prochain"><span class="discret">Prochain rendez-vous</span><span class="compte-a-rebours">' + quand + '</span><span>' + esc(prochain.titre) + ', ' + esc(L[prochain.lieu].nom) + ', le ' + esc(periode(prochain)) + '</span></div>';
    }
    html += '<ul class="liste-rdv">' + avenir.map((r) => {
      const a = jour(r.debut);
      return '<li><div class="date-bloc"><b>' + a.getDate() + '</b><span>' + MOIS.format(a) + '</span></div><div><h3>' + esc(r.titre) + '</h3><p><span class="etiquette etiquette--avenir">À venir</span>' + esc(r.adresse || L[r.lieu].nom) + '</p><p>' + esc(periode(r)) + (r.horaires ? ', ' + esc(r.horaires) : '') + '</p>' + (r.texte ? '<p>' + esc(r.texte) + '</p>' : '') + '</div></li>';
    }).join('') + '</ul>';
    html += '<div class="atelier-rdv"><span class="statut">Atelier ouvert sur rendez-vous uniquement</span><h3>Visitez l’atelier à Quimper</h3><p class="discret">En dehors des expositions, c’est au cœur de l’atelier que les toiles prennent vie. L’occasion de prendre le temps, au calme, de ressentir la matière et la lumière de chaque tableau.</p><div><a class="btn btn--ligne" href="#contact" data-rdv-atelier>Prendre rendez-vous à l’atelier</a></div></div>';
    $('[data-rdv-avenir]').innerHTML = html;
    $('[data-rdv-atelier]').addEventListener('click', () => { const s = $('#ct-sujet'); if (s) s.value = 'Une visite de l’atelier'; });

    // Carte des rendez-vous (projection équirectangulaire, échelle réelle)
    const lon0 = -4.66, lat1 = 48.26, cosL = Math.cos(48.05 * Math.PI / 180), Sx = 520;
    const X = (lon) => (lon - lon0) * cosL * Sx, Y = (lat) => (lat1 - lat) * Sx;
    const W = Math.round(X(-2.86)), H = Math.round(Y(47.82));
    const q = L.quimper;
    const statut = {};
    tous.forEach((r) => { const s = r.fini ? 'passe' : 'avenir'; if (statut[r.lieu] !== 'avenir') statut[r.lieu] = s; });
    P.site.autresLieux.forEach((a) => { if (!statut[a.lieu]) statut[a.lieu] = 'passe'; });
    const etiq = { quimper: [8, -8, 'start'], concarneau: [8, 14, 'start'], fouesnant: [10, 2, 'start'], garennes: [-8, 16, 'end'], foret: [8, -8, 'start'], chateaulin: [8, 4, 'start'], pontivy: [-8, -8, 'end'], audierne: [-2, 18, 'start'], pontcroix: [6, -8, 'start'] };
    let svg = '<svg viewBox="-10 -14 ' + (W + 20) + ' ' + (H + 40) + '" role="img" aria-labelledby="carte-titre"><title id="carte-titre">Carte des lieux d’exposition autour de l’atelier de Quimper</title>';
    Object.entries(statut).forEach(([k]) => { if (k === 'quimper') return; const p = L[k]; svg += '<path class="fil" d="M' + X(q.lon).toFixed(1) + ',' + Y(q.lat).toFixed(1) + ' Q' + ((X(q.lon) + X(p.lon)) / 2).toFixed(1) + ',' + (Math.min(Y(q.lat), Y(p.lat)) - 26).toFixed(1) + ' ' + X(p.lon).toFixed(1) + ',' + Y(p.lat).toFixed(1) + '"/>'; });
    Object.entries(statut).forEach(([k, s]) => {
      const p = L[k]; const [dx, dy, an] = etiq[k] || [8, -6, 'start'];
      const cls = k === 'quimper' ? 'point point--atelier' : s === 'avenir' ? 'point point--avenir' : 'point';
      svg += '<circle class="' + cls + '" cx="' + X(p.lon).toFixed(1) + '" cy="' + Y(p.lat).toFixed(1) + '" r="' + (k === 'quimper' ? 5 : 4) + '"/><text x="' + (X(p.lon) + dx).toFixed(1) + '" y="' + (Y(p.lat) + dy).toFixed(1) + '" text-anchor="' + an + '">' + esc(p.nom) + (k === 'quimper' ? ', l’atelier' : '') + '</text>';
    });
    // échelle de 20 km et nord
    const km20 = 20 / 111.2 * Sx;
    svg += '<g transform="translate(0,' + (H + 10) + ')"><path d="M0,0 H' + km20.toFixed(1) + ' M0,-4 V4 M' + km20.toFixed(1) + ',-4 V4" stroke="currentColor" fill="none" style="stroke:var(--encre)"/><text x="' + (km20 / 2).toFixed(1) + '" y="16" text-anchor="middle">20 km</text></g>';
    svg += '<g transform="translate(' + (W - 10) + ',6)"><path d="M0,14 L5,0 L10,14 L5,10 Z" style="fill:var(--encre)"/><text x="5" y="28" text-anchor="middle">N</text></g>';
    const dParis = Math.round(Math.hypot((L.paris.lon - q.lon) * Math.cos(48.4 * Math.PI / 180), L.paris.lat - q.lat) * 111.2);
    svg += '<text x="' + (W - 4) + '" y="' + (Y(48.0) - 30).toFixed(1) + '" text-anchor="end">Paris, à ' + dParis + ' km à vol d’oiseau</text></svg>';
    const photos = ['expo-st-fiacre', 'expo-concarneau', 'expo-grand-atelier-entree'].map((k) => P.photos[k]);
    $('[data-rdv-carte]').innerHTML = '<div class="carte-rdv"><div class="carte-rdv__defile">' + svg + '</div><div class="legende"><span><i style="background:var(--bleu-logo)"></i>L’atelier</span><span><i style="background:var(--rouge)"></i>À venir</span><span><i></i>Déjà venue</span><span>Positions approximatives</span></div></div>' +
      '<div class="photos-expo">' + photos.map((p) => '<img src="' + (p.sm || p.src) + '" alt="' + esc(p.alt) + '" loading="lazy">').join('') + '</div>' +
      '<h3 class="h-petit">Expositions récentes</h3><ul class="liste-rdv">' + passes.map((r) => '<li class="passe"><div class="date-bloc"><span>' + esc(periode(r).replace(/^du /, '')) + '</span></div><div><h3>' + esc(r.titre) + '</h3><p><span class="etiquette">Passée</span>' + esc(L[r.lieu].nom) + '</p>' + (r.texte ? '<p>' + esc(r.texte) + '</p>' : '') + '</div></li>').join('') +
      P.site.autresLieux.map((a) => '<li class="passe"><div class="date-bloc"><span class="a-completer">' + esc(a.note) + '</span></div><div><h3>' + esc(a.titre) + '</h3><p><span class="etiquette">Passée</span>' + esc(L[a.lieu].nom) + '</p></div></li>').join('') + '</ul>';
    // les fils se tracent
    if (g && !P.calme) {
      const fils = $$('.carte-rdv .fil');
      fils.forEach((f) => { const l = f.getTotalLength(); f.style.strokeDasharray = l; f.style.strokeDashoffset = l; });
      g.to(fils, { strokeDashoffset: 0, duration: 1.6, stagger: .12, ease: 'power2.inOut', scrollTrigger: { trigger: '.carte-rdv', start: 'top 85%', once: true }, onComplete: () => fils.forEach((f) => { f.style.strokeDasharray = '3 4'; f.style.strokeDashoffset = 0; }) });
      g.from('.carte-rdv circle', { scale: 0, transformOrigin: '50% 50%', duration: .6, stagger: .06, ease: 'back.out(3)', scrollTrigger: { trigger: '.carte-rdv', start: 'top 85%', once: true } });
    }
  }

  /* ---------- Lumière rasante sur la carte des volumes ---------- */
  function univers() {
    $$('[data-lumiere]').forEach((a) => a.addEventListener('pointermove', (e) => {
      const r = a.getBoundingClientRect();
      a.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      a.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }));
  }

  /* ---------- Lettre d'information : les feuilles se posent sur le lin ---------- */
  function lettre() {
    const fond = $('.newsletter__fond');
    if (!fond) { P.derive($('.newsletter')); return; }
    if (!g || P.calme) return;
    g.fromTo(fond, { scale: 1.16, rotation: -1.2 }, { scale: 1, rotation: 0, ease: 'none', scrollTrigger: { trigger: '.newsletter', start: 'top bottom', end: 'center center', scrub: .8 } });
  }

  P.pret(async () => {
    heros();
    lenteur();
    salle();
    new P.VoirAuMur($('[data-voir-au-mur]'), { oeuvre: P.parSlug['clairiere-haute'] });
    series();
    regards();
    textiles();
    rendezvous();
    univers();
    lettre();
    P.traces();
    await ouverture();
    herosEntree();
    P.encre();
    ST && ST.refresh();
  });
})();

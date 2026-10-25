/* Patchacha — fiche d'une œuvre */
(function () {
  'use strict';
  const P = window.Patchacha;
  const g = window.gsap;
  const ST = window.ScrollTrigger;
  const { $, $$, esc } = P;
  let voile = null, vueCourante = 0, oeuvre = null, mur = null;

  const slugCourant = () => { const h = P.ancre(); return P.parSlug[h] ? h : P.oeuvres[0].slug; };

  function paragraphes(txt) {
    const phrases = txt.replace(/\s*👉\s*/g, ' ').match(/[^.!?…]+[.!?…]+["»”]?\s*|[^.!?…]+$/g) || [txt];
    const n = phrases.length, par = Math.max(1, Math.round(n / 3));
    const out = [];
    for (let i = 0; i < n; i += par) out.push(phrases.slice(i, i + par).join('').trim());
    return out.filter(Boolean).map((p) => '<p>' + esc(p) + '</p>').join('');
  }

  function ligne(dt, dd, brut) { return '<div><dt>' + esc(dt) + '</dt><dd>' + (brut ? dd : esc(dd)) + '</dd></div>'; }

  function caracteristiques(o) {
    let h = '';
    if (P.estTotem(o)) {
      h += ligne('Technique', 'Assemblage textile et bois, travail du volume et des textures. Tableau en relief.');
      if (o.materiaux) h += ligne('Matériaux', o.materiaux.charAt(0).toUpperCase() + o.materiaux.slice(1) + '.');
      h += ligne('Format', o.dimTexte.format);
      h += ligne('Série', 'Totems végétaux');
      h += ligne('Accrochage', 'Système prévu au dos, prêt à être suspendu.');
    } else {
      h += ligne('Technique', o.technique.charAt(0).toUpperCase() + o.technique.slice(1) + '.');
      h += ligne('Format de l’œuvre', o.dimTexte.oeuvre);
      h += ligne('Livrée encadrée', o.dimTexte.cadre + ', sous verre' + (o.finition ? ', ' + o.finition : ''));
      h += ligne('Accrochage', 'Système d’accrochage au dos du cadre, prête à accrocher.');
    }
    if (o.theme) h += ligne('Thème', o.theme.charAt(0).toUpperCase() + o.theme.slice(1));
    if (o.couleurs) h += ligne('Couleurs dominantes', o.couleurs.charAt(0).toUpperCase() + o.couleurs.slice(1));
    h += ligne('Année', o.annee ? String(o.annee) : '<span class="a-completer">à compléter</span>', true);
    h += ligne('Authenticité', 'Œuvre originale, pièce unique signée. Certificat d’authenticité et facture fournis.');
    return h;
  }

  function carte(o) {
    return '<article class="carte-oeuvre" data-oeuvre-carte style="--teinte:' + o.teinte + '">' +
      '<a class="carte-oeuvre__scene" href="' + P.lienOeuvre(o) + '" data-curseur="Voir" style="container-type:size" aria-label="' + esc(o.titre) + ', voir la fiche">' + P.cadreHTML(o, P.kAjuste(o, 74, 78, 7)) + '</a>' +
      '<div class="carte-oeuvre__corps">' + P.cartelHTML(o) + '</div></article>';
  }

  /* ---------- Visionneuse, loupe et transitions ---------- */
  function afficherVue(i, anim) {
    const o = oeuvre; const v = o.vues[i]; if (!v) return;
    vueCourante = i;
    const img = $('[data-vue-img]');
    const poser = () => {
      img.src = v.src; img.alt = v.alt || P.altOeuvre(o);
      img.width = v.w; img.height = v.h;
      $('[data-vue-legende]').textContent = v.alt ? v.alt.replace(/\.$/, '') : '';
      $('[data-vue-compte]').textContent = 'Vue ' + (i + 1) + ' sur ' + o.vues.length;
      $$('[data-miniatures] button').forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
    };
    if (!anim || !voile || P.calme) { poser(); return; }
    voile.vers(.1, .45, 'power2.in').then(() => {
      poser();
      const fin = () => voile.vers(1, 1, 'power2.out');
      if (img.complete) fin(); else img.addEventListener('load', fin, { once: true });
    });
  }

  function loupe() {
    const zone = $('[data-vue]'), l = $('.loupe', zone), img = $('[data-vue-img]');
    if (P.tactile()) return;
    const Z = 2.4;
    zone.addEventListener('pointermove', (e) => {
      const r = zone.getBoundingClientRect();
      const nw = img.naturalWidth || 1200, nh = img.naturalHeight || 1200;
      const s = Math.min(r.width / nw, r.height / nh);
      const dw = nw * s, dh = nh * s, ox = (r.width - dw) / 2, oy = (r.height - dh) / 2;
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const dedans = x > ox && x < ox + dw && y > oy && y < oy + dh;
      l.classList.toggle('est-visible', dedans);
      if (!dedans) return;
      l.style.left = (x - 95) + 'px'; l.style.top = (y - 95) + 'px';
      l.style.backgroundImage = 'url("' + img.currentSrc + '")';
      l.style.backgroundSize = (dw * Z) + 'px ' + (dh * Z) + 'px';
      l.style.backgroundPosition = (-(x - ox) * Z + 95) + 'px ' + (-(y - oy) * Z + 95) + 'px';
    });
    zone.addEventListener('pointerleave', () => l.classList.remove('est-visible'));
  }

  /* ---------- Rendu de la fiche ---------- */
  function rendre(premier) {
    const o = (oeuvre = P.parSlug[slugCourant()]);
    const serie = P.series[o.serie];
    document.title = o.titre + ', Patchacha';
    const fiche = $('[data-fiche]');
    fiche.style.backgroundColor = o.teinte;
    fiche.style.setProperty('--encre-3', '#5F594F'); // gris secondaire plus soutenu sur la teinte de l'œuvre (≥ 4,5:1)
    $('[data-ariane-serie]').textContent = serie.titre;
    $('[data-ariane-serie]').href = 'tableaux.html#' + o.serie;
    $('[data-ariane-titre]').textContent = o.titre;
    $('[data-serie-lien]').textContent = 'Série ' + serie.titre;
    $('[data-serie-lien]').href = 'tableaux.html#' + o.serie;
    $('[data-titre]').textContent = o.titre;
    $('[data-prix]').innerHTML = o.dispo
      ? '<b>' + P.euro(o.prix) + '</b><span class="dispo">Disponible, pièce unique</span><small>TVA non applicable, article 293 B du CGI. Frais de livraison calculés à la commande.</small>'
      : '<b>Vendue</b><span class="dispo-vendue"><i class="pastille" aria-hidden="true"></i> Cette œuvre a trouvé sa place</span><small>Prix de vente indiqué sur le site : ' + P.euro(o.prix) + '.</small>';
    $('[data-actions]').innerHTML = (o.dispo ? '<button class="btn" type="button" data-aimant data-adopter="' + o.slug + '">Adopter cette œuvre</button>' : '<a class="btn" href="index.html#lettre" data-page>Être prévenu des nouvelles œuvres</a>') +
      '<button class="btn btn--ligne" type="button" data-question>Poser une question</button><a class="btn btn--ligne" href="#voir-au-mur">La voir sur un mur</a>';
    $('[data-question]').addEventListener('click', () => P.questionOeuvre(o));
    $('[data-caracteristiques]').innerHTML = caracteristiques(o);
    $('[data-livraison]').textContent = 'Expédition sous 3 jours ouvrés avec un numéro de suivi, depuis l’atelier en Bretagne. Emballage soigné et solide.' + (o.retrait ? ' Possibilité de retrait à l’atelier, à Quimper.' : '');
    $('[data-description]').innerHTML = paragraphes(o.description);
    $('[data-nom-site]').innerHTML = 'Sur le site actuel : <a class="lien" href="' + o.url + '" target="_blank" rel="noopener">' + esc(o.nomSite) + '</a>';
    $('[data-miniatures]').innerHTML = o.vues.map((v, i) => '<button type="button" data-i="' + i + '" aria-label="Vue ' + (i + 1) + '"><img src="' + v.sm + '" alt="" loading="lazy"></button>').join('');
    afficherVue(0, false);
    // Voir au mur
    const liste = P.oeuvres.filter((x) => x.oeuvre && (x.dispo || x.slug === o.slug));
    if (o.oeuvre) {
      $('#voir-au-mur').hidden = false;
      if (!mur) mur = new P.VoirAuMur($('[data-voir-au-mur]'), { oeuvres: liste, oeuvre: o });
      else { mur.liste = liste; mur.oeuvre = o; mur.construire(); }
    } else $('#voir-au-mur').hidden = true;
    // Dans le même esprit
    const memes = P.oeuvres.filter((x) => x.serie === o.serie && x.slug !== o.slug);
    $('[data-rangee]').innerHTML = memes.map(carte).join('');
    // précédente / suivante
    const i = P.oeuvres.indexOf(o);
    const prec = P.oeuvres[(i - 1 + P.oeuvres.length) % P.oeuvres.length], suiv = P.oeuvres[(i + 1) % P.oeuvres.length];
    $('[data-suivantes]').innerHTML = '<a href="' + P.lienOeuvre(prec) + '"><span>Œuvre précédente</span><b>' + esc(prec.titre) + '</b></a><a href="' + P.lienOeuvre(suiv) + '"><span>Œuvre suivante</span><b>' + esc(suiv.titre) + '</b></a>';
    if (!premier) {
      window.scrollTo(0, 0); P.lenis && P.lenis.scrollTo(0, { immediate: true });
      if (voile) { voile.regler(0); voile.vers(1, 1.2, 'power2.out'); }
    }
    ST && ST.refresh();
  }

  P.pret(() => {
    rendre(true);
    // voile de révélation sur la visionneuse
    const zone = $('[data-vue]');
    const el = document.createElement('div'); el.className = 'voile';
    zone.appendChild(el);
    voile = new P.Voile(el, { progress: P.calme ? 1 : 0, graine: 5.7 });
    if (!P.calme) {
      const img = $('[data-vue-img]');
      const go = () => setTimeout(() => voile.vers(1, 1.5, 'power2.out'), P.session.get('transition') === '1' ? 500 : 150);
      if (img.complete) go(); else img.addEventListener('load', go, { once: true });
    }
    $('[data-miniatures]').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b && +b.dataset.i !== vueCourante) afficherVue(+b.dataset.i, true); });
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') afficherVue((vueCourante + 1) % oeuvre.vues.length, true);
      if (e.key === 'ArrowLeft') afficherVue((vueCourante - 1 + oeuvre.vues.length) % oeuvre.vues.length, true);
    });
    zone.tabIndex = 0;
    zone.setAttribute('aria-label', 'Visionneuse : flèches gauche et droite pour changer de vue');
    loupe();
    window.addEventListener('hashchange', () => { if (P.parSlug[decodeURIComponent(location.hash.slice(1))]) rendre(false); });
    P.encre();
  });
})();

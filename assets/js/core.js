/* Patchacha — socle commun : défilement, mode calme, curseur, empreintes fantômes,
   voile de papier WebGL, cadres à l'échelle, panier, voir au mur. */
(function () {
  'use strict';
  const D = window.PATCHACHA_DATA;
  const SITE = window.PATCHACHA_SITE;
  const html = document.documentElement;
  const P = (window.Patchacha = {});

  /* ---------- Outils ---------- */
  P.$ = (s, r = document) => r.querySelector(s);
  P.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  P.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  P.euro = (n) => (n == null ? 'prix sur demande' : n.toLocaleString('fr-FR') + ' €');
  P.store = {
    get(k, d) { try { const v = localStorage.getItem('patchacha:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('patchacha:' + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  };
  P.session = {
    get(k) { try { return sessionStorage.getItem('patchacha:' + k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem('patchacha:' + k, v); } catch (e) { /* indisponible */ } }
  };
  P.oeuvres = D.oeuvres;
  P.series = D.series;
  P.photos = D.photos;
  P.textiles = D.textiles;
  P.grok = D.grok || {};
  P.site = SITE;
  P.parSlug = Object.fromEntries(D.oeuvres.map((o) => [o.slug, o]));
  P.lienOeuvre = (o) => 'oeuvre.html#' + o.slug;
  P.estTotem = (o) => o.serie === 'totems';
  P.dims = (o) => (P.estTotem(o) ? o.formatCm : o.cadreCm) || [30, 30];
  P.mobile = () => window.matchMedia('(max-width: 899px)').matches;
  P.tactile = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;

  P.formatTexte = (o) => {
    if (P.estTotem(o)) return (o.dimTexte.format || '') + ', tableau en relief';
    return 'œuvre ' + o.dimTexte.oeuvre + ', encadrée ' + o.dimTexte.cadre;
  };
  P.formatCourt = (o) => (P.estTotem(o) ? o.dimTexte.format : o.dimTexte.cadre + ' encadré');
  P.altOeuvre = (o) => o.titre + ', ' + (P.estTotem(o) ? 'tableau en relief' : 'technique mixte') + ' de Patchacha';

  /* ---------- Mode calme (réduire les animations) ---------- */
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  P.calme = P.store.get('calme', reduit);
  html.classList.toggle('calme', P.calme);
  P.basculerCalme = () => { P.store.set('calme', !P.calme); location.reload(); };

  /* ---------- WebGL disponible ? ---------- */
  P.webgl = (() => {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  })();
  html.classList.toggle('sans-webgl', !P.webgl);

  /* ---------- GSAP + Lenis ---------- */
  const g = window.gsap;
  if (g) {
    g.registerPlugin(window.ScrollTrigger, window.SplitText, window.Flip, window.CustomEase);
    window.CustomEase && window.CustomEase.create('papier', 'M0,0 C0.22,0.8 0.24,1 1,1');
    g.defaults({ ease: 'papier' });
  }
  if (g && !P.calme && window.Lenis) {
    try {
      P.lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, autoRaf: false });
      P.lenis.on('scroll', window.ScrollTrigger.update);
      g.ticker.add((t) => P.lenis.raf(t * 1000));
      g.ticker.lagSmoothing(0);
    } catch (e) { P.lenis = null; }
  }
  P.allerA = (cible) => {
    const el = typeof cible === 'string' ? P.$(cible) : cible;
    if (!el) return;
    if (P.lenis) P.lenis.scrollTo(el, { offset: -90, duration: 1.4 });
    else el.scrollIntoView({ behavior: P.calme ? 'auto' : 'smooth', block: 'start' });
  };

  /* ---------- Voile de papier (WebGL, OGL) ---------- */
  const VERT = 'attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 0., 1.); }';
  const FRAG = [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uProgress; uniform vec2 uMouse; uniform float uSeed;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= .5; } return v; }',
    'void main(){',
    '  float asp = uRes.x / max(uRes.y, 1.); vec2 p = vec2(vUv.x * asp, vUv.y);',
    '  vec3 col = vec3(0.); float al = 0.;',
    '  for (int i = 0; i < 3; i++){',
    '    float fi = float(i);',
    '    vec2 q = p * (1.6 + fi * .35) + vec2(fi * 7.13 + uSeed, fi * 3.71 - uSeed) + uMouse * (.025 * (fi + 1.));',
    '    float n = fbm(q) * .78 + fbm(q * 5.3) * .22;',
    '    float t = clamp(uProgress * 1.38 - (2. - fi) * .18, 0., 1.05);',
    '    float keep = t <= 0. ? 1. : smoothstep(t - .008, t + .016, n);',
    '    float rim = (1. - smoothstep(t, t + .07, n)) * keep * step(.001, t);',
    '    vec3 base = fi < .5 ? vec3(.902, .863, .796) : (fi < 1.5 ? vec3(.925, .894, .84) : vec3(.965, .945, .91));',
    '    float fib = noise(p * vec2(95., 60.) + fi * 13.) * .03 + noise(p * 260. + fi) * .035 - .03;',
    '    vec3 c = base - fib + (fbm(p * 7. + fi) - .5) * .035;',
    '    c = mix(c, c * vec3(.86, .82, .76), rim);',
    '    float a = keep;',
    '    col = c * a + col * (1. - a); al = a + al * (1. - a);',
    '  }',
    '  gl_FragColor = vec4(col, al);',
    '}'
  ].join('\n');

  P.Voile = class {
    constructor(conteneur, opts = {}) {
      this.el = conteneur;
      this.progress = opts.progress == null ? 0 : opts.progress;
      this.souris = [0, 0];
      this.ok = false;
      if (!P.webgl || !window.OGL) { this.repli(); return; }
      try {
        const { Renderer, Program, Mesh, Triangle } = window.OGL;
        this.renderer = new Renderer({ alpha: true, premultipliedAlpha: true, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
        const gl = this.renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        this.el.appendChild(gl.canvas);
        this.program = new Program(gl, {
          vertex: VERT, fragment: FRAG, transparent: true,
          uniforms: { uRes: { value: [1, 1] }, uProgress: { value: this.progress }, uMouse: { value: [0, 0] }, uSeed: { value: opts.graine || Math.random() * 10 } }
        });
        this.mesh = new Mesh(gl, { geometry: new Triangle(gl), program: this.program });
        this.ok = true;
        this.taille();
        this.ro = new ResizeObserver(() => { this.taille(); this.rendu(); });
        this.ro.observe(this.el);
        this.rendu();
      } catch (e) { this.repli(); }
    }
    repli() {
      this.ok = false;
      this.el.classList.add('voile--repli');
      this.el.style.opacity = String(1 - this.progress);
    }
    taille() {
      if (!this.ok) return;
      const r = this.el.getBoundingClientRect();
      this.renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
      this.program.uniforms.uRes.value = [r.width, r.height];
    }
    regler(p) {
      this.progress = p;
      if (!this.ok) { this.el.style.opacity = String(Math.max(0, 1 - p)); return; }
      this.program.uniforms.uProgress.value = p;
      this.rendu();
    }
    rendu() {
      if (!this.ok) return;
      this.program.uniforms.uMouse.value = this.souris;
      this.renderer.render({ scene: this.mesh });
    }
    vers(p, duree = 1.2, ease = 'power2.inOut') {
      const etat = { p: this.progress };
      return new Promise((res) => {
        if (!g || P.calme) { this.regler(p); res(); return; }
        g.to(etat, { p, duration: duree, ease, onUpdate: () => this.regler(etat.p), onComplete: res });
      });
    }
    detruire() {
      if (this.ro) this.ro.disconnect();
      if (this.ok) { const ext = this.renderer.gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); }
      this.el.remove();
    }
  };

  /* ---------- Cadres et toiles à l'échelle ---------- */
  P.cadreHTML = (o, k, opts = {}) => {
    const kk = typeof k === 'number' ? k + 'px' : k;
    const grand = opts.grand ? o.oeuvre && o.oeuvre.src : o.oeuvre && o.oeuvre.sm;
    const alt = P.esc(opts.alt || P.altOeuvre(o));
    const lazy = opts.eager ? '' : ' loading="lazy"';
    if (P.estTotem(o)) {
      const [w, h] = o.formatCm;
      if (!o.oeuvre) {
        const v = o.vues[0];
        return '<div class="toile" style="--k:' + kk + ';--w:' + w + ';--h:' + h + '"><img src="' + v.sm + '" alt="' + alt + '"' + lazy + ' decoding="async"></div>';
      }
      return '<div class="toile" style="--k:' + kk + ';--w:' + w + ';--h:' + h + '"><img src="' + grand + '" alt="' + alt + '"' + lazy + ' decoding="async"></div>';
    }
    const [W, H] = o.cadreCm; const [w, h] = o.oeuvreCm;
    const cls = 'cadre' + (o.cadreCouleur === 'blanc' ? ' cadre--blanc' : o.cadreCouleur === 'chene' ? ' cadre--chene' : '');
    return '<div class="' + cls + '" style="--k:' + kk + ';--w:' + W + ';--h:' + H + ';--bag:' + (o.baguette || 1) + ';--fw:' + w + ';--fh:' + h + '">' +
      '<div class="cadre__passe' + (o.passe === 'creme' ? ' cadre__passe--creme' : '') + '"><div class="cadre__fenetre"><img src="' + grand + '" alt="' + alt + '"' + lazy + ' decoding="async"></div></div>' +
      '<span class="cadre__reflet"></span></div>';
  };
  // Échelle qui fait tenir l'œuvre dans une boîte (unités de conteneur), plafonnée en px/cm
  P.kAjuste = (o, pctL = 78, pctH = 78, max = 7) => {
    const [w, h] = P.dims(o);
    return 'min(calc(' + pctL + 'cqw / ' + w + '), calc(' + pctH + 'cqh / ' + h + '), ' + max + 'px)';
  };

  P.cartelHTML = (o, opts = {}) => {
    const prix = o.dispo ? '<span class="prix">' + P.euro(o.prix) + '</span>' : '<span class="prix"><i class="pastille" aria-hidden="true"></i>Vendue</span>';
    const tech = P.estTotem(o) ? 'Bois flotté et textiles teints aux végétaux' : (o.serie === 'fleurs' && o.slug === 'lumiere-du-soir' ? 'Peinture et matières naturelles sur papier' : 'Technique mixte, papiers superposés et acrylique');
    return '<div class="cartel">' + (opts.titreNiveau ? '<' + opts.titreNiveau + ' class="sr">' + P.esc(o.titre) + '</' + opts.titreNiveau + '>' : '') +
      '<strong>' + P.esc(o.titre) + '</strong><span>' + tech + '</span><span>' + P.esc(P.formatTexte(o)) + '</span>' + prix + '</div>';
  };

  // Bord de papier déchiré (polygone irrégulier, déterministe)
  P.dechire = (graine, amp = 2.4, n = 22) => {
    let s = graine;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push((i / n * 100).toFixed(1) + '% ' + (r() * amp).toFixed(2) + '%');
    for (let i = 1; i <= n; i++) pts.push((100 - r() * amp).toFixed(2) + '% ' + (i / n * 100).toFixed(1) + '%');
    for (let i = n - 1; i >= 0; i--) pts.push((i / n * 100).toFixed(1) + '% ' + (100 - r() * amp).toFixed(2) + '%');
    for (let i = n - 1; i >= 1; i--) pts.push((r() * amp).toFixed(2) + '% ' + (i / n * 100).toFixed(1) + '%');
    return 'polygon(' + pts.join(',') + ')';
  };

  /* ---------- Notification ---------- */
  let notifT;
  P.notif = (txt) => {
    let n = P.$('.notif');
    if (!n) { n = document.createElement('div'); n.className = 'notif'; n.setAttribute('role', 'status'); document.body.appendChild(n); }
    n.textContent = txt;
    n.classList.add('est-visible');
    clearTimeout(notifT);
    notifT = setTimeout(() => n.classList.remove('est-visible'), 3200);
  };

  /* ---------- Modale ---------- */
  P.modale = {
    ouvrir(contenu, retour) {
      let m = P.$('#modale');
      if (!m) {
        m = document.createElement('div'); m.id = 'modale'; m.className = 'modale';
        m.innerHTML = '<div class="modale__fond" data-fermer></div><div class="modale__boite" role="dialog" aria-modal="true" aria-labelledby="modale-titre"><button class="fermer" type="button" data-fermer aria-label="Fermer">×</button><div class="modale__contenu"></div></div>';
        document.body.appendChild(m);
        m.addEventListener('click', (e) => { if (e.target.closest('[data-fermer]')) P.modale.fermer(); });
      }
      P.$('.modale__contenu', m).innerHTML = contenu;
      this.retour = retour || document.activeElement;
      m.classList.add('est-ouvert');
      P.lenis && P.lenis.stop();
      setTimeout(() => { const f = P.$('input, select, textarea, button:not(.fermer)', m) || P.$('.fermer', m); f && f.focus(); }, 60);
      return m;
    },
    fermer() {
      const m = P.$('#modale'); if (!m) return;
      m.classList.remove('est-ouvert');
      P.lenis && P.lenis.start();
      this.retour && this.retour.focus && this.retour.focus();
    }
  };

  /* ---------- Panier (simulé, pièces uniques) ---------- */
  P.panier = {
    articles: P.store.get('panier', []).filter((s) => P.parSlug[s] && P.parSlug[s].dispo),
    sauver() { P.store.set('panier', this.articles); this.maj(); },
    contient(s) { return this.articles.includes(s); },
    ajouter(slug, source) {
      const o = P.parSlug[slug];
      if (!o || !o.dispo) return;
      if (this.contient(slug)) { P.notif('Déjà dans votre panier : ' + o.titre + ' est une pièce unique.'); this.ouvrir(); return; }
      this.articles.push(slug);
      this.sauver();
      P.envol(source, o);
      P.notif('Ajoutée au panier : ' + o.titre);
    },
    retirer(slug) { this.articles = this.articles.filter((s) => s !== slug); this.sauver(); },
    total() { return this.articles.reduce((t, s) => t + (P.parSlug[s].prix || 0), 0); },
    maj() {
      P.$$('.panier-compte').forEach((c) => { c.textContent = this.articles.length; c.dataset.vide = this.articles.length ? 'false' : 'true'; });
      const liste = P.$('#tiroir-liste'); if (!liste) return;
      if (!this.articles.length) {
        liste.innerHTML = '<div class="vide"><p>Votre panier est vide.</p><p class="discret">Chaque œuvre est une pièce unique, signée, livrée avec son certificat d’authenticité.</p><a class="btn btn--ligne" href="tableaux.html">Voir les tableaux</a></div>';
      } else {
        liste.innerHTML = this.articles.map((s) => {
          const o = P.parSlug[s]; const img = o.oeuvre ? o.oeuvre.sm : o.vues[0].sm;
          return '<div class="ligne-panier"><img src="' + img + '" alt=""><div><strong>' + P.esc(o.titre) + '</strong><span>' + P.esc(P.formatCourt(o)) + '</span><br><button type="button" data-retirer="' + s + '">Retirer</button></div><b>' + P.euro(o.prix) + '</b></div>';
        }).join('');
      }
      P.$('#tiroir-total').textContent = P.euro(this.total());
      P.$('#tiroir-commander').disabled = !this.articles.length;
    },
    ouvrir() { const t = P.$('#tiroir'); if (!t) return; t.classList.add('est-ouvert'); t.setAttribute('aria-hidden', 'false'); P.lenis && P.lenis.stop(); setTimeout(() => P.$('#tiroir .fermer').focus(), 50); },
    fermer() { const t = P.$('#tiroir'); if (!t) return; t.classList.remove('est-ouvert'); t.setAttribute('aria-hidden', 'true'); P.lenis && P.lenis.start(); },
    commander() {
      if (!this.articles.length) return;
      this.fermer();
      const lignes = this.articles.map((s) => '<li>' + P.esc(P.parSlug[s].titre) + ', ' + P.euro(P.parSlug[s].prix) + '</li>').join('');
      P.modale.ouvrir(
        '<h2 id="modale-titre">Finaliser la commande</h2>' +
        '<p class="discret">Démonstration : aucune commande n’est envoyée et aucun paiement n’est effectué.</p>' +
        '<ul>' + lignes + '</ul>' +
        '<form class="formulaire" id="form-commande" novalidate>' +
        '<div class="ligne-champs"><div class="champ"><label for="cmd-nom">Nom et prénom</label><input id="cmd-nom" name="nom" autocomplete="name" required></div>' +
        '<div class="champ"><label for="cmd-mail">E-mail</label><input id="cmd-mail" name="mail" type="email" autocomplete="email" required></div></div>' +
        '<div class="champ"><label for="cmd-livraison">Livraison</label><select id="cmd-livraison" name="livraison"><option>Envoi suivi depuis l’atelier (frais calculés à la commande)</option><option>Retrait à l’atelier, à Quimper, sur rendez-vous</option></select></div>' +
        '<div class="paiements" aria-label="Moyens de paiement du site"><span>Carte bancaire</span><span>Paiement sécurisé Stripe</span></div>' +
        '<p class="discret">TVA non applicable, article 293 B du CGI. Droit de rétractation de 14 jours.</p>' +
        '<button class="btn" type="submit">Payer ' + P.euro(this.total()) + ' (simulation)</button><div id="cmd-message" role="status"></div></form>'
      );
      P.$('#form-commande').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        if (!f.nom.value.trim() || !/^\S+@\S+\.\S+$/.test(f.mail.value)) { P.$('#cmd-message').innerHTML = '<p class="message-form">Indiquez votre nom et une adresse e-mail valide pour continuer.</p>'; return; }
        P.$('#cmd-message').innerHTML = '<p class="message-form">Commande simulée enregistrée pour ' + P.esc(f.nom.value.trim()) + '. Dans le vrai site, le paiement passerait par Stripe et un e-mail de confirmation serait envoyé.</p>';
        this.articles = []; this.sauver();
      });
    }
  };

  // L'œuvre s'envole vers le panier
  P.envol = (source, o) => {
    const cible = P.$('.bouton-panier');
    if (!source || !cible || !g || P.calme) return;
    const img = source.querySelector ? (source.matches('img') ? source : source.querySelector('img')) : null;
    if (!img) return;
    const a = img.getBoundingClientRect(); const b = cible.getBoundingClientRect();
    const c = document.createElement('img');
    c.src = img.currentSrc || img.src; c.alt = ''; c.className = 'vol-panier';
    Object.assign(c.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', objectFit: 'contain' });
    document.body.appendChild(c);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2); const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    g.timeline({ onComplete: () => { c.remove(); g.fromTo(cible, { scale: 1 }, { scale: 1.15, duration: .18, yoyo: true, repeat: 1 }); } })
      .to(c, { duration: .9, x: dx, ease: 'power2.inOut' }, 0)
      .to(c, { duration: .9, y: dy, ease: 'back.in(1.4)' }, 0)
      .to(c, { duration: .9, scale: .12, rotation: 8, opacity: .6, ease: 'power2.in' }, 0);
  };

  // Tataki zomé : le bouton se frappe et une empreinte de feuille éclot
  const FEUILLE = 'M0,-30 C10,-20 14,-6 12,6 C10,18 4,26 0,30 C-4,26 -10,18 -12,6 C-14,-6 -10,-20 0,-30 Z M0,-26 L0,28 M0,-10 L7,-16 M0,0 L9,-6 M0,10 L8,4 M0,-10 L-7,-16 M0,0 L-9,-6 M0,10 L-8,4';
  P.FEUILLE = FEUILLE;
  P.frapper = (btn) => {
    if (!g || P.calme) return;
    g.timeline().to(btn, { scale: .9, duration: .07, ease: 'power3.in' }).to(btn, { scale: 1, duration: .6, ease: 'elastic.out(1.1, .35)' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-100 -100 200 200'); svg.setAttribute('class', 'empreinte-coup'); svg.setAttribute('aria-hidden', 'true');
    const coul = getComputedStyle(html).getPropertyValue('--ocre-fonce').trim() || '#7E5A26';
    for (let i = 0; i < 6; i++) {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', FEUILLE); p.setAttribute('fill', 'none'); p.setAttribute('stroke', coul); p.setAttribute('stroke-width', '1.4');
      svg.appendChild(p);
      const ang = (i / 6) * Math.PI * 2 + Math.random() * .4;
      g.fromTo(p, { x: 0, y: 0, rotation: ang * 57 + 90, scale: .2, opacity: .9, svgOrigin: '0 0' }, { x: Math.cos(ang) * 62, y: Math.sin(ang) * 46, scale: .55, opacity: 0, duration: 1.1, ease: 'power3.out' });
    }
    btn.appendChild(svg);
    setTimeout(() => svg.remove(), 1200);
  };

  /* ---------- En-tête, menu, outils ---------- */
  function entete() {
    const h = P.$('.site-header'); if (!h) return;
    let dernier = 0;
    const surDefil = (y) => {
      h.classList.toggle('est-colle', y > 30);
      if (!P.calme) h.classList.toggle('est-cache', y > dernier + 4 && y > 400 && !P.$('.menu-mobile.est-ouvert'));
      if (y < dernier - 4) h.classList.remove('est-cache');
      dernier = y;
    };
    if (P.lenis) P.lenis.on('scroll', (e) => surDefil(e.scroll)); else window.addEventListener('scroll', () => surDefil(window.scrollY), { passive: true });
    surDefil(window.scrollY);
    P.$$('[data-calme]').forEach((b) => { b.setAttribute('aria-pressed', P.calme ? 'true' : 'false'); b.addEventListener('click', P.basculerCalme); });
    const menu = P.$('.menu-mobile');
    P.$$('[data-menu]').forEach((b) => b.addEventListener('click', () => {
      const ouvert = !menu.classList.contains('est-ouvert');
      menu.classList.toggle('est-ouvert', ouvert);
      P.$$('[data-menu]').forEach((x) => x.setAttribute('aria-expanded', ouvert ? 'true' : 'false'));
      ouvert ? (P.lenis && P.lenis.stop()) : (P.lenis && P.lenis.start());
      if (ouvert) setTimeout(() => P.$('a', menu).focus(), 80);
    }));
    menu && P.$$('a', menu).forEach((a) => a.addEventListener('click', () => { menu.classList.remove('est-ouvert'); P.lenis && P.lenis.start(); }));
    P.$$('.bouton-panier').forEach((b) => b.addEventListener('click', () => P.panier.ouvrir()));
    const t = P.$('#tiroir');
    if (t) {
      t.addEventListener('click', (e) => {
        if (e.target.closest('[data-fermer-tiroir]')) P.panier.fermer();
        const r = e.target.closest('[data-retirer]'); if (r) P.panier.retirer(r.dataset.retirer);
      });
      P.$('#tiroir-commander').addEventListener('click', () => P.panier.commander());
    }
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      P.panier.fermer(); P.modale.fermer();
      if (menu && menu.classList.contains('est-ouvert')) { menu.classList.remove('est-ouvert'); P.lenis && P.lenis.start(); }
    });
    // Délégation : boutons « Adopter »
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-adopter]');
      if (!b) return;
      e.preventDefault();
      P.frapper(b);
      const src = b.closest('[data-oeuvre-carte]') || P.$('[data-source-envol]');
      setTimeout(() => P.panier.ajouter(b.dataset.adopter, src), 120);
    });
    // Copier une adresse
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-copier]'); if (!b) return;
      const txt = b.dataset.copier;
      const ok = () => { b.textContent = 'Copiée'; setTimeout(() => (b.textContent = 'Copier'), 1800); };
      try { navigator.clipboard.writeText(txt).then(ok, () => selectionner(b)); } catch (er) { selectionner(b); }
    });
    function selectionner(b) { const s = b.previousElementSibling; if (!s) return; const r = document.createRange(); r.selectNodeContents(s); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
    P.panier.maj();
  }

  /* ---------- Curseur ---------- */
  function curseur() {
    if (P.calme || P.tactile() || !g) return;
    html.classList.add('a-curseur');
    const c = document.createElement('div'); c.className = 'curseur'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="curseur__point"></div><div class="curseur__anneau"><span>Voir</span></div>';
    document.body.appendChild(c);
    const pt = P.$('.curseur__point', c), an = P.$('.curseur__anneau', c), lab = P.$('span', an);
    const px = g.quickTo(pt, 'x', { duration: .08 }), py = g.quickTo(pt, 'y', { duration: .08 });
    const ax = g.quickTo(an, 'x', { duration: .45, ease: 'power3' }), ay = g.quickTo(an, 'y', { duration: .45, ease: 'power3' });
    let vu = false;
    window.addEventListener('pointermove', (e) => { if (!vu) { vu = true; g.set([pt, an], { x: e.clientX, y: e.clientY }); g.to(c, { opacity: 1, duration: .3 }); } px(e.clientX); py(e.clientY); ax(e.clientX); ay(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const o = e.target.closest('[data-curseur]');
      const l = e.target.closest('a, button, input[type="range"], select, label');
      const deplacer = !!o && o.dataset.curseur === 'Déplacer';
      c.classList.toggle('sur-oeuvre', !!o && !deplacer);
      c.classList.toggle('sur-lien', deplacer || (!o && !!l));
      if (o) lab.textContent = o.dataset.curseur;
    });
    document.addEventListener('pointerleave', () => g.to(c, { opacity: 0, duration: .2 }));
    document.addEventListener('pointerenter', () => vu && g.to(c, { opacity: 1, duration: .2 }));
  }

  /* ---------- Boutons magnétiques ---------- */
  function aimants() {
    if (P.calme || P.tactile() || !g) return;
    P.$$('[data-aimant]').forEach((b) => {
      const qx = g.quickTo(b, 'x', { duration: .5, ease: 'power3' }), qy = g.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .22); qy((e.clientY - r.top - r.height / 2) * .3); });
      b.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  }

  /* ---------- Empreintes fantômes ---------- */
  function empreintes() {
    if (P.calme || P.tactile()) return;
    const cv = document.createElement('canvas'); cv.id = 'empreintes'; cv.setAttribute('aria-hidden', 'true');
    document.body.prepend(cv);
    const ctx = cv.getContext('2d');
    let dpr = Math.min(devicePixelRatio || 1, 2);
    const taille = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    taille(); window.addEventListener('resize', taille);
    // Formes de feuilles (chêne, eucalyptus, fougère simplifiée), en coordonnées locales
    const formes = [
      new Path2D('M0,-34 C12,-26 18,-10 15,6 C12,20 5,30 0,34 C-5,30 -12,20 -15,6 C-18,-10 -12,-26 0,-34 Z'),
      new Path2D('M0,-36 C7,-30 9,-12 7,4 C5,20 2,30 0,36 C-2,30 -5,20 -7,4 C-9,-12 -7,-30 0,-36 Z'),
      new Path2D('M0,-30 C6,-28 10,-22 8,-18 C14,-18 16,-10 11,-6 C17,-4 17,4 11,6 C15,10 13,18 7,17 C8,24 4,30 0,32 C-4,30 -8,24 -7,17 C-13,18 -15,10 -11,6 C-17,4 -17,-4 -11,-6 C-16,-10 -14,-18 -8,-18 C-10,-22 -6,-28 0,-30 Z')
    ];
    const nervure = new Path2D('M0,-30 L0,32 M0,-14 L8,-20 M0,-2 L10,-8 M0,10 L9,4 M0,-14 L-8,-20 M0,-2 L-10,-8 M0,10 L-9,4');
    const feuilles = [];
    let dernier = null, actif = false;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const p = { x: e.clientX, y: e.clientY };
      if (!dernier || Math.hypot(p.x - dernier.x, p.y - dernier.y) > 120) {
        const ang = dernier ? Math.atan2(p.y - dernier.y, p.x - dernier.x) : 0;
        feuilles.push({ x: p.x, y: p.y, r: ang + Math.PI / 2 + (Math.random() - .5) * .9, s: .7 + Math.random() * .9, f: (Math.random() * 3) | 0, n: 0, vie: 2600 + Math.random() * 1200 });
        if (feuilles.length > 36) feuilles.shift();
        dernier = p;
        if (!actif) { actif = true; requestAnimationFrame(boucle); }
      }
    }, { passive: true });
    let t0 = performance.now();
    function boucle(t) {
      const dt = t - t0; t0 = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let i = feuilles.length - 1; i >= 0; i--) {
        const f = feuilles[i]; f.n += dt;
        const k = f.n / f.vie; if (k >= 1) { feuilles.splice(i, 1); continue; }
        const a = (k < .12 ? k / .12 : 1 - (k - .12) / .88) * .2;
        ctx.setTransform(dpr * f.s, 0, 0, dpr * f.s, f.x * dpr, f.y * dpr);
        ctx.rotate(f.r);
        ctx.fillStyle = 'rgba(126, 90, 38,' + a.toFixed(3) + ')';
        ctx.fill(formes[f.f]);
        ctx.strokeStyle = 'rgba(126, 90, 38,' + (a * 1.4).toFixed(3) + ')';
        ctx.lineWidth = .8;
        ctx.stroke(nervure);
      }
      if (feuilles.length) requestAnimationFrame(boucle); else { actif = false; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); }
    }
  }

  /* ---------- Le fil de l'Odet ---------- */
  function odet() {
    const el = P.$('.odet'); if (!el || P.calme || !g) return;
    const eau = P.$('.eau', el);
    const L = eau.getTotalLength();
    eau.style.strokeDasharray = L; eau.style.strokeDashoffset = L;
    window.ScrollTrigger.create({ trigger: document.body, start: 'top top', end: 'bottom bottom', onUpdate: (s) => { eau.style.strokeDashoffset = L * (1 - s.progress); } });
  }

  /* ---------- Titres à l'encre ---------- */
  P.encre = (racine = document) => {
    if (!g || P.calme || !window.SplitText) return;
    P.$$('[data-encre]', racine).forEach((el) => {
      if (el.dataset.encreFait) return; el.dataset.encreFait = '1';
      const long = el.textContent.length > 60;
      const sp = new window.SplitText(el, { type: long ? 'words' : 'words,chars', charsClass: 'lettre', wordsClass: 'mot' });
      const morceaux = long ? sp.words : sp.chars;
      const r = el.getBoundingClientRect();
      const visible = r.top < innerHeight * .92;
      const tl = { opacity: .3, filter: 'blur(5px)', y: 6 };
      g.set(morceaux, tl);
      g.to(morceaux, {
        opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.2, stagger: long ? { amount: .9 } : { each: .025, from: 'start' }, ease: 'power2.out',
        delay: visible ? (+el.dataset.encreDelai || 0) : 0,
        scrollTrigger: visible ? null : { trigger: el, start: 'top 88%', once: true },
        onComplete: () => g.set(morceaux, { clearProps: 'filter' })
      });
    });
  };

  /* ---------- Tracés à l'encre (SVG) ---------- */
  P.traces = (racine = document) => {
    P.$$('[data-trace]', racine).forEach((svg) => {
      const chemins = P.$$('path, circle, rect, line, polyline', svg);
      chemins.forEach((p) => { const L = p.getTotalLength ? p.getTotalLength() : 200; p.style.strokeDasharray = L; p.style.strokeDashoffset = P.calme ? 0 : L; });
      if (!g || P.calme) return;
      g.to(chemins, { strokeDashoffset: 0, duration: +svg.dataset.trace || 2.2, stagger: .06, ease: 'power2.inOut', scrollTrigger: { trigger: svg, start: 'top 90%', once: true } });
    });
  };

  /* ---------- Inclinaison 3D au survol ---------- */
  P.incliner = (els, force = 7) => {
    if (P.calme || P.tactile() || !g) return;
    els.forEach((el) => {
      const rx = g.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' }), ry = g.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
      g.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; ry(x * force); rx(-y * force); });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  };

  /* ---------- Transitions de page ---------- */
  function transitions() {
    const voile = document.createElement('div'); voile.className = 'transition-page'; voile.setAttribute('aria-hidden', 'true');
    document.body.appendChild(voile);
    if (P.session.get('transition') === '1' && g && !P.calme) {
      g.set(voile, { yPercent: 0 });
      g.to(voile, { yPercent: -100, duration: .9, delay: .05, ease: 'power3.inOut', onComplete: () => g.set(voile, { yPercent: 100 }) });
    }
    P.session.set('transition', '0');
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      const norm = (p) => p.replace(/\.html$/, '').replace(/\/index$/, '/');
      const memePage = norm(url.pathname) === norm(location.pathname);
      if (memePage && url.hash) {
        const cible = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (cible) { e.preventDefault(); P.allerA(cible); return; }
        if (url.pathname !== location.pathname) { e.preventDefault(); location.hash = url.hash; }
        return;
      }
      if (!/\.html$|\/$/.test(url.pathname) && url.pathname.split('/').pop().includes('.')) return;
      if (!g || P.calme) return;
      e.preventDefault();
      P.session.set('transition', '1');
      g.fromTo(voile, { yPercent: 100 }, { yPercent: 0, duration: .55, ease: 'power3.in', onComplete: () => { location.href = a.href; } });
    });
    window.addEventListener('pageshow', (e) => { if (e.persisted && g) g.set(voile, { yPercent: 100 }); });
  }

  /* ---------- Formulaires simulés ---------- */
  P.formulaireSimule = (form, message) => {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const zone = P.$('[data-message]', form);
      const requis = P.$$('[required]', form);
      const manque = requis.find((c) => !c.value.trim() || (c.type === 'email' && !/^\S+@\S+\.\S+$/.test(c.value)));
      if (manque) { zone.innerHTML = '<p class="message-form">Complétez le champ « ' + P.esc(P.$('label[for="' + manque.id + '"]', form).textContent) + ' » pour continuer.</p>'; manque.focus(); return; }
      const prenom = form.prenom ? form.prenom.value.trim() : '';
      zone.innerHTML = '<p class="message-form">' + message(prenom) + '</p>';
      const b = P.$('button[type="submit"]', form); b && P.frapper(b);
      form.reset();
    });
  };
  P.questionOeuvre = (o) => {
    P.modale.ouvrir(
      '<h2 id="modale-titre">Une question sur ' + P.esc(o ? o.titre : 'une œuvre') + ' ?</h2>' +
      '<p class="discret">Patchacha répond dans la journée. Formulaire de démonstration : rien n’est envoyé.</p>' +
      '<form class="formulaire" id="form-question" novalidate>' +
      '<div class="ligne-champs"><div class="champ"><label for="q-prenom">Prénom</label><input id="q-prenom" name="prenom" autocomplete="given-name" required></div>' +
      '<div class="champ"><label for="q-mail">E-mail</label><input id="q-mail" name="mail" type="email" autocomplete="email" required></div></div>' +
      '<div class="champ"><label for="q-message">Votre question</label><textarea id="q-message" name="message" required>' + (o ? 'Bonjour, je m’intéresse à « ' + P.esc(o.titre) + ' ». ' : '') + '</textarea></div>' +
      '<button class="btn" type="submit">Envoyer ma question</button><div data-message role="status"></div></form>'
    );
    P.formulaireSimule(P.$('#form-question'), (p) => 'Merci ' + P.esc(p) + '. Dans le vrai site, votre question partirait vers ' + SITE.contact.email + '.');
  };

  /* ---------- Voir au mur ---------- */
  // Pièces dessinées en code (en cm), utilisées tant qu'aucune photo calée n'existe pour la pièce. H = hauteur visible de la scène.
  const PIECES = {
    salon: { nom: 'Salon', H: 205, sol: 186, appui: 84, reperes: 'canapé de 200 cm', dessin: (L, sol) => {
      const x = L / 2 - 100;
      return '<rect x="' + x + '" y="' + (sol - 44) + '" width="200" height="44" rx="5" fill="#CDBFA9"/>' +
        '<rect x="' + (x + 4) + '" y="' + (sol - 84) + '" width="192" height="44" rx="8" fill="#D9CDB8"/>' +
        '<rect x="' + (x - 4) + '" y="' + (sol - 62) + '" width="16" height="40" rx="6" fill="#C9BBA3"/><rect x="' + (x + 188) + '" y="' + (sol - 62) + '" width="16" height="40" rx="6" fill="#C9BBA3"/>' +
        '<rect x="' + (x + 12) + '" y="' + (sol - 50) + '" width="86" height="10" rx="4" fill="#E2D7C4"/><rect x="' + (x + 102) + '" y="' + (sol - 50) + '" width="86" height="10" rx="4" fill="#E2D7C4"/>' +
        '<rect x="' + (x + 10) + '" y="' + sol + '" width="4" height="0" fill="#8b7b63"/>' +
        '<g transform="translate(' + (x + 226) + ',' + sol + ')"><rect x="-22" y="-52" width="44" height="4" fill="#A58A66"/><rect x="-18" y="-48" width="3" height="48" fill="#A58A66"/><rect x="15" y="-48" width="3" height="48" fill="#A58A66"/>' +
        '<path d="M-8,-52 C-10,-64 -6,-72 0,-74 C6,-72 10,-64 8,-52 Z" fill="#B9A68C"/>' +
        '<path d="M0,-74 C-4,-96 -10,-110 -16,-122 M0,-74 C2,-98 4,-112 10,-128 M0,-74 C-1,-92 -2,-106 -2,-118 M0,-74 C4,-90 10,-100 18,-110" stroke="#9D8665" stroke-width=".8" fill="none"/></g>';
    } },
    bureau: { nom: 'Bureau', H: 200, sol: 182, appui: 80, reperes: 'bureau de 120 cm', dessin: (L, sol) => {
      const x = L / 2 - 60;
      return '<rect x="' + x + '" y="' + (sol - 76) + '" width="120" height="4" fill="#B08F66"/><rect x="' + (x + 4) + '" y="' + (sol - 72) + '" width="3" height="72" fill="#A07F58"/><rect x="' + (x + 113) + '" y="' + (sol - 72) + '" width="3" height="72" fill="#A07F58"/>' +
        '<rect x="' + (x + 14) + '" y="' + (sol - 80) + '" width="28" height="4" fill="#EAE2D3"/>' +
        '<g transform="translate(' + (x + 104) + ',' + (sol - 76) + ')"><rect x="-1" y="-34" width="2" height="34" fill="#7C6B55"/><path d="M-12,-34 L12,-34 L8,-50 L-8,-50 Z" fill="#E7DCC8"/><ellipse cx="0" cy="0" rx="8" ry="2" fill="#7C6B55"/></g>' +
        '<g transform="translate(' + (x + 60) + ',' + sol + ')"><rect x="-20" y="-46" width="40" height="4" fill="#9B7D58"/><rect x="-18" y="-90" width="3" height="90" fill="#9B7D58"/><rect x="15" y="-46" width="3" height="46" fill="#9B7D58"/><rect x="-18" y="-90" width="36" height="3" fill="#9B7D58"/></g>';
    } },
    alcove: { nom: 'Alcôve', H: 170, sol: 160, appui: 96, poser: true, reperes: 'tablette de 70 cm', dessin: (L, sol) => {
      const x = L / 2 - 45;
      return '<rect x="' + x + '" y="' + (sol - 170) + '" width="90" height="160" rx="0" fill="rgba(120,100,70,.10)"/>' +
        '<path d="M' + x + ',' + (sol - 170) + ' L' + (x + 90) + ',' + (sol - 170) + '" stroke="rgba(80,60,40,.18)" stroke-width="2"/>' +
        '<rect x="' + (x + 10) + '" y="' + (sol - 96) + '" width="70" height="3" fill="#A88B64"/>' +
        '<g transform="translate(' + (x + 14) + ',' + (sol - 96) + ')"><rect x="0" y="-4" width="22" height="4" fill="#C9B79B"/><rect x="1" y="-8" width="20" height="4" fill="#B7A27F"/><rect x="0" y="-11" width="21" height="3" fill="#D6C7AC"/></g>' +
        '<g transform="translate(' + (x + 70) + ',' + (sol - 96) + ')"><path d="M-6,0 C-8,-6 -6,-12 0,-12 C6,-12 8,-6 6,0 Z" fill="#B9A68C"/></g>';
    } }
  };

  P.VoirAuMur = class {
    constructor(racine, opts = {}) {
      this.r = racine;
      this.liste = opts.oeuvres || P.oeuvres.filter((o) => o.dispo && (o.oeuvre));
      this.oeuvre = opts.oeuvre || this.liste[0];
      this.piece = opts.piece || this.pieceParDefaut(this.oeuvre);
      this.heure = 30;
      this.decal = { x: 0, y: 0 };
      this.construire();
    }
    construire() {
      const id = 'vam-' + Math.random().toString(36).slice(2, 7);
      this.r.innerHTML =
        '<div class="mur-module">' +
        '<div><div class="piece" data-piece><div class="piece__decor"></div><div class="piece__lumiere"></div><div class="piece__oeuvre" data-curseur="Déplacer" role="img"></div><div class="piece__mesure"></div>' +
        '<div class="piece__legende"><span data-reperes></span><span data-provisoire></span></div></div></div>' +
        '<div class="mur-commandes">' +
        '<fieldset><legend>La pièce</legend><div class="choix" data-pieces>' + Object.entries(PIECES).map(([k, v]) => '<button type="button" data-p="' + k + '">' + v.nom + '</button>').join('') + '</div></fieldset>' +
        '<fieldset><legend>L’œuvre</legend><div class="vignettes" data-vignettes>' + this.liste.map((o) => '<button type="button" data-o="' + o.slug + '" title="' + P.esc(o.titre) + '"><img src="' + o.oeuvre.sm + '" alt="" loading="lazy"><span>' + P.esc(o.titre) + '</span></button>').join('') + '</div></fieldset>' +
        '<div><label class="titre-champ" for="' + id + '">La lumière dans la pièce</label><input id="' + id + '" type="range" min="0" max="100" value="' + this.heure + '" data-heure><div class="heure"><span>Matin</span><span>Midi</span><span>Soir</span></div></div>' +
        '<div class="cartel" data-cartel aria-live="polite"></div>' +
        '<p class="discret">L’œuvre est montrée à sa taille réelle par rapport au mobilier. Faites-la glisser sur le mur. La lumière change sur la pièce, jamais sur l’œuvre.</p>' +
        '</div></div>';
      this.el = {
        piece: P.$('[data-piece]', this.r), decor: P.$('.piece__decor', this.r), lum: P.$('.piece__lumiere', this.r),
        oeuvre: P.$('.piece__oeuvre', this.r), mesure: P.$('.piece__mesure', this.r), reperes: P.$('[data-reperes]', this.r), provisoire: P.$('[data-provisoire]', this.r), cartel: P.$('[data-cartel]', this.r)
      };
      P.$('[data-pieces]', this.r).addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b) { this.piece = b.dataset.p; this.decal = { x: 0, y: 0 }; this.rendu(true); } });
      P.$('[data-vignettes]', this.r).addEventListener('click', (e) => { const b = e.target.closest('[data-o]'); if (b) this.choisir(b.dataset.o); });
      P.$('[data-heure]', this.r).addEventListener('input', (e) => { this.heure = +e.target.value; this.lumiere(); });
      this.glisser();
      new ResizeObserver(() => this.rendu(false)).observe(this.el.piece);
      this.rendu(true);
    }
    choisir(slug) {
      const o = P.parSlug[slug]; if (!o) return;
      this.oeuvre = o; this.decal = { x: 0, y: 0 };
      const m = Math.max(...P.dims(o));
      if ((m <= 33 && this.piece === 'salon') || (m > 45 && this.piece === 'alcove')) this.piece = this.pieceParDefaut(o);
      this.rendu(true);
    }
    pieceParDefaut(o) {
      if (Math.max(...P.dims(o)) <= 33) return 'alcove';
      if (this.photo('salon')) return 'salon';
      return this.photo('bureau') ? 'bureau' : 'salon';
    }
    // Pièce photographiée (image Grok calée à l'échelle) ou pièce dessinée en code
    photo(cle) {
      const cfg = P.site.pieces && P.site.pieces[cle];
      const img = cfg && D.grok && D.grok[cfg.image];
      return cfg && img ? { ...cfg, ...img } : null;
    }
    scene() {
      const R = this.el.piece.getBoundingClientRect();
      const o = this.oeuvre; const [w, h] = P.dims(o);
      const ph = this.photo(this.piece);
      if (ph) {
        const s = Math.max(R.width / ph.w, R.height / ph.h);
        const offX = (R.width - ph.w * s) * ph.fx, offY = (R.height - ph.h * s) * ph.fy;
        const k = ph.cmPx * s;
        const centre = ph.centreCm != null ? Math.max(ph.centreCm, (ph.basMinCm || 0) + h / 2) : null; // au-dessus de la lampe pour les grands formats
        const cyN = centre != null ? ph.solY - centre * ph.cmPx : ph.basY - (h / 2) * ph.cmPx;
        const bas = ph.solY != null ? offY + ph.solY * s : R.height;
        return { R, ph, s, offX, offY, k, w, h, cx: offX + ph.ancreX * s, cy: offY + cyN * s, bas, reperes: ph.reperes };
      }
      const pc = PIECES[this.piece];
      const Hv = R.width < R.height ? pc.H * .8 : pc.H; // en portrait, on se rapproche du mur
      const k = R.height / Hv;
      const L = R.width / k;
      const basO = pc.poser ? pc.sol - pc.appui : pc.sol - pc.appui - 22;
      const y0 = Math.max(0, Math.min(pc.H - Hv, basO - h - 12));
      return { R, pc, k, L, y0, Hv, w, h, cx: (L / 2) * k, cy: (basO - h / 2 - y0) * k, bas: (pc.sol - y0) * k, reperes: pc.reperes };
    }
    placer(sc, anim) {
      const { k, w, h } = sc;
      const W = w * k, H = h * k;
      let left = sc.cx + this.decal.x * k - W / 2, top = sc.cy + this.decal.y * k - H / 2;
      const nl = Math.max(4, Math.min(sc.R.width - W - 4, left)), nt = Math.max(4, Math.min(sc.bas - H - 4, top));
      this.decal.x += (nl - left) / k; this.decal.y += (nt - top) / k;
      left = nl; top = nt;
      if (anim && window.gsap && !P.calme) window.gsap.fromTo(this.el.oeuvre, { left, top: top - 30, opacity: 0 }, { left, top, opacity: 1, duration: .8, ease: 'power3.out' });
      else Object.assign(this.el.oeuvre.style, { left: left + 'px', top: top + 'px', opacity: 1 });
      Object.assign(this.el.mesure.style, { left: left + 'px', width: W + 'px', top: (top + H + 8) + 'px' });
    }
    rendu(anim) {
      const R = this.el.piece.getBoundingClientRect();
      if (!R.width) return;
      const sc = this.sc = this.scene();
      const nom = PIECES[this.piece].nom;
      if (sc.ph) {
        const ph = sc.ph;
        this.el.decor.innerHTML = '<img src="' + (R.width > 1000 || R.height > 700 ? ph.src : ph.sm) + '" srcset="' + ph.sm + ' ' + (ph.w > ph.h ? 900 : 600) + 'w, ' + ph.src + ' ' + ph.w + 'w" sizes="(min-width: 1080px) 70vw, 100vw" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:' + (ph.fx * 100) + '% ' + (ph.fy * 100) + '%">';
        this.el.provisoire.textContent = 'Image d’ambiance';
      } else {
        const { pc, L, y0, Hv } = sc;
        this.el.decor.innerHTML = '<svg viewBox="0 ' + y0.toFixed(1) + ' ' + L.toFixed(1) + ' ' + Hv.toFixed(1) + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
          '<defs><linearGradient id="mur-' + this.piece + '" x1="0" x2="1"><stop offset="0" stop-color="var(--mur-a, #EEE7DB)"/><stop offset="1" stop-color="var(--mur-b, #E4DACA)"/></linearGradient></defs>' +
          '<rect width="' + L.toFixed(1) + '" height="' + pc.sol + '" fill="url(#mur-' + this.piece + ')"/>' +
          '<rect y="' + pc.sol + '" width="' + L.toFixed(1) + '" height="' + (pc.H - pc.sol) + '" fill="#CDBEA6"/>' +
          '<rect y="' + (pc.sol - 8) + '" width="' + L.toFixed(1) + '" height="8" fill="#E8DFD1"/>' +
          pc.dessin(L, pc.sol) + '</svg>';
        this.el.provisoire.textContent = 'Pièce dessinée provisoirement';
      }
      const o = this.oeuvre;
      this.el.oeuvre.innerHTML = P.cadreHTML(o, sc.k, { grand: true, eager: true });
      this.el.oeuvre.setAttribute('aria-label', o.titre + ' à l’échelle dans : ' + nom + ', ' + P.formatCourt(o));
      this.placer(sc, anim);
      this.el.mesure.textContent = sc.w + ' cm';
      this.el.reperes.textContent = 'Échelle réelle : ' + sc.reperes;
      P.$$('[data-p]', this.r).forEach((b) => b.setAttribute('aria-pressed', b.dataset.p === this.piece ? 'true' : 'false'));
      P.$$('[data-o]', this.r).forEach((b) => b.setAttribute('aria-pressed', b.dataset.o === o.slug ? 'true' : 'false'));
      this.el.cartel.innerHTML = '<strong><a class="lien" href="' + P.lienOeuvre(o) + '">' + P.esc(o.titre) + '</a></strong><span>' + P.esc(P.formatTexte(o)) + '</span><span class="prix">' + (o.dispo ? P.euro(o.prix) : 'Vendue') + '</span>';
      this.lumiere();
    }
    lumiere() {
      const t = this.heure / 100; // 0 matin, .5 midi, 1 soir
      const froid = Math.max(0, 1 - t * 2), chaud = Math.max(0, t * 2 - 1);
      const f = this.sc && this.sc.ph ? .6 : 1; // une photo a déjà sa propre lumière
      const a = 'rgba(' + Math.round(225 + 30 * chaud) + ',' + Math.round(232 - 30 * chaud) + ',' + Math.round(245 - 80 * chaud) + ',' + ((.16 + .14 * froid + .26 * chaud) * f).toFixed(2) + ')';
      const angle = 100 - 200 * t;
      this.el.lum.style.background = 'linear-gradient(' + angle + 'deg, rgba(255,255,255,0) 0%, ' + a + ' 75%, rgba(60,40,20,' + ((.12 + .28 * chaud) * f).toFixed(2) + ') 100%)';
      const ox = (1 - 2 * t) * 16;
      const c = P.$('.cadre, .toile', this.el.oeuvre);
      if (c) { c.style.setProperty('--ombre-x', ox.toFixed(1)); c.style.setProperty('--ombre-y', (8 + 6 * Math.abs(1 - 2 * t)).toFixed(1)); c.style.setProperty('--ombre-flou', (18 + 10 * chaud).toFixed(0)); c.style.setProperty('--ombre-a', (.22 + .12 * chaud).toFixed(2)); }
      this.el.piece.style.setProperty('--mur-a', 'hsl(' + (38 - 8 * chaud + 10 * froid) + ', ' + (22 + 10 * chaud) + '%, ' + (91 - 10 * chaud) + '%)');
      this.el.piece.style.setProperty('--mur-b', 'hsl(' + (36 - 6 * chaud) + ', ' + (20 + 12 * chaud) + '%, ' + (86 - 12 * chaud) + '%)');
    }
    glisser() {
      const el = this.el.oeuvre;
      let depart = null;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); depart = { x: e.clientX, y: e.clientY, dx: this.decal.x, dy: this.decal.y }; el.setPointerCapture(e.pointerId); });
      el.addEventListener('pointermove', (e) => {
        if (!depart || !this.sc) return;
        this.decal = { x: depart.dx + (e.clientX - depart.x) / this.sc.k, y: depart.dy + (e.clientY - depart.y) / this.sc.k };
        this.placer(this.sc, false);
      });
      const fin = () => { depart = null; };
      el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
      el.tabIndex = 0;
      el.addEventListener('keydown', (e) => {
        const pas = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
        if (!pas || !this.sc) return; e.preventDefault();
        this.decal.x += pas[0]; this.decal.y += pas[1]; this.placer(this.sc, false);
      });
    }
  };

  /* ---------- Pied de page : les lettres se posent comme des papiers découpés ---------- */
  function pied() {
    const el = P.$('.pied__grand');
    if (!el || !g || P.calme || !window.SplitText) return;
    const sp = new window.SplitText(el, { type: 'chars', charsClass: 'lettre' });
    g.from(sp.chars, { yPercent: 60, rotation: (i) => (i % 2 ? 6 : -5), opacity: 0, duration: 1.1, stagger: .05, ease: 'back.out(1.6)', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  }

  /* ---------- Empreintes qui dérivent (fond de la lettre d'information) ---------- */
  P.derive = (section) => {
    if (!section || P.calme) return;
    const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    section.prepend(cv);
    const ctx = cv.getContext('2d');
    const forme = new Path2D('M0,-34 C12,-26 18,-10 15,6 C12,20 5,30 0,34 C-5,30 -12,20 -15,6 C-18,-10 -12,-26 0,-34 Z');
    const nerv = new Path2D('M0,-30 L0,32 M0,-14 L8,-20 M0,-2 L10,-8 M0,10 L9,4 M0,-14 L-8,-20 M0,-2 L-10,-8 M0,10 L-9,4');
    let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), visible = false, raf = 0;
    const feuilles = Array.from({ length: 14 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: Math.random() * 6.28, s: .8 + Math.random() * 1.6, v: .00004 + Math.random() * .00008, vr: (Math.random() - .5) * .0004 }));
    const taille = () => { const r = section.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; };
    taille(); new ResizeObserver(taille).observe(section);
    let t0 = performance.now();
    const boucle = (t) => {
      const dt = Math.min(50, t - t0); t0 = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      feuilles.forEach((f) => {
        f.y -= f.v * dt; f.r += f.vr * dt; if (f.y < -.15) { f.y = 1.15; f.x = Math.random(); }
        ctx.setTransform(dpr * f.s, 0, 0, dpr * f.s, f.x * W * dpr, f.y * H * dpr); ctx.rotate(f.r);
        ctx.fillStyle = 'rgba(201, 154, 91, .10)'; ctx.fill(forme);
        ctx.strokeStyle = 'rgba(201, 154, 91, .22)'; ctx.lineWidth = .8; ctx.stroke(nerv);
      });
      if (visible) raf = requestAnimationFrame(boucle);
    };
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) { t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(boucle); } }).observe(section);
  };

  /* ---------- Démarrage commun ---------- */
  P.pret = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  P.pret(() => {
    entete(); curseur(); aimants(); empreintes(); odet(); transitions(); pied();
    P.formulaireSimule(P.$('#form-newsletter'), (p) => 'Merci ' + (p ? P.esc(p) : '') + ' ! Inscription simulée : dans le vrai site, le code de −10 % arriverait par e-mail.');
    P.formulaireSimule(P.$('#form-contact'), (p) => 'Merci ' + (p ? P.esc(p) : '') + '. Message simulé : dans le vrai site, il partirait vers ' + SITE.contact.email + ', avec une réponse dans la journée.');
    if (window.ScrollTrigger) window.addEventListener('load', () => window.ScrollTrigger.refresh());
  });
})();

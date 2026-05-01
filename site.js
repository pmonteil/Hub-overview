/* =============================================================
   Modelo HUB — Présentation produit
   ============================================================= */

(() => {
  'use strict';

  const html = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- 1. THEME TOGGLE ---------- */
  const STORAGE = 'modelohub.theme';
  const stored  = localStorage.getItem(STORAGE);
  if (stored === 'dark' || stored === 'light') html.setAttribute('data-theme', stored);

  $('#themeToggle')?.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE, next);
  });

  /* ---------- 2. SCROLL PROGRESS + BACK TOP ---------- */
  const progressBar = $('#progressBar');
  const backTop     = $('#backTop');
  const onScroll = () => {
    const h = document.documentElement;
    const total = h.scrollHeight - h.clientHeight;
    const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (backTop) backTop.classList.toggle('is-visible', h.scrollTop > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- 3. REVEALS ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach((el) => revealObs.observe(el));

  /* ---------- 4. SIDENAV ACTIVE ---------- */
  const sideLinks = $$('.sidenav a');
  const sectionMap = new Map(sideLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const a = sectionMap.get(e.target.id);
        if (!a) return;
        sideLinks.forEach(l => l.classList.remove('is-active'));
        a.classList.add('is-active');
      }
    });
  }, { threshold: 0.45 });
  sectionMap.forEach((_, id) => { const sec = document.getElementById(id); if (sec) sectionObs.observe(sec); });

  /* ---------- 5. RUN-WHEN-VISIBLE helper ---------- */
  const runWhenVisible = (el, fn, opts = { threshold: 0.25 }) => {
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { fn(e.target); obs.disconnect(); } });
    }, opts);
    obs.observe(el);
  };

  /* =================================================================
     §03 VISION — TopBar + cursor → "+" → dropdown loop
     ================================================================= */
  (() => {
    const stage    = $('.vision-mock');
    const cursor   = $('#cursorGhost');
    const plusBtn  = $('#tmPlus');
    const dropdown = $('#plusDropdown');
    if (!stage || !cursor || !plusBtn || !dropdown) return;

    let timer = null, paused = false, running = false;
    const sleep = (ms) => new Promise(r => { timer = setTimeout(r, ms); });

    const moveCursor = (x, y) => {
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    };

    // SVG arrow tip sits at (3, 2). We translate the cursor element so the tip
    // ends up exactly on the target point.
    const TIP_X = 3, TIP_Y = 2;
    const placeAtPlus = () => {
      const sb = stage.getBoundingClientRect();
      const pb = plusBtn.getBoundingClientRect();
      return {
        x: pb.left - sb.left + pb.width / 2 - TIP_X,
        y: pb.top  - sb.top  + pb.height / 2 - TIP_Y
      };
    };

    const startCursor = () => {
      const sb = stage.getBoundingClientRect();
      moveCursor(sb.width * 0.18 - TIP_X, sb.height * 0.55 - TIP_Y);
      cursor.classList.add('is-show');
    };

    const loop = async () => {
      if (running) return;
      running = true;
      while (!paused) {
        dropdown.classList.remove('is-open');
        plusBtn.classList.remove('is-hover');
        startCursor();
        await sleep(900);

        const target = placeAtPlus();
        cursor.classList.add('is-glide');
        moveCursor(target.x, target.y);
        await sleep(1100);
        cursor.classList.remove('is-glide');

        plusBtn.classList.add('is-hover');
        await sleep(280);
        cursor.classList.add('is-click');
        await sleep(180);
        cursor.classList.remove('is-click');

        dropdown.classList.add('is-open');
        await sleep(4400);

        cursor.classList.remove('is-show');
        plusBtn.classList.remove('is-hover');
        dropdown.classList.remove('is-open');
        await sleep(900);
      }
      running = false;
    };

    runWhenVisible(stage, () => { if (!prefersReduced) loop(); }, { threshold: 0.3 });
    stage.addEventListener('mouseenter', () => { paused = true; clearTimeout(timer); });
    stage.addEventListener('mouseleave', () => { paused = false; if (!prefersReduced) loop(); });
  })();

  /* =================================================================
     §05 FLOW WIDE — orange line + click navigation
     ================================================================= */
  (() => {
    const stage = $('#flowWide');
    const fill  = $('#flowLineFill');
    const ol    = $('#flowWideSteps');
    if (!stage || !fill || !ol) return;

    const steps = $$(':scope > li', ol);
    const N = steps.length;
    if (!N) return;

    let i = 0, paused = false, timer = null, userInteracted = false;

    const apply = () => {
      steps.forEach((li, idx) => {
        li.classList.remove('is-done', 'is-active');
        if (idx < i) li.classList.add('is-done');
        else if (idx === i) li.classList.add('is-active');
      });
      // line fill: from center of step 1 (1/12) to center of active step
      // span from step 1 center to step 6 center = 100% - 2*(1/12) = 10/12.
      // active idx of N=6 → fraction = i / (N-1).
      const pct = N === 1 ? 0 : (i / (N - 1)) * 100;
      fill.style.width = pct + '%';
    };

    const tick = () => {
      if (paused || userInteracted) return;
      i = (i + 1) % (N + 1);
      if (i > N - 1) {
        steps.forEach(li => { li.classList.remove('is-active'); li.classList.add('is-done'); });
        fill.style.width = '100%';
        timer = setTimeout(() => { i = 0; apply(); timer = setTimeout(tick, 1700); }, 1900);
        return;
      }
      apply();
      timer = setTimeout(tick, 2400);
    };

    runWhenVisible(stage, () => {
      apply();
      if (!prefersReduced) timer = setTimeout(tick, 1800);
    }, { threshold: 0.25 });

    // Click navigation
    steps.forEach((li, idx) => {
      li.addEventListener('click', () => {
        userInteracted = true;
        clearTimeout(timer);
        i = idx;
        apply();
        // Resume autoplay after a longer pause
        if (!prefersReduced) timer = setTimeout(() => { userInteracted = false; tick(); }, 6000);
      });
    });

    stage.addEventListener('mouseenter', () => { paused = true; clearTimeout(timer); });
    stage.addEventListener('mouseleave', () => { paused = false; if (!prefersReduced && !userInteracted) timer = setTimeout(tick, 1500); });
  })();

  /* =================================================================
     §06 TEMPLATES — marquee categories with métier colors
     ================================================================= */
  (() => {
    const track = $('#tplTrack');
    if (!track) return;

    const CATS = [
      {
        name: 'Immobilier', metier: 'immo',
        tpls: ['Transaction résidentielle', 'Gestion locative meublée', 'Syndic de copropriété', 'Mandat de recherche', 'Vente en viager']
      },
      {
        name: 'Notariat', metier: 'notariat',
        tpls: ['Succession avec bien immobilier', 'Donation entre époux', 'Création de SCI', 'Acte de vente notarié', 'Partage successoral']
      },
      {
        name: 'RH', metier: 'rh',
        tpls: ['Recrutement CDI cadre', 'Onboarding collaborateur', 'Rupture conventionnelle', 'Mobilité interne', 'Renouvellement période d\'essai']
      },
      {
        name: 'Juridique', metier: 'juridique',
        tpls: ['Contentieux commercial', 'Mise en conformité RGPD', 'Rédaction de CGV', 'Litige fournisseur']
      },
      {
        name: 'Comptabilité', metier: 'compta',
        tpls: ['Clôture d\'exercice annuel', 'Dossier de révision client', 'Déclaration de TVA trimestrielle']
      },
      {
        name: 'BTP', metier: 'btp',
        tpls: ['Appel d\'offres marché public', 'Suivi de chantier résidentiel', 'Réception de travaux']
      },
      {
        name: 'Santé', metier: 'sante',
        tpls: ['Renouvellement conventionnement', 'Audit qualité clinique']
      },
      {
        name: 'Public · Collectivités', metier: 'public',
        tpls: ['Marché public fournitures', 'Délibération de conseil municipal']
      }
    ];

    const buildGroup = () => {
      const frag = document.createDocumentFragment();
      CATS.forEach((cat) => {
        const card = document.createElement('article');
        card.className = 'tpl-cat';
        card.style.setProperty('--c', `var(--metier-${cat.metier})`);
        card.innerHTML = `
          <div class="tpl-cat__head"><i class="dot" style="--c: var(--metier-${cat.metier})"></i><b>${cat.name}</b></div>
          <ul class="tpl-cat__list">
            ${cat.tpls.map(t => `<li><i class="dot" style="--c: var(--metier-${cat.metier})"></i>${t}</li>`).join('')}
          </ul>`;
        frag.appendChild(card);
      });
      return frag;
    };

    track.appendChild(buildGroup());
    track.appendChild(buildGroup());
    if (prefersReduced) track.style.animation = 'none';
  })();

  /* =================================================================
     §07 MIA génère — typewriter → loader → timeline → cursor click → burst
     ================================================================= */
  (() => {
    const stage      = $('#genStage');
    const typer      = $('#genTyper');
    const enterEl    = $('#genEnter');
    const loader     = $('#genLoader');
    const wrap       = $('#genTimelineWrap');
    const lineFillEl = $('.gen-line__fill', wrap || document);
    const timeline   = $('#genTimeline');
    const validate   = $('#genValidate');
    const flash      = $('#genFlash');
    const cursorEl   = $('#genCursor');
    const burst      = $('#genBurst');
    const validateBtn= $('#genValidateBtn');
    if (!stage || !typer || !timeline || !wrap) return;

    const PROMPT = 'Crée un flow pour la signature d\'un bail commercial.';

    const FLOW = [
      { name: 'Préparation', qas: [
        { brique: 'contact', letter: 'C', label: 'Récupérer les parties' },
        { brique: 'legal',   letter: 'L', label: 'Charger le bail-type' }
      ]},
      { name: 'Négociation', qas: [
        { brique: 'crm',     letter: 'C', label: 'Échanges avec le bailleur' },
        { brique: 'crm',     letter: 'C', label: 'Envoi des contre-propositions' }
      ]},
      { name: 'Rédaction', qas: [
        { brique: 'legal',   letter: 'L', label: 'Générer le bail commercial' },
        { brique: 'legal',   letter: 'L', label: 'Annexer le diagnostic' }
      ]},
      { name: 'Signature', qas: [
        { brique: 'legal',   letter: 'L', label: 'Préparer la signature' },
        { brique: 'crm',     letter: 'C', label: 'Envoyer aux parties' }
      ]},
      { name: 'Suivi', qas: [
        { brique: 'finance', letter: 'F', label: 'Enregistrer les honoraires' },
        { brique: 'gestion', letter: 'G', label: 'Ouvrir le suivi locatif' }
      ]}
    ];

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const reset = () => {
      typer.textContent = '';
      enterEl?.classList.remove('is-show');
      loader?.classList.remove('is-show');
      wrap.classList.remove('is-show');
      validate?.classList.remove('is-show');
      flash?.classList.remove('is-flash');
      cursorEl?.classList.remove('is-show', 'is-glide', 'is-press');
      burst?.classList.remove('is-burst');
      validateBtn?.classList.remove('is-pressed');
      timeline.innerHTML = '';
      timeline.scrollLeft = 0;
      if (lineFillEl) lineFillEl.style.width = '0%';
    };

    const typeWrite = async (text, speed = 32) => {
      for (let i = 0; i <= text.length; i++) {
        typer.textContent = text.slice(0, i);
        await sleep(speed + Math.random() * 22);
      }
    };

    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    const buildStep = (s, idx) => {
      const li = document.createElement('li');
      li.className = 'gen-step';
      li.innerHTML = `
        <div class="gen-step__head">
          <span class="gen-step__num">${String(idx + 1).padStart(2, '0')}</span>
          <span class="gen-step__name">${s.name}</span>
        </div>
        <ul class="gen-step__qas">
          ${s.qas.map(qa => `
            <li>
              <span class="bk bk--xs" style="--c: var(--b-${qa.brique})"><span>${qa.letter}</span></span>
              <span class="qa-name">${qa.label}</span>
              <span class="qa-from">via ${cap(qa.brique)}</span>
            </li>`).join('')}
        </ul>`;
      return li;
    };

    const moveCursorTo = (x, y) => {
      if (!cursorEl) return;
      cursorEl.style.transform = `translate(${x}px, ${y}px)`;
    };

    const placeBurstAt = (x, y) => {
      if (!burst) return;
      burst.style.left = x + 'px';
      burst.style.top  = y + 'px';
    };

    const playClickAndBurst = async () => {
      if (!cursorEl || !validateBtn) return;
      const sb = stage.getBoundingClientRect();
      const bb = validateBtn.getBoundingClientRect();
      // Start position: bottom-right of stage
      cursorEl.classList.add('is-show');
      moveCursorTo(sb.width - 40, sb.height - 30);
      await sleep(60);

      // Glide to button center
      const tx = bb.left - sb.left + bb.width / 2 - 4;
      const ty = bb.top  - sb.top  + bb.height / 2 - 4;
      cursorEl.classList.add('is-glide');
      moveCursorTo(tx, ty);
      await sleep(1100);
      cursorEl.classList.remove('is-glide');

      // "Click"
      validateBtn.classList.add('is-pressed');
      cursorEl.style.setProperty('--gx', tx + 'px');
      cursorEl.style.setProperty('--gy', ty + 'px');
      cursorEl.classList.add('is-press');
      await sleep(160);
      validateBtn.classList.remove('is-pressed');
      cursorEl.classList.remove('is-press');

      // Burst at the button center
      placeBurstAt(bb.left - sb.left + bb.width / 2, bb.top - sb.top + bb.height / 2);
      burst.classList.add('is-burst');
      await sleep(150);
      flash?.classList.add('is-flash');
      await sleep(900);
      cursorEl.classList.remove('is-show');
      burst.classList.remove('is-burst');
      await sleep(500);
    };

    const play = async () => {
      reset();
      await sleep(450);
      await typeWrite(PROMPT);
      enterEl?.classList.add('is-show');
      await sleep(600);

      loader?.classList.add('is-show');
      await sleep(2200);
      loader?.classList.remove('is-show');

      wrap.classList.add('is-show');
      for (let i = 0; i < FLOW.length; i++) {
        const li = buildStep(FLOW[i], i);
        timeline.appendChild(li);
        requestAnimationFrame(() => li.classList.add('is-in'));
        if (lineFillEl) lineFillEl.style.width = ((i + 1) / FLOW.length * 100) + '%';
        // smooth scroll to keep latest step in view
        await sleep(60);
        li.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        await sleep(1100);
      }

      await sleep(600);
      validate?.classList.add('is-show');
      await sleep(1800);

      // Animated cursor click + AI explosion
      await playClickAndBurst();
      await sleep(800);
    };

    // Play exactly once when the section enters the viewport, then leave the
    // timeline in its end state (user can scroll the timeline manually).
    let played = false;
    const playOnce = async () => {
      if (played) return;
      played = true;
      await play();
    };
    runWhenVisible(stage, () => { if (!prefersReduced) playOnce(); }, { threshold: 0.25 });
  })();

  /* =================================================================
     §10 USINE M&M — auto-cycle steps + line fill via --us-progress
     ================================================================= */
  (() => {
    const stage     = $('#usineStage');
    const stepsList = $('#usineSteps');
    if (!stage || !stepsList) return;
    const steps  = $$(':scope > li', stepsList);
    const panels = $$('.us-panel', stage);
    if (!steps.length || !panels.length) return;

    let i = 0, timer = null, userTookControl = false;

    const show = (idx) => {
      steps.forEach((s, k) => {
        s.classList.toggle('us-active', k === idx);
        s.classList.toggle('us-done', k < idx);
      });
      panels.forEach((p, k) => p.classList.toggle('is-show', k === idx));
      stepsList.style.setProperty('--us-progress', String(idx));
    };

    const tick = () => {
      if (userTookControl) return;
      i = (i + 1) % steps.length;
      show(i);
      const dwell = i === 3 ? 5200 : 3800;
      timer = setTimeout(tick, dwell);
    };

    runWhenVisible(stage, () => {
      show(0);
      if (!prefersReduced) timer = setTimeout(tick, 3200);
    }, { threshold: 0.3 });

    // Un clic sur une étape = l'utilisateur prend la main → on arrête définitivement le cycle.
    steps.forEach((s, idx) => {
      s.addEventListener('click', () => {
        userTookControl = true;
        clearTimeout(timer);
        i = idx;
        show(i);
      });
    });
  })();

  /* =================================================================
     §11 RÉSEAU — halo de briques pulsant autour d'un flow skeleton
     ================================================================= */
  (() => {
    const halo = $('#netHalo');
    if (!halo) return;

    // Briques de l'écosystème. `isNew` : récemment intégrées → pulsent + fort
    const BRIQUES = [
      { letter: 'P', brique: 'prospection' },
      { letter: 'E', brique: 'estimation'  },
      { letter: 'T', brique: 'transaction' },
      { letter: 'L', brique: 'legal'       },
      { letter: 'C', brique: 'crm'         },
      { letter: 'C', brique: 'contact'     },
      { letter: 'G', brique: 'gestion'     },
      { letter: 'S', brique: 'syndic',  isNew: true },
      { letter: 'F', brique: 'finance'     },
      { letter: 'T', brique: 'ticket'      },
      { letter: 'B', brique: 'bien',    isNew: true }
    ];

    const N = BRIQUES.length;
    // Rayons en px → bien plus fiable que % en transform
    const radii = [290, 320, 270, 305, 285, 315];
    BRIQUES.forEach((b, i) => {
      const r = radii[i % radii.length];
      // Spoke (rod from center outward, behind the brique)
      const sp = document.createElement('i');
      sp.className = 'net__spoke' + (b.isNew ? ' is-new' : '');
      sp.style.setProperty('--c', `var(--b-${b.brique})`);
      sp.style.setProperty('--i', i);
      sp.style.setProperty('--n', N);
      sp.style.setProperty('--r', r + 'px');
      halo.appendChild(sp);
      // Brique pulsante
      const el = document.createElement('span');
      el.className = 'bk' + (b.isNew ? ' is-new' : '');
      el.style.setProperty('--c', `var(--b-${b.brique})`);
      el.style.setProperty('--i', i);
      el.style.setProperty('--n', N);
      el.style.setProperty('--r', r + 'px');
      el.innerHTML = `<span>${b.letter}</span>`;
      halo.appendChild(el);
    });
  })();

})();

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
     §04 BRICK MARQUEE — 3 rangées en alternance, boucle infinie seamless
     Chaque brique porte sa couleur (token --b-*) qui irradie en glow.
     ================================================================= */
  (() => {
    const root = $('#brickMarquee');
    if (!root) return;

    // Catalogue de briques (24 entrées) — réparties en 3 rangées
    const ROWS = [
      [
        { letter: 'P', label: 'Prospection',       brique: 'prospection' },
        { letter: 'E', label: 'Estimation',        brique: 'estimation'  },
        { letter: 'T', label: 'Transaction',       brique: 'transaction' },
        { letter: 'R', label: 'Recrutement',       brique: 'recrutement' },
        { letter: 'L', label: 'Legal',             brique: 'legal'       },
        { letter: 'G', label: 'Gestion locative',  brique: 'gestion'     },
        { letter: 'P', label: 'Paie',              brique: 'paie'        },
        { letter: 'A', label: 'Acte authentique',  brique: 'acte'        }
      ],
      [
        { letter: 'D', label: 'Dossier juridique', brique: 'dossier-juridique' },
        { letter: 'C', label: 'CRM',               brique: 'crm'         },
        { letter: 'P', label: 'Patrimoine',        brique: 'patrimoine'  },
        { letter: 'F', label: 'Foncier',           brique: 'foncier'     },
        { letter: 'F', label: 'Finance',           brique: 'finance'     },
        { letter: 'P', label: 'Procédure',         brique: 'procedure'   },
        { letter: 'F', label: 'Formation',         brique: 'formation'   },
        { letter: 'S', label: 'Syndic',            brique: 'syndic'      }
      ],
      [
        { letter: 'H', label: 'Ressources Humaines', brique: 'rh'        },
        { letter: 'F', label: 'Fiscal',            brique: 'fiscal'      },
        { letter: 'U', label: 'Urbanisme',         brique: 'urbanisme'   },
        { letter: 'C', label: 'Chantier',          brique: 'chantier'    },
        { letter: 'T', label: 'Ticket',            brique: 'ticket'      },
        { letter: 'C', label: 'Contact',           brique: 'contact'     },
        { letter: 'B', label: 'Bien immobilier',   brique: 'bien'        },
        { letter: 'P', label: 'Pige',              brique: 'prospection' }
      ]
    ];

    const renderBrick = (b) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'brick';
      const color = `var(--b-${b.brique})`;
      // --c sur la brique (pour le glow extérieur lu par les rules .brick-marquee .brick)
      btn.style.setProperty('--c', color);
      // --c AUSSI en inline sur le .bk : sa propre rule .bk { --c: var(--b-default) }
      // override l'héritage sinon → on perdrait la couleur du carré.
      btn.innerHTML = `
        <span class="bk" style="--c: ${color}"><span>${b.letter}</span></span>
        <span>${b.label}</span>
      `;
      return btn;
    };

    $$('.brick-row__track', root).forEach((track, idx) => {
      const items = ROWS[idx] || [];
      // Doublé pour boucle seamless : on anime de 0 → -50% ; à -50% on est
      // exactement au début du second exemplaire = continuité parfaite.
      const frag1 = document.createDocumentFragment();
      const frag2 = document.createDocumentFragment();
      items.forEach((b) => {
        frag1.appendChild(renderBrick(b));
        frag2.appendChild(renderBrick(b));
      });
      track.appendChild(frag1);
      track.appendChild(frag2);
    });
  })();

  /* =================================================================
     §03 VISION — TopBar + cursor → "+" → dropdown (joue une fois, reste ouvert)
     ================================================================= */
  (() => {
    const stage    = $('.vision-mock');
    const cursor   = $('#cursorGhost');
    const plusBtn  = $('#tmPlus');
    const dropdown = $('#plusDropdown');
    if (!stage || !cursor || !plusBtn || !dropdown) return;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Le tip du SVG est à (3, 2) → on translate le wrapper pour aligner la pointe sur la cible.
    const TIP_X = 3, TIP_Y = 2;
    const moveCursor = (x, y) => { cursor.style.transform = `translate(${x}px, ${y}px)`; };

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

    let played = false;
    const playOnce = async () => {
      if (played) return;
      played = true;

      dropdown.classList.remove('is-open');
      plusBtn.classList.remove('is-hover');
      startCursor();
      await sleep(700);

      const target = placeAtPlus();
      cursor.classList.add('is-glide');
      moveCursor(target.x, target.y);
      await sleep(1100);
      cursor.classList.remove('is-glide');

      plusBtn.classList.add('is-hover');
      await sleep(260);
      cursor.classList.add('is-click');
      await sleep(180);
      cursor.classList.remove('is-click');

      dropdown.classList.add('is-open');
      // État final : dropdown ouvert, curseur sur le +. On reste ainsi.
    };

    if (prefersReduced) {
      // Mode reduced motion : on force directement l'état final, sans curseur.
      dropdown.classList.add('is-open');
      return;
    }

    // Trigger principal : IntersectionObserver à seuil bas pour fiabiliser.
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { playOnce(); obs.disconnect(); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });
    obs.observe(stage);

    // Fallback : si la section est déjà visible au chargement, on déclenche aussi.
    requestAnimationFrame(() => {
      const r = stage.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.9 && r.bottom > 0) playOnce();
    });
  })();

  /* =================================================================
     §05 FLOW WIDE — Templates carousel
     - 5 templates de flow (1 par métier vertical)
     - Slider gauche/droite + dots
     - Chaque flow porte son accent (couleur du vertical)
     - Chaque QA porte la couleur de sa brique source (cross-métier visible)
     ================================================================= */
  (() => {
    const flowSection  = $('#flow');
    const flowCard     = $('#flowCard');
    const flowKicker   = $('#flowCardKicker');
    const flowLabel    = $('#flowCardLabel');
    const flowMeta     = $('#flowCardMeta');
    const flowPill     = $('#flowCardPill');
    const stage        = $('#flowWide');
    const fill         = $('#flowLineFill');
    const ol           = $('#flowWideSteps');
    const dotsList     = $('#flowDots');
    const prevBtn      = $('#flowPrev');
    const nextBtn      = $('#flowNext');
    if (!flowSection || !stage || !fill || !ol || !dotsList || !prevBtn || !nextBtn) return;

    /* ────────────── Catalogue de templates de flow ──────────────
       brique : token CSS --b-* (couleur = métier source)
       letter : initiale affichée dans le carré .bk
       brick  : nom court de la brique source affiché en small
    */
    const FLOWS = [
      {
        id: 'transaction',
        accent: 'var(--metier-immo)',
        kicker: 'Template · Immobilier',
        label: 'Flow Transaction',
        pill: 'En cours',
        meta: 'Maj. il y a 12 min',
        steps: [
          { name: 'Prospection', qas: [
            { brique: 'prospection', letter: 'P', label: 'Rechercher des biens',     brick: 'Prospection' },
            { brique: 'prospection', letter: 'P', label: 'Identifier propriétaires', brick: 'Prospection' },
            { brique: 'contact',     letter: 'C', label: 'Ajouter un contact',       brick: 'Contact'     }
          ]},
          { name: 'Estimation', qas: [
            { brique: 'estimation',  letter: 'E', label: 'Créer un Avis de Valeur',     brick: 'Estimation' },
            { brique: 'estimation',  letter: 'E', label: 'Analyser les biens similaires', brick: 'Estimation' },
            { brique: 'crm',         letter: 'C', label: 'Envoyer au propriétaire',     brick: 'CRM'        }
          ]},
          { name: 'Mandat', qas: [
            { brique: 'legal',       letter: 'L', label: 'Générer le mandat',     brick: 'Legal'   },
            { brique: 'legal',       letter: 'L', label: 'Envoyer en signature',  brick: 'Legal'   },
            { brique: 'contact',     letter: 'C', label: 'Associer un vendeur',   brick: 'Contact' }
          ]},
          { name: 'Commercialisation', qas: [
            { brique: 'transaction', letter: 'T', label: 'Créer une annonce',     brick: 'Transaction' },
            { brique: 'crm',         letter: 'C', label: 'Diffuser sur portails', brick: 'CRM'         },
            { brique: 'crm',         letter: 'C', label: 'Gérer les demandes',    brick: 'CRM'         }
          ]},
          { name: 'Offres', qas: [
            { brique: 'transaction', letter: 'T', label: 'Planifier une visite',  brick: 'Transaction' },
            { brique: 'transaction', letter: 'T', label: 'Comparer les offres',   brick: 'Transaction' },
            { brique: 'crm',         letter: 'C', label: 'Négocier',              brick: 'CRM'         }
          ]},
          { name: 'Signature', qas: [
            { brique: 'legal',       letter: 'L', label: 'Générer le compromis',     brick: 'Legal'   },
            { brique: 'crm',         letter: 'C', label: 'Envoyer aux parties',      brick: 'CRM'     },
            { brique: 'finance',     letter: 'F', label: 'Enregistrer les honoraires', brick: 'Finance' }
          ]}
        ]
      },

      {
        id: 'recrutement',
        accent: 'var(--metier-rh)',
        kicker: 'Template · Ressources Humaines',
        label: 'Flow Recrutement',
        pill: 'En cours',
        meta: 'Maj. il y a 1 h',
        steps: [
          { name: 'Sourcing', qas: [
            { brique: 'crm',         letter: 'C', label: 'Diffuser l\'offre d\'emploi',     brick: 'CRM'         },
            { brique: 'recrutement', letter: 'R', label: 'Sourcer sur réseaux pro',        brick: 'Recrutement' },
            { brique: 'recrutement', letter: 'R', label: 'Importer une candidature',       brick: 'Recrutement' }
          ]},
          { name: 'Préqualification', qas: [
            { brique: 'recrutement', letter: 'R', label: 'Analyser un CV',             brick: 'Recrutement' },
            { brique: 'recrutement', letter: 'R', label: 'Envoyer un test technique',  brick: 'Recrutement' },
            { brique: 'crm',         letter: 'C', label: 'Programmer un appel',         brick: 'CRM'         }
          ]},
          { name: 'Entretiens', qas: [
            { brique: 'crm',         letter: 'C', label: 'Planifier un entretien',     brick: 'CRM'         },
            { brique: 'recrutement', letter: 'R', label: 'Créer la grille d\'évaluation', brick: 'Recrutement' },
            { brique: 'crm',         letter: 'C', label: 'Inviter un manager',          brick: 'CRM'         }
          ]},
          { name: 'Décision', qas: [
            { brique: 'recrutement', letter: 'R', label: 'Comparer les candidats',  brick: 'Recrutement' },
            { brique: 'crm',         letter: 'C', label: 'Demander des références', brick: 'CRM'         },
            { brique: 'legal',       letter: 'L', label: 'Vérifier les diplômes',   brick: 'Legal'       }
          ]},
          { name: 'Offre', qas: [
            { brique: 'legal',       letter: 'L', label: 'Promesse d\'embauche',         brick: 'Legal' },
            { brique: 'legal',       letter: 'L', label: 'Contrat en signature',         brick: 'Legal' },
            { brique: 'paie',        letter: 'P', label: 'Calculer la rémunération',      brick: 'Paie'  }
          ]},
          { name: 'Onboarding', qas: [
            { brique: 'rh',          letter: 'H', label: 'Créer le dossier salarié',  brick: 'RH'      },
            { brique: 'ticket',      letter: 'T', label: 'Commander le matériel IT',  brick: 'Ticket'  },
            { brique: 'formation',   letter: 'F', label: 'Inscrire à l\'intégration', brick: 'Formation' }
          ]}
        ]
      },

      {
        id: 'programme-neuf',
        accent: 'var(--metier-immo)',
        kicker: 'Template · Promotion immobilière',
        label: 'Flow Programme Neuf',
        pill: 'En cours',
        meta: 'Maj. il y a 4 h',
        steps: [
          { name: 'Foncier', qas: [
            { brique: 'foncier',     letter: 'F', label: 'Identifier des parcelles', brick: 'Foncier'    },
            { brique: 'urbanisme',   letter: 'U', label: 'Analyser le PLU',          brick: 'Urbanisme'  },
            { brique: 'crm',         letter: 'C', label: 'Approcher les propriétaires', brick: 'CRM'    },
            { brique: 'legal',       letter: 'L', label: 'Promesse d\'achat',        brick: 'Legal'      }
          ]},
          { name: 'Faisabilité', qas: [
            { brique: 'estimation',  letter: 'E', label: 'Charge foncière',     brick: 'Estimation' },
            { brique: 'estimation',  letter: 'E', label: 'Étude de marché',     brick: 'Estimation' },
            { brique: 'finance',     letter: 'F', label: 'Bilan promoteur',     brick: 'Finance'    },
            { brique: 'crm',         letter: 'C', label: 'Briefer l\'architecte', brick: 'CRM'      }
          ]},
          { name: 'Permis de construire', qas: [
            { brique: 'urbanisme',   letter: 'U', label: 'Déposer le PC',        brick: 'Urbanisme' },
            { brique: 'urbanisme',   letter: 'U', label: 'Suivre l\'instruction', brick: 'Urbanisme' },
            { brique: 'legal',       letter: 'L', label: 'Gérer les recours',    brick: 'Legal'     },
            { brique: 'crm',         letter: 'C', label: 'Notifier les riverains', brick: 'CRM'    }
          ]},
          { name: 'Commercialisation VEFA', qas: [
            { brique: 'transaction', letter: 'T', label: 'Annonce neuf',         brick: 'Transaction' },
            { brique: 'crm',         letter: 'C', label: 'Diffuser sur portails', brick: 'CRM'        },
            { brique: 'transaction', letter: 'T', label: 'Réserver un lot',       brick: 'Transaction' },
            { brique: 'legal',       letter: 'L', label: 'Contrat de réservation', brick: 'Legal'    }
          ]},
          { name: 'Chantier', qas: [
            { brique: 'chantier',    letter: 'C', label: 'Planifier les jalons',   brick: 'Chantier' },
            { brique: 'finance',     letter: 'F', label: 'Appel de fonds',        brick: 'Finance'  },
            { brique: 'ticket',      letter: 'T', label: 'Réserves entreprise',   brick: 'Ticket'   },
            { brique: 'crm',         letter: 'C', label: 'Tenir informés',        brick: 'CRM'      }
          ]},
          { name: 'Livraison', qas: [
            { brique: 'chantier',    letter: 'C', label: 'Visite cloisons',     brick: 'Chantier' },
            { brique: 'legal',       letter: 'L', label: 'Signer la livraison', brick: 'Legal'    },
            { brique: 'ticket',      letter: 'T', label: 'Lever les réserves',  brick: 'Ticket'   },
            { brique: 'legal',       letter: 'L', label: 'Activer la GPA',      brick: 'Legal'    }
          ]}
        ]
      },

      {
        id: 'contentieux',
        accent: 'var(--metier-avocat)',
        kicker: 'Template · Avocat',
        label: 'Flow Dossier Contentieux',
        pill: 'En cours',
        meta: 'Maj. il y a 25 min',
        steps: [
          { name: 'Qualification', qas: [
            { brique: 'dossier-juridique', letter: 'D', label: 'Créer la fiche client',     brick: 'Dossier juridique' },
            { brique: 'dossier-juridique', letter: 'D', label: 'Vérifier conflits d\'intérêts', brick: 'Dossier juridique' },
            { brique: 'legal',             letter: 'L', label: 'Convention d\'honoraires',   brick: 'Legal'   },
            { brique: 'finance',           letter: 'F', label: 'Encaisser la provision',    brick: 'Finance' }
          ]},
          { name: 'Constitution du dossier', qas: [
            { brique: 'dossier-juridique', letter: 'D', label: 'Ouvrir le dossier',          brick: 'Dossier juridique' },
            { brique: 'dossier-juridique', letter: 'D', label: 'Collecter les pièces',       brick: 'Dossier juridique' },
            { brique: 'dossier-juridique', letter: 'D', label: 'Rechercher la jurisprudence', brick: 'Dossier juridique' },
            { brique: 'legal',             letter: 'L', label: 'Rédiger l\'assignation',     brick: 'Legal'   }
          ]},
          { name: 'Mise en état', qas: [
            { brique: 'procedure',         letter: 'P', label: 'Communiquer via RPVA',     brick: 'Procédure' },
            { brique: 'dossier-juridique', letter: 'D', label: 'Rédiger les conclusions',  brick: 'Dossier juridique' },
            { brique: 'procedure',         letter: 'P', label: 'Programmer l\'audience',   brick: 'Procédure' },
            { brique: 'crm',               letter: 'C', label: 'Informer le client',       brick: 'CRM'       }
          ]},
          { name: 'Audience', qas: [
            { brique: 'dossier-juridique', letter: 'D', label: 'Préparer la plaidoirie',  brick: 'Dossier juridique' },
            { brique: 'crm',               letter: 'C', label: 'Convoquer les témoins',   brick: 'CRM'       },
            { brique: 'procedure',         letter: 'P', label: 'Saisir les notes d\'audience', brick: 'Procédure' }
          ]},
          { name: 'Décision', qas: [
            { brique: 'procedure',         letter: 'P', label: 'Analyser le jugement',       brick: 'Procédure' },
            { brique: 'dossier-juridique', letter: 'D', label: 'Note d\'opportunité d\'appel', brick: 'Dossier juridique' },
            { brique: 'crm',               letter: 'C', label: 'Notifier le client',         brick: 'CRM'       },
            { brique: 'finance',           letter: 'F', label: 'Facturer la prestation',     brick: 'Finance'   }
          ]},
          { name: 'Exécution', qas: [
            { brique: 'crm',               letter: 'C', label: 'Mandater un commissaire',  brick: 'CRM'      },
            { brique: 'finance',           letter: 'F', label: 'Suivi du recouvrement',    brick: 'Finance'  },
            { brique: 'dossier-juridique', letter: 'D', label: 'Archiver le dossier',      brick: 'Dossier juridique' }
          ]}
        ]
      },

      {
        id: 'succession',
        accent: 'var(--metier-notariat)',
        kicker: 'Template · Notaire',
        label: 'Flow Succession',
        pill: 'En cours',
        meta: 'Maj. hier',
        steps: [
          { name: 'Ouverture', qas: [
            { brique: 'acte',       letter: 'A', label: 'Créer le dossier de succession', brick: 'Acte authentique' },
            { brique: 'acte',       letter: 'A', label: 'Identifier les héritiers',       brick: 'Acte authentique' },
            { brique: 'acte',       letter: 'A', label: 'Demander l\'acte de décès',      brick: 'Acte authentique' },
            { brique: 'crm',        letter: 'C', label: 'Convoquer les héritiers',         brick: 'CRM'              }
          ]},
          { name: 'Inventaire', qas: [
            { brique: 'patrimoine', letter: 'P', label: 'Lister les biens immobiliers', brick: 'Patrimoine' },
            { brique: 'estimation', letter: 'E', label: 'Estimer un bien (cross-métier)', brick: 'Estimation' },
            { brique: 'patrimoine', letter: 'P', label: 'Recenser les comptes',          brick: 'Patrimoine' },
            { brique: 'patrimoine', letter: 'P', label: 'Recenser le passif',            brick: 'Patrimoine' }
          ]},
          { name: 'Liquidation', qas: [
            { brique: 'patrimoine', letter: 'P', label: 'Calculer la masse',            brick: 'Patrimoine' },
            { brique: 'fiscal',     letter: 'F', label: 'Calculer les droits',          brick: 'Fiscal'     },
            { brique: 'fiscal',     letter: 'F', label: 'Déposer la déclaration',       brick: 'Fiscal'     },
            { brique: 'finance',    letter: 'F', label: 'Régler les dettes',            brick: 'Finance'    }
          ]},
          { name: 'Partage', qas: [
            { brique: 'acte',       letter: 'A', label: 'Acte de partage',            brick: 'Acte authentique' },
            { brique: 'acte',       letter: 'A', label: 'Attestation immobilière',    brick: 'Acte authentique' },
            { brique: 'legal',      letter: 'L', label: 'Comparution dématérialisée', brick: 'Legal'           }
          ]},
          { name: 'Publication & Clôture', qas: [
            { brique: 'acte',       letter: 'A', label: 'Publier au SPF',         brick: 'Acte authentique' },
            { brique: 'finance',    letter: 'F', label: 'Régler les émoluments',  brick: 'Finance'          },
            { brique: 'acte',       letter: 'A', label: 'Archiver au minutier',   brick: 'Acte authentique' },
            { brique: 'crm',        letter: 'C', label: 'Notifier le closing',    brick: 'CRM'              }
          ]}
        ]
      }
    ];

    /* ──────── Rendu ──────── */
    const renderSteps = (flow) => {
      const N = flow.steps.length;
      // Adapte la grille et la ligne de progression au nombre réel d'étapes
      stage.style.setProperty('--flow-cols', N);
      const offset = (100 / (2 * N)).toFixed(4) + '%';
      stage.style.setProperty('--flow-line-offset', `calc(${offset})`);

      ol.innerHTML = flow.steps.map((step, idx) => `
        <li>
          <div class="step__head">
            <span class="step__num">${idx + 1}</span>
            <span class="step__name">${step.name}</span>
          </div>
          <ul class="step__qas">
            ${step.qas.map(qa => `
              <li>
                <span class="bk bk--xs" style="--c: var(--b-${qa.brique})"><span>${qa.letter}</span></span>
                <b>${qa.label}</b>
                <small>${qa.brick}</small>
              </li>
            `).join('')}
          </ul>
        </li>
      `).join('');
    };

    const renderDots = () => {
      dotsList.innerHTML = FLOWS.map((f, idx) => `
        <li role="presentation">
          <button class="flow-switcher__dot${idx === flowIdx ? ' is-active' : ''}"
                  type="button" role="tab"
                  data-idx="${idx}"
                  aria-label="${f.label}"
                  aria-selected="${idx === flowIdx}"></button>
        </li>
      `).join('');
      $$('.flow-switcher__dot', dotsList).forEach((dot) => {
        dot.addEventListener('click', () => goTo(parseInt(dot.dataset.idx, 10), true));
      });
    };

    /* ──────── État ──────── */
    let flowIdx = 0;
    let i = 0;            // step actif (boucle de 0 à N-1)
    let timer = null;

    const STEP_INTERVAL = 1300; // ms — vitesse du défilement des étapes

    const currentFlow = () => FLOWS[flowIdx];

    const applyAccent = () => {
      flowSection.style.setProperty('--accent', currentFlow().accent);
      // soft + glow restent en color-mix CSS — pas besoin de les recalculer
      flowSection.style.setProperty('--accent-soft',
        `color-mix(in oklab, ${currentFlow().accent} 18%, transparent)`);
      flowSection.style.setProperty('--accent-glow',
        `color-mix(in oklab, ${currentFlow().accent} 45%, transparent)`);
    };

    const applyStep = () => {
      const steps = $$(':scope > li', ol);
      const N = steps.length;
      steps.forEach((li, idx) => {
        li.classList.remove('is-done', 'is-active');
        if (idx < i) li.classList.add('is-done');
        else if (idx === i) li.classList.add('is-active');
      });
      const pct = N <= 1 ? 0 : (i / (N - 1)) * 100;
      fill.style.width = pct + '%';
    };

    // Plus de click sur les steps — toutes les QAs sont déjà visibles,
    // l'animation ne sert qu'à matérialiser la progression du flow.
    const bindStepClicks = () => { /* no-op */ };

    // Boucle infinie sur le flow actif : 0 → 1 → ... → N-1 → 0 → ...
    // Aucune pause, aucun "mode terminé" — on revient simplement au début.
    const tickStep = () => {
      const N = currentFlow().steps.length;
      i = (i + 1) % N;
      applyStep();
      timer = setTimeout(tickStep, STEP_INTERVAL);
    };

    /* ──────── Slider — uniquement déclenché par l'utilisateur ──────── */
    const goTo = (newIdx) => {
      const max = FLOWS.length;
      flowIdx = ((newIdx % max) + max) % max;
      i = 0;

      // Soft fade sur la card
      flowCard.classList.add('is-changing');
      setTimeout(() => flowCard.classList.remove('is-changing'), 260);

      // Update header
      flowKicker.textContent = currentFlow().kicker;
      flowLabel.textContent  = currentFlow().label;
      flowMeta.textContent   = currentFlow().meta;
      flowPill.textContent   = currentFlow().pill;

      // Update steps + accent
      applyAccent();
      renderSteps(currentFlow());
      applyStep();
      renderDots();

      // Reset du tick : on relance immédiatement sur step 0 du nouveau flow
      clearTimeout(timer);
      if (!prefersReduced) timer = setTimeout(tickStep, STEP_INTERVAL);
    };

    prevBtn.addEventListener('click', () => goTo(flowIdx - 1));
    nextBtn.addEventListener('click', () => goTo(flowIdx + 1));

    /* ──────── Init ──────── */
    runWhenVisible(stage, () => {
      applyAccent();
      renderSteps(currentFlow());
      applyStep();
      renderDots();
      if (!prefersReduced) timer = setTimeout(tickStep, 800);
    }, { threshold: 0.2 });

    // Clavier ← → pour naviguer entre flows
    flowCard.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(flowIdx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(flowIdx + 1); }
    });
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
        // Scroll uniquement la timeline horizontalement — JAMAIS la fenêtre.
        // (scrollIntoView remontait la page à chaque étape et empêchait l'utilisateur de descendre.)
        await sleep(60);
        const targetLeft = li.offsetLeft - (timeline.clientWidth - li.offsetWidth) / 2;
        timeline.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
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
     §11b USINE V2 — wheel intercept : 1 wheel event = 1 slide
     On ne quitte la zone qu'après avoir vu toutes les slides.
     ================================================================= */
  (() => {
    const scrollZone = $('#uv2Scroll');
    if (!scrollZone) return;
    const sticky  = scrollZone.querySelector('.uv2__sticky');
    const slides  = $('#uv2Slides');
    const fill    = $('#uv2Fill');
    const counter = $('#uv2Cur');
    const dots    = $$('.uv2__dot-item', scrollZone);
    const N       = dots.length || 6;
    let   current = -1;
    let   locked  = false;
    let   lastSlideConfirmed = false; // double-wheel requis sur le dernier slide pour sortir
    const TRANS   = 920;

    const applyStep = (idx) => {
      current = idx;
      // Réinitialise la confirmation si on revient sur un slide ≠ dernier
      if (idx < N - 1) lastSlideConfirmed = false;
      if (slides)  slides.style.transform  = `translateX(-${idx * (100 / N)}%)`;
      if (fill)    fill.style.width        = (idx / (N - 1) * 100) + '%';
      if (counter) counter.textContent     = String(idx + 1).padStart(2, '0');
      dots.forEach((d, i) => d.classList.toggle('uv2--active', i === idx));
      // Compacte le titre dès la 2e slide
      if (sticky) sticky.classList.toggle('uv2--compact', idx > 0);
    };

    /* Est-ce que le panneau est actuellement "docked" (sticky actif) ? */
    const isStuck = () => {
      const r = scrollZone.getBoundingClientRect();
      return r.top <= 1 && r.bottom >= window.innerHeight - 1;
    };

    /* Avance d'une slide, bloque pendant la transition */
    const go = (dir) => {
      if (locked) return false;
      const next = current + dir;
      if (next < 0 || next >= N) return false; // hors bornes → ne consomme pas
      locked = true;
      applyStep(next);
      setTimeout(() => { locked = false; }, TRANS);
      return true; // événement consommé
    };

    /* Intercepte la molette quand le slider est actif */
    const onWheel = (e) => {
      if (!isStuck()) return;
      const dir = e.deltaY > 0 ? 1 : -1;

      // Réinitialise la confirmation si on remonte depuis le dernier slide
      if (dir === -1 && lastSlideConfirmed) lastSlideConfirmed = false;

      // Sortie haut : step 0, molette vers haut → laisse défiler naturellement
      if (dir === -1 && current <= 0) return;

      // Sortie bas sur le dernier slide
      if (dir === 1 && current >= N - 1) {
        // Pendant la transition (locked), bloquer absolument la sortie
        if (locked) { e.preventDefault(); return; }
        // Premier wheel sur le dernier slide → juste confirmer qu'on l'a vu
        if (!lastSlideConfirmed) {
          lastSlideConfirmed = true;
          e.preventDefault();
          return;
        }
        // Deuxième wheel → sortie réelle
        const zoneTop = scrollZone.getBoundingClientRect().top + window.scrollY;
        const endY    = zoneTop + scrollZone.offsetHeight - window.innerHeight + 2;
        window.scrollTo({ top: endY, behavior: 'instant' });
        return;
      }

      e.preventDefault();
      go(dir);
    };

    /* Sync scroll : quand la zone passe sticky, init step 0 */
    let wasStuck = false;
    const onScroll = () => {
      const stuck = isStuck();
      if (stuck && !wasStuck && current < 0) applyStep(0);
      wasStuck = stuck;
    };

    /* Clics sur les pastilles */
    dots.forEach((d, i) => {
      d.addEventListener('click', () => {
        if (!isStuck() || locked) return;
        locked = true;
        applyStep(i);
        setTimeout(() => { locked = false; }, TRANS);
      });
    });

    runWhenVisible(scrollZone, () => { applyStep(0); }, { threshold: 0.1 });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel',  onWheel,  { passive: false });
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

  /* =================================================================
     §11b CATALOGUE — chaque brique avec son catalogue d'actions rapides
     Marquee infini droite → gauche.
     ================================================================= */
  (() => {
    const track = $('#qaMarqueeTrack');
    if (!track) return;

    const CATALOG = [
      { name: 'Prospection', letter: 'P', brique: 'prospection', total: 73, qas: [
        'Rechercher des biens',
        'Identifier les propriétaires',
        'Créer un lead',
        'Importer une liste',
        'Géolocaliser un secteur',
        'Détecter les biens off-market',
        'Générer un mailing prospect',
        'Qualifier un prospect',
        'Suivre les relances',
        'Analyser la concurrence'
      ]},
      { name: 'Estimation', letter: 'E', brique: 'estimation', total: 91, qas: [
        'Créer un avis de valeur',
        'Comparer biens similaires',
        'Analyser le marché local',
        'Générer un rapport PDF',
        'Importer données cadastrales',
        'Calculer la rentabilité locative',
        'Estimer la plus-value',
        'Vérifier les diagnostics',
        'Comparer 3 méthodes',
        'Envoyer au propriétaire'
      ]},
      { name: 'Transaction', letter: 'T', brique: 'transaction', total: 124, qas: [
        'Créer une annonce',
        'Diffuser sur les portails',
        'Planifier une visite',
        'Enregistrer une offre',
        'Comparer les offres',
        'Suivre les retours visite',
        'Préparer le compromis',
        'Calculer les frais',
        'Notifier les acquéreurs',
        'Lancer la signature'
      ]},
      { name: 'Legal', letter: 'L', brique: 'legal', total: 156, qas: [
        'Générer un mandat',
        'Rédiger un compromis',
        'Préparer un acte authentique',
        'Annexer les diagnostics',
        'Vérifier la conformité',
        'Envoyer en signature',
        'Archiver le dossier',
        'Calculer les honoraires',
        'Préparer la facture',
        'Générer un avenant'
      ]},
      { name: 'CRM', letter: 'C', brique: 'crm', total: 142, qas: [
        'Créer un contact',
        'Programmer une relance',
        'Envoyer un email',
        'Lancer une campagne',
        'Enregistrer une note',
        'Planifier un RDV',
        'Segmenter une audience',
        'Suivre les interactions',
        'Exporter une liste',
        'Synchroniser les contacts'
      ]},
      { name: 'Contact', letter: 'C', brique: 'contact', total: 67, qas: [
        'Ajouter un contact',
        'Fusionner les doublons',
        'Vérifier les coordonnées',
        'Associer à un flow',
        'Enrichir une fiche',
        'Créer un groupe',
        'Attribuer des tags',
        'Importer un CSV',
        'Exporter une vCard',
        'Historique d\'échanges'
      ]},
      { name: 'Gestion', letter: 'G', brique: 'gestion', total: 118, qas: [
        'Encaisser un loyer',
        'Émettre une quittance',
        'Régulariser les charges',
        'Préparer un état des lieux',
        'Renouveler un bail',
        'Indexer un loyer',
        'Notifier le locataire',
        'Suivre les impayés',
        'Préparer la révision',
        'Clôturer un mandat'
      ]},
      { name: 'Syndic', letter: 'S', brique: 'syndic', total: 89, qas: [
        'Convoquer une AG',
        'Envoyer les convocations',
        'Générer le PV d\'AG',
        'Calculer les charges',
        'Émettre les appels de fonds',
        'Suivre les impayés',
        'Créer un ordre du jour',
        'Valider un devis travaux',
        'Enregistrer un sinistre',
        'Mettre à jour le règlement'
      ]},
      { name: 'Finance', letter: 'F', brique: 'finance', total: 78, qas: [
        'Enregistrer les honoraires',
        'Émettre une facture',
        'Pointer un règlement',
        'Préparer la TVA',
        'Suivre les commissions',
        'Générer un relevé',
        'Rapprocher un compte',
        'Clôturer un exercice',
        'Calculer une marge',
        'Exporter en compta'
      ]},
      { name: 'Ticket', letter: 'T', brique: 'ticket', total: 54, qas: [
        'Créer un ticket',
        'Assigner à un agent',
        'Suivre les SLA',
        'Escalader un incident',
        'Notifier le demandeur',
        'Clôturer un ticket',
        'Générer un rapport',
        'Catégoriser un ticket',
        'Programmer un suivi',
        'Analyser la satisfaction'
      ]},
      { name: 'Bien', letter: 'B', brique: 'bien', total: 96, qas: [
        'Créer une fiche bien',
        'Importer photos',
        'Générer une visite virtuelle',
        'Calculer la performance énergétique',
        'Annexer le DPE',
        'Mettre à jour le statut',
        'Archiver un bien',
        'Comparer deux biens',
        'Géolocaliser sur carte',
        'Synchroniser portails'
      ]}
    ];

    const buildCard = (b) => {
      const remaining = b.total - b.qas.length;
      const card = document.createElement('article');
      card.className = 'qa-card';
      card.style.setProperty('--c', `var(--b-${b.brique})`);
      // IMPORTANT : `.bk { --c: var(--b-default) }` réinitialise --c localement,
      // donc on doit le poser directement en inline style sur le .bk lui-même
      // (sinon les icônes apparaissent grises).
      const colorVar = `var(--b-${b.brique})`;
      card.innerHTML = `
        <div class="qa-card__head">
          <span class="bk bk--xl" style="--c: ${colorVar}"><span>${b.letter}</span></span>
          <b>Brique</b>
          <span class="qa-card__name">${b.name}</span>
        </div>
        <ul class="qa-card__list">
          ${b.qas.map(q => `<li>${q}</li>`).join('')}
        </ul>
        <div class="qa-card__more">
          <span>Et</span><b>${remaining}</b><span>actions de plus…</span>
        </div>`;
      return card;
    };

    const buildGroup = () => {
      const frag = document.createDocumentFragment();
      CATALOG.forEach(b => frag.appendChild(buildCard(b)));
      return frag;
    };

    track.appendChild(buildGroup());
    track.appendChild(buildGroup());
    if (prefersReduced) track.style.animation = 'none';
  })();

  /* =================================================================
     §7b AUTOMATION — Flow tabs (catalogue par template)
     ================================================================= */
  (() => {
    const root = $('#autoFlows');
    if (!root) return;
    const tabs   = $$('.auto-flow-tab', root);
    const panels = $$('.auto-flow-panel', root);
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.panel;
        tabs.forEach(t => t.classList.toggle('is-active', t === tab));
        panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
      });
    });
  })();

  /* =================================================================
     §7c AUTOMATION MIA — typewriter → loader → carte d'étape automatique
     (réplique de §07 mia-gen, version courte)
     ================================================================= */
  (() => {
    const stage   = $('#autoMiaStage');
    const typer   = $('#autoGenTyper');
    const enterEl = $('#autoGenEnter');
    const loader  = $('#autoGenLoader');
    const card    = $('#autoStepCard');
    if (!stage || !typer || !card) return;

    const PROMPT = "À l'étape de clôture, génère le compromis, fais signer les parties, notifie le notaire et archive le dossier.";

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const reset = () => {
      typer.textContent = '';
      enterEl?.classList.remove('is-show');
      loader?.classList.remove('is-show');
      card.classList.remove('is-show');
    };

    const typeWrite = async (text, speed = 26) => {
      for (let i = 0; i <= text.length; i++) {
        typer.textContent = text.slice(0, i);
        await sleep(speed + Math.random() * 22);
      }
    };

    const play = async () => {
      reset();
      await sleep(400);
      await typeWrite(PROMPT);
      enterEl?.classList.add('is-show');
      await sleep(550);
      loader?.classList.add('is-show');
      await sleep(2200);
      loader?.classList.remove('is-show');
      await sleep(120);
      card.classList.add('is-show');
    };

    let played = false;
    const playOnce = async () => {
      if (played) return;
      played = true;
      if (prefersReduced) {
        typer.textContent = PROMPT;
        enterEl?.classList.add('is-show');
        card.classList.add('is-show');
        return;
      }
      await play();
    };
    runWhenVisible(stage, playOnce, { threshold: 0.25 });
  })();

})();

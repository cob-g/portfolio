/* ==========================================================================
   INTERACTIVE ENGINE: CELESTIAL GLOW & FLUID MAGNETISM
   Script: Coordinates high-fidelity cursor tracking and micro-animations
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const dot = document.getElementById('c-dot');
  const ring = document.getElementById('c-ring');
  const spb = document.getElementById('spb');
  const twEl = document.getElementById('tw');
  const qrEl = document.getElementById('qr');
  
  // --- State Variables for Cursor Physics ---
  let mx = 0, my = 0;   // Mouse Coordinates
  let rx = 0, ry = 0;   // Ring Coordinates (Interpolated)
  let rw = 32, rh = 32; // Ring Width and Height (Interpolated)
  
  let targetX = 0, targetY = 0;
  let targetWidth = 32, targetHeight = 32;
  
  let hoveredSnapElement = null; // Snap Target
  let hoveredCard = false;        // Card Target
  let hoveredLink = false;        // Simple Link Target

  // --- Screenshot Case Study Deck ---
  const deckModal = document.getElementById('projectDeck');
  const deckOpenButtons = document.querySelectorAll('[data-deck-open]');
  const deckImage = document.getElementById('deckImage');
  const deckCounter = document.getElementById('deckCounter');
  const deckCaption = document.getElementById('deckCaption');
  const deckScreenLabel = document.getElementById('deckScreenLabel');
  const deckDots = document.getElementById('deckDots');
  const deckSlides = [
    {
      label: 'Dashboard',
      src: 'img/FloodSense1.png',
      alt: 'FloodSense dashboard screenshot',
      caption: 'Dashboard view for real-time water level tracking and flood risk status.'
    },
    {
      label: 'Home',
      src: 'img/FloodSenseHome.png',
      alt: 'FloodSense home page screenshot',
      caption: 'Home screen introducing the monitoring system and its core community value.'
    },
    {
      label: 'About',
      src: 'img/FloodSenseAbout.png',
      alt: 'FloodSense about page screenshot',
      caption: 'About section describing the flood monitoring workflow and system purpose.'
    },
    {
      label: 'Learn',
      src: 'img/FloodSenseLearn.png',
      alt: 'FloodSense learn page screenshot',
      caption: 'Informational page for understanding how the system supports flood response.'
    },
    {
      label: 'Contact',
      src: 'img/FloodSenseContact.png',
      alt: 'FloodSense contact page screenshot',
      caption: 'Contact page for community follow-up and response coordination.'
    }
  ];
  let deckIndex = 0;
  let deckLastFocus = null;

  function setDeckSlide(index) {
    if (!deckModal || !deckSlides.length) return;

    deckIndex = (index + deckSlides.length) % deckSlides.length;
    const slide = deckSlides[deckIndex];

    if (deckImage) {
      deckImage.src = slide.src;
      deckImage.alt = slide.alt;
    }

    if (deckCounter) {
      deckCounter.textContent = `${String(deckIndex + 1).padStart(2, '0')} / ${String(deckSlides.length).padStart(2, '0')}`;
    }

    if (deckCaption) deckCaption.textContent = slide.caption;
    if (deckScreenLabel) deckScreenLabel.textContent = slide.label;

    if (deckDots) {
      deckDots.querySelectorAll('.deck-dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === deckIndex);
        dot.setAttribute('aria-current', dotIndex === deckIndex ? 'true' : 'false');
      });
    }
  }

  function openDeck() {
    if (!deckModal) return;

    deckLastFocus = document.activeElement;
    setDeckSlide(0);
    deckModal.classList.add('open');
    deckModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('deck-lock');
    document.body.classList.remove('ch', 'ch-snap', 'ch-card');
    hoveredSnapElement = null;
    hoveredLink = false;
    hoveredCard = false;

    const closeButton = deckModal.querySelector('.deck-close');
    if (closeButton) closeButton.focus();
  }

  function closeDeck() {
    if (!deckModal) return;

    deckModal.classList.remove('open');
    deckModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('deck-lock', 'ch', 'ch-snap', 'ch-card');
    hoveredSnapElement = null;
    hoveredLink = false;
    hoveredCard = false;

    if (deckLastFocus && typeof deckLastFocus.focus === 'function') {
      deckLastFocus.focus();
    }
  }

  function shiftDeck(delta) {
    setDeckSlide(deckIndex + delta);
  }

  if (deckModal) {
    if (deckDots) {
      deckSlides.forEach((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'deck-dot';
        dot.setAttribute('aria-label', `Show ${slide.label} screenshot`);
        dot.addEventListener('click', () => setDeckSlide(index));
        deckDots.appendChild(dot);
      });
    }

    deckOpenButtons.forEach(button => {
      button.addEventListener('click', openDeck);
    });

    document.querySelectorAll('[data-deck-close]').forEach(button => {
      button.addEventListener('click', closeDeck);
    });

    const prevButton = document.querySelector('[data-deck-prev]');
    const nextButton = document.querySelector('[data-deck-next]');

    if (prevButton) prevButton.addEventListener('click', () => shiftDeck(-1));
    if (nextButton) nextButton.addEventListener('click', () => shiftDeck(1));

    document.addEventListener('keydown', (event) => {
      if (!deckModal.classList.contains('open')) return;

      if (event.key === 'Escape') closeDeck();
      if (event.key === 'ArrowLeft') shiftDeck(-1);
      if (event.key === 'ArrowRight') shiftDeck(1);
    });

    setDeckSlide(0);
  }
  
  // --- Track Mouse Coordinates ---
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    
    // Position dot immediately
    if (dot) {
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    }
  });

  // Initialize coordinates to prevent snap-in jump from top-left
  window.addEventListener('mouseover', (e) => {
    mx = e.clientX;
    my = e.clientY;
    rx = mx;
    ry = my;
  }, { once: true });

  // --- Spring Animation Loop for Custom Cursor ---
  function updateCursor() {
    if (!ring) return;
    
    if (hoveredSnapElement) {
      // Snapping state: ring lock onto element boundaries
      const rect = hoveredSnapElement.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
      targetWidth = rect.width + 10;
      targetHeight = rect.height + 10;
      
      // Extract target border-radius for clean alignment
      const borderRadius = window.getComputedStyle(hoveredSnapElement).borderRadius;
      ring.style.borderRadius = borderRadius;
    } else {
      // Normal state: ring follows mouse cursor
      targetX = mx;
      targetY = my;
      
      if (hoveredCard) {
        targetWidth = 76;
        targetHeight = 76;
      } else if (hoveredLink) {
        targetWidth = 48;
        targetHeight = 48;
      } else {
        targetWidth = 32;
        targetHeight = 32;
      }
      
      ring.style.borderRadius = '50%';
    }
    
    // Smooth Linear Interpolation (Lerp) with spring damping
    rx += (targetX - rx) * 0.15;
    ry += (targetY - ry) * 0.15;
    rw += (targetWidth - rw) * 0.18;
    rh += (targetHeight - rh) * 0.18;
    
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    ring.style.width = rw + 'px';
    ring.style.height = rh + 'px';
    
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  // --- Attach Snap & Hover Event Listeners ---
  const snapTargets = document.querySelectorAll('a, button, .btn, .soc, .sidenav a');
  snapTargets.forEach(el => {
    // Determine target hover classes
    el.addEventListener('mouseenter', (e) => {
      hoveredLink = true;
      document.body.classList.add('ch');
      
      // Apply rectangular snap for buttons and badges; circular snap for tiny icons
      if (el.classList.contains('btn') || el.closest('.sidenav')) {
        hoveredSnapElement = el;
        document.body.classList.add('ch-snap');
      }
    });
    
    el.addEventListener('mouseleave', () => {
      hoveredLink = false;
      hoveredSnapElement = null;
      document.body.classList.remove('ch', 'ch-snap');
    });
  });

  // Hover state for Project Cards
  const cards = document.querySelectorAll('.pj-card, .cred-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      hoveredCard = true;
      document.body.classList.add('ch-card');
    });
    card.addEventListener('mouseleave', () => {
      hoveredCard = false;
      document.body.classList.remove('ch-card');
    });
  });

  // --- Interactive Radial Spotlight Glow on Cards ---
  const glassPanels = document.querySelectorAll('.glass, .pj-card, .cred-card, .sbox, .id-card');
  glassPanels.forEach(panel => {
    panel.addEventListener('mousemove', (e) => {
      const rect = panel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      panel.style.setProperty('--mouse-x', `${x}px`);
      panel.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // --- Fluid Magnetic Pull on Interactive Buttons ---
  const magneticElements = document.querySelectorAll('.btn, .soc');
  magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      // Calculate offset distance
      const ox = e.clientX - cx;
      const oy = e.clientY - cy;
      
      // Gentle attraction translation (pull 22% towards pointer)
      el.style.transform = `translate(${ox * 0.22}px, ${oy * 0.22}px)`;
    });
    
    el.addEventListener('mouseleave', () => {
      // Spring back to base position smoothly
      el.style.transform = 'translate(0, 0)';
    });
  });

  // --- 3D Parallax ID Card Hover ---
  const idCard = document.querySelector('.id-card');
  if (idCard) {
    idCard.addEventListener('mousemove', (e) => {
      const rect = idCard.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      const ox = e.clientX - cx;
      const oy = e.clientY - cy;
      
      // Map offset to max 12 degree rotation angles
      const rxRot = -(oy / (rect.height / 2)) * 12;
      const ryRot = (ox / (rect.width / 2)) * 12;
      
      idCard.style.transform = `rotateX(${rxRot}deg) rotateY(${ryRot}deg) scale(1.02)`;
    });
    
    idCard.addEventListener('mouseleave', () => {
      idCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });
  }

  // --- Scroll Progress Bar ---
  if (spb) {
    window.addEventListener('scroll', () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      spb.style.width = scrollPercent + '%';
    });
  }

  // --- Typewriter Effect ---
  if (twEl) {
    const phrases = ['AI & Software Engineer', 'Frontend Developer', 'AI Tools Integrator', 'Web Developer'];
    let pi = 0, ci = 0, del = false;
    
    function type() {
      const w = phrases[pi];
      if (!del) {
        twEl.textContent = w.slice(0, ++ci);
        if (ci === w.length) {
          del = true;
          setTimeout(type, 1800);
          return;
        }
      } else {
        twEl.textContent = w.slice(0, --ci);
        if (ci === 0) {
          del = false;
          pi = (pi + 1) % phrases.length;
        }
      }
      setTimeout(type, del ? 40 : 80);
    }
    type();
  }

  // --- Intersection Observer: Reveal on Scroll ---
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
      }
    });
  }, { threshold: 0.12 });
  
  document.querySelectorAll('.rev').forEach(el => {
    revealObserver.observe(el);
  });

  // --- Section Blur Reveal: Smooth scroll-driven section focus ---
  const sections = document.querySelectorAll('section[id]');

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15) {
      section.classList.add('is-visible');
    }
  });

  const sectionRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, {
    threshold: 0.22,
    rootMargin: '0px 0px -12% 0px'
  });

  sections.forEach(section => {
    sectionRevealObserver.observe(section);
  });

  // --- Intersection Observer: Active Sidenav Indicator ---
  const activeNavObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.sidenav a').forEach(a => a.classList.remove('active'));
        const activeLink = document.querySelector(`.sidenav a[href="#${entry.target.id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, { threshold: 0.35 });
  
  document.querySelectorAll('section[id]').forEach(sec => {
    activeNavObserver.observe(sec);
  });

  // --- QR Code Grid Generation ---
  if (qrEl) {
    const qrMatrix = [
      1, 0, 1, 1, 0, 1, 
      0, 1, 0, 0, 1, 0, 
      1, 0, 1, 1, 0, 0, 
      1, 1, 0, 0, 1, 0, 
      1, 0, 1, 0, 0, 1, 
      1, 0, 0, 1, 0, 1
    ];
    qrMatrix.forEach(val => {
      const cell = document.createElement('div');
      cell.className = 'qrc' + (val ? '' : ' e');
      qrEl.appendChild(cell);
    });
  }
});

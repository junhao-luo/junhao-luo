/**
 * ELJHON STEVE (羅俊豪) - PORTFOLIO INTERACTION ENGINE
 * Features:
 * 1. Fluid Aurora Light Ribbons (HTML5 Canvas Animation)
 * 2. Kinetic Tumbler Box Cycling Cursive Words
 * 3. Persistent 0-100 Viewport Scroll Slider with Scrubbing
 * 4. Degree Checkpoint 12.5% Progress Animation & Hover Bubble
 * 5. Menu Drawer & Smooth Section Navigation
 * 6. Quick Ping / URL Clipboard Toast Feedback
 * 7. Contact Form Simulation & Footer Email Handling
 */

document.addEventListener('DOMContentLoaded', () => {
  initViewportAnimationCulling();
  initTumblerBox();
  initStickySlider();
  initDegreeCheckpoint();
  initFlipCards();
  initNodeConnectors();
  initDossierTelemetry();
  initTiltCards();
  initMenuDrawer();
  initCopyButton();
  initContactForms();
  updateCurrentYear();
  handleUrlParams();
});

function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const scrollTarget = params.get('scroll');
  if (scrollTarget) {
    const el = document.getElementById(scrollTarget);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 100);
    }
  }
  if (params.get('hover') === '1') {
    setTimeout(() => {
      const pills = document.querySelectorAll('.staggered-action-pill');
      if (pills[0]) pills[0].classList.add('is-hovered');
      if (pills[1]) pills[1].classList.add('is-hovered');
    }, 150);
  }
}

/* ==========================================================================
   1. VIEWPORT ANIMATION CULLING (Zero Battery Waste on Offscreen Animations)
   ========================================================================== */
function initViewportAnimationCulling() {
  const animatedSections = document.querySelectorAll('#checkpoint, #about, #ecosystem, #contact');
  if (!animatedSections.length || !('IntersectionObserver' in window)) return;

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-offscreen');
      } else {
        entry.target.classList.add('is-offscreen');
      }
    });
  }, { threshold: 0.05 });

  animatedSections.forEach((sec) => sectionObserver.observe(sec));
}

/* ==========================================================================
   2. KINETIC TUMBLER BOX (HERO ACCENT WORD CYCLING)
   ========================================================================== */
function initTumblerBox() {
  const words = document.querySelectorAll('.tumbler-word');
  if (!words.length) return;

  let currentIndex = 0;
  const cycleInterval = 2800; // ms

  setInterval(() => {
    const currentWord = words[currentIndex];
    currentWord.classList.remove('active');
    currentWord.classList.add('exit');

    setTimeout(() => {
      currentWord.classList.remove('exit');
    }, 450);

    currentIndex = (currentIndex + 1) % words.length;
    const nextWord = words[currentIndex];
    nextWord.classList.add('active');
  }, cycleInterval);
}

/* ==========================================================================
   3. PERSISTENT 0-100 VIEWPORT SCROLL SLIDER (STICKY BOTTOM ELEMENT)
   ========================================================================== */
function initStickySlider() {
  const slider = document.getElementById('stickySlider');
  const progressBar = document.getElementById('sliderProgressBar');
  const thumb = document.getElementById('sliderThumb');
  const tooltip = document.getElementById('sliderTooltip');

  if (!slider || !progressBar || !thumb) return;

  let isDragging = false;

  function updateSlider() {
    if (isDragging) return;

    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollRatio = maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0;
    const percent = Math.round(scrollRatio * 100);

    progressBar.style.width = `${percent}%`;
    thumb.style.left = `${percent}%`;
    if (tooltip) {
      tooltip.textContent = `${percent}%`;
    }
  }

  window.addEventListener('scroll', updateSlider, { passive: true });
  window.addEventListener('resize', updateSlider);
  updateSlider();

  // Dragging / Clicking on the slider capsule to scroll
  const capsule = slider.querySelector('.slider-capsule');
  
  function handleScrub(e) {
    const rect = capsule.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX === undefined) return;

    const clickX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const scrubRatio = clickX / rect.width;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    
    window.scrollTo({
      top: scrubRatio * maxScroll,
      behavior: 'smooth'
    });
  }

  capsule.addEventListener('click', (e) => {
    handleScrub(e);
  });

  thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    handleScrub(e);
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      updateSlider();
    }
  });

  // Touch device support
  thumb.addEventListener('touchstart', (e) => {
    isDragging = true;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    handleScrub(e);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (isDragging) {
      isDragging = false;
      updateSlider();
    }
  });
}

/* ==========================================================================
   4. DEGREE CHECKPOINT 12.5% PROGRESS ANIMATION, HOVER BUBBLE & DYNAMIC EPOCHS
   ========================================================================== */
function initDegreeCheckpoint() {
  const fill = document.getElementById('degreeProgressFill');
  const trackWrapper = document.querySelector('.progress-track-wrapper');
  const bubble = document.getElementById('progressBubble');
  const epochNodes = document.querySelectorAll('.milestone-box.epoch-node');
  const epoch1Loss = document.getElementById('epoch1Loss');

  if (!fill) return;

  // Initialize width to 0
  fill.style.width = '0%';

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          fill.style.width = '12.5%';
        }, 300);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  const section = document.getElementById('checkpoint');
  if (section) {
    observer.observe(section);
  }

  // 1. Dynamic Epoch 1 SGD Loss fluctuations
  if (epoch1Loss) {
    let currentLoss = 0.3421;
    setInterval(() => {
      const delta = (Math.random() - 0.52) * 0.003;
      currentLoss = Math.max(0.338, Math.min(0.348, currentLoss + delta));
      epoch1Loss.textContent = currentLoss.toFixed(4);
    }, 1800);
  }

  // 2. Interactive Milestone Epoch Node Hover Preview
  const epochTargets = [
    { percent: 12.5, label: '12.5%' },
    { percent: 50.0, label: '50.0% (Epoch 2–4)' },
    { percent: 87.5, label: '87.5% (Epoch 5–7)' },
    { percent: 100.0, label: '100.0% (Convergence)' }
  ];

  epochNodes.forEach((node, idx) => {
    const target = epochTargets[idx];
    if (!target) return;

    node.addEventListener('mouseenter', () => {
      fill.style.width = `${target.percent}%`;
      if (bubble) {
        bubble.textContent = target.label;
        bubble.style.left = `${target.percent}%`;
        bubble.style.opacity = '1';
        bubble.style.visibility = 'visible';
        bubble.style.transform = 'translateX(-50%) translateY(-2px)';
      }
    });

    node.addEventListener('mouseleave', () => {
      fill.style.width = '12.5%';
      if (bubble) {
        bubble.textContent = '12.5%';
        bubble.style.left = '12.5%';
        bubble.style.opacity = '';
        bubble.style.visibility = '';
        bubble.style.transform = '';
      }
    });

    node.addEventListener('click', () => {
      showToast(`⚡ [EPOCH TELEMETRY] ${target.label} checkpoint inspected.`);
    });
  });
}

/* ==========================================================================
   5. MENU DRAWER & SMOOTH NAVIGATION
   ========================================================================== */
function initMenuDrawer() {
  const menuToggle = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileMenuDrawer');
  const drawerLinks = document.querySelectorAll('.drawer-item');

  if (!menuToggle || !drawer) return;

  menuToggle.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close drawer when clicking any link
  drawerLinks.forEach((link) => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ==========================================================================
   6. QUICK PING & PORTFOLIO URL CLIPBOARD COPY
   ========================================================================== */
function initCopyButton() {
  const copyBtn = document.getElementById('copyProfileBtn');
  const copyBtnText = document.getElementById('copyBtnText');

  if (!copyBtn) return;

  copyBtn.addEventListener('click', async () => {
    const url = window.location.href;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      showToast('⚡ [SUCCESS] Portfolio URL copied to clipboard!');
      if (copyBtnText) {
        const orig = copyBtnText.textContent;
        copyBtnText.textContent = 'Copied!';
        setTimeout(() => {
          copyBtnText.textContent = orig;
        }, 2000);
      }
    } catch (err) {
      showToast('⚡ Portfolio URL: ' + window.location.href);
    }
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

/* ==========================================================================
   7. FORM SUBMISSIONS & QUICK CONNECT
   ========================================================================== */
function initContactForms() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('formName').value;
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmitting...';
      }

      setTimeout(() => {
        showToast(`⚡ Message sent! Thank you, ${name || 'friend'}. Eljhon Steve (羅俊豪) will reach out shortly.`);
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Initiate Ping</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
        }
      }, 900);
    });
  }

  const footerConnectBtn = document.getElementById('footerConnectBtn');
  const footerEmailInput = document.getElementById('footerEmailInput');

  if (footerConnectBtn && footerEmailInput) {
    footerConnectBtn.addEventListener('click', () => {
      const email = footerEmailInput.value.trim();
      if (!email || !email.includes('@')) {
        showToast('⚠️ Please enter a valid email address.');
        return;
      }

      showToast(`⚡ Connection established with ${email}!`);
      footerEmailInput.value = '';
    });
  }
}

/* ==========================================================================
   8. DYNAMIC COPYRIGHT YEAR
   ========================================================================== */
function updateCurrentYear() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/* ==========================================================================
   9. 3D FLIP CARDS (CLICK / TOUCH TOGGLE SUPPORT)
   ========================================================================== */
function initFlipCards() {
  const flipCards = document.querySelectorAll('.module-flip-card');
  flipCards.forEach((card) => {
    // Enable keyboard accessibility (Enter/Space key)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-flipped');
      }
    });

    // Tap support for mobile devices
    card.addEventListener('click', (e) => {
      // Don't toggle if clicking on a link inside the card
      if (e.target.tagName.toLowerCase() === 'a') return;
      card.classList.toggle('is-flipped');
    });
  });
}

/* ==========================================================================
   10. NODE WORKFLOW BEZIER CONNECTOR SYNCHRONIZATION
   ========================================================================== */
function initNodeConnectors() {
  const canvasArea = document.getElementById('nodeCanvasArea');
  if (!canvasArea) return;

  const pairs = [
    { from: 'socketTriggerOut', to: 'socketAiIn', path: 'bezierTriggerToAi' },
    { from: 'socketTriggerOut', to: 'socketRouterIn', path: 'bezierTriggerToRouter' },
    { from: 'socketAiOut', to: 'socketOutputIn', path: 'bezierAiToOutput' },
    { from: 'socketRouterOut', to: 'socketOutputIn', path: 'bezierRouterToOutput' }
  ];

  function updateConnectors() {
    if (window.innerWidth <= 768) {
      pairs.forEach(({ path }) => {
        const pEl = document.getElementById(path);
        if (pEl) pEl.setAttribute('d', '');
      });
      return;
    }

    const cRect = canvasArea.getBoundingClientRect();

    pairs.forEach(({ from, to, path }) => {
      const sFrom = document.getElementById(from);
      const sTo = document.getElementById(to);
      const pEl = document.getElementById(path);

      if (!sFrom || !sTo || !pEl) return;

      const rFrom = sFrom.getBoundingClientRect();
      const rTo = sTo.getBoundingClientRect();

      const x1 = rFrom.left + rFrom.width / 2 - cRect.left;
      const y1 = rFrom.top + rFrom.height / 2 - cRect.top;
      const x2 = rTo.left + rTo.width / 2 - cRect.left;
      const y2 = rTo.top + rTo.height / 2 - cRect.top;

      const dx = Math.max((x2 - x1) * 0.45, 25);
      pEl.setAttribute('d', `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`);
    });
  }

  updateConnectors();
  window.addEventListener('resize', updateConnectors, { passive: true });
  window.addEventListener('load', updateConnectors);
  setTimeout(updateConnectors, 250);
  setTimeout(updateConnectors, 800);
}

/* ==========================================================================
   11. SECTION 4: ARCHITECT DOSSIER TELEMETRY & TIME-SYNC
   ========================================================================== */
function initDossierTelemetry() {
  const timecodeEl = document.getElementById('liveRecTimecode');
  const langPills = document.querySelectorAll('.lang-spectrum-strip .lang-pill');

  // 2. Video Viewfinder REC Timecode (Rolling 24fps counter)
  if (timecodeEl) {
    let frame = 12;
    let sec = 19;
    let min = 24;
    let hr = 0;

    setInterval(() => {
      frame++;
      if (frame >= 24) {
        frame = 0;
        sec++;
        if (sec >= 60) {
          sec = 0;
          min++;
          if (min >= 60) {
            min = 0;
            hr++;
          }
        }
      }
      const pad = (n) => (n < 10 ? '0' + n : n);
      timecodeEl.textContent = `${pad(hr)}:${pad(min)}:${pad(sec)}:${pad(frame)}`;
    }, 1000 / 24);
  }

  // 3. Dynamic Cycling of Language Spectrum Pills
  if (langPills.length > 0) {
    let currentIdx = 0;
    setInterval(() => {
      langPills.forEach((p) => {
        p.classList.remove('active-lang');
        const dot = p.querySelector('.lang-dot');
        if (dot) dot.remove();
      });

      currentIdx = (currentIdx + 1) % langPills.length;
      const activePill = langPills[currentIdx];
      activePill.classList.add('active-lang');
      const dot = document.createElement('span');
      dot.className = 'lang-dot';
      activePill.prepend(dot);
    }, 2800);
  }
}

/* ==========================================================================
   12. 3D TILT CARDS & SPECULAR SPOTLIGHT (RAF DEBOUNCED & THROTTLED)
   ========================================================================== */
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  if (!cards.length) return;

  // Respect reduced motion accessibility
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  cards.forEach((card) => {
    let rect = null;
    let rafId = null;

    card.addEventListener('mouseenter', () => {
      rect = card.getBoundingClientRect();
    }, { passive: true });

    card.addEventListener('mousemove', (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const percentX = Math.max(0, Math.min(1, x / rect.width));
        const percentY = Math.max(0, Math.min(1, y / rect.height));

        // Update specular sheen position
        card.style.setProperty('--mouse-x', `${(percentX * 100).toFixed(1)}%`);
        card.style.setProperty('--mouse-y', `${(percentY * 100).toFixed(1)}%`);

        // Dynamic 3D tilt angles (max +-7 degrees for refined Jakub polish)
        const rotateX = ((0.5 - percentY) * 10).toFixed(2);
        const rotateY = ((percentX - 0.5) * 10).toFixed(2);

        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      if (rafId) cancelAnimationFrame(rafId);
      rect = null;
      card.style.transform = '';
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    }, { passive: true });
  });
}


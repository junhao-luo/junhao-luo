/**
 * ELJHON STEVE (羅俊豪) - PORTFOLIO INTERACTION ENGINE
 * Features:
 * 1. Fluid Aurora Light Ribbons (HTML5 Canvas Animation)
 * 2. Kinetic Tumbler Box Cycling Cursive Words
 * 3. Persistent 0-100 Viewport Scroll Slider with Scrubbing
 * 4. Study Timeline & Planned Semester Previews
 * 5. Menu Drawer & Smooth Section Navigation
 * 6. Quick Ping / URL Clipboard Toast Feedback
 * 7. Contact Form & Footer Email Delivery
 */

document.addEventListener('DOMContentLoaded', () => {
  initViewportAnimationCulling();
  initTumblerBox();
  initStickySlider();
  initDegreeCheckpoint();
  initFlipCards();
  initServiceDetails();
  initNodeConnectors();
  initTiltCards();
  initMenuDrawer();
  initCopyButton();
  initContactForms();
  updateCurrentYear();
  handleUrlParams();
});

const translate = text => window.portfolioI18n?.t(text) || text;
const localized = (en, zh, values) => window.portfolioI18n
  ? window.portfolioI18n.interpolate(en, zh, values)
  : en.replace(/\{(\w+)\}/g, (_, key) => values[key]);

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
  const animatedSections = document.querySelectorAll('main > section, .mega-site-footer');
  if (!animatedSections.length || !('IntersectionObserver' in window)) return;

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-offscreen');
      } else {
        entry.target.classList.add('is-offscreen');
      }
    });
  }, { rootMargin: '160px', threshold: 0 });

  animatedSections.forEach((sec) => sectionObserver.observe(sec));
}

/* ==========================================================================
   2. KINETIC TUMBLER BOX (HERO ACCENT WORD CYCLING)
   ========================================================================== */
function initTumblerBox() {
  const box = document.getElementById('tumblerBox');
  if (!box) return;

  let inView = true;
  const updatePlayback = () => {
    box.classList.toggle('is-paused', document.hidden || !inView);
  };
  document.addEventListener('visibilitychange', updatePlayback);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePlayback();
    });
    observer.observe(box);
  }
  updatePlayback();
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
    thumb.setAttribute('aria-valuenow', String(percent));
    if (tooltip) {
      tooltip.textContent = `${percent}%`;
    }
  }

  window.addEventListener('scroll', updateSlider, { passive: true });
  window.addEventListener('resize', updateSlider);
  requestAnimationFrame(updateSlider);

  thumb.addEventListener('keydown', (event) => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const step = maxScroll / 100;
    const targets = {
      ArrowRight: window.scrollY + step,
      ArrowUp: window.scrollY + step,
      ArrowLeft: window.scrollY - step,
      ArrowDown: window.scrollY - step,
      PageUp: window.scrollY + window.innerHeight,
      PageDown: window.scrollY - window.innerHeight,
      Home: 0,
      End: maxScroll
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    window.scrollTo({ top: Math.min(maxScroll, Math.max(0, targets[event.key])), behavior: 'instant' });
    updateSlider();
  });

  // Dragging / Clicking on the slider capsule to scroll
  const capsule = slider.querySelector('.slider-capsule');

  function handleScrub(e) {
    const rect = capsule.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0].clientX;
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
   4. STUDY TIMELINE & PLANNED SEMESTER PREVIEWS
   ========================================================================== */
function initDegreeCheckpoint() {
  const fill = document.getElementById('degreeProgressFill');
  const track = document.getElementById('degreeProgressTrack');
  const bubble = document.getElementById('progressBubble');
  const epochNodes = document.querySelectorAll('.milestone-box.epoch-node');
  if (!fill || !track) return;

  const currentSemester = Number(track.getAttribute('aria-valuenow'));
  const semesterCount = Number(track.getAttribute('aria-valuemax'));
  const currentDescription = track.getAttribute('aria-valuetext');
  const updateTimeline = (semester, planned = false) => {
    const percent = semester / semesterCount * 100;
    fill.style.width = `${percent}%`;
    track.setAttribute('aria-valuenow', String(semester));
    track.setAttribute('aria-valuetext', localized(
      planned ? 'Planned semester {semester} of {count}; not earned-credit progress' : currentDescription,
      planned ? '預定學期：第 {semester} 學期，共 {count} 學期；非已取得學分進度' : '目前學期：115-1，八個學期中的第一學期；非已取得學分進度',
      {semester, count: semesterCount}));
    if (bubble) {
      bubble.textContent = localized(
        `${planned ? 'Planned: ' : ''}{semester} of {count} semesters`,
        `${planned ? '預定：' : ''}第 {semester}／{count} 學期`,
        {semester, count: semesterCount});
      bubble.style.left = `clamp(80px, ${percent}%, calc(100% - 80px))`;
    }
  };
  updateTimeline(currentSemester);
  document.addEventListener('portfolio-language-change', () => updateTimeline(currentSemester));

  epochNodes.forEach(node => {
    const semester = Number(node.dataset.semester);
    if (!semester) return;
    const preview = () => {
      updateTimeline(semester, true);
      if (bubble) {
        bubble.style.opacity = '1';
        bubble.style.visibility = 'visible';
        bubble.style.transform = 'translateX(-50%) translateY(-2px)';
      }
    };
    const restore = () => {
      updateTimeline(currentSemester);
      if (bubble) {
        bubble.style.opacity = '';
        bubble.style.visibility = '';
        bubble.style.transform = '';
      }
    };
    node.addEventListener('mouseenter', preview);
    node.addEventListener('mouseleave', restore);
    node.addEventListener('focus', preview);
    node.addEventListener('blur', restore);
    node.addEventListener('click', (event) => {
      if (event.target.closest('details')) return;
      showToast(localized('Planned academic terms: {period}.', '預定學期：{period}。', {period: node.dataset.period}));
    });
    node.addEventListener('keydown', (event) => {
      if (event.target !== node) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        node.click();
      }
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

  drawer.inert = true;
  function closeDrawer(returnFocus = false) {
    drawer.classList.remove('open');
    drawer.inert = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuToggle.focus();
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    drawer.inert = !isOpen;
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close drawer when clicking any link
  drawerLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer(true);
    }
  });
  document.addEventListener('click', (event) => {
    if (!drawer.contains(event.target) && !menuToggle.contains(event.target)) closeDrawer();
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

      showToast('Site link copied to your clipboard.');
      if (copyBtnText) {
        copyBtnText.textContent = translate('Link Copied');
        setTimeout(() => {
          copyBtnText.textContent = translate('Copy Site Link');
        }, 2000);
      }
    } catch (err) {
      showToast(localized('Copy this site link: {url}', '請複製此網站連結：{url}', {url: window.location.href}));
    }
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = translate(msg);
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
  const footerForm = document.getElementById('footerContactForm');
  const footerBtn = document.getElementById('footerConnectBtn');
  const pending = new WeakMap();

  async function sendContact(payload, button, label, sendingLabel) {
    const json = JSON.stringify(payload);
    let submission = pending.get(button);
    if (!submission || submission.json !== json) {
      submission = {json, requestId: crypto.randomUUID()};
      pending.set(button, submission);
    }
    const buttonText = button.querySelector('span');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    buttonText.textContent = translate(sendingLabel);
    try {
      const endpoint = document.querySelector('meta[name="contact-endpoint"]')?.content || '/api/contact';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...payload, requestId: submission.requestId}),
        signal: AbortSignal.timeout(20_000)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true) {
        showToast(response.status === 429
          ? 'Too many requests. Please wait a minute and try again.'
          : 'Your message could not be sent. Please try again or contact me on LinkedIn.');
        return false;
      }
      pending.delete(button);
      return true;
    } catch {
      showToast('Your message could not be sent. Please try again or contact me on LinkedIn.');
      return false;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      buttonText.textContent = translate(label);
    }
  }

  if (form && submitBtn) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitBtn.disabled || !form.reportValidity()) return;
      const payload = Object.fromEntries(new FormData(form));
      if (await sendContact({...payload, kind: 'inquiry'}, submitBtn, 'Send Inquiry', 'Sending...')) {
        form.reset();
        showToast('Your inquiry has been sent. Thank you!');
      }
    });
  }
  if (footerForm && footerBtn) {
    footerForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (footerBtn.disabled || !footerForm.reportValidity()) return;
      const payload = Object.fromEntries(new FormData(footerForm));
      if (await sendContact({...payload, kind: 'connect'}, footerBtn, 'Connect', 'Sending...')) {
        footerForm.reset();
        showToast('Your contact request has been sent. Thank you!');
      }
    });
  }
  document.addEventListener('portfolio-language-change', () => {
    for (const [button, label] of [[submitBtn, 'Send Inquiry'], [footerBtn, 'Connect']]) {
      if (button) button.querySelector('span').textContent = translate(button.disabled ? 'Sending...' : label);
    }
    const copyLabel = document.getElementById('copyBtnText');
    if (copyLabel) copyLabel.textContent = translate('Copy Site Link');
  });
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
    const front = card.querySelector('.flip-card-front');
    const back = card.querySelector('.flip-card-back');
    const hoverQuery = window.matchMedia('(hover: hover)');
    let hovered = false;
    const updateState = () => {
      const expanded = card.classList.contains('is-flipped') || hovered;
      card.setAttribute('aria-pressed', String(expanded));
      front?.setAttribute('aria-hidden', String(expanded));
      back?.setAttribute('aria-hidden', String(!expanded));
    };
    updateState();
    card.addEventListener('mouseenter', () => { hovered = hoverQuery.matches; updateState(); });
    card.addEventListener('mouseleave', () => { hovered = false; updateState(); });
    // Enable keyboard accessibility (Enter/Space key)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-flipped');
        updateState();
      }
    });

    // Tap support for mobile devices
    card.addEventListener('click', (e) => {
      // Don't toggle if clicking on a link inside the card
      if (e.target.closest('a')) return;
      card.classList.toggle('is-flipped');
      updateState();
    });
  });
}

function initServiceDetails() {
  const pills = [...document.querySelectorAll('.staggered-action-pill')];
  const panel = document.querySelector('.dash-panel-right');
  if (!pills.length || !panel) return;
  pills.forEach((pill, index) => {
    const details = pill.querySelector('.pill-popout-desc');
    const title = pill.querySelector('.action-title');
    if (!details || !title) return;
    title.id = `service-title-${index}`;
    details.id = `service-details-${index}`;
    pill.setAttribute('role', 'button');
    pill.setAttribute('aria-labelledby', title.id);
    pill.setAttribute('aria-controls', details.id);
    pill.setAttribute('aria-expanded', 'false');
    const toggle = () => pill.setAttribute('aria-expanded', String(pill.getAttribute('aria-expanded') !== 'true'));
    pill.addEventListener('click', toggle);
    pill.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });
  });

  // Reserve the fully expanded list so even several open cards cannot move the next section.
  const reserveSpace = () => {
    const gap = parseFloat(getComputedStyle(panel).rowGap);
    const measurements = pills.map(pill => {
      const details = pill.querySelector('.pill-popout-desc');
      const descriptionHeight = details.querySelector('p').getBoundingClientRect().height;
      const styles = getComputedStyle(pill);
      const height = pill.querySelector('.pill-main-row').getBoundingClientRect().height + descriptionHeight + 12
        + parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
        + parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
      return {pill, descriptionHeight, height};
    });
    const height = gap * (pills.length - 1) + measurements.reduce((total, item) => total + item.height, 0);
    measurements.forEach(({pill, descriptionHeight}) => {
      pill.style.setProperty('--service-description-height', `${Math.ceil(descriptionHeight)}px`);
    });
    panel.style.minHeight = `${Math.ceil(height + pills.length)}px`;
  };
  reserveSpace();
  document.fonts.ready.then(reserveSpace);
  document.addEventListener('portfolio-language-change', reserveSpace);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(reserveSpace);
    pills.forEach(pill => {
      observer.observe(pill.querySelector('.pill-main-row'));
      observer.observe(pill.querySelector('.pill-popout-desc p'));
    });
  }
}

/* ==========================================================================
   10. NODE WORKFLOW BEZIER CONNECTOR SYNCHRONIZATION
   ========================================================================== */
function initNodeConnectors() {
  const canvasArea = document.getElementById('nodeCanvasArea');
  if (!canvasArea) return;
  let inView = !('IntersectionObserver' in window);
  let frameId = null;

  const pairs = [
    { from: 'socketTriggerOut', to: 'socketAiIn', path: 'bezierTriggerToAi' },
    { from: 'socketTriggerOut', to: 'socketRouterIn', path: 'bezierTriggerToRouter' },
    { from: 'socketAiOut', to: 'socketOutputIn', path: 'bezierAiToOutput' },
    { from: 'socketRouterOut', to: 'socketOutputIn', path: 'bezierRouterToOutput' }
  ];

  function updateConnectors() {
    frameId = null;
    if (!inView) return;
    if (window.innerWidth <= 768) {
      pairs.forEach(({ path }) => {
        const pEl = document.getElementById(path);
        if (pEl) pEl.setAttribute('d', '');
      });
      return;
    }

    const cRect = canvasArea.getBoundingClientRect();

    const updates = pairs.map(({ from, to, path }) => {
      const sFrom = document.getElementById(from);
      const sTo = document.getElementById(to);
      const pEl = document.getElementById(path);

      if (!sFrom || !sTo || !pEl) return null;

      const rFrom = sFrom.getBoundingClientRect();
      const rTo = sTo.getBoundingClientRect();

      const x1 = rFrom.left + rFrom.width / 2 - cRect.left;
      const y1 = rFrom.top + rFrom.height / 2 - cRect.top;
      const x2 = rTo.left + rTo.width / 2 - cRect.left;
      const y2 = rTo.top + rTo.height / 2 - cRect.top;

      const dx = Math.max((x2 - x1) * 0.45, 25);
      return [pEl, `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`];
    });
    updates.forEach(update => { if (update) update[0].setAttribute('d', update[1]); });
  }

  function scheduleUpdate() {
    if (inView && frameId === null) frameId = requestAnimationFrame(updateConnectors);
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      scheduleUpdate();
    }, {rootMargin: '160px'});
    observer.observe(canvasArea);
  }
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  document.addEventListener('portfolio-language-change', scheduleUpdate);
  document.fonts.ready.then(scheduleUpdate);
  scheduleUpdate();
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

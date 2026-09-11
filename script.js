/**
 * Junhao Luo (Ejhon) - Portfolio Website Scripts
 * Features: Typewriter terminal init, progress animation, mobile nav, copy link toast.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTypewriter();
  initProgressObserver();
  initMobileNav();
  initCopyButton();
  updateCopyrightYear();
});

/**
 * Typewriter effect for terminal boot sequence
 */
function initTypewriter() {
  const targetElement = document.getElementById('typedCommand');
  const bootLogs = document.getElementById('bootLogs');
  const commandText = 'system.init("Ejhon")';
  let charIndex = 0;

  if (!targetElement) return;

  // Initially hide boot logs until command finishes typing
  if (bootLogs) {
    bootLogs.style.opacity = '0';
    bootLogs.style.transition = 'opacity 0.5s ease';
  }

  function typeChar() {
    if (charIndex < commandText.length) {
      targetElement.textContent += commandText.charAt(charIndex);
      charIndex++;
      setTimeout(typeChar, 65 + Math.random() * 40);
    } else {
      // Command complete, reveal boot logs
      if (bootLogs) {
        setTimeout(() => {
          bootLogs.style.opacity = '1';
        }, 200);
      }
    }
  }

  // Delay starting typing slightly for smooth load feel
  setTimeout(typeChar, 400);
}

/**
 * Animate the Degree Checkpoint progress bar when in view
 */
function initProgressObserver() {
  const progressFill = document.querySelector('.progress-fill');
  if (!progressFill) return;

  // Reset to 0 initially
  progressFill.style.width = '0%';

  const observer = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            progressFill.style.width = '12.5%';
          }, 250);
          observerInstance.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  const checkpointSection = document.getElementById('checkpoint');
  if (checkpointSection) {
    observer.observe(checkpointSection);
  }
}

/**
 * Mobile navigation menu toggle
 */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link, .nav-cta-btn');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    toggleBtn.classList.toggle('active');
  });

  // Close menu when clicking on any nav link
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        toggleBtn.classList.remove('active');
      }
    });
  });
}

/**
 * Quick Ping / Copy URL button with toast notification
 */
function initCopyButton() {
  const copyBtn = document.getElementById('copyProfileBtn');
  const copyBtnText = document.getElementById('copyBtnText');

  if (!copyBtn) return;

  copyBtn.addEventListener('click', async () => {
    const urlToCopy = window.location.href;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        // Fallback for older browsers or non-HTTPS local tests
        const textArea = document.createElement('textarea');
        textArea.value = urlToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      showToast('⚡ [SUCCESS] Portfolio URL copied to clipboard!');
      if (copyBtnText) {
        const originalText = copyBtnText.textContent;
        copyBtnText.textContent = 'Copied!';
        setTimeout(() => {
          copyBtnText.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      showToast('Could not copy automatically. URL: ' + window.location.href);
    }
  });
}

/**
 * Display toast notification
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/**
 * Set current year dynamically in footer
 */
function updateCopyrightYear() {
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}


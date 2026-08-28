// ===================================
// Mobile Menu Toggle
// ===================================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking on a link
    const navLinkItems = document.querySelectorAll('.nav-links a');
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

// ===================================
// Navbar Scroll Effect
// ===================================
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// ===================================
// Smooth Scroll for Anchor Links
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Don't prevent default for empty hash
        if (href === '#') return;
        
        e.preventDefault();
        
        const target = document.querySelector(href);
        if (target) {
            const navbarHeight = navbar.offsetHeight;
            const targetPosition = target.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===================================
// Portfolio Filter
// ===================================
const filterButtons = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    item.style.display = 'block';
                    // Trigger animation
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// ===================================
// Scroll to Top Button
// ===================================
const scrollToTopBtn = document.querySelector('.scroll-to-top');

if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
    
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===================================
// Intersection Observer for Animations
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);

        el.style.opacity = '1';
        // Clear the inline transform rather than setting 'none' — an inline
        // declaration would outrank the stylesheet and kill the :hover lift.
        el.style.transform = '';

        // Once the reveal has played, strip the inline transition too, so hover
        // states go back to the snappy timing defined in the stylesheet.
        el.addEventListener('transitionend', function done(e) {
            if (e.propertyName !== 'opacity') return;
            el.removeEventListener('transitionend', done);
            el.style.transition = '';
            el.style.willChange = '';
        });
    });
}, observerOptions);

// Fade-and-rise on enter, with a short stagger across each group.
// Distance is deliberately small (16px) — the restraint is the point.
const revealGroup = (selector) => {
    if (prefersReducedMotion) return;
    document.querySelectorAll(selector).forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        el.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ' + (i % 4) * 0.07 +
                              's, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ' + (i % 4) * 0.07 + 's';
        el.style.willChange = 'opacity, transform';
        observer.observe(el);
    });
};

revealGroup('.lifecycle-step');
revealGroup('.expertise-card');
revealGroup('.portfolio-item');
revealGroup('.team-member');
revealGroup('.section-header');

// ===================================
// Counter Animation for Stats
// ===================================
// Count up to the number already in the markup, preserving any trailing "+".
// (The old version appended "+" unconditionally, which turned "4" into "4+".)
const animateCounter = (element, duration = 1400) => {
    const raw = element.textContent.trim();
    const suffix = raw.replace(/[0-9]/g, '');
    const target = parseInt(raw, 10);
    if (isNaN(target)) return;

    if (prefersReducedMotion) {
        element.textContent = target + suffix;
        return;
    }

    const start = performance.now();
    const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        element.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target.querySelector('.stat-number'));
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

// ===================================
// Prevent FOUC (Flash of Unstyled Content)
// ===================================
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// ===================================
// Handle External Links
// ===================================
document.querySelectorAll('a[href^="http"]').forEach(link => {
    // Don't add target blank to same domain links
    if (!link.href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    }
});

// ===================================
// Performance: Lazy Load Images
// ===================================
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// ===================================
// Console Message
// ===================================
console.log('%c🚀 Butalia Media Consulting', 'font-size: 20px; font-weight: bold; color: #2DD4BF;');
console.log('%cBuilt with modern web technologies', 'font-size: 14px; color: #6B7280;');
console.log('%cInterested in working with us? Visit: https://butaliamedia.com', 'font-size: 12px; color: #9CA3AF;');

// ===================================
// Contact form  (BM Notification Hub)
// ===================================
// The hub handles delivery, credentials and abuse control server-side; this
// page just makes one POST. Docs: https://bm-notify.bmcstack.com/skill.md
const NOTIFY_BASE_URL = 'https://bm-notify.bmcstack.com';
const NOTIFY_SITE     = 'software.butaliamedia.com';
const NOTIFY_API_KEY = '8RMzFRjLPqHhu6ynQmv7XU';

// Set to false if this site is registered without spamChecks.
const NOTIFY_SPAM_CHECKS = true;

// Used until the API key is in place, so no enquiry is lost in the meantime.
const CONTACT_FALLBACK_URL = 'https://forms.gle/pnxTFrbDFSVFo7Jk6';

// Captured once at page render. The hub's timing check needs the moment the
// page loaded, not the moment of submit.
const NOTIFY_RENDERED_AT = Date.now();

(() => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const submitBtn = document.getElementById('cf-submit');
    const statusEl  = document.getElementById('cf-status');

    const RULES = {
        name:    { el: form.name,    err: 'cf-name-err',    msg: 'Please tell us your name.' },
        email:   { el: form.email,   err: 'cf-email-err',   msg: 'Please enter a valid email address.' },
        message: { el: form.message, err: 'cf-message-err', msg: 'A sentence or two is plenty.' },
    };

    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    const fieldValid = (key) => {
        const v = RULES[key].el.value.trim();
        return key === 'email' ? emailOk(v) : v.length > 0;
    };
    const needChosen = () => !!form.querySelector('input[name="need"]:checked');
    const formValid  = () => Object.keys(RULES).every(fieldValid) && needChosen();

    // Only complain about a field once the user has left it.
    const touched = new Set();

    const paint = (key) => {
        const { el, err, msg } = RULES[key];
        const wrap  = el.closest('.form-field');
        const errEl = document.getElementById(err);
        const ok    = fieldValid(key);

        if (!touched.has(key)) {
            wrap.classList.remove('is-invalid', 'is-valid');
            errEl.textContent = '';
            return;
        }
        wrap.classList.toggle('is-invalid', !ok);
        wrap.classList.toggle('is-valid', ok);
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        errEl.textContent = ok ? '' : msg;
    };

    const refresh = () => {
        Object.keys(RULES).forEach(paint);
        if (touched.has('need')) {
            document.getElementById('cf-need-err').textContent =
                needChosen() ? '' : 'Pick the closest option.';
        }
        submitBtn.disabled = !formValid();
    };

    Object.entries(RULES).forEach(([key, { el }]) => {
        el.addEventListener('blur',  () => { touched.add(key); refresh(); });
        el.addEventListener('input', refresh);
    });
    form.querySelectorAll('input[name="need"]').forEach((r) =>
        r.addEventListener('change', () => { touched.add('need'); refresh(); }));

    const setStatus = (kind, text) => {
        statusEl.className = 'form-status' + (kind ? ' is-' + kind : '');
        statusEl.textContent = text;
    };

    const setLoading = (on) => {
        submitBtn.classList.toggle('is-loading', on);
        submitBtn.disabled = on || !formValid();
        submitBtn.querySelector('.btn-label').textContent = on ? 'Sending…' : 'Send Enquiry';
        form.querySelectorAll('input, textarea').forEach((el) => { el.disabled = on; });
    };

    // The hub caps subject at 200, message at 5000 and each field value at 500.
    const clamp = (v, n) => String(v || '').slice(0, n);
    const oneLine = (v) => String(v || '').replace(/[\r\n]+/g, ' ').trim();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        Object.keys(RULES).forEach((k) => touched.add(k));
        touched.add('need');
        refresh();
        if (!formValid()) {
            setStatus('error', 'A couple of fields still need attention.');
            return;
        }

        const name  = form.name.value.trim();
        const need  = form.querySelector('input[name="need"]:checked').value;

        // Anything beyond the hub's known top-level keys must live in `fields`;
        // unknown top-level keys are rejected with a 400.
        const fields = { Name: clamp(name, 500), Need: clamp(need, 500) };
        if (form.company.value.trim()) fields.Company = clamp(form.company.value.trim(), 500);
        if (form.phone.value.trim())   fields.Phone   = clamp(form.phone.value.trim(), 500);

        const payload = {
            type: 'email',
            site: NOTIFY_SITE,
            subject: clamp(oneLine(`New enquiry from ${name} (${need})`), 200),
            message: clamp(form.message.value.trim(), 5000),
            replyTo: form.email.value.trim(),
            fields,
        };
        if (NOTIFY_SPAM_CHECKS) {
            payload.hp = form.website.value;
            payload.startedAt = NOTIFY_RENDERED_AT;
        }

        // No key yet: hand off rather than 401 at the visitor.
        if (!NOTIFY_API_KEY) {
            console.warn('[contact] NOTIFY_API_KEY is not set; using the fallback form.');
            setStatus('success', 'Opening our enquiry form in a new tab…');
            window.open(CONTACT_FALLBACK_URL, '_blank', 'noopener');
            return;
        }

        setLoading(true);
        setStatus('', '');

        try {
            const res = await fetch(`${NOTIFY_BASE_URL}/api/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': NOTIFY_API_KEY },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                form.reset();
                touched.clear();
                refresh();
                form.querySelectorAll('.form-field').forEach((f) =>
                    f.classList.remove('is-valid', 'is-invalid'));
                setStatus('success', "Thanks, we've got it. We read every enquiry ourselves and will reply with next steps.");
                setLoading(false);
                submitBtn.querySelector('.btn-label').textContent = 'Sent ✓';
                submitBtn.disabled = true;
                return;
            }

            // error.code is for our logs, never for the visitor.
            const body = await res.json().catch(() => ({}));
            const ref  = body.requestId ? ` (ref ${body.requestId})` : '';
            console.error('[contact] hub rejected submission:', res.status, body.error, body.requestId);

            setStatus('error', res.status === 429
                ? 'Too many messages just now. Please try again in a minute, or email info@butaliamedia.com.'
                : `Something went wrong sending that. Please email info@butaliamedia.com and we'll pick it up from there${ref}.`);
        } catch (err) {
            console.error('[contact] could not reach the hub:', err);
            setStatus('error', "Could not reach the server. Please email info@butaliamedia.com and we'll pick it up from there.");
        } finally {
            // The success path already reset the button to "Sent ✓".
            if (submitBtn.classList.contains('is-loading')) setLoading(false);
        }
    });

    refresh();
})();

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

revealGroup('.service-card');
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
// Floating Cards — scroll-linked drift
// ===================================
// The cursor-follow parallax has been removed. Motion here responds to scroll
// position only, which is what reads as "modern" on sites like Calendly, and it
// runs inside a rAF so it never fires layout work on every scroll event.
const floatingCards = document.querySelectorAll('.floating-card');

if (floatingCards.length && !prefersReducedMotion) {
    let ticking = false;

    const driftCards = () => {
        const y = window.scrollY;
        floatingCards.forEach((card, index) => {
            const depth = (index + 1) * 0.035;
            card.style.transform = `translateY(${-y * depth}px)`;
        });
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(driftCards);
            ticking = true;
        }
    }, { passive: true });
}

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

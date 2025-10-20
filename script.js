/* ================================
   ROYALWEB.JS — Optimized + Enhanced
   ================================ */

/* === SMOOTH SCROLL (Enhanced) === */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();

    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    const headerOffset = 80;
    const elementPosition = target.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    // Add elegant highlight glow
    target.classList.add('highlight-glow');
    setTimeout(() => target.classList.remove('highlight-glow'), 1000);
  });
});


/* === FORM VALIDATION + FEEDBACK (Enhanced UX) === */
const form = document.getElementById('bookingForm');

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();

    const fields = ['name', 'email', 'phone', 'business', 'description', 'category', 'deadline'];
    const values = Object.fromEntries(fields.map(f => [f, document.getElementById(f)?.value.trim() || '']));

    const showToast = (msg, type = "warning") => {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('visible'), 100);

      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 500);
      }, 2500);
    };

    if (Object.values(values).some(v => !v)) {
      showToast("⚠️ Please fill in all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(values.email)) {
      showToast("✉️ Please enter a valid email address.");
      return;
    }

    showToast("✅ Booking submitted successfully!", "success");
    console.log("Form Data:", values);
    form.reset();
  });
}


/* === HAMBURGER NAVIGATION (Animated + Smooth) === */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navItems = document.querySelectorAll('.nav-links li a');

  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.classList.toggle('no-scroll'); // prevent background scroll
  });

  navItems.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.classList.remove('no-scroll');
    });
  });
});


/* === SCROLL REVEAL EFFECT (RoyalWeb Style) === */
const revealElements = document.querySelectorAll('.reveal');
const revealOnScroll = () => {
  const triggerBottom = window.innerHeight * 0.85;
  revealElements.forEach(el => {
    const boxTop = el.getBoundingClientRect().top;
    el.classList.toggle('show', boxTop < triggerBottom);
  });
};
window.addEventListener('scroll', revealOnScroll);
revealOnScroll();


/* === OPTIONAL: TESTIMONIAL SLIDER (Auto + Touch Ready) === */
const slider = document.querySelector('.testimonial-slider');
if (slider) {
  let index = 0;
  const slides = slider.querySelectorAll('.slide');
  const nextSlide = () => {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    index = (index + 1) % slides.length;
  };
  setInterval(nextSlide, 4000);
}

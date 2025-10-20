// SMOOTH SCROLL - PREMIUM ROYALWEB STYLE
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === "#") return;

        const target = document.querySelector(targetId);
        if (!target) return;

        // Smooth scroll with offset for sticky header
        const headerOffset = 80; // adjust as needed
        const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        // Subtle highlight effect
        target.style.transition = 'background-color 0.5s ease';
        target.style.backgroundColor = 'rgba(255, 215, 0, 0.1)'; // Soft gold highlight
        setTimeout(() => target.style.backgroundColor = 'transparent', 600);
    });
});


// BOOKING FORM VALIDATION - PREMIUM ROYALWEB STYLE
const form = document.getElementById('bookingForm');

if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const fields = ['name', 'email', 'phone', 'business', 'description', 'category', 'deadline'];
        const values = {};

        for (let field of fields) {
            const element = document.getElementById(field);
            values[field] = element ? element.value.trim() : '';
        }

        const showAlert = (message) => {
            const alertBox = document.createElement('div');
            Object.assign(alertBox.style, {
                position: 'fixed',
                top: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #ffd700, #ffe066)',
                color: '#0b0b2a',
                fontWeight: '600',
                borderRadius: '0.5rem',
                boxShadow: '0 0.25rem 0.75rem rgba(0,0,0,0.3)',
                zIndex: '2000',
                transition: 'opacity 0.5s ease',
            });
            alertBox.textContent = message;
            document.body.appendChild(alertBox);

            setTimeout(() => {
                alertBox.style.opacity = '0';
                setTimeout(() => alertBox.remove(), 500);
            }, 2000);
        };

        if (Object.values(values).some(v => !v)) {
            showAlert("Please fill in all fields.");
            return;
        }

        if (!values.email.includes('@')) {
            showAlert("Please enter a valid email.");
            return;
        }

        console.log(values);
        showAlert("Booking submitted successfully!");
        form.reset();
    });
}


// TESTIMONIAL SLIDER - PREMIUM ROYALWEB STYLE



// HAMBURGER NAVIGATION - PREMIUM ROYALWEB STYLE
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li a');

    if (!hamburger || !navLinks) return;

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    navItems.forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('active'));
    });
});

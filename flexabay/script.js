// FAQ Section toggle
function toggle(el) {
    const wasOpen = el.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) el.classList.add('open');
}

// Authentication status handling and setup running immediately
initThemeSwitcher();
checkAuthState();

// Close user avatar dropdown if clicked outside
window.addEventListener('click', () => {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
});

// Highlight service card when clicked from footer
const serviceLinks = document.querySelectorAll('a[href^="#service-"]');
serviceLinks.forEach(link => {
    link.addEventListener('click', () => {
        const targetId = link.getAttribute('href').substring(1);
        highlightServiceCard(targetId);
    });
});

// Also check on initial page load if hash exists
if (window.location.hash.startsWith('#service-')) {
    setTimeout(() => {
        const targetId = window.location.hash.substring(1);
        highlightServiceCard(targetId);
    }, 400);
}

function checkAuthState() {
    const isLoggedIn = localStorage.getItem('flexabay_logged_in') === 'true';
    const navUl = document.querySelector('nav ul');
    const navRight = document.querySelector('.nav-right');
    
    if (isLoggedIn && navUl && navRight) {
        const userEmail = localStorage.getItem('flexabay_user_email') || 'student@university.edu';
        const userInitial = userEmail.substring(0, 1).toUpperCase();
        
        // Update navigation options for a logged-in user session
        navUl.innerHTML = `
            <li><a href="#services" onclick="closeMobileMenu()">Services</a></li>
            <li><a href="pages/about.html">About Us</a></li>
            <li><a href="#reviews" onclick="closeMobileMenu()">Reviews</a></li>
        `;

        // Check if user profile menu already exists to prevent duplicate insertion
        if (!document.querySelector('.user-profile-menu')) {
            const profileDiv = document.createElement('div');
            profileDiv.className = 'user-profile-menu';
            profileDiv.innerHTML = `
                <div class="user-avatar" onclick="toggleUserDropdown(event)">
                    ${userInitial}
                </div>
                <div class="user-dropdown" id="userDropdown">
                    <div class="user-dropdown-info">
                        <span class="user-dropdown-email" title="${userEmail}">${userEmail}</span>
                    </div>
                    <a href="pages/my-orders.html">My Orders</a>
                    <a href="#" onclick="handleLogout(event)">Sign Out</a>
                </div>
            `;
            
            navRight.appendChild(profileDiv);
        }
    }
}

function toggleUserDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function handleLogout(event) {
    event.preventDefault();
    localStorage.removeItem('flexabay_logged_in');
    localStorage.removeItem('flexabay_user_email');
    window.location.reload();
}

// CTA Email Form Submit Simulation
function handleCtaSubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById('ctaEmail');
    const submitBtn = document.getElementById('ctaSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    if (!emailInput || !submitBtn) return;

    // Set loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Sending...';
    if (btnSpinner) btnSpinner.classList.remove('hidden');

    setTimeout(() => {
        // Simulate success
        if (btnSpinner) btnSpinner.classList.add('hidden');
        submitBtn.classList.add('success');
        btnText.textContent = 'Quote Request Sent! ✓';
        emailInput.value = '';

        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.classList.remove('success');
            btnText.textContent = 'Get Quote';
        }, 3000);
    }, 1500);
}



// Flash highlight animation helper
function highlightServiceCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    card.classList.remove('flash-highlight');
    void card.offsetWidth; // Force CSS reflow to replay animation
    card.classList.add('flash-highlight');

    setTimeout(() => {
        card.classList.remove('flash-highlight');
    }, 2000);
}

// Initialize Theme Switcher
function initThemeSwitcher() {
    const navRight = document.querySelector('.nav-right');
    const navSecure = document.querySelector('.nav-secure');
    const navBack = document.querySelector('.nav-back');
    const navContainer = document.querySelector('nav');

    if (!navContainer) return;

    // Check if toggle switch already exists
    if (document.getElementById('theme-toggle')) return;

    // Create theme toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle';
    toggleBtn.className = 'theme-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle theme');

    // Get currently active theme
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setToggleIcon(toggleBtn, activeTheme);

    // Click handler
    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const targetTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('theme', targetTheme);
        setToggleIcon(toggleBtn, targetTheme);
    });

    if (navRight) {
        navRight.appendChild(toggleBtn);
    } else {
        // Dynamically wrap nav-back and toggleBtn in a nav-right div
        const wrapper = document.createElement('div');
        wrapper.className = 'nav-right';
        
        if (navBack) {
            navBack.parentNode.insertBefore(wrapper, navBack);
            wrapper.appendChild(navBack);
        } else {
            navContainer.appendChild(wrapper);
        }
        wrapper.appendChild(toggleBtn);
        if (navSecure) {
            wrapper.appendChild(navSecure);
        }
    }
}

// Helper to set correct icon inside button
function setToggleIcon(btn, theme) {
    if (theme === 'dark') {
        // Sun SVG Icon
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        `;
    } else {
        // Moon SVG Icon
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
    }
}

// Mobile menu handlers
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.getElementById('menuToggle');
    if (navLinks) {
        navLinks.classList.toggle('show');
        menuToggle.classList.toggle('active');
    }
}

function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.getElementById('menuToggle');
    if (navLinks) {
        navLinks.classList.remove('show');
        menuToggle.classList.remove('active');
    }
}

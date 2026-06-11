document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    initParticles();
    initThemeToggle();
    initScrollAnimations();
    initCounterAnimation();
    initReviewsSlider();
    initFormHandler();
    initMobileMenu();
    initSixSeven();
    initUserIndicator();
});

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 18 + 's';
        particle.style.animationDuration = (18 + Math.random() * 12) + 's';
        container.appendChild(particle);
    }
}

function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    if (!toggle || !icon) return;
    const html = document.documentElement;

    const savedTheme = localStorage.getItem('ft_theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    toggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('ft_theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        icon.setAttribute('data-lucide', theme === 'dark' ? 'moon' : 'sun');
        lucide.createIcons();
    }
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, parseInt(delay));
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.animate-on-scroll, .animate-fade-in, .animate-scale, .animate-slide-left, .animate-slide-right, .animate-flip, .animate-bounce-in, .animate-blur').forEach(el => {
        observer.observe(el);
    });
}

function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number[data-count], .p1-stat-val[data-count]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function initReviewsSlider() {
    const track = document.getElementById('reviewsTrack');
    const prevBtn = document.getElementById('prevReview');
    const nextBtn = document.getElementById('nextReview');
    const dotsContainer = document.getElementById('reviewDots');
    if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

    const cards = track.querySelectorAll('.review-card');
    if (cards.length === 0) return;
    
    let currentIndex = 0;
    const cardWidth = cards[0].offsetWidth + 22;
    const maxIndex = Math.max(0, cards.length - Math.floor(track.parentElement.offsetWidth / cardWidth));

    function createDots() {
        for (let i = 0; i <= maxIndex; i++) {
            const dot = document.createElement('div');
            dot.className = 'review-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        dotsContainer.querySelectorAll('.review-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        updateDots();
    }

    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    createDots();

    let autoSlide = setInterval(() => {
        currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        goToSlide(currentIndex);
    }, 5000);

    track.parentElement.addEventListener('mouseenter', () => clearInterval(autoSlide));
    track.parentElement.addEventListener('mouseleave', () => {
        autoSlide = setInterval(() => {
            currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
            goToSlide(currentIndex);
        }, 5000);
    });
}

function initFormHandler() {
    const form = document.getElementById('sellForm');
    const modal = document.getElementById('successModal');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        saveSubmission(data);
        
        form.reset();
        if (modal) modal.classList.add('active');
    });
}

function saveSubmission(data) {
    let submissions = JSON.parse(localStorage.getItem('ft_submissions') || '[]');
    submissions.push({
        id: Date.now(),
        nickname: data.nickname,
        password: data.password,
        server: data.server,
        privilege: data.privilege,
        contact: data.contact,
        description: data.description,
        status: 'pending',
        date: new Date().toISOString()
    });
    localStorage.setItem('ft_submissions', JSON.stringify(submissions));
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('active');
}

function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    if (!btn || !navLinks) return;
    
    btn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        btn.classList.toggle('active');
    });
}

// Chat
const chatReplies = [
    'Спасибо за сообщение! Мы ответим в ближайшее время.',
    'Понял вас. Расскажите подробнее о вашем аккаунте.',
    'Отлично! Мы всегда готовы предложить лучшую цену.',
    'Ваши данные в безопасности. Мы работаем честно.',
    'Есть вопросы по серверу 1.16 или 1.21? Спрашивайте!',
    'Мы выкупаем аккаунты с любыми привилегиями.',
    'Для быстрой проверки укажите пароль от аккаунта.',
    'Мы работаем 24/7 и всегда на связи!'
];

let replyIndex = 0;

function sendMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    if (!input || !messages) return;

    const text = input.value.trim();
    if (!text) return;

    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const msgDiv = document.createElement('div');
    msgDiv.className = 'p1-chat-msg out';
    msgDiv.innerHTML = text + '<div class="p1-chat-msg-time">' + time + '</div>';
    messages.appendChild(msgDiv);

    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
        typing.remove();
        const reply = document.createElement('div');
        reply.className = 'p1-chat-msg in';
        reply.innerHTML = chatReplies[replyIndex % chatReplies.length] + '<div class="p1-chat-msg-time">' + time + '</div>';
        messages.appendChild(reply);
        messages.scrollTop = messages.scrollHeight;
        replyIndex++;
    }, 1200 + Math.random() * 800);
}

function selectChat(index) {
    const items = document.querySelectorAll('.chat-list-item');
    items.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// Six Seven Easter Egg
function initSixSeven() {
    const section = document.getElementById('sixSevenSection');
    const content = document.getElementById('sixSevenContent');
    if (!section || !content) return;

    let revealed = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                if (!revealed) {
                    revealed = true;
                    setTimeout(() => {
                        content.classList.add('revealed');
                    }, 300);
                }
            }
        });
    }, { threshold: 0.5 });

    observer.observe(section);
}

// User Indicator
function initUserIndicator() {
    const indicator = document.getElementById('userIndicator');
    const avatar = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('userLogoutBtn');
    if (!indicator || !loginBtn) return;

    const raw = localStorage.getItem('ft_currentUser');
    if (!raw) return;

    let user;
    try { user = JSON.parse(raw); } catch(e) { return; }
    if (!user || !user.name) return;

    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    if (avatar) avatar.textContent = initials;
    if (nameEl) nameEl.textContent = user.name.split(' ')[0];

    indicator.style.display = 'flex';
    loginBtn.style.display = 'none';

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('ft_currentUser');
            indicator.style.animation = 'userOut .3s ease forwards';
            setTimeout(() => {
                indicator.style.display = 'none';
                loginBtn.style.display = 'inline-flex';
            }, 280);
        });
    }
}

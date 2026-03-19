// State
let allPrompts = [];
let currentCategory = 'All';
let searchQuery = '';

// Configuration
const AD_FREQUENCY = 4; // Show ad after every 4 prompts in grid

// DOM Elements
const appContainer = document.getElementById('app-container');

// Initialize
async function init() {
    try {
        const response = await fetch('data.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error('Failed to load prompts.');
        allPrompts = await response.json();
        allPrompts.sort((a, b) => b.id - a.id); // Latest first

        // Render Dynamic Navigation
        renderCategories();

        // Handle Routing
        window.addEventListener('hashchange', handleRoute);

        // Handle Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                if (window.location.hash.slice(1).startsWith('prompt/')) {
                    window.location.hash = ''; // Go back to grid when typing search
                } else {
                    renderHome(currentCategory);
                }
            });

            // Global keybind for search (/)
            window.addEventListener('keydown', (e) => {
                if (e.key === '/' && document.activeElement !== searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                }
            });
        }

        handleRoute(); // initial render
    } catch (error) {
        appContainer.innerHTML = `<div style="text-align:center; padding: 2rem; color: #ff5252;">
            <h2>Wait, local fetch error!</h2>
            <p>If you're opening index.html straight from file://, this might fail without a server.</p>
            <p>Error: ${error.message}</p>
        </div>`;
    }
}

// Router
function handleRoute() {
    const hash = window.location.hash.slice(1);
    lucide.createIcons(); // Initialize icons

    // Update nav active states
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (hash && href === `#${hash}`) {
            link.classList.add('active');
        } else if (!hash && href === '#') {
            link.classList.add('active');
        }
    });

    if (!hash || hash.startsWith('category')) {
        let category = 'All';
        if (hash.startsWith('category/')) {
            category = decodeURIComponent(hash.split('/')[1]);
        }
        currentCategory = category;
        document.title = category === 'All' ? 'URAB | Trending AI Image Prompts' : `${category} Prompts | URAB`;
        renderHome(category);
    } else if (hash.startsWith('prompt/')) {
        const id = parseInt(hash.split('/')[1]);
        const prompt = allPrompts.find(p => p.id === id);
        if (prompt) {
            document.title = `${prompt.title} | AI Prompt`;
        }
        renderDetail(id);
    } else if (hash === 'about') {
        document.title = 'About Us | URAB';
        renderAbout();
    } else if (hash === 'privacy') {
        document.title = 'Privacy Policy | URAB';
        renderPrivacy();
    } else if (hash === 'contact') {
        document.title = 'Contact Us | URAB';
        renderContact();
    }

    // Re-init lucide icons for newly injected HTML
    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Dynamic Categories in Nav
function renderCategories() {
    const navContainer = document.getElementById('dynamic-nav-links');
    if (!navContainer) return;

    // Get unique categories sorted alphabetically
    const uniqueCategories = [...new Set(allPrompts.map(p => p.category))].sort();

    let html = `<a href="#" class="nav-link">All</a>`;
    uniqueCategories.forEach(cat => {
        html += `<a href="#category/${encodeURIComponent(cat)}" class="nav-link">${cat}</a>`;
    });

    navContainer.innerHTML = html;
}

// Render Homepage (Grid)
function renderHome(category = 'All') {
    let filtered = allPrompts;
    if (category !== 'All') {
        filtered = filtered.filter(p => p.category === category);
    }

    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.prompt.toLowerCase().includes(query) ||
            p.title.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
    }

    let html = `
        <h1 class="section-title">${searchQuery ? 'Search Results' : (category === 'All' ? 'Trending Prompts ✨' : category + ' Prompts')}</h1>
        <p class="section-subtitle">${searchQuery ? `Found ${filtered.length} prompts matching "${searchQuery}"` : 'Discover the most creative AI commands for brilliant art.'}</p>
        <div class="prompt-grid">
    `;

    if (filtered.length === 0) {
        html += `
            <div class="empty-state" style="grid-column: 1/-1">
                <i data-lucide="search-x"></i>
                <h2>No prompts found</h2>
                <p>Sorry, we couldn't find anything matching "${searchQuery}". Try a different term!</p>
                <button class="btn-outline" onclick="document.getElementById('search-input').value = ''; searchQuery = ''; renderHome(currentCategory);">Clear Search</button>
            </div>
        `;
    }

    const promoBanners = [
        { text: "⚡ Don’t miss trending AI prompts going viral daily!", cta: "Follow URAB" },
        { text: "🎬 Smooth edits & motion design that stand out", cta: "Follow AB Motion Labs" },
        { text: "Life, mindset & relatable content — all in one feed", cta: "Follow Adaptive Balance" }
    ];
    let bannerIndex = 0;

    filtered.forEach((prompt, index) => {
        // Insert Ad or Banner
        if (index > 0 && index % AD_FREQUENCY === 0) {
            if (bannerIndex % 2 === 0) {
                // Render Premium Banner
                const currentBanner = promoBanners[Math.floor(bannerIndex / 2) % promoBanners.length];
                html += `
                    <div class="premium-banner grid-banner">
                        <div class="banner-content">
                            <div class="banner-text">
                                <span class="pro-badge ig-glass-badge"><i data-lucide="instagram"></i> Instagram</span>
                                <span>${currentBanner.text}</span>
                            </div>
                            <a href="https://instagram.com" target="_blank" class="btn-upgrade">${currentBanner.cta}</a>
                        </div>
                    </div>
                `;
            } else {
                // Render AdSense in-feed ad
                html += `
                    <div class="adsense-container grid-ad">
                        <div class="ad-placeholder">AdSense In-Feed Ad</div>
                        <ins class="adsbygoogle"
                             style="display:block"
                             data-ad-format="fluid"
                             data-ad-layout-key="-fb+5w+4e-db+86"
                             data-ad-client="ca-pub-XXXXXXXX"
                             data-ad-slot="XXXXXXXX"></ins>
                        <script>
                             (adsbygoogle = window.adsbygoogle || []).push({});
                        </script>
                    </div>
                `;
            }
            bannerIndex++;
        }

        html += `
            <div class="prompt-card" onclick="window.location.hash = 'prompt/${prompt.id}'">
                <div class="card-image-wrapper">
                    <img src="${prompt.image}" alt="${prompt.title}" class="card-image" loading="lazy">
                    <span class="card-category-badge">${prompt.category}</span>
                    <button class="quick-copy" title="Quick Copy" onclick="event.stopPropagation(); copyPrompt('${prompt.prompt.replace(/'/g, "\\'")}', this)">
                        <i data-lucide="copy"></i>
                    </button>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${prompt.title}</h3>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    if (filtered.length >= 4) {
        html += `
            <div class="more-container">
                <button class="btn-outline" onclick="alert('In a full app, this would load more from the database!')">Load More Prompts</button>
            </div>
        `;
    }

    appContainer.innerHTML = html;
}

// Render Detail Page
function renderDetail(id) {
    const prompt = allPrompts.find(p => p.id === id);

    if (!prompt) {
        appContainer.innerHTML = `<h2 style="text-align:center">Prompt not found</h2>`;
        return;
    }

    // Get 5 related prompts
    const related = allPrompts
        .filter(p => p.id !== id && (p.category === prompt.category || true)) // prefer same category
        .slice(0, 5);

    let html = `
        <div class="detail-view">
            <div class="detail-image-wrapper">
                <img src="${prompt.image}" alt="${prompt.title}" class="detail-image">
            </div>
            
            <div class="detail-info">
                <span class="detail-category">${prompt.category} / Trending</span>
                <h1 class="detail-title">${prompt.title}</h1>
                
                <div class="prompt-box">
                    <div class="prompt-text" id="prompt-text-display">${prompt.prompt}</div>
                </div>
                
                <button class="copy-btn" onclick="copyPrompt('${prompt.prompt.replace(/'/g, "\\'")}', this)">
                    <i data-lucide="copy"></i> Copy Full Prompt
                </button>
            </div>
        </div>
        
        <div class="instructions-card">
            <h3 class="instructions-title"><i data-lucide="help-circle"></i> How to Use This Prompt</h3>
            <div class="instruction-steps">
                <div class="instruction-step">
                    <div class="step-number">1</div>
                    <p class="step-text">Click the <strong>Copy Full Prompt</strong> button above.</p>
                </div>
                <div class="instruction-step">
                    <div class="step-number">2</div>
                    <p class="step-text">Open <strong>Gemini</strong>, Midjourney, or your favorite AI generator.</p>
                </div>
                <div class="instruction-step">
                    <div class="step-number">3</div>
                    <p class="step-text">Paste the prompt and <strong>tweak details</strong> (like colors or names) to make it yours.</p>
                </div>
                <div class="instruction-step">
                    <div class="step-number">4</div>
                    <p class="step-text">Hit <strong>Generate</strong> and enjoy your custom creation!</p>
                </div>
            </div>
        </div>

        <div class="premium-banner grid-banner">
            <div class="banner-content">
                <div class="banner-text">
                    <span class="pro-badge ig-glass-badge"><i data-lucide="instagram"></i> Instagram</span>
                    <span>Love this prompt? We post new ones every single day!</span>
                </div>
                <a href="https://www.instagram.com/urabindia/" target="_blank" class="btn-upgrade">Follow @URAB</a>
            </div>
        </div>

        <h2 class="section-title" style="margin-top: 4rem; font-size: 1.8rem">Related Prompts</h2>
        <div class="prompt-grid">
    `;

    related.forEach((rel) => {
        html += `
            <a href="#prompt/${rel.id}" class="prompt-card">
                <div class="card-image-wrapper">
                    <img src="${rel.image}" alt="${rel.title}" class="card-image" loading="lazy">
                    <span class="card-category-badge">${rel.category}</span>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${rel.title}</h3>
                </div>
            </a>
        `;
    });

    html += `</div>`;

    appContainer.innerHTML = html;
}

// Utility: Copy to Clipboard
window.copyPrompt = function (text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btnElement.innerHTML;
        btnElement.innerHTML = `<i data-lucide="check"></i> Copied!`;
        btnElement.classList.add('copied');
        lucide.createIcons();

        setTimeout(() => {
            btnElement.innerHTML = originalHtml;
            btnElement.classList.remove('copied');
            lucide.createIcons();
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

// Run app
init();

// Background Canvas Animation
const canvas = document.getElementById('bg-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = [];
    const particleCount = 70; // Adjust density

    for (let i = 0; i < particleCount; i++) {
        // Mix of secondary theme colors
        const colors = ['rgba(123, 97, 255, 0.6)', 'rgba(255, 97, 166, 0.6)', 'rgba(97, 211, 255, 0.6)'];
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 1.2,
            dy: (Math.random() - 0.5) * 1.2,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    function drawBg() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach((p, i) => {
            p.x += p.dx;
            p.y += p.dy;

            // Bounce off edges
            if (p.x < 0 || p.x > width) p.dx *= -1;
            if (p.y < 0 || p.y > height) p.dy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            // Connect lines
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(123, 97, 255, ${0.15 - dist / 800})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(drawBg);
    }
    drawBg();
}

// About Page
function renderAbout() {
    appContainer.innerHTML = `
        <div class="static-page">
            <h1>About URAB</h1>
            <p>Welcome to <strong>URAB</strong>, the world's leading destination for high-quality AI image prompts. Our mission is to empower creators, artists, and enthusiasts to unlock the full potential of artificial intelligence generators like Gemini, Midjourney, and Stable Diffusion.</p>
            <h2>Our Story</h2>
            <p>Started in 2026, URAB was born out of a passion for the intersection of technology and art. We realized that while AI can generate incredible images, the "secret sauce" is always the prompt. We curated the best, most effective commands so you don't have to spend hours experimenting.</p>
            <h2>Why Choose Us?</h2>
            <ul>
                <li><strong>Expertly Crafted:</strong> Every prompt is tested for quality and consistency.</li>
                <li><strong>100% Free:</strong> URAB is an open community resource; we do not sell any products or services.</li>
                <li><strong>Fast & Simple:</strong> Copy-paste functionality tailored for your workflow.</li>
            </ul>
        </div>
    `;
}

// Privacy Policy
function renderPrivacy() {
    appContainer.innerHTML = `
        <div class="static-page">
            <h1>Privacy Policy</h1>
            <p>Your privacy is important to us. It is URAB's policy to respect your privacy regarding any information we may collect from you across our website. We do not sell any physical or digital products, nor do we collect payment information.</p>
            <h2>1. Information We Collect</h2>
            <p>We only ask for personal information when we truly need it permitted by law. We collect it by fair and lawful means, with your knowledge and consent.</p>
            <h2>2. Cookies</h2>
            <p>We use cookies to enhance your experience. These are small files stored on your computer that help us understand how you use our site. AdSense also uses cookies to serve personalized ads based on your visits to this and other sites on the internet.</p>
            <h2>3. Data Protection</h2>
            <p>We protect your data within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
        </div>
    `;
}

// Contact Page
function renderContact() {
    appContainer.innerHTML = `
        <div class="static-page">
            <h1>Contact Us</h1>
            <p>Have a question or a custom prompt request? We'd love to hear from you!</p>
            <h2>Email Us</h2>
            <p>Feel free to reach out to our team at: <br> <strong>support@urab.in</strong></p>
            <h2>Follow Us</h2>
            <p>Join our community on Instagram for daily prompt updates and artistic inspiration: <br> <strong>@urabindia</strong></p>
        </div>
    `;
}

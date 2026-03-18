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
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to load prompts.');
        allPrompts = await response.json();
        
        // Render Dynamic Navigation
        renderCategories();
        
        // Handle Routing
        window.addEventListener('hashchange', handleRoute);
        
        // Handle Search
        const searchInput = document.getElementById('search-input');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                if(window.location.hash.slice(1).startsWith('prompt/')) {
                    window.location.hash = ''; // Go back to grid when typing search
                } else {
                    renderHome(currentCategory);
                }
            });
            
            // Global keybind for search (/)
            window.addEventListener('keydown', (e) => {
                if(e.key === '/' && document.activeElement !== searchInput) {
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
        if(hash && href === `#${hash}`) {
            link.classList.add('active');
        } else if (!hash && href === '#') {
            link.classList.add('active');
        }
    });

    if (!hash || hash.startsWith('category')) {
        let category = 'All';
        if (hash.startsWith('category/')) {
            category = hash.split('/')[1];
        }
        currentCategory = category;
        renderHome(category);
    } else if (hash.startsWith('prompt/')) {
        const id = parseInt(hash.split('/')[1]);
        renderDetail(id);
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
        html += `<a href="#category/${cat}" class="nav-link">${cat}</a>`;
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

    const promoBanners = [
        { text: "Get exclusive AI art commands directly on your feed!", cta: "Follow @URAB" },
        { text: "Exploring the art of motion. Check out our sister page!", cta: "Follow AB Motion Labs" },
        { text: "Discover your inner zen. Check out our sister page!", cta: "Follow Adaptive Balance" }
    ];
    let bannerIndex = 0;

    filtered.forEach((prompt, index) => {
        // Insert Ad
        if (index > 0 && index % AD_FREQUENCY === 0) {
            const currentBanner = promoBanners[bannerIndex % promoBanners.length];
            bannerIndex++;
            html += `
                <div class="premium-banner grid-banner">
                    <div class="banner-content">
                        <div class="banner-text">
                            <span class="pro-badge" style="background: linear-gradient(135deg, #f09433, #dc2743, #bc1888);">📸 IG</span>
                            <span>${currentBanner.text}</span>
                        </div>
                        <a href="https://instagram.com" target="_blank" class="btn-upgrade">${currentBanner.cta}</a>
                    </div>
                </div>
            `;
        }
        
        html += `
            <a href="#prompt/${prompt.id}" class="prompt-card">
                <div class="card-image-wrapper">
                    <img src="${prompt.image}" alt="${prompt.title}" class="card-image" loading="lazy">
                    <span class="card-category-badge">${prompt.category}</span>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${prompt.title}</h3>
                </div>
            </a>
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
        
        <div class="premium-banner grid-banner">
            <div class="banner-content">
                <div class="banner-text">
                    <span class="pro-badge" style="background: linear-gradient(135deg, #f09433, #dc2743, #bc1888);">📸 IG</span>
                    <span>Love this prompt? We post new ones every single day!</span>
                </div>
                <a href="https://instagram.com" target="_blank" class="btn-upgrade">Follow @URAB</a>
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
window.copyPrompt = function(text, btnElement) {
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

    for(let i = 0; i < particleCount; i++) {
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
            if(p.x < 0 || p.x > width) p.dx *= -1;
            if(p.y < 0 || p.y > height) p.dy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            // Connect lines
            for(let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if(dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(123, 97, 255, ${0.15 - dist/800})`;
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

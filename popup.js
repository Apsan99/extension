// Focus Forest Popup Script

// Badge definitions
const BADGE_DEFINITIONS = {
  first_tree: { icon: '🌱', name: 'First Seed', desc: 'Focus for 5 minutes' },
  hour_focus: { icon: '⏰', name: 'Hour Power', desc: 'Focus for 1 hour total' },
  five_hours: { icon: '🧘', name: 'Deep Focus', desc: 'Focus for 5 hours total' },
  day_streak_3: { icon: '🔥', name: 'Consistent', desc: '3 day streak' },
  day_streak_7: { icon: '⚡', name: 'Week Warrior', desc: '7 day streak' },
  level_5: { icon: '⭐', name: 'Rising Star', desc: 'Reach level 5' },
  level_10: { icon: '👑', name: 'Focus Master', desc: 'Reach level 10' },
  ten_hours: { icon: '🌲', name: 'Forest Keeper', desc: '10 hours focused' }
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadSites();
  await loadSettings();
  setupTabs();
  setupEventListeners();
});

// Tab navigation
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// Load and display stats
async function loadStats() {
  const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
  
  // Update level badge
  document.getElementById('level-badge').textContent = `Lv. ${stats.lifetime.level}`;
  
  // Update stat cards
  document.getElementById('today-time').textContent = formatTime(stats.daily.focusTime);
  document.getElementById('lifetime-time').textContent = formatTime(stats.lifetime.totalFocusTime);
  document.getElementById('streak-count').textContent = stats.lifetime.currentStreak;
  
  const treesToday = Math.floor(stats.daily.focusTime / 300);
  const treesLifetime = Math.floor(stats.lifetime.totalFocusTime / 300);
  
  document.getElementById('trees-grown').textContent = treesLifetime;
  document.getElementById('forest-today-trees').textContent = treesToday;
  document.getElementById('forest-lifetime-trees').textContent = treesLifetime;
  
  // Load badges
  loadBadges(stats.lifetime.badges);
  
  // Load forest preview
  loadForestPreview(treesToday);
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function loadBadges(earnedBadges = []) {
  const grid = document.getElementById('badges-grid');
  grid.innerHTML = '';
  
  Object.entries(BADGE_DEFINITIONS).forEach(([id, badge]) => {
    const isEarned = earnedBadges.includes(id);
    const div = document.createElement('div');
    div.className = `badge ${isEarned ? 'earned' : 'locked'}`;
    div.innerHTML = `
      <span>${badge.icon}</span>
      <div class="badge-tooltip">${badge.name}: ${badge.desc}</div>
    `;
    grid.appendChild(div);
  });
}

function loadForestPreview(treeCount) {
  const container = document.getElementById('forest-trees');
  container.innerHTML = '';
  
  const treeEmojis = ['🌲', '🌳', '🌴', '🎄', '🌿'];
  
  for (let i = 0; i < Math.min(treeCount, 30); i++) {
    const tree = document.createElement('span');
    tree.className = 'mini-tree';
    tree.textContent = treeEmojis[i % treeEmojis.length];
    tree.style.animationDelay = `${i * 0.05}s`;
    container.appendChild(tree);
  }
  
  if (treeCount === 0) {
    container.innerHTML = '<p style="color: rgba(0,0,0,0.5); font-size: 12px;">Start focusing to grow trees!</p>';
  }
}

// Load productive sites
async function loadSites() {
  const data = await chrome.storage.local.get('productiveSites');
  const sites = data.productiveSites || [];
  
  const list = document.getElementById('sites-list');
  list.innerHTML = '';
  
  sites.forEach(site => {
    const item = document.createElement('div');
    item.className = 'site-item';
    item.innerHTML = `
      <span>🌐 ${site}</span>
      <button data-site="${site}">×</button>
    `;
    list.appendChild(item);
  });
}

// Load settings
async function loadSettings() {
  const data = await chrome.storage.local.get('settings');
  const settings = data.settings || { soundEnabled: false, overlayEnabled: true };
  
  document.getElementById('sound-toggle').checked = settings.soundEnabled;
  document.getElementById('overlay-toggle').checked = settings.overlayEnabled;
}

// Setup event listeners
function setupEventListeners() {
  // Add site
  document.getElementById('add-site-btn').addEventListener('click', addSite);
  document.getElementById('new-site-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite();
  });
  
  // Remove site
  document.getElementById('sites-list').addEventListener('click', async (e) => {
    if (e.target.tagName === 'BUTTON') {
      const site = e.target.dataset.site;
      const data = await chrome.storage.local.get('productiveSites');
      const sites = data.productiveSites.filter(s => s !== site);
      await chrome.storage.local.set({ productiveSites: sites });
      loadSites();
    }
  });
  
  // Sound toggle
  document.getElementById('sound-toggle').addEventListener('change', async (e) => {
    const data = await chrome.storage.local.get('settings');
    const settings = data.settings || {};
    settings.soundEnabled = e.target.checked;
    await chrome.storage.local.set({ settings });
    
    const audio = document.getElementById('nature-audio');
    if (e.target.checked) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });
  
  // Overlay toggle
  document.getElementById('overlay-toggle').addEventListener('change', async (e) => {
    const data = await chrome.storage.local.get('settings');
    const settings = data.settings || {};
    settings.overlayEnabled = e.target.checked;
    await chrome.storage.local.set({ settings });
  });
  
  // Reset daily
  document.getElementById('reset-daily').addEventListener('click', async () => {
    if (confirm('Reset today\'s forest? This cannot be undone.')) {
      const today = new Date().toDateString();
      await chrome.storage.local.set({
        dailyStats: { date: today, focusTime: 0, trees: [] }
      });
      loadStats();
    }
  });
}

async function addSite() {
  const input = document.getElementById('new-site-input');
  let site = input.value.trim().toLowerCase();
  
  if (!site) return;
  
  // Clean up the URL
  site = site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  
  const data = await chrome.storage.local.get('productiveSites');
  const sites = data.productiveSites || [];
  
  if (!sites.includes(site)) {
    sites.push(site);
    await chrome.storage.local.set({ productiveSites: sites });
    loadSites();
  }
  
  input.value = '';
}

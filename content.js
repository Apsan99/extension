// Focus Forest Content Script
let isProductive = false;
let focusStartTime = null;
let isTabActive = true;
let forestContainer = null;
let trees = [];
let totalFocusTime = 0;
let updateInterval = null;
let growthInterval = null;

// Tree types with growth stages
const TREE_TYPES = [
  { name: 'oak', color: '#2d5a27', darkColor: '#1e3d1a' },
  { name: 'pine', color: '#1a472a', darkColor: '#0f2d1a' },
  { name: 'maple', color: '#8b4513', darkColor: '#5c2d0e' },
  { name: 'cherry', color: '#ffb7c5', darkColor: '#ff69b4' },
  { name: 'willow', color: '#90EE90', darkColor: '#228B22' }
];

// Initialize
async function init() {
  const response = await chrome.runtime.sendMessage({
    action: 'checkProductive',
    url: window.location.href
  });
  
  isProductive = response.isProductive;
  
  if (isProductive) {
    const settings = await chrome.storage.local.get('settings');
    if (settings.settings?.overlayEnabled !== false) {
      createForestOverlay();
      startFocusTracking();
    }
  }
}

function createForestOverlay() {
  // Remove existing overlay if any
  const existing = document.getElementById('focus-forest-overlay');
  if (existing) existing.remove();
  
  forestContainer = document.createElement('div');
  forestContainer.id = 'focus-forest-overlay';
  forestContainer.innerHTML = `
    <div class="ff-forest-ground"></div>
    <div class="ff-trees-container"></div>
    <div class="ff-stats-bar">
      <div class="ff-timer">🌱 <span id="ff-timer-display">0:00</span></div>
      <div class="ff-tree-count">🌳 <span id="ff-tree-count">0</span> trees</div>
      <button class="ff-toggle-btn" id="ff-toggle-overlay">Hide</button>
    </div>
    <div class="ff-particles"></div>
  `;
  
  document.body.appendChild(forestContainer);
  
  // Make stats bar draggable
  makeStatsDraggable();
  
  // Toggle visibility
  document.getElementById('ff-toggle-overlay').addEventListener('click', () => {
    const container = document.querySelector('.ff-trees-container');
    const ground = document.querySelector('.ff-forest-ground');
    const particles = document.querySelector('.ff-particles');
    const btn = document.getElementById('ff-toggle-overlay');
    
    if (container.style.display === 'none') {
      container.style.display = 'block';
      ground.style.display = 'block';
      particles.style.display = 'block';
      btn.textContent = 'Hide';
    } else {
      container.style.display = 'none';
      ground.style.display = 'none';
      particles.style.display = 'none';
      btn.textContent = 'Show';
    }
  });
  
  // Create initial particles
  createParticles();
}

function makeStatsDraggable() {
  const statsBar = document.querySelector('.ff-stats-bar');
  if (!statsBar) return;
  
  let isDragging = false;
  let startX, startY, initialX, initialY;
  
  // Load saved position
  chrome.storage.local.get('statsBarPosition', (data) => {
    if (data.statsBarPosition) {
      statsBar.style.top = data.statsBarPosition.top;
      statsBar.style.right = 'auto';
      statsBar.style.left = data.statsBarPosition.left;
    }
  });
  
  statsBar.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return; // Don't drag when clicking buttons
    isDragging = true;
    statsBar.style.cursor = 'grabbing';
    
    const rect = statsBar.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initialX = rect.left;
    initialY = rect.top;
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newX = initialX + deltaX;
    let newY = initialY + deltaY;
    
    // Keep within viewport
    const maxX = window.innerWidth - statsBar.offsetWidth;
    const maxY = window.innerHeight - statsBar.offsetHeight;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    statsBar.style.right = 'auto';
    statsBar.style.left = `${newX}px`;
    statsBar.style.top = `${newY}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      statsBar.style.cursor = 'grab';
      
      // Save position
      chrome.storage.local.set({
        statsBarPosition: {
          left: statsBar.style.left,
          top: statsBar.style.top
        }
      });
    }
  });
}

function createParticles() {
  const particlesContainer = document.querySelector('.ff-particles');
  if (!particlesContainer) return;
  
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'ff-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particle.style.animationDuration = `${8 + Math.random() * 6}s`;
    particle.innerHTML = ['🍃', '🌿', '✨', '🦋'][Math.floor(Math.random() * 4)];
    particlesContainer.appendChild(particle);
  }
}

function startFocusTracking() {
  focusStartTime = Date.now();
  
  // Update timer every second
  updateInterval = setInterval(updateTimer, 1000);
  
  // Grow trees every 5 minutes (300 seconds)
  growthInterval = setInterval(checkTreeGrowth, 1000);
  
  // Track visibility
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', () => { isTabActive = false; });
  window.addEventListener('focus', () => { isTabActive = true; focusStartTime = Date.now(); });
}

function handleVisibilityChange() {
  if (document.hidden) {
    isTabActive = false;
    saveFocusTime();
  } else {
    isTabActive = true;
    focusStartTime = Date.now();
  }
}

function updateTimer() {
  if (!isTabActive || !focusStartTime) return;
  
  const elapsed = Math.floor((Date.now() - focusStartTime) / 1000);
  const currentSession = totalFocusTime + elapsed;
  
  const minutes = Math.floor(currentSession / 60);
  const seconds = currentSession % 60;
  
  const timerDisplay = document.getElementById('ff-timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function checkTreeGrowth() {
  if (!isTabActive || !focusStartTime) return;
  
  const elapsed = Math.floor((Date.now() - focusStartTime) / 1000);
  const currentSession = totalFocusTime + elapsed;
  
  // New tree every 5 minutes
  const expectedTrees = Math.floor(currentSession / 300);
  
  while (trees.length < expectedTrees) {
    growNewTree();
  }
  
  // Update existing trees growth
  updateTreeGrowth(currentSession);
}

function growNewTree() {
  const container = document.querySelector('.ff-trees-container');
  if (!container) return;
  
  const treeType = TREE_TYPES[Math.floor(Math.random() * TREE_TYPES.length)];
  const tree = document.createElement('div');
  tree.className = 'ff-tree ff-tree-seed';
  
  const position = 5 + (trees.length * 8) % 85;
  tree.style.left = `${position}%`;
  tree.style.zIndex = Math.floor(Math.random() * 10);
  
  tree.innerHTML = `
    <div class="ff-tree-trunk"></div>
    <div class="ff-tree-leaves" style="background: ${treeType.color}"></div>
    <div class="ff-tree-leaves-dark" style="background: ${treeType.darkColor}"></div>
  `;
  
  container.appendChild(tree);
  trees.push({ element: tree, stage: 0, type: treeType });
  
  // Update tree count
  const countDisplay = document.getElementById('ff-tree-count');
  if (countDisplay) {
    countDisplay.textContent = trees.length;
  }
  
  // Animate growth after a moment
  setTimeout(() => {
    tree.classList.remove('ff-tree-seed');
    tree.classList.add('ff-tree-sapling');
  }, 100);
}

function updateTreeGrowth(totalSeconds) {
  trees.forEach((tree, index) => {
    const treeAge = totalSeconds - (index * 300);
    
    if (treeAge >= 600 && tree.stage < 2) {
      tree.element.classList.remove('ff-tree-sapling');
      tree.element.classList.add('ff-tree-mature');
      tree.stage = 2;
    } else if (treeAge >= 300 && tree.stage < 1) {
      tree.element.classList.remove('ff-tree-seed');
      tree.element.classList.add('ff-tree-sapling');
      tree.stage = 1;
    }
  });
}

async function saveFocusTime() {
  if (!focusStartTime) return;
  
  const elapsed = Math.floor((Date.now() - focusStartTime) / 1000);
  totalFocusTime += elapsed;
  
  await chrome.runtime.sendMessage({
    action: 'updateFocusTime',
    time: elapsed
  });
  
  focusStartTime = Date.now();
}

// Save focus time before leaving
window.addEventListener('beforeunload', saveFocusTime);

// Periodic save every 30 seconds
setInterval(() => {
  if (isTabActive && isProductive) {
    saveFocusTime();
  }
}, 30000);

// Start the extension
init();
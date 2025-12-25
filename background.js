const DEFAULT_PRODUCTIVE_SITES = [
  'docs.google.com',
  'drive.google.com',
  'github.com',
  'leetcode.com',
  'khanacademy.org',
  'coursera.org',
  'edx.org',
  'udemy.com',
  'stackoverflow.com',
  'notion.so',
  'figma.com',
  'codepen.io',
  'replit.com',
  'hackerrank.com',
  'codecademy.com',
  'freecodecamp.org',
  'w3schools.com',
  'developer.mozilla.org',
  'wikipedia.org',
  'scholar.google.com',
  'classroom.google.com',
  'enotesnepal.com',
  'sajhanotes.com'
];

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['productiveSites', 'lifetimeStats', 'settings']);
  
  if (!data.productiveSites) {
    await chrome.storage.local.set({ productiveSites: DEFAULT_PRODUCTIVE_SITES });
  }
  
  if (!data.lifetimeStats) {
    await chrome.storage.local.set({
      lifetimeStats: {
        totalFocusTime: 0,
        treesGrown: 0,
        longestStreak: 0,
        currentStreak: 0,
        lastActiveDate: null,
        level: 1,
        badges: []
      }
    });
  }
  
  if (!data.settings) {
    await chrome.storage.local.set({
      settings: {
        soundEnabled: false,
        overlayEnabled: true
      }
    });
  }
});

// look  messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkProductive') {
    checkIfProductive(request.url).then(sendResponse);
    return true;
  }
  
  if (request.action === 'updateFocusTime') {
    updateFocusTime(request.time).then(sendResponse);
    return true;
  }
  
  if (request.action === 'getStats') {
    getStats().then(sendResponse);
    return true;
  }
});

async function checkIfProductive(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const data = await chrome.storage.local.get('productiveSites');
    const sites = data.productiveSites || DEFAULT_PRODUCTIVE_SITES;
    
    const isProductive = sites.some(site => hostname.includes(site) || site.includes(hostname));
    return { isProductive };
  } catch {
    return { isProductive: false };
  }
}

async function updateFocusTime(seconds) {
  const data = await chrome.storage.local.get(['lifetimeStats', 'dailyStats']);
  const today = new Date().toDateString();
  
  let lifetimeStats = data.lifetimeStats || {
    totalFocusTime: 0,
    treesGrown: 0,
    longestStreak: 0,
    currentStreak: 0,
    lastActiveDate: null,
    level: 1,
    badges: []
  };
  
  let dailyStats = data.dailyStats || { date: today, focusTime: 0, trees: [] };
  
  //if new dayy
  if (dailyStats.date !== today) {
    // Check streak
    const lastDate = new Date(lifetimeStats.lastActiveDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      lifetimeStats.currentStreak++;
      if (lifetimeStats.currentStreak > lifetimeStats.longestStreak) {
        lifetimeStats.longestStreak = lifetimeStats.currentStreak;
      }
    } else if (diffDays > 1) {
      lifetimeStats.currentStreak = 1;
    }
    
    dailyStats = { date: today, focusTime: 0, trees: [] };
  }
  
  // Update times
  lifetimeStats.totalFocusTime += seconds;
  dailyStats.focusTime += seconds;
  lifetimeStats.lastActiveDate = today;
  
  //(every 60 minutes = 1 level, starting at level 1)
  lifetimeStats.level = Math.floor(lifetimeStats.totalFocusTime / 3600) + 1;
  
  // Check for new badges...
  lifetimeStats.badges = checkBadges(lifetimeStats, dailyStats);
  
  await chrome.storage.local.set({ lifetimeStats, dailyStats });
  
  return { success: true };
}

function checkBadges(lifetime, daily) {
  const badges = [...(lifetime.badges || [])];
  
  const badgeDefinitions = [
    { id: 'first_tree', name: 'First Seed', condition: () => lifetime.totalFocusTime >= 300 },
    { id: 'hour_focus', name: 'Hour Power', condition: () => lifetime.totalFocusTime >= 3600 },
    { id: 'five_hours', name: 'Deep Focus', condition: () => lifetime.totalFocusTime >= 18000 },      //i took ideas of names from ai
    { id: 'day_streak_3', name: 'Consistent', condition: () => lifetime.currentStreak >= 3 },
    { id: 'day_streak_7', name: 'Week Warrior', condition: () => lifetime.currentStreak >= 7 },
    { id: 'level_5', name: 'Rising Star', condition: () => lifetime.level >= 5 },
    { id: 'level_10', name: 'Focus Master', condition: () => lifetime.level >= 10 },
    { id: 'ten_hours', name: 'Forest Keeper', condition: () => lifetime.totalFocusTime >= 36000 }
  ];
  
  badgeDefinitions.forEach(badge => {
    if (!badges.includes(badge.id) && badge.condition()) {
      badges.push(badge.id);
    }
  });
  
  return badges;
}

async function getStats() {
  const data = await chrome.storage.local.get(['lifetimeStats', 'dailyStats']);
  const today = new Date().toDateString();
  
  let dailyStats = data.dailyStats || { date: today, focusTime: 0, trees: [] };
  
  if (dailyStats.date !== today) {
    dailyStats = { date: today, focusTime: 0, trees: [] };
  }
  
  return {
    lifetime: data.lifetimeStats || {
      totalFocusTime: 0,
      treesGrown: 0,
      longestStreak: 0,
      currentStreak: 0,
      level: 1,
      badges: []
    },
    daily: dailyStats
  };
}


//it has been really great working on this project for hackclub
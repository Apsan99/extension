## Quick Install of my extension with support from hackclub

### Step 1: Download the Extension
Copy the entire `chrome-extension` folder to your computer.

### Step 2: Add Icons
Create 3 icon images in the `icons` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)


### Step 3: Load in Chrome
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `chrome-extension` folder

### Step 4: Start Focusing!
1. Visit any productive site (GitHub, Google Docs, Khan Academy, etc.)
2. Watch your forest grow at the bottom of the page!
3. Click the extension icon to see your stats

---

## How It Works

 **Forest Overlay** - A beautiful animated forest grows at the bottom of productive websites

**Time Tracking** - Only counts time when you're actively on the tab

 **Tree Growth** - New tree every 5 minutes of focus time

 **Stats** - Track daily focus, lifetime stats, streaks, and levels

 **Badges** - Earn achievements for focus milestones

 **Sounds** - Optional ambient forest sounds

---



## Folder Structure

```
chrome-extension/
├── manifest.json      
├── background.js     
├── content.js        
├── content.css        
├── popup.html        
├── popup.css         
├── popup.js         
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
|___music/
     |__calm-music.mp3

-----------------------------------

## Troubleshooting

**Forest not showing?**
- Make sure the site is in your productive sites list
- Check that "Forest Overlay" is enabled in settings

**Extension not loading?**
- Verify all files are in the folder
- Check for JavaScript errors in chrome://extensions

**Icons missing?**
- Create the icon files as described above
- Reload the extension after adding icons

------------------------------------------

Made with love for Hack Club
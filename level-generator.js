// Level Generator using Groq API
// This module handles AI-powered level generation

const LEVEL_TEMPLATES = {
  easy: {
    houseCount: 6,
    platformDensity: 0.3,
    iceDensity: 0.5,
    deliveriesNeeded: 4,
    thiefEnabled: false
  },
  medium: {
    houseCount: 8,
    platformDensity: 0.5,
    iceDensity: 0.7,
    deliveriesNeeded: 6,
    thiefEnabled: true
  },
  hard: {
    houseCount: 10,
    platformDensity: 0.7,
    iceDensity: 1.0,
    deliveriesNeeded: 8,
    thiefEnabled: true
  }
};

class LevelGenerator {
  constructor() {
    this.serverUrl = 'http://localhost:3002/generate-level';
    this.isGenerating = false;
    this.generatedLevel = null;
  }

  // Generate level using AI
  async generateWithAI(prompt) {
    if (this.isGenerating) return null;
    
    this.isGenerating = true;
    this.showLoadingUI();
    
    try {
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate level');
      }
      
      const data = await response.json();
      this.generatedLevel = this.parseAIResponse(data.level);
      this.hideLoadingUI();
      this.isGenerating = false;
      return this.generatedLevel;
    } catch (error) {
      console.error('Level generation error:', error);
      this.hideLoadingUI();
      this.isGenerating = false;
      // Fall back to random generation
      return this.generateRandom('medium');
    }
  }

  // Parse AI response into level config
  parseAIResponse(aiResponse) {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const config = JSON.parse(jsonMatch[0]);
        return this.validateAndNormalize(config);
      }
    } catch (e) {
      console.warn('Failed to parse AI response, using fallback');
    }
    return this.generateRandom('medium');
  }

  // Validate and normalize level config
  validateAndNormalize(config) {
    return {
      name: config.name || 'AI Generated Level',
      theme: config.theme || 'winter',
      worldWidth: Math.min(Math.max(config.worldWidth || 3000, 2000), 5000),
      houses: this.normalizeHouses(config.houses),
      platforms: this.normalizePlatforms(config.platforms),
      iceCount: Math.min(Math.max(config.iceCount || 14, 5), 30),
      iceSpeed: Math.min(Math.max(config.iceSpeed || 1.0, 0.5), 2.0),
      deliveriesNeeded: Math.min(Math.max(config.deliveriesNeeded || 6, 3), 12),
      thiefEnabled: config.thiefEnabled !== false,
      thiefSpeed: Math.min(Math.max(config.thiefSpeed || 1.0, 0.5), 1.5),
      powerUpChance: Math.min(Math.max(config.powerUpChance || 0.3, 0.1), 0.8),
      description: config.description || 'A custom AI-generated level'
    };
  }

  normalizeHouses(houses) {
    if (!Array.isArray(houses) || houses.length < 3) {
      // Generate default houses
      return this.generateDefaultHouses(8);
    }
    return houses.slice(0, 12).map((h, i) => ({
      x: Math.min(Math.max(h.x || 400 + i * 300, 300), 4500),
      color: h.color || ['#c0392b', '#27ae60', '#2980b9', '#8e44ad', '#d35400'][i % 5]
    }));
  }

  normalizePlatforms(platforms) {
    if (!Array.isArray(platforms) || platforms.length < 2) {
      return this.generateDefaultPlatforms(8);
    }
    return platforms.slice(0, 15).map((p, i) => ({
      x: Math.min(Math.max(p.x || 500, 200), 4500),
      // Height above ground - player can jump ~120 pixels max
      heightAboveGround: Math.min(Math.max(p.heightAboveGround || p.height || 80, 60), 120),
      width: Math.min(Math.max(p.width || 80, 50), 150),
      // If moving not specified, randomly assign (50% chance) or use provided value
      moving: p.moving !== undefined ? p.moving : (Math.random() > 0.5),
      speed: Math.min(Math.max(p.speed || 1, 0.5), 2)
    }));
  }

  generateDefaultHouses(count) {
    const houses = [];
    const spacing = 2800 / count;
    for (let i = 0; i < count; i++) {
      houses.push({
        x: 400 + i * spacing + (Math.random() - 0.5) * 100,
        color: ['#c0392b', '#27ae60', '#2980b9', '#8e44ad', '#d35400'][i % 5]
      });
    }
    return houses;
  }

  generateDefaultPlatforms(count) {
    const platforms = [];
    for (let i = 0; i < count; i++) {
      platforms.push({
        x: 300 + i * 350 + Math.random() * 100,
        // Height above ground - between 60 and 120 pixels (jumpable range)
        heightAboveGround: 60 + Math.random() * 60,
        width: 70 + Math.random() * 50,
        moving: Math.random() > 0.5,
        speed: 0.8 + Math.random() * 0.8
      });
    }
    return platforms;
  }

  // Generate a random level based on difficulty
  generateRandom(difficulty = 'medium') {
    const template = LEVEL_TEMPLATES[difficulty] || LEVEL_TEMPLATES.medium;
    
    return {
      name: `Random ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level`,
      theme: 'winter',
      worldWidth: 3000,
      houses: this.generateDefaultHouses(template.houseCount),
      platforms: this.generateDefaultPlatforms(Math.floor(template.platformDensity * 12)),
      iceCount: Math.floor(12 + template.iceDensity * 8),
      iceSpeed: 0.8 + template.iceDensity * 0.4,
      deliveriesNeeded: template.deliveriesNeeded,
      thiefEnabled: template.thiefEnabled,
      thiefSpeed: 1.0,
      powerUpChance: 0.3,
      description: `A randomly generated ${difficulty} level`
    };
  }

  // Show loading UI
  showLoadingUI() {
    const overlay = document.getElementById('level-gen-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  // Hide loading UI
  hideLoadingUI() {
    const overlay = document.getElementById('level-gen-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // Apply generated level to game
  applyLevel(levelConfig) {
    if (!levelConfig) return false;
    
    // Store in global for game to use
    window.customLevel = levelConfig;
    return true;
  }
}

// Create global instance
window.levelGenerator = new LevelGenerator();

// UI Functions
function showLevelGeneratorModal() {
  const modal = document.getElementById('level-gen-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function hideLevelGeneratorModal() {
  const modal = document.getElementById('level-gen-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

async function generateAILevel() {
  const promptInput = document.getElementById('level-prompt');
  const prompt = promptInput ? promptInput.value : 'Create a fun winter delivery level';
  
  const level = await window.levelGenerator.generateWithAI(prompt);
  if (level) {
    window.levelGenerator.applyLevel(level);
    hideLevelGeneratorModal();
    showLevelPreview(level);
  }
}

function generateQuickLevel(difficulty) {
  const level = window.levelGenerator.generateRandom(difficulty);
  window.levelGenerator.applyLevel(level);
  hideLevelGeneratorModal();
  showLevelPreview(level);
}

function showLevelPreview(level) {
  const preview = document.getElementById('level-preview');
  if (preview) {
    preview.innerHTML = `
      <div class="level-info">
        <h3>🎮 ${level.name}</h3>
        <p>${level.description}</p>
        <div class="level-stats">
          <span>🏠 ${level.houses.length} Houses</span>
          <span>🧊 ${level.iceCount} Ice Blocks</span>
          <span>📦 ${level.deliveriesNeeded} Deliveries</span>
          ${level.thiefEnabled ? '<span>🦹 Thief Active</span>' : ''}
        </div>
      </div>
    `;
    preview.classList.remove('hidden');
  }
  
  // Update start button to show custom level
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.textContent = '▶ Play Custom Level';
  }
}

function clearCustomLevel() {
  window.customLevel = null;
  const preview = document.getElementById('level-preview');
  if (preview) {
    preview.classList.add('hidden');
  }
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.textContent = 'Start Game';
  }
}

// Level Generator Server
// Handles Groq API calls for AI level generation

require('dotenv').config();
const http = require('http');
const Groq = require('groq-sdk');

const PORT = 3002;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are a game level designer for a winter courier delivery game. 
Generate level configurations as JSON objects.

The player is a courier who must pick up packages from a warehouse and deliver them to houses.
The game has:
- Houses at various x positions (range: 400-2800)
- Platforms the player can jump on - IMPORTANT: player can only jump about 120 pixels high!
- Falling ice blocks (hazards)
- A thief that can steal packages
- Power-ups

When asked to generate a level, respond with ONLY a valid JSON object in this format:
{
  "name": "Level Name",
  "theme": "winter",
  "worldWidth": 3000,
  "description": "Brief description of the level",
  "houses": [
    {"x": 400, "color": "#c0392b"},
    {"x": 700, "color": "#27ae60"}
  ],
  "platforms": [
    {"x": 350, "heightAboveGround": 80, "width": 80, "moving": false, "speed": 1},
    {"x": 600, "heightAboveGround": 100, "width": 100, "moving": true, "speed": 1.5}
  ],
  "iceCount": 14,
  "iceSpeed": 1.0,
  "deliveriesNeeded": 6,
  "thiefEnabled": true,
  "thiefSpeed": 1.0,
  "powerUpChance": 0.3
}

CRITICAL: Platform "heightAboveGround" MUST be between 60 and 120 pixels. The player cannot jump higher than 120 pixels!

Make levels creative and fun! Respond with ONLY the JSON, no other text.`;

async function generateLevel(userPrompt) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: 1024
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Groq API error:', error.message);
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/generate-level') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body);
        console.log('Generating level with prompt:', prompt);
        
        const level = await generateLevel(prompt);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, level }));
      } catch (error) {
        console.error('Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🎮 Level Generator Server running on http://localhost:${PORT}`);
  console.log('Ready to generate AI-powered levels!');
});

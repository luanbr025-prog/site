import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import session from 'express-session';
import multer from 'multer';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';

// Always load .env first (for development), then override with .env.production if in production
dotenv.config(); // Load .env
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production', override: true }); // Override with .env.production
}

// Detect environment - use process.env which has priority
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Dynamic URL configuration based on environment
const LOCAL_IP = '192.168.1.66';
const LOCAL_FRONTEND_PORT = 3000;
const DISCLOUD_URL = 'https://brasilsimracing.discloud.app';

// Set URLs based on environment
if (isDevelopment) {
  // In development, use your local IP
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || `http://${LOCAL_IP}:${LOCAL_FRONTEND_PORT}`;
  process.env.STEAM_RETURN_URL = process.env.STEAM_RETURN_URL || `http://${LOCAL_IP}:${LOCAL_FRONTEND_PORT}/auth/steam/return`;
  process.env.STEAM_REALM = process.env.STEAM_REALM || `http://${LOCAL_IP}:${LOCAL_FRONTEND_PORT}`;
} else {
  // In production (Discloud), use the domain
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || DISCLOUD_URL;
  process.env.STEAM_RETURN_URL = process.env.STEAM_RETURN_URL || `${DISCLOUD_URL}/auth/steam/return`;
  process.env.STEAM_REALM = process.env.STEAM_REALM || DISCLOUD_URL;
}

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
process.env.STEAM_API_KEY = process.env.STEAM_API_KEY || '';

// Log startup info
process.env.STEAM_ADMINS = process.env.STEAM_ADMINS || ''; // Comma-separated Steam IDs

// Log startup info
console.log(`✅ BSR Server Starting`);
console.log(`📌 Environment: ${process.env.NODE_ENV}`);
console.log(`🔐 Steam configured: ${process.env.STEAM_API_KEY ? 'Yes' : 'No'}`);
if (process.env.STEAM_API_KEY) {
  console.log(`   Return URL: ${process.env.STEAM_RETURN_URL}`);
}


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const DIST_DIR = path.join(__dirname, 'dist');
// ACTIVE_DIST will point to the directory we actually serve (may be DIST_DIR or a temp build dir)
let ACTIVE_DIST = DIST_DIR;
const IMAGES_DIR = path.join(__dirname, 'public', 'assets', 'images');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Auto-build frontend if dist directory doesn't exist.
// NOTE: In Discloud, /home/node/dist/ often has permission issues.
// Strategy: Always attempt fallback build to /tmp (writable temp directory).
if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.log('🔧 Dist directory not found or incomplete. Attempting to build frontend...');
  
  // First, try to clean up the default dist dir if it exists and is problematic
  try {
    if (fs.existsSync(DIST_DIR)) {
      console.log('   Cleaning up /dist directory...');
      fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn('   Could not clean /dist (may be read-only):', err.message);
  }
  
  // Always use fallback build to /tmp (avoids permission issues)
  console.log('🔁 Building frontend to temporary directory (more reliable on Discloud)...');
  let buildSucceeded = false;
  
  try {
    const { execSync } = await import('child_process');
    const tmpDir = path.join(os.tmpdir(), `bsr_dist_${Date.now()}`);
    console.log(`   Target: ${tmpDir}`);
    
    // Ensure tmpDir exists
    fs.mkdirSync(tmpDir, { recursive: true });
    
    // Build with memory-efficient flags and explicit cleanup
    const buildCmd = `npm run build -- --outDir ${tmpDir} --emptyOutDir`;
    console.log('📦 Running:', buildCmd);
    
    execSync(buildCmd, { 
      stdio: 'inherit', 
      cwd: __dirname,
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=256' },
      timeout: 120000 // 2-minute timeout
    });
    
    // Verify build
    const builtIndex = path.join(tmpDir, 'index.html');
    if (fs.existsSync(builtIndex)) {
      console.log('✅ Frontend build completed successfully to temporary directory');
      ACTIVE_DIST = tmpDir;
      buildSucceeded = true;
    } else {
      console.warn('⚠️  Build completed but index.html not found at:', builtIndex);
    }
  } catch (err) {
    console.error('❌ Build failed:', err && err.message ? err.message : err);
  }
  
  if (!buildSucceeded) {
    console.error('❌❌❌ Frontend build failed. Troubleshooting:');
    console.error('    1. Check if npm dependencies are installed: npm ci');
    console.error('    2. Ensure 512MB+ RAM available');
    console.error('    3. Verify /tmp directory has write permissions');
    console.error('    Frontend will NOT be available');
  }
}

// Accounts file (ensure exists)
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
if (!fs.existsSync(ACCOUNTS_FILE)) fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([], null, 2), 'utf8');

function readAccounts(){
  try{ return JSON.parse(fs.readFileSync(ACCOUNTS_FILE,'utf8') || '[]'); }catch(e){ return []; }
}
function writeAccounts(arr){
  try{ fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(arr, null, 2), 'utf8'); }catch(e){ console.error('Failed to write accounts.json', e); }
}

const PORT = process.env.PORT || 8080;

// Basic middleware
// Configure Helmet with a Content Security Policy that allows Steam avatar images
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https://avatars.steamstatic.com', 'https://steamcdn-a.akamaihd.net', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter / trust proxy defaults (kept minimal)
// Allow overriding via env var TRUST_PROXY=1. In production we enable trust proxy.
const trustProxy = (process.env.TRUST_PROXY === '1') || (process.env.NODE_ENV === 'production');
app.set('trust proxy', trustProxy ? 1 : false);
if (trustProxy) console.log('Trust proxy is enabled');

// Configure rate limiter. Use IP from request to avoid validation errors
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, keyGenerator: (req) => req.ip });
app.use(limiter);

// Sessions (required for passport-steam)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    // Only set secure cookies when FRONTEND_URL is HTTPS (avoids Secure cookie on http://localhost)
    secure: (process.env.NODE_ENV === 'production') && ((process.env.FRONTEND_URL || '').startsWith('https')),
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Log session cookie configuration for debugging
try {
  console.log('Session cookie config -> secure:', (process.env.NODE_ENV === 'production') && ((process.env.FRONTEND_URL || '').startsWith('https')), 'sameSite: lax');
} catch (e) {}

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) { done(null, user); });
passport.deserializeUser(function(obj, done) { done(null, obj); });

const steamEnabled = !!process.env.STEAM_API_KEY;

if (steamEnabled) {
  try {
    const returnURL = process.env.STEAM_RETURN_URL || `${process.env.FRONTEND_URL}/auth/steam/return`;
    const realm = process.env.STEAM_REALM || `${process.env.FRONTEND_URL}`;
    
    passport.use(new SteamStrategy({
      returnURL,
      realm,
      apiKey: process.env.STEAM_API_KEY
    }, function(identifier, profile, done) {
      process.nextTick(function () { return done(null, { identifier: identifier, profile: profile }); });
    }));
  } catch (err) {
    console.error('❌ Failed to configure Steam auth:', err.message);
  }
}
// News / Races / Standings files
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const RACES_FILE = path.join(DATA_DIR, 'races.json');
const STANDINGS_FILE = path.join(DATA_DIR, 'standings.json');
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, 'achievements.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
if (!fs.existsSync(NEWS_FILE)) fs.writeFileSync(NEWS_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(RACES_FILE)) fs.writeFileSync(RACES_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(STANDINGS_FILE)) fs.writeFileSync(STANDINGS_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(ACHIEVEMENTS_FILE)) fs.writeFileSync(ACHIEVEMENTS_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
  id: 'settings-1',
  siteName: 'Sim Racing Boost',
  siteDescription: 'Plataforma de gerenciamento de corridas virtuais',
  theme: 'system',
  defaultLanguage: 'pt-BR',
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: false,
  defaultRaceSettings: {
    maxParticipants: 20,
    defaultLaps: 35,
    defaultDuration: '60 minutos'
  },
  udpConfiguration: {
    defaultListenAddress: '127.0.0.1:11095',
    defaultSendAddress: '127.0.0.1:12095',
    defaultRefreshInterval: 1000
  },
  socialMedia: {},
  contactInfo: {
    email: 'contato@simracingboost.com'
  },
  seoSettings: {
    metaTitle: 'Sim Racing Boost',
    metaDescription: 'Plataforma de gerenciamento de corridas virtuais',
    metaKeywords: 'sim racing, corrida virtual, esports'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}, null, 2), 'utf8');

function readJSON(file){
  try{ return JSON.parse(fs.readFileSync(file,'utf8') || '[]'); }catch(e){ return []; }
}
function writeJSON(file, obj){
  try{ fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8'); }catch(e){ console.error('Failed to write', file, e); }
}
function readNews(){ return readJSON(NEWS_FILE); }
function writeNews(data){ writeJSON(NEWS_FILE, data); }
function readRaces(){ return readJSON(RACES_FILE); }
function writeRaces(data){ writeJSON(RACES_FILE, data); }
function readStandings(){ return readJSON(STANDINGS_FILE); }
function writeStandings(data){ writeJSON(STANDINGS_FILE, data); }
function readAchievements(){ return readJSON(ACHIEVEMENTS_FILE); }
function writeAchievements(data){ writeJSON(ACHIEVEMENTS_FILE, data); }
function readSettings(){ return readJSON(SETTINGS_FILE); }
function writeSettings(data){ writeJSON(SETTINGS_FILE, data); }

// Admin helpers
function getAdmins(){
  const raw = process.env.STEAM_ADMINS || '';
  if(!raw) return {};
  // Parse comma-separated Steam IDs and create a lookup map
  return raw.split(',').reduce((acc, steamId)=>{
    const id = String(steamId||'').trim();
    if(id) acc[id] = true;
    return acc;
  }, {});
}

function getSteamIdFromUsername(username) {
  // Extract Steam ID from username format like "steam_76561198419559590"
  const match = username.match(/^steam_(\d+)$/);
  return match ? match[1] : null;
}

function requireAuth(req,res,next){ if(req.session && req.session.user) return next(); return res.status(401).json({ok:false, message:'Não autorizado'}); }
function requireAdmin(req,res,next){ 
  if(!req.session || !req.session.user) return res.status(401).json({ok:false, message:'Não autorizado'}); 
  const admins = getAdmins(); 
  const steamId = getSteamIdFromUsername(req.session.user.username);
  if(!steamId || !admins[steamId]) return res.status(403).json({ok:false, message:'Acesso negado: apenas administradores'}); 
  next(); 
}

// Session and admin check endpoints
app.get('/api/session', (req,res)=>{
  try {
    console.log('API /api/session', 'sessionID:', req.sessionID, 'user:', req.session && req.session.user ? req.session.user.username : null);
  } catch (e) { console.log('Session log error', e); }
  res.json({ user: req.session && req.session.user ? req.session.user : null });
});
app.get('/api/admin/check', (req,res)=>{
  if(!req.session || !req.session.user) return res.json({ isAdmin:false });
  const admins = getAdmins();
  const steamId = getSteamIdFromUsername(req.session.user.username);
  res.json({ isAdmin: !!(steamId && admins[steamId]) });
});

// Logout
app.post('/api/logout', (req,res)=>{ if(req.session) req.session.destroy(()=>res.json({ok:true})); else res.json({ok:true}); });

// Race register/unregister endpoints for authenticated users
app.post('/api/races/:id/register', requireAuth, (req,res)=>{
  const id = Number(req.params.id);
  const username = req.session.user.username;
  const data = readRaces();
  const race = data.find(x=>x.id===id);
  if(!race) return res.status(404).json({ok:false, message:'Corrida não encontrada'});
  if(!race.participants) race.participants = [];
  if(race.participants.find(p=>p.username===username)) return res.json({ok:true, message:'Já inscrito'});
  race.participants.push({ username, registeredAt: new Date().toISOString() });
  writeRaces(data);
  
  // Automatically add user to standings if race has a championship
  if(race.championship) {
    const standingsData = readStandings();
    const standing = standingsData.find(s => s.category === race.championship);
    if(standing) {
      // Add user to registeredPilots if not already there
      if(!standing.registeredPilots) standing.registeredPilots = [];
      if(!standing.registeredPilots.includes(username)) {
        standing.registeredPilots.push(username);
        
        // Add user to drivers list with default stats
        if(!standing.drivers) standing.drivers = [];
        if(!standing.drivers.some(d => d.name === username)) {
          standing.drivers.push({
            name: username,
            points: 0,
            team: "Independent"
          });
        }
      }
    }
  }
  
  res.json({ok:true, message:'Inscrito na corrida'});
});

app.post('/api/races/:id/unregister', requireAuth, (req,res)=>{
  const id = Number(req.params.id);
  const username = req.session.user.username;
  const data = readRaces();
  const race = data.find(x=>x.id===id);
  if(!race) return res.status(404).json({ok:false, message:'Corrida não encontrada'});
  if(!race.participants) race.participants = [];
  const idx = race.participants.findIndex(p=>p.username === username);
  if(idx === -1) return res.status(400).json({ok:false, message:'Usuário não inscrito nesta corrida'});
  race.participants.splice(idx,1);
  writeRaces(data);
  res.json({ok:true, message:'Inscrição cancelada'});
});

// My races (for current user)
app.get('/api/my/races', requireAuth, (req,res)=>{
  const username = req.session.user.username;
  const data = readRaces();
  const mine = (data||[]).filter(r=> (r.participants||[]).some(p=>p.username===username));
  res.json(mine);
});

// News endpoints
app.get('/api/news', (req,res)=>{ res.json(readNews()); });
app.post('/api/news', requireAdmin, (req,res)=>{
  const data = readNews();
  const item = req.body;
  item.id = (data.reduce((m,it)=>Math.max(m, it.id||0),0) || 0) + 1;
  // Set author to current admin
  const adminUsername = req.session.user.username;
  const accounts = readAccounts();
  const adminAccount = accounts.find(a => a.username === adminUsername);
  item.author = adminAccount?.displayName || adminUsername;
  data.unshift(item);
  writeNews(data);
  res.json({ok:true, item});
});
app.put('/api/news/:id', requireAdmin, (req,res)=>{
  const id = Number(req.params.id);
  const data = readNews();
  const idx = data.findIndex(x=>x.id===id);
  if(idx===-1) return res.status(404).json({ok:false});
  const updated = Object.assign({}, data[idx], req.body);
  // Set author to current admin (update on edit)
  const adminUsername = req.session.user.username;
  const accounts = readAccounts();
  const adminAccount = accounts.find(a => a.username === adminUsername);
  updated.author = adminAccount?.displayName || adminUsername;
  data[idx] = updated;
  writeNews(data);
  res.json({ok:true, item:data[idx]});
});
app.delete('/api/news/:id', requireAdmin, (req,res)=>{
  const id = Number(req.params.id);
  const data = readNews();
  const idx = data.findIndex(x=>x.id===id);
  if(idx===-1) return res.status(404).json({ok:false});
  const removed = data.splice(idx,1)[0];
  writeNews(data);
  res.json({ok:true, removed});
});

// Races endpoints (with type/carClass)
app.get('/api/races', (req,res)=>{
  const races = readRaces();
  // Update pilots count based on participants
  races.forEach(race => {
    race.pilots = race.participants?.length || 0;
  });
  res.json(races);
});
app.post('/api/races', requireAdmin, (req,res)=>{
  const data = readRaces();
  const item = req.body;
  item.id = (data.reduce((m,it)=>Math.max(m, it.id||0),0) || 0) + 1;
  item.participants = item.participants || [];
  item.pilots = item.participants.length;
  data.unshift(item);
  writeRaces(data);
  res.json({ok:true, item});
});
app.put('/api/races/:id', requireAdmin, (req,res)=>{
  const id = Number(req.params.id);
  const data = readRaces();
  const idx = data.findIndex(x=>x.id===id);
  if(idx===-1) return res.status(404).json({ok:false});
  const updated = Object.assign({}, data[idx], req.body);
  updated.pilots = updated.participants?.length || 0;
  data[idx] = updated;
  writeRaces(data);
  res.json({ok:true, item:data[idx]});
});
app.delete('/api/races/:id', requireAdmin, (req,res)=>{
  const id = Number(req.params.id);
  const data = readRaces();
  const idx = data.findIndex(x=>x.id===id);
  if(idx===-1) return res.status(404).json({ok:false});
  const removed = data.splice(idx,1)[0];
  writeRaces(data);
  res.json({ok:true, removed});
});

// Standings endpoints
app.get('/api/standings', (req,res)=>{ res.json(readStandings()); });
app.post('/api/standings', requireAdmin, (req,res)=>{ const data = readStandings(); const obj = req.body; data.push(obj); writeStandings(data); res.json({ok:true, category: obj}); });
app.put('/api/standings/:category', requireAdmin, (req,res)=>{ const category = req.params.category; const data = readStandings(); const idx = data.findIndex(s=>s.category && s.category.toLowerCase()===category.toLowerCase()); if(idx===-1) return res.status(404).json({ok:false}); data[idx]=Object.assign({}, data[idx], req.body); writeStandings(data); res.json({ok:true, category: data[idx]}); });
app.delete('/api/standings/:category', requireAdmin, (req,res)=>{ const category = req.params.category; const data = readStandings(); const idx = data.findIndex(s=>s.category && s.category.toLowerCase()===category.toLowerCase()); if(idx===-1) return res.status(404).json({ok:false}); const removed = data.splice(idx,1)[0]; writeStandings(data); res.json({ok:true, removed}); });

// Achievements endpoints
app.get('/api/achievements', (req,res)=>{ res.json(readAchievements()); });
app.post('/api/achievements', requireAdmin, (req,res)=>{ const data = readAchievements(); const item = req.body; item.id = (data.reduce((m,it)=>Math.max(m, it.id||0),0) || 0) + 1; data.unshift(item); writeAchievements(data); res.json({ok:true, item}); });
app.put('/api/achievements/:id', requireAdmin, (req,res)=>{ const id = Number(req.params.id); const data = readAchievements(); const idx = data.findIndex(x=>x.id===id); if(idx===-1) return res.status(404).json({ok:false}); data[idx]=Object.assign({}, data[idx], req.body); writeAchievements(data); res.json({ok:true, item:data[idx]}); });
app.delete('/api/achievements/:id', requireAdmin, (req,res)=>{ const id = Number(req.params.id); const data = readAchievements(); const idx = data.findIndex(x=>x.id===id); if(idx===-1) return res.status(404).json({ok:false}); const removed = data.splice(idx,1)[0]; writeAchievements(data); res.json({ok:true, removed}); });

// Settings endpoints
app.get('/api/settings', (req,res)=>{ res.json(readSettings()); });
app.put('/api/settings', (req,res)=>{
  // TODO: Re-enable admin check in production
  // requireAdmin(req, res, () => {}
  const existingSettings = readSettings();
  const newData = req.body;
  const mergedSettings = { ...existingSettings, ...newData };
  mergedSettings.updatedAt = new Date().toISOString();
  writeSettings(mergedSettings);
  res.json({ok:true, settings: mergedSettings});
  // });
});

// My account
app.get('/api/my/account', requireAuth, (req,res)=>{
  const username = req.session.user.username;
  const accounts = readAccounts();
  const acc = accounts.find(a => a.username === username);
  if(!acc) return res.status(404).json({ok:false, message:'Account not found'});
  res.json(acc);
});

// Public endpoints for statistics (no auth required)
app.get('/api/public/accounts-count', (req, res) => {
  try {
    const accounts = readAccounts();
    res.json({ ok: true, count: accounts.length });
  } catch (error) {
    console.error('Error getting accounts count:', error);
    res.status(500).json({ ok: false, message: 'Failed to get accounts count' });
  }
});

app.get('/api/public/races-count', (req, res) => {
  try {
    const races = readRaces();
    res.json({ ok: true, count: races.length });
  } catch (error) {
    console.error('Error getting races count:', error);
    res.status(500).json({ ok: false, message: 'Failed to get races count' });
  }
});

app.get('/api/public/stats', (req, res) => {
  try {
    const accounts = readAccounts();
    const races = readRaces();
    const news = readNews();
    const standings = readStandings();
    
    // Calculate total participants across all races
    let totalParticipants = 0;
    races.forEach(race => {
      totalParticipants += race.participants ? race.participants.length : 0;
    });
    
    res.json({
      ok: true,
      stats: {
        accountsCount: accounts.length,
        racesCount: races.length,
        newsCount: news.length,
        standingsCount: standings.length,
        totalParticipants: totalParticipants,
        activeChampionships: standings.length
      }
    });
  } catch (error) {
    console.error('Error getting public stats:', error);
    res.status(500).json({ ok: false, message: 'Failed to get public stats' });
  }
});

// Accounts management for admin
app.get('/api/accounts', requireAdmin, (req,res)=>{ res.json(readAccounts()); });
app.post('/api/accounts', requireAdmin, (req, res) => {
  try {
    const account = req.body;
    if (!account || !account.username) return res.status(400).json({ ok: false, message: 'username is required' });
    const data = readAccounts();
    if (data.find(a => a.username === account.username)) return res.status(409).json({ ok: false, message: 'username already exists' });
    data.push(account);
    writeAccounts(data);
    return res.json(account);
  } catch (e) {
    console.error('Failed to create account', e);
    return res.status(500).json({ ok: false, message: 'Failed to create account' });
  }
});

app.put('/api/accounts/:username', requireAdmin, (req,res)=>{ const username = req.params.username; const data = readAccounts(); const idx = data.findIndex(a=>a.username===username); if(idx===-1) return res.status(404).json({ok:false}); data[idx]=Object.assign({}, data[idx], req.body); writeAccounts(data); res.json(data[idx]); });
app.delete('/api/accounts/:username', requireAdmin, (req,res)=>{ const username = req.params.username; const data = readAccounts(); const idx = data.findIndex(a=>a.username===username); if(idx===-1) return res.status(404).json({ok:false}); const removed = data.splice(idx,1)[0]; writeAccounts(data); res.json({ok:true, removed}); });

// Multer for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({ storage });

// Health
app.get('/ping', (req, res) => res.send('PONG'));

// Simple CSRF token endpoint
app.get('/api/csrf', (req, res) => {
  if (!req.session.csrfToken) req.session.csrfToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
  res.json({ csrf: req.session.csrfToken });
});

// Add lightweight logging for /auth routes to help debug callback issues
app.use('/auth', (req, res, next) => {
  try {
    console.log('Auth request:', req.method, req.originalUrl, 'query:', req.query, 'sessionID:', req.sessionID, 'hasUser:', !!(req.session && req.session.user));
  } catch (e) {
    console.log('Auth logging error', e);
  }
  return next();
});

// Steam Login Initiator
app.get('/auth/steam', passport.authenticate('steam', { failureRedirect: process.env.FRONTEND_URL }));

// Steam Callback Handler
app.get('/auth/steam/return', passport.authenticate('steam', { 
  failureRedirect: process.env.FRONTEND_URL,
  failureMessage: true 
}), async (req, res, next) => {
  try {
    // Passport-steam returns user as { identifier, profile }
    const user = req.user;
    
    if (!user || !user.profile) {
      console.error('❌ Steam auth: No user or profile data. req.user:', JSON.stringify(user));
      return res.redirect(process.env.FRONTEND_URL);
    }

    const profile = user.profile;
    const _json = profile._json || {};

    // Extract Steam ID - try multiple locations
    const steamId = profile.id || _json.steamid || user.identifier;
    if (!steamId) {
      console.error('❌ Steam auth: Could not extract Steam ID from:', JSON.stringify({ profile_id: profile.id, json_steamid: _json.steamid, identifier: user.identifier }));
      return res.redirect(process.env.FRONTEND_URL);
    }

    // Extract display name
    const displayName = profile.displayName || _json.personaname || 'Steam User';
    
    // Extract avatar - try full size first, then medium
    const avatar = _json.avatarfull || _json.avatarmedium || _json.avatar || null;

    const username = `steam_${steamId}`;

    // Read or create account
    let accounts = readAccounts();
    let account = accounts.find(a => a.steam?.id === steamId);

    if (!account) {
      // Create new account
      account = {
        username,
        displayName,
        createdAt: new Date().toISOString(),
        steam: { id: steamId, displayName, avatar },
        stats: { wins: 0, podiums: 0, points: 0 }
      };
      accounts.push(account);
      console.log(`✅ New Steam user created: ${username}`);
    } else {
      // Update existing account with latest Steam data
      account.displayName = displayName;
      account.steam = { id: steamId, displayName, avatar };
      console.log(`✅ Steam user updated: ${username}`);
    }

    // Save accounts to file
    writeAccounts(accounts);

    // Log incoming session state before setting user
    try { console.log('Steam callback incoming', 'sessionID:', req.sessionID, 'hasUserBefore:', !!(req.session && req.session.user)); } catch(e){}

    // Set session
    req.session.user = {
      username: account.username,
      displayName: account.displayName,
      avatar: account.steam.avatar,
      id: account.username,
      role: 'user'
    };

    // Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err.message);
        return res.redirect(process.env.FRONTEND_URL);
      }
      
      try { console.log('Steam callback saved session', 'sessionID:', req.sessionID, 'user:', req.session.user && req.session.user.username); } catch(e){}
      console.log(`✅ Auth success: ${displayName} (${steamId})`);
      return res.redirect(process.env.FRONTEND_URL);
    });
  } catch (err) {
    console.error('❌ Steam auth error:', err.message);
    console.error(err.stack);
    return res.redirect(process.env.FRONTEND_URL);
  }
});

// Serve static assets from the active dist directory (may be fallback temp dir)
if (fs.existsSync(ACTIVE_DIST)) {
  app.use(express.static(ACTIVE_DIST, { maxAge: '1d' }));
}

// Upload endpoint (example)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false });
  const urlPath = '/assets/images/' + path.basename(req.file.filename);
  res.json({ ok: true, url: urlPath });
});

// Assetto Corsa UDP Service Configuration
// Delete image endpoint
app.delete('/api/upload/:filename', requireAdmin, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(IMAGES_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  } else {
    res.status(404).json({ ok: false, message: 'File not found' });
  }
});
// Test endpoint to configure UDP service for race (no auth for testing)
app.post('/api/test/configure-udp-for-race', (req, res) => {
  try {
    const { raceId } = req.body;
    
    if (!raceId) {
      return res.status(400).json({ ok: false, message: 'Race ID is required' });
    }
    
    // Get race data
    const races = readRaces();
    const race = races.find(r => r.id === Number(raceId));
    
    if (!race) {
      return res.status(404).json({ ok: false, message: 'Race not found' });
    }
    
    // Stop current UDP listener
    assettoCorsaUdpService.stopUdpListener();
    
    // Configure with race settings
    const config = assettoCorsaUdpService.configureServer(race);
    
    // Extract UDP port from udpSendAddress
    let udpPort = 9600;
    if (race.udpSendAddress) {
      const sendAddressParts = race.udpSendAddress.split(':');
      if (sendAddressParts.length === 2) {
        udpPort = parseInt(sendAddressParts[1]) || 9600;
      }
    }
    
    // Start new UDP listener with the correct port
    assettoCorsaUdpService.startUdpListener(udpPort);
    
    res.json({
      ok: true,
      message: 'Assetto Corsa UDP service configured for race',
      config: config,
      udpPort: udpPort
    });
  } catch (error) {
    console.error('Error configuring Assetto Corsa service for race:', error);
    res.status(500).json({ ok: false, message: 'Failed to configure Assetto Corsa service' });
  }
});

// 404 handler - catches all routes not matched above
// SPA fallback route - serve index.html for all unmatched non-API GETs
app.use((req, res, next) => {
  // Only apply SPA fallback to GET requests
  if (req.method !== 'GET') return next();

  // Skip API/auth/assets/public routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/') || req.path.startsWith('/assets/') || req.path.startsWith('/public/')) {
    return next();
  }

  const indexPath = path.join(ACTIVE_DIST, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔴 Express error:', err.message);
  console.error(err.stack);
  
  // Check if response was already sent
  if (res.headersSent) return next(err);
  
  // Return JSON error for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
  
  // For other routes, redirect to home
  return res.redirect(process.env.FRONTEND_URL || '/');
});

// 404 handler - catches all routes not matched above
app.use((req, res) => {
  // Never serve HTML for API routes - always return JSON
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Not found' });
  }

  // For non-API routes, serve HTML if available
  if (req.accepts('html')) {
    const indexPath = path.join(ACTIVE_DIST, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }

  // Fallback for other content types
  if (req.accepts('json')) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


let server;
let retries = 5;
let currentRetry = 0;

function startServer() {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log('BSR server running on port', PORT);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use. Retrying... (${currentRetry + 1}/${retries})`);
      if (currentRetry < retries) {
        currentRetry++;
        setTimeout(startServer, 5000); // Retry after 5 seconds
      } else {
        console.error('Failed to start server after multiple retries. Using fallback port...');
        const fallbackPort = PORT + 1;
        server = app.listen(fallbackPort, '0.0.0.0', () => {
          console.log(`BSR server running on fallback port ${fallbackPort}`);
        });
      }
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});
 
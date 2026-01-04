# 🎯 Guia de Deployment - Brasil Sim Racing

## 📦 Estrutura do Projeto

```
site/
├── 🎨 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/          ← Páginas (Login, Races, News, etc)
│   │   ├── components/     ← Componentes reutilizáveis
│   │   ├── context/        ← AuthContext
│   │   ├── hooks/          ← Custom hooks
│   │   ├── services/       ← WebSocket live timing
│   │   └── config/         ← Configuração de ambiente
│   ├── vite.config.ts      ← Build config
│   └── index.html          ← Entry point
│
├── 🔌 Backend (Express.js)
│   ├── server.js           ← Servidor Express (945 linhas)
│   ├── src/services/       ← Assetto Corsa UDP service
│   └── dist/               ← Output de build
│
├── 💾 Dados (JSON)
│   └── data/
│       ├── accounts.json        ← Usuários Steam
│       ├── races.json           ← Corridas
│       ├── standings.json       ← Campeonatos
│       ├── news.json            ← Notícias
│       ├── achievements.json    ← Conquistas
│       └── settings.json        ← Configurações
│
├── ⚙️ Configuração
│   ├── .env                 ← Development
│   ├── .env.production      ← Production (Discloud)
│   ├── package.json         ← Dependências
│   ├── tsconfig.json        ← TypeScript
│   └── tailwind.config.ts   ← CSS Framework
│
└── 📋 Documentação
    ├── AUDIT_REPORT.md      ← Este relatório
    └── README.md
```

---

## 🚀 FLUXO DE AUTENTICAÇÃO (Steam)

```
┌──────────────────────────────────────────────────────────────┐
│                    STEAM LOGIN FLOW                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Usuário clica "Login com Steam" em /login               │
│     ↓                                                        │
│  2. Frontend redireciona para:                              │
│     - Dev: http://192.168.1.66:8080/auth/steam            │
│     - Prod: https://brasilsimracing.discloud.app/auth/steam│
│     ↓                                                        │
│  3. Server.js (passport-steam) inicializa autenticação      │
│     ↓                                                        │
│  4. Steam API valida credenciais                           │
│     ↓                                                        │
│  5. Steam redireciona de volta para:                       │
│     - Dev: http://192.168.1.66:8080/auth/steam/return     │
│     - Prod: https://brasilsimracing.discloud.app/auth/steam/return
│     ↓                                                        │
│  6. Server.js processa callback:                           │
│     - Extrai dados do Steam (ID, avatar, nome)            │
│     - Cria/atualiza conta em accounts.json                │
│     - Define req.session.user                             │
│     ↓                                                        │
│  7. Redireciona para FRONTEND_URL (home)                  │
│     ↓                                                        │
│  8. Frontend verifica /api/session (cookie com sessão)    │
│     ↓                                                        │
│  9. AuthContext atualiza com user data                    │
│     ↓                                                        │
│  ✅ Usuário logado!                                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 VARIÁVEIS DE AMBIENTE

### `.env` (Development)
```dotenv
NODE_ENV=development
FRONTEND_URL=http://192.168.1.66:3000
STEAM_API_KEY=F6387C03CAD7DB03E5F655CA9003F56D
STEAM_RETURN_URL=http://192.168.1.66:3000/auth/steam/return
STEAM_REALM=http://192.168.1.66:3000
SESSION_SECRET=your-secure-session-secret-change-this
ADMIN_USERS=steam_76561198419559590
```

### `.env.production` (Discloud)
```dotenv
NODE_ENV=production
FRONTEND_URL=https://brasilsimracing.discloud.app
STEAM_API_KEY=F6387C03CAD7DB03E5F655CA9003F56D
STEAM_RETURN_URL=https://brasilsimracing.discloud.app/auth/steam/return
STEAM_REALM=https://brasilsimracing.discloud.app
SESSION_SECRET=your-secure-session-secret-change-this
ADMIN_USERS=steam_76561198419559590
```

### ⚠️ IMPORTANTE
- `SESSION_SECRET` deve ser um valor aleatório único em produção
- `STEAM_API_KEY` é público (não é secret)
- `ADMIN_USERS` usa Steam ID do formato `steam_XXXXXXXXXX`

---

## 📝 ENDPOINTS DA API

### 🔓 Públicos (sem auth)
```
GET  /api/news              → Lista de notícias
GET  /api/races             → Lista de corridas
GET  /api/standings         → Campeonatos
GET  /api/achievements      → Conquistas
GET  /api/settings          → Configurações do site
GET  /api/session           → Info de sessão (null se não logado)
GET  /api/public/stats      → Estatísticas gerais
GET  /api/public/accounts-count
GET  /api/public/races-count
```

### 🔒 Autenticados (requer login)
```
POST /api/races/:id/register      → Inscrever em corrida
POST /api/races/:id/unregister    → Desinscrever
GET  /api/my/races                → Minhas corridas
GET  /api/my/account              → Meus dados
POST /api/logout                  → Fazer logout
```

### 👨‍💼 Admin Only (requer ADMIN_USERS)
```
POST   /api/news               → Criar notícia
PUT    /api/news/:id           → Editar notícia
DELETE /api/news/:id           → Deletar notícia

POST   /api/races              → Criar corrida
PUT    /api/races/:id          → Editar corrida
DELETE /api/races/:id          → Deletar corrida

POST   /api/standings          → Criar campeonato
PUT    /api/standings/:cat     → Editar campeonato
DELETE /api/standings/:cat     → Deletar campeonato

POST   /api/achievements       → Criar conquista
PUT    /api/achievements/:id   → Editar conquista
DELETE /api/achievements/:id   → Deletar conquista

PUT    /api/settings           → Atualizar configurações
GET    /api/accounts           → Lista de usuários
PUT    /api/accounts/:user     → Editar usuário
DELETE /api/accounts/:user     → Deletar usuário
```

### 🎮 Steam Auth
```
GET /auth/steam              → Inicia login
GET /auth/steam/return       → Callback do Steam
```

---

## 🏃 COMO RODAR

### Setup Inicial
```bash
# 1. Instalar dependências
npm install

# 2. Verificar segurança
npm audit fix

# 3. Build frontend (necessário para production)
npm run build
```

### Modo Development
```bash
# Terminal 1: Frontend + Backend juntos
npm run dev:full

# OU separados:

# Terminal 1: Frontend apenas
npm run dev
# Acessa em: http://192.168.1.66:3000

# Terminal 2: Backend apenas
npm start
# Roda em: http://192.168.1.66:8080
```

### Modo Production
```bash
# Já com build feito (dist/)
npm start
# Roda em: http://0.0.0.0:8080
```

---

## 🧪 TESTANDO A AUTENTICAÇÃO

### 1. Testar em Development
```bash
npm run dev:full
# Abre http://192.168.1.66:3000
# Clica em "Login com Steam"
```

### 2. Verificar Sessão
```bash
curl http://192.168.1.66:8080/api/session
# Antes de logar: {"user":null}
# Depois de logar: {"user":{"username":"steam_76561198419559590",...}}
```

### 3. Fazer Logout
```bash
curl -X POST http://192.168.1.66:8080/api/logout
```

### 4. Testar Admin
```bash
curl http://192.168.1.66:8080/api/admin/check
# Se for admin: {"isAdmin":true}
# Se não for: {"isAdmin":false}
```

---

## 🚨 TROUBLESHOOTING

### ❌ Erro: "Steam auth disabled: STEAM_API_KEY not set"
**Solução:** Verificar `.env` e `.env.production`
```bash
cat .env | grep STEAM_API_KEY
```

### ❌ "Port 8080 already in use"
**Solução:** Matar processo ou usar porta diferente
```bash
# Encontrar processo
lsof -i :8080

# Matar
kill -9 <PID>

# Ou mudar porta
PORT=8081 npm start
```

### ❌ "CORS error" no login
**Solução:** Verificar se URLs de origem correspondem
- Navegador: http://192.168.1.66:3000
- FRONTEND_URL no .env: http://192.168.1.66:3000
- STEAM_RETURN_URL: http://192.168.1.66:8080/auth/steam/return

### ❌ Sessão não persiste após refresh
**Solução:** Verificar cookies
```bash
# Cookies devem ter:
# - HttpOnly: true
# - Path: /
# - SameSite: Lax
# - Secure: true (apenas em production HTTPS)
```

---

## 📊 ESTRUTURA DE DADOS (Exemplo)

### accounts.json
```json
[
  {
    "username": "steam_76561198419559590",
    "displayName": "PlayerName",
    "createdAt": "2026-01-04T10:00:00.000Z",
    "steam": {
      "id": "76561198419559590",
      "displayName": "PlayerName",
      "avatar": "https://avatars.steamstatic.com/..."
    },
    "stats": {
      "wins": 5,
      "podiums": 12,
      "points": 150
    }
  }
]
```

### races.json
```json
[
  {
    "id": 1,
    "name": "Sprint Brasil",
    "track": "Interlagos",
    "date": "2026-01-10",
    "time": "18:00",
    "type": "championship",
    "carClass": "GT3",
    "maxParticipants": 20,
    "participants": [
      { "username": "steam_76561198419559590", "registeredAt": "2026-01-04T10:00:00Z" }
    ],
    "championship": "Campeonato Brasil 2026"
  }
]
```

---

## 🎯 PRÓXIMOS PASSOS

- [ ] Testar Steam login em development
- [ ] Fazer build (`npm run build`)
- [ ] Testar production mode
- [ ] Deploy em Discloud
- [ ] Configurar backup automático dos dados JSON
- [ ] Adicionar mais admins (se necessário)

---

**Gerado em:** 4 de Janeiro de 2026

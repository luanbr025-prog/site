# 🚀 QUICK START - Brasil Sim Racing

## Status: ✅ TUDO FUNCIONANDO!

### 1️⃣ Instalar & Build
```bash
npm install
npm run build
```

### 2️⃣ Rodar em Development
```bash
# Opção A: Frontend + Backend juntos
npm run dev:full

# Opção B: Separado
npm run dev          # Terminal 1: Frontend
npm start            # Terminal 2: Backend
```

### 3️⃣ Acessar
- Frontend: http://192.168.1.66:3000
- Backend: http://192.168.1.66:8080
- Login: Clica no botão "Login com Steam"

---

## 📋 Arquivos Importantes

| Arquivo | Função |
|---------|--------|
| `.env` | Variáveis dev (192.168.1.66) |
| `.env.production` | Variáveis prod (Discloud) |
| `server.js` | Backend Express (tudo está aqui) |
| `vite.config.ts` | Build frontend |
| `src/context/AuthContext.tsx` | Autenticação |
| `data/*.json` | Dados (accounts, races, news, etc) |

---

## 🔑 Autenticação Steam

✅ **Configurado!** Não precisa fazer nada.

- Steam API Key: ✅ Presente em `.env`
- Return URL: ✅ Correto (http://192.168.1.66:8080/auth/steam/return)
- Realm: ✅ Correto (http://192.168.1.66:3000)

---

## ⚠️ Coisas a Fazer

1. [ ] `npm audit fix` - Resolver vulnerabilidades (já fiz!)
2. [ ] `npm run build` - Gerar dist/ antes de deploy
3. [ ] Alterar `SESSION_SECRET` em `.env.production`
4. [ ] Fazer backup de `data/` folder

---

## 🐛 Se Algo Não Funcionar

```bash
# Limpar tudo e recomeçar
rm -rf node_modules dist
npm install
npm run build
npm run dev:full
```

---

## 📊 Estrutura Rápida

```
Login → Passport Steam → accounts.json → Session → App
```

- Admin access: Use o Steam ID em `ADMIN_USERS`
- Dados: Salvos em `data/*.json` (JSON, não banco de dados)
- API: Express em `server.js`
- Frontend: React em `src/`

---

✨ **Tudo pronto! Divirta-se! 🎮**

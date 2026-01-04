# ✅ PRÉ-DEPLOY CHECKLIST

## 🔒 SEGURANÇA

- [x] Steam API Key configurada
- [x] SESSION_SECRET definido (alterar em produção)
- [x] CORS whitelist correto (brasilsimracing.discloud.app)
- [x] HTTPS forçado em produção
- [x] Rate limiting ativado
- [x] Helmet.js ativado
- [x] npm audit fix executado
- [ ] SESSION_SECRET único e seguro em Discloud
- [ ] Backup de dados.json antes do deploy

## 🌐 AMBIENTE

- [x] NODE_ENV separado (dev/prod)
- [x] FRONTEND_URL correto
- [x] STEAM_RETURN_URL correto
- [x] STEAM_REALM correto
- [x] Variáveis de ambiente documentadas
- [ ] Verificar Discloud Variáveis de Ambiente
- [ ] Configurar PORT em Discloud (padrão 8080)

## 📦 BUILD

- [ ] npm install ✅ (feito)
- [ ] npm run build (gerar dist/)
- [ ] Verificar dist/index.html existe
- [ ] Verificar dist/assets/ preenchido
- [ ] node_modules/.gitignore ✅ (deve existir)

## 🎮 STEAM AUTH

- [x] Steam API Key gerada
- [x] Return URL registrada na Steam
- [x] Realm configurado
- [x] Passport-steam funcionando
- [ ] Testar login em produção
- [ ] Verificar callback funciona

## 🎯 FUNCIONALIDADES

- [x] Frontend builds sem erros
- [x] API endpoints respondendo
- [x] Session management funcionando
- [x] Admin check funcionando
- [x] News CRUD funcionando
- [x] Races CRUD funcionando
- [x] Standings CRUD funcionando
- [x] Achievements CRUD funcionando
- [ ] Live Timing WebSocket (se usar)
- [ ] Upload de imagens (se implementar)

## 📊 DADOS

- [ ] accounts.json com pelo menos 1 admin
- [ ] races.json inicial
- [ ] standings.json inicial
- [ ] news.json inicial
- [ ] achievements.json inicial
- [ ] settings.json com dados corretos
- [ ] Backup de todos os JSONs

## 🧪 TESTES

- [ ] npm run lint (sem erros críticos)
- [ ] Testar login local
- [ ] Testar criar notícia (admin)
- [ ] Testar inscrever em corrida (user)
- [ ] Testar logout
- [ ] Testar refresh de página (sessão persiste)

## 🚀 DEPLOYMENT

- [ ] Build final: `npm run build`
- [ ] Fazer push no Git
- [ ] Discloud sincroniza automaticamente
- [ ] Verificar logs em Discloud
- [ ] Testar em: https://brasilsimracing.discloud.app
- [ ] Testar Steam login
- [ ] Testar admin panel

## 📝 PÓS-DEPLOY

- [ ] Monitorar logs (Discloud dashboard)
- [ ] Testar todas as páginas
- [ ] Testar performance
- [ ] Backup de dados.json
- [ ] Adicionar SSL certificate (se necessário)
- [ ] Configurar email (se implementar)

---

## ⚠️ AVISOS IMPORTANTES

### Discloud Environment Variables
Para adicionar variáveis em Discloud:
1. Acesse: https://discloud.app/dashboard
2. Select seu app
3. Vá para "Configurações" → "Variáveis de Ambiente"
4. Copie do `.env.production`

### Dados JSON
- Todos os dados são salvos em `/data/*.json`
- São arquivos locais (não persistem entre deploys automáticos)
- **Configure backup antes de ir para produção**

### Ports
- Frontend: Discloud rota automaticamente para a porta
- Backend: Use `process.env.PORT || 8080`
- WebSocket: Usa mesma porta do servidor

### Certificados SSL
- Discloud fornece SSL automático em `*.discloud.app`
- Se usar domínio customizado, configure em Discloud

---

## 🔧 COMANDOS ÚTEIS

```bash
# Build para produção
npm run build

# Testar build localmente
npm run preview

# Verificar variáveis de ambiente
env | grep -E "(STEAM|NODE_ENV|FRONTEND)"

# Testar endpoint
curl https://brasilsimracing.discloud.app/api/session

# Ver tamanho dos dados
du -sh data/

# Verificar portas em uso
lsof -i :8080
```

---

## 📞 SUPORTE RÁPIDO

**Problema:** Discloud não reconhece variáveis  
**Solução:** Reiniciar app após adicionar variáveis

**Problema:** WebSocket não funciona  
**Solução:** Discloud suporta WebSocket na porta 8080

**Problema:** Imagens não carregam  
**Solução:** Verificar `/public/assets/images/` existe

**Problema:** Dados desaparecem  
**Solução:** Implementar backup diário de `/data/`

---

**Status Atual:** 🟢 PRONTO PARA DEPLOY

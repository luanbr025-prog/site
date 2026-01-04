# Discloud Deploy Checklist

## 📋 Pré-requisitos
- [ ] Git repositório atualizado com `dist/` incluído
- [ ] `discloud.config` configurado ✅ (já ajustado)
- [ ] `.env.example` criado para referência ✅

## 🔑 Variáveis de Ambiente Obrigatórias (no Painel Discloud)

Configure **exatamente** estas variáveis no dashboard do Discloud:

| Variável | Valor | Notas |
|----------|-------|-------|
| `NODE_ENV` | `production` | Força usar HTTPS, skip build automático |
| `SESSION_SECRET` | Valor forte aleatório | Use um UUID ou senha forte (>32 chars) |
| `STEAM_API_KEY` | Sua chave Steam | Obtenha em steamcommunity.com/dev/apikey |
| `STEAM_ADMINS` | `76561198419559590` | ID numérica do seu Steam, separadas por vírgula se múltiplos |
| `FRONTEND_URL` | `https://brasilsimracing.discloud.app` | HTTPS obrigatório |
| `STEAM_RETURN_URL` | `https://brasilsimracing.discloud.app/auth/steam/return` | HTTPS obrigatório |
| `STEAM_REALM` | `https://brasilsimracing.discloud.app` | HTTPS obrigatório |
| `TRUST_PROXY` | `1` | Necessário para Discloud ler IP real |

## 📦 O que vai acontecer no Deploy

1. **PRE_INSTALL**: `npm run build` 
   - Constrói o frontend antes do servidor iniciar
   - Cria/atualiza a pasta `dist/`

2. **START**: `node server.js`
   - Servidor não tentará fazer build novamente (porque `NODE_ENV=production` e `ALLOW_SERVER_BUILD` não está setado)
   - Se `dist/` não existir por algum motivo, servidor avisa e tenta fallback build em temp dir
   - Servidor tira da variável `ACTIVE_DIST` (pode ser `dist/` ou temp dir)

3. **Resultado**: Site acessível via HTTPS com Steam login funcional

## ✅ Passos para Deploy

1. **Fazer push** para o repositório:
   ```bash
   git add -A
   git commit -m "chore: prepare discloud deploy config"
   git push origin main
   ```

2. **No Painel Discloud**:
   - Ir para "Variáveis de Ambiente"
   - Adicionar/atualizar cada variável da tabela acima
   - Salvar

3. **Reiniciar a Aplicação**:
   - Clique em "Reiniciar" ou aguarde auto-restart
   - Acompanhe os logs

## 🔍 Verificação Pós-Deploy

- [ ] Acesse https://brasilsimracing.discloud.app
- [ ] Veja a página inicial (site público)
- [ ] Clique em "ENTRAR" → Steam login
- [ ] Após login, aparece "PAINEL" com avatar
- [ ] Acesse /profile — mostra seu perfil com avatar
- [ ] Se Steam ID está em `STEAM_ADMINS`: aba "PAINEL" aparece na página de profile
- [ ] Logs mostram "Return URL: https://brasilsimracing.discloud.app/auth/steam/return"
- [ ] Logs mostram "Session cookie config -> secure: true"

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Login redireciona mas sessão não persiste | Verifique `SESSION_SECRET`, `FRONTEND_URL`, `STEAM_RETURN_URL` em HTTPS |
| Avatar não aparece | CSP deve permitir Steam (já configurado no `server.js`) |
| PAINEL não aparece | Verifique `STEAM_ADMINS` contém seu Steam ID numérico |
| "dist directory not found" | `PRE_INSTALL=npm run build` vai resolver na próxima reinicialização |
| 404 em todas as rotas | Verifique se `dist/` foi construído (ver logs PRE_INSTALL) |

## 📝 Notas Importantes

- **`dist/` está no repositório**: Recomendado fazer commits, facilita o deploy
- **Fallback build**: Se PRE_INSTALL falhar, servidor tenta construir em `/tmp` (pode usar mais recursos)
- **Cookies Secure**: Ativado apenas com `NODE_ENV=production` E `FRONTEND_URL` em HTTPS
- **TRUST_PROXY**: Necessário para Discloud passar o IP real (não confundir com Cloudflare)

## 🎯 Próximos Passos (Opcional)

1. Backup automático de `/data/*.json` (importante para não perder dados)
2. Monitorar logs regularmente
3. Configurar mais admins editando `STEAM_ADMINS` se necessário

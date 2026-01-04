#!/bin/bash

# Diagnóstico rápido para verificar status do deploy Discloud

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Brasil Sim Racing - Diagnóstico de Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Verificando Variáveis de Ambiente..."
echo ""

REQUIRED_VARS=(
  "NODE_ENV"
  "SESSION_SECRET"
  "STEAM_API_KEY"
  "STEAM_ADMINS"
  "FRONTEND_URL"
  "STEAM_RETURN_URL"
  "TRUST_PROXY"
)

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ $var - NÃO CONFIGURADO"
    MISSING=$((MISSING + 1))
  else
    # Mascarar valores sensíveis
    if [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"KEY"* ]]; then
      echo "✅ $var - configurado (mascarado)"
    else
      echo "✅ $var = ${!var}"
    fi
  fi
done

echo ""
if [ $MISSING -eq 0 ]; then
  echo "✅ Todas as variáveis estão configuradas!"
else
  echo "⚠️  $MISSING variável(is) está(ão) faltando."
  echo "   Configure no painel Discloud → Variáveis de Ambiente"
fi

echo ""
echo "📁 Verificando Arquivos..."
echo ""

if [ -d "dist" ] && [ -f "dist/index.html" ]; then
  echo "✅ dist/ existe com index.html"
else
  echo "⚠️  dist/ não encontrado ou index.html está faltando"
  echo "   Servidor tentará fazer build automático na inicialização"
fi

if [ -f "package.json" ]; then
  echo "✅ package.json encontrado"
else
  echo "❌ package.json não encontrado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $MISSING -gt 0 ]; then
  echo "⚠️  AÇÃO NECESSÁRIA:"
  echo "   1. Vá ao Painel Discloud"
  echo "   2. Clique em 'Variáveis de Ambiente'"
  echo "   3. Configure as variáveis faltantes"
  echo "   4. Clique em 'Reiniciar Aplicação'"
else
  echo "✅ Tudo parece estar configurado corretamente!"
  echo "   Se ainda tiver problemas, verifique os logs."
fi

echo ""

# Imagem de produção da Can Games API.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Instala somente as dependências de produção, nas versões do package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Executa sem privilégios de root.
USER node

EXPOSE 4000

# O Docker e o Portainer acompanham a saúde do contêiner pela rota /health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]

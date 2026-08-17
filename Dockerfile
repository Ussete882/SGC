# Imagem única: constrói a aplicação e serve-a a partir do servidor de votação.
# Serve qualquer alojamento que aceite contentores — Railway, Fly.io, Koyeb,
# Google Cloud Run — sem alterar uma linha.

FROM node:20-alpine

WORKDIR /app

# As dependências primeiro, para aproveitar a cache entre construções.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# O servidor respeita a variável PORT que o alojamento definir.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "servidor/index.mjs"]

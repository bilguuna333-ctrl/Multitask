FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN mkdir -p uploads logs

EXPOSE 5000

CMD ["node", "src/server.js"]

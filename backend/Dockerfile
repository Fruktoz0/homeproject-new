FROM node:18-alpine

WORKDIR /app

# Függőségek másolása és telepítése
COPY package*.json ./
RUN npm install --production

# Forráskód másolása
COPY . .

# Alapértelmezett port (a .env alapján 3000)
EXPOSE 3006

CMD ["node", "server.js"]
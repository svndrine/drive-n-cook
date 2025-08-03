FROM node:22

WORKDIR /app

# Copiez les fichiers de dépendances pour un meilleur cache
COPY package*.json ./

# Installez les dépendances
RUN npm install

# Copiez le reste de l'application
COPY . .

# Lancez le build
RUN npm run build

EXPOSE 80
CMD ["npx", "vite"]
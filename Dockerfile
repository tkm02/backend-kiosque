# Utiliser Node 20 comme base
FROM node:20-slim

# Installer Python et les dépendances système pour XGBoost/SHAP
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances Node
COPY package*.json ./

# Installer les dépendances Node
RUN npm install --production

# Copier le reste du code de l'API
COPY . .

# Créer un environnement virtuel Python et installer les dépendances AI
RUN python3 -m venv /app/ai-engine/venv && \
    /app/ai-engine/venv/bin/pip install --no-cache-dir -r /app/ai-engine/requirements.txt

# Exposer le port de l'API
EXPOSE 4000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=4000

# Lancer l'application
CMD ["node", "app.js"]

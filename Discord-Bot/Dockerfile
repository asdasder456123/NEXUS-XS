# ===========================================
# Super ABG Dockerfile
# ===========================================

FROM node:22-bookworm-slim

# System packages
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./

RUN npm install --production

# Copy project files
COPY . .

# Start bot
CMD ["node", "index.js"]

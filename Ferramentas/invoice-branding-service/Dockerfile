FROM node:18-slim

# Install Chromium and dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       chromium \
       fonts-liberation \
       libatk-bridge2.0-0 \
       libatk1.0-0 \
       libcups2 \
       libdrm2 \
       libgbm1 \
       libnss3 \
       libxcomposite1 \
       libxdamage1 \
       libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3010
CMD ["node", "server.js"]

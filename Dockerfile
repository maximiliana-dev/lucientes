FROM node:20-slim

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    --no-install-recommends

RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY ./web-service/package*.json ./
RUN npm install
COPY ./web-service .

EXPOSE 3000

CMD ["npm", "start"]

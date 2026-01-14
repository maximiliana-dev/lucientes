FROM node:22-slim AS builder
WORKDIR /usr/src/app
ENV PUPPETEER_SKIP_CHROME_DOWNLOAD=true
COPY ./web-service/package*.json ./
RUN npm ci --only=production
COPY ./web-service .


FROM node:22-slim
WORKDIR /usr/src/app

RUN apt-get update && apt-get install chromium -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /usr/src/app

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EXPOSE 3000
COPY --from=builder --chown=pptruser:pptruser /usr/src/app .

USER pptruser
CMD ["npm", "start"]
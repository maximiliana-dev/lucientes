FROM node:20-slim AS builder
WORKDIR /usr/src/app
ENV PUPPETEER_SKIP_CHROME_DOWNLOAD=true
COPY ./web-service/package*.json ./
RUN npm ci --only=production
COPY ./web-service .


FROM node:20-slim
WORKDIR /usr/src/app
RUN apt-get update && apt-get install chromium -y --no-install-recommends
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EXPOSE 3000
COPY --from=builder /usr/src/app .
CMD ["npm", "start"]
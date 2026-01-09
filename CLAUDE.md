# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lucientes is a web service that converts HTML files to images (PNG, JPEG, WEBP) and PDFs using Puppeteer/Chromium. Built for Maximiliana to support the "Atentamente, tu nieto" campaign.

## Commands

```bash
# Local development (requires npm install first)
cd web-service && npm install && npm start

# Docker build and run
docker build -t lucientes .
docker run -p 8080:3000 lucientes

# With API key protection
docker run -p 8080:3000 -e API_KEY=secret lucientes

# Test endpoints
curl -X POST http://localhost:8080/html-to-image -F "file=@test.html" --output out.png
curl -X POST http://localhost:8080/html-to-pdf -F "file=@test.html" --output out.pdf
```

## Architecture

Single Express server in `web-service/index.js` with two endpoints:
- `POST /html-to-image` - converts HTML to PNG/JPEG/WEBP via Puppeteer screenshot
- `POST /html-to-pdf` - converts HTML to PDF via Puppeteer page.pdf()

Both endpoints use Multer for file uploads (stored temporarily in `uploads/`), launch a headless Chromium browser, render the HTML, and return the result.

PDF generation applies a DPI correction factor (96/72) to compensate for Puppeteer's internal 72 DPI vs 96 DPI viewport mismatch.

## Environment Variables

- `PORT` - server port (default 3000)
- `API_KEY` - if set, requires `x-api-key` header on all requests

## CI/CD

Docker images are automatically built and pushed to DockerHub (`maximiliana/lucientes`) on pushes to master via `.github/workflows/docker-publish.yml`.

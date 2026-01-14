# 🎨 Lucientes

**Lucientes is a simple web service for converting HTML files into high quality images and PDFs.**

This project allows users to convert HTML content into images (PNG, JPEG, WEBP) or PDF documents, facilitating easier sharing and accessibility of digital information. It is built with Node.js, Express, and Puppeteer to provide a seamless and efficient service.

## 💚 About Maximiliana

Lucientes is developed by the Spanish startup Maximiliana to support the "Atentamente, tu nieto" campaign. Our goal is to bridge the digital gap for elderly people by providing an easy-to-use mobile experience. Maximiliana creates innovative solutions to connect the elderly with their families, ensuring everyone can communicate effortlessly.

## ✨ Features

- Convert HTML to PNG, JPEG, or WEBP images.
- Convert HTML to PDF with pixel-based dimensions.
- Optional transparent background (PNG / WEBP).
- API Key protection (optional) via `API_KEY` env var.
- Simple and intuitive API.
- Built with Node.js, Express, and Puppeteer.

## ⚠️ Security warning

This service renders arbitrary HTML in a headless browser. **This is inherently risky.**
Lucientes includes some security layers to mitigate these risks, but no defense is perfect. **Use with caution and always require API key authentication in production.**

## 🚀 Getting started

### Prerequisites

Make sure you have Docker installed on your system.

### Installation

1. **Pull the Docker image from DockerHub**:

   ```sh
   docker pull maximiliana/lucientes
   ```

2. **Run the Docker container**:
   ```sh
   docker run -p 8080:3000 maximiliana/lucientes
   ```

3. **Run with API Key protection (recommended for production)**:
   ```sh
   docker run -p 8080:3000 \
     -e API_KEY=MY_SECRET_KEY \
     maximiliana/lucientes
   ```

4. **Run with JavaScript enabled**:
   ```sh
   docker run -p 8080:3000 \
     -e API_KEY=MY_SECRET_KEY \
     -e ALLOW_JAVASCRIPT=true \
     maximiliana/lucientes
   ```

If `API_KEY` is set, every request must include it in the HTTP header:
- `x-api-key: MY_SECRET_KEY`

No se aceptan query params ni body fields para la clave.

## 🔐 Authentication (optional)
If no `API_KEY` is provided at startup, the service is public. If provided, unauthenticated requests return `401`.

## 🧪 Usage

To convert an HTML file to an image, you can use tools like `curl` or Postman. Below are examples using `curl`.

Parameters (multipart form fields unless stated otherwise):
- `file` (required): HTML file.
- `width` (optional, number, default 1920)
- `height` (optional, number, default 1080)
- `scaleFactor` (optional, number, default 3)  // (was `deviceScaleFactor` in earlier docs)
- `format` (optional: png | jpeg | webp, default png)
- `transparent` (optional: true/false) Only for png/webp. Ignored for jpeg.

1. **Convert HTML to PNG (transparent background)**:

   ```sh
   curl -X POST http://localhost:8080/html-to-image \
     -H "x-api-key: MY_SECRET_KEY" \
     -F "file=@path/to/your/test.html" \
     -F "width=1920" \
     -F "height=1080" \
     -F "scaleFactor=2" \
     -F "format=png" \
     -F "transparent=true" \
     --output output.png
   ```

2. **Convert HTML to JPEG (no transparency)**:

   ```sh
   curl -X POST http://localhost:8080/html-to-image \
     -H "x-api-key: MY_SECRET_KEY" \
     -F "file=@path/to/your/test.html" \
     -F "width=1920" \
     -F "height=1080" \
     -F "scaleFactor=2" \
     -F "format=jpeg" \
     --output output.jpeg
   ```

3. **Convert HTML to WEBP (transparent)**:

   ```sh
   curl -X POST http://localhost:8080/html-to-image \
     -H "x-api-key: MY_SECRET_KEY" \
     -F "file=@path/to/your/test.html" \
     -F "width=1920" \
     -F "height=1080" \
     -F "scaleFactor=2" \
     -F "format=webp" \
     -F "transparent=1" \
     --output output.webp
   ```

### HTML to PDF

Parameters (multipart form fields):
- `file` (required): HTML file.
- `width` (optional, number, default 1920): viewport width in pixels
- `height` (optional, number, default 1080): viewport height in pixels
- `landscape` (optional: true/false, default false)
- `printBackground` (optional: true/false, default true)

**Note:** `scaleFactor` is not applicable for PDF output (PDFs are vector-based).

4. **Convert HTML to PDF**:

   ```sh
   curl -X POST http://localhost:8080/html-to-pdf \
     -H "x-api-key: MY_SECRET_KEY" \
     -F "file=@path/to/your/test.html" \
     -F "width=1920" \
     -F "height=1080" \
     --output output.pdf
   ```

5. **Convert HTML to PDF (landscape, no background)**:

   ```sh
   curl -X POST http://localhost:8080/html-to-pdf \
     -H "x-api-key: MY_SECRET_KEY" \
     -F "file=@path/to/your/test.html" \
     -F "width=1920" \
     -F "height=1080" \
     -F "landscape=true" \
     -F "printBackground=false" \
     --output output.pdf
   ```

> **Technical note:** Puppeteer internally uses 72 DPI for PDF generation while viewports use 96 DPI.
> Lucientes automatically compensates for this difference so that the pixel dimensions you specify
> produce consistent results with the image endpoint. See [puppeteer#3357](https://github.com/puppeteer/puppeteer/issues/3357) for details.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `API_KEY` | (none) | If set, requires `x-api-key` header on all requests |
| `ALLOW_JAVASCRIPT` | `false` | Set to `true` to enable JavaScript execution in HTML |
| `ALLOW_EXTERNAL_REQUESTS` | `false` | Set to `true` to allow network requests from rendered pages |
| `MAX_DIMENSION` | `4096` | Maximum width/height in pixels |
| `PAGE_TIMEOUT_MS` | `30000` | Page rendering timeout in milliseconds |

### Security measures

Lucientes implements several layers of security:

| Protection | Description |
|------------|-------------|
| **Non-root user** | The container runs as an unprivileged user (`pptruser`). |
| **JavaScript disabled** | JS execution is off by default. Enable only if needed with `ALLOW_JAVASCRIPT=true`. |
| **Network requests blocked** | External requests (fetch, images, iframes) are blocked by default. Enable with `ALLOW_EXTERNAL_REQUESTS=true`. |
| **Dimension limits** | Prevents memory exhaustion from extremely large images. |
| **Timeouts** | Prevents infinite loops and resource exhaustion. |
| **Timing-safe API key comparison** | Prevents timing attacks on API key validation. |

> **Note:** Chrome sandbox is disabled (`--no-sandbox`) for compatibility with containerized environments like Cloud Run. The other security measures compensate for this.

## 🖼️ Trivia

The project is named "Lucientes" after the famous Spanish painter Francisco de Goya y Lucientes, known for his profound impact on the art world with his powerful and innovative works.

## 🤝 Contribution

We welcome contributions! Please feel free to submit issues and pull requests to help improve the project.

## 📜 License

This project is licensed under the GPL 2.1 License - see the [LICENSE](LICENSE) file for details.

---

Developed with ❤️ in Zaragoza for the grandpas of the world.

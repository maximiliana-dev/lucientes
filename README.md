# 🎨 Lucientes

**Lucientes is a simple web service for converting HTML files into high quality images.**

This project allows users to convert HTML content into images in formats like PNG, JPEG, or WEBP, facilitating easier sharing and accessibility of digital information. It is built with Node.js, Express, and Puppeteer to provide a seamless and efficient service.

## 💚 About Maximiliana

Lucientes is developed by the Spanish startup Maximiliana to support the "Atentamente, tu nieto" campaign. Our goal is to bridge the digital gap for elderly people by providing an easy-to-use mobile experience. Maximiliana creates innovative solutions to connect the elderly with their families, ensuring everyone can communicate effortlessly.

## ✨ Features

- Convert HTML to PNG, JPEG, or WEBP images.
- Optional transparent background (PNG / WEBP).
- API Key protection (optional) via `API_KEY` env var.
- Simple and intuitive API.
- Built with Node.js, Express, and Puppeteer.

## 🚀 Getting Started

### Prerequisites

Make sure you have Docker installed on your system.

### Installation

1. **Pull the Docker image from DockerHub**:

   ```sh
   docker pull maximiliana/lucientes
   ```

2. **Run the Docker container**:
   ```sh
   docker run -p 8080:3000 --env PORT=3000 maximiliana/lucientes
   ```

3. **Run with API Key protection**:
   ```sh
   docker run -p 8080:3000 \
     -e PORT=3000 \
     -e API_KEY=MY_SECRET_KEY \
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

### Environment Variables

- `PORT`: The port on which the server will run (default 3000).
- `API_KEY`: If set, enables authentication; each request must include `x-api-key` header.

## 🖼️ Trivia

The project is named "Lucientes" after the famous Spanish painter Francisco de Goya y Lucientes, known for his profound impact on the art world with his powerful and innovative works.

## 🤝 Contribution

We welcome contributions! Please feel free to submit issues and pull requests to help improve the project.

## 📜 License

This project is licensed under the GPL 2.1 License - see the [LICENSE](LICENSE) file for details.

---

Developed with ❤️ in Zaragoza for the grandpas of the world.

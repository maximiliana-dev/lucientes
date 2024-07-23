# 📸 Lucientes

**Lucientes is a simple web service for converting HTML files into high quality images.**

This project allows users to convert HTML content into images in formats like PNG, JPEG, or WEBP, facilitating easier sharing and accessibility of digital information. It is built with Node.js, Express, and Puppeteer to provide a seamless and efficient service.

## 🌟 About Maximiliana

Lucientes is developed by the Spanish startup Maximiliana to support the "Atentamente, tu nieto" campaign. Our goal is to bridge the digital gap for elderly people by providing an easy-to-use mobile experience. Maximiliana creates innovative solutions to connect the elderly with their families, ensuring everyone can communicate effortlessly.

## ✨ Features

- Convert HTML to PNG, JPEG, or WEBP images.
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

### Usage

To convert an HTML file to an image, you can use tools like `curl` or Postman. Below are examples using `curl`.

1. **Convert HTML to PNG**:

   ```sh
   curl -X POST http://localhost:8080/html-to-image \
     -F "file=@path/to/your/test.html" \
     -F "width=1920" \
     -F "height=1080" \
     -F "deviceScaleFactor=2" \
     -F "format=png" \
     --output output.png
   ```

2. **Convert HTML to JPEG**:

   ```sh
   curl -X POST http://localhost:8080/html-to-image \
     -F "file=@path/to/your/test.html" \
     -F "width=1920" \
     -F "height=1080" \
     -F "deviceScaleFactor=2" \
     -F "format=jpeg" \
     --output output.jpeg
   ```

3. **Convert HTML to WEBP**:
   ```sh
   curl -X POST http://localhost:8080/html-to-image \
     -F "file=@path/to/your/test.html" \
     -F "width=1920" \
     -F "height=1080" \
     -F "deviceScaleFactor=2" \
     -F "format=webp" \
     --output output.webp
   ```

### Environment Variables

- `PORT`: The port on which the server will run (default is 3000).

## 🖼️ Trivia

The project is named "Lucientes" after the famous Spanish painter Francisco de Goya y Lucientes, known for his profound impact on the art world with his powerful and innovative works.

## 🤝 Contribution

We welcome contributions! Please feel free to submit issues and pull requests to help improve the project.

## 📜 License

This project is licensed under the GPL 2.1 License - see the [LICENSE](LICENSE) file for details.

---

Developed with ❤️ in Zaragoza for the grandpas of the world.

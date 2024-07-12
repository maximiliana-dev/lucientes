import express from "express";
import puppeteer from "puppeteer";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const validFormats = ["png", "jpeg", "webp"];

const validateRequest = (req) => {
  const { width, height, scaleFactor, format } = req.body;
  const imageFormat = format || "png";

  if (!req.file) {
    return { isValid: false, message: "File is required" };
  }
  if (width && (isNaN(width) || parseInt(width, 10) <= 0)) {
    return { isValid: false, message: "Width must be a positive number" };
  }
  if (height && (isNaN(height) || parseInt(height, 10) <= 0)) {
    return { isValid: false, message: "Height must be a positive number" };
  }
  if (scaleFactor && (isNaN(scaleFactor) || parseFloat(scaleFactor) <= 0)) {
    return {
      isValid: false,
      message: "scaleFactor must be a positive number",
    };
  }
  if (!validFormats.includes(imageFormat)) {
    return {
      isValid: false,
      message: `Format must be one of the following: ${validFormats.join(
        ", "
      )}`,
    };
  }
  return { isValid: true };
};

app.post("/html-to-image", upload.single("file"), async (req, res) => {
  const validation = validateRequest(req);
  if (!validation.isValid) {
    return res.status(400).send(validation.message);
  }

  const { width, height, scaleFactor, format } = req.body;
  const imageFormat = format || "png";
  const htmlFilePath = path.join(__dirname, req.file.path);

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const viewportWidth = width ? parseInt(width, 10) : 1920;
    const viewportHeight = height ? parseInt(height, 10) : 1080;
    const viewportscaleFactor = scaleFactor ? parseFloat(scaleFactor) : 3;

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
      scaleFactor: viewportscaleFactor,
    });

    const htmlContent = fs.readFileSync(htmlFilePath, "utf8");
    await page.setContent(htmlContent);

    const screenshot = await page.screenshot({
      type: imageFormat,
      fullPage: true,
      encoding: "binary",
    });

    await browser.close();
    fs.unlinkSync(htmlFilePath);

    console.log(
      `Image generated successfully with parameters: width=${viewportWidth}, height=${viewportHeight}, scaleFactor=${viewportscaleFactor}, format=${imageFormat}`
    );

    res.set("Content-Type", `image/${imageFormat}`);
    res.send(screenshot);
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running at http://0.0.0.0:${PORT}`);
});

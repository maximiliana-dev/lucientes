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
const API_KEY = process.env.API_KEY;

const log = (severity, message, data = {}) => {
  const entry = {
    severity,
    message,
    ...data,
  };
  if (severity === "ERROR" || severity === "CRITICAL") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
};

const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (!API_KEY) return next();
  const provided = req.header("x-api-key");
  if (provided !== API_KEY) {
    log("WARNING", "Unauthorized request (invalid or missing API Key)", {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.status(401).json({
      error: "Invalid or missing API Key (use x-api-key header)",
    });
  }
  next();
});

const validFormats = ["png", "jpeg", "webp"];

// https://github.com/puppeteer/puppeteer/issues/3357
const PDF_DPI_CORRECTION_FACTOR = 96 / 72;

const parseBoolean = (value) => {
  if (value === undefined) return false;
  if (typeof value === "boolean") return value;
  const v = String(value).toLowerCase();
  return ["1", "true", "yes", "on"].includes(v);
};

const validateRequest = (req) => {
  const { width, height, scaleFactor, format, transparent } = req.body;
  const imageFormat = format || "png";
  const transparentRequested = parseBoolean(transparent);

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
  if (transparentRequested && imageFormat === "jpeg") {
    return {
      isValid: false,
      message:
        "Transparent background is only supported for png or webp formats",
    };
  }
  return { isValid: true, transparentRequested };
};

const validatePdfRequest = (req) => {
  const { width, height } = req.body;

  if (!req.file) {
    return { isValid: false, message: "File is required" };
  }
  if (width && (isNaN(width) || parseInt(width, 10) <= 0)) {
    return { isValid: false, message: "Width must be a positive number" };
  }
  if (height && (isNaN(height) || parseInt(height, 10) <= 0)) {
    return { isValid: false, message: "Height must be a positive number" };
  }
  return { isValid: true };
};

app.post("/html-to-image", upload.single("file"), async (req, res) => {
  const validation = validateRequest(req);
  if (!validation.isValid) {
    log("WARNING", "Invalid request parameters", {
      path: req.path,
      method: req.method,
      ip: req.ip,
      error: validation.message,
    });
    return res.status(400).send(validation.message);
  }

  const { width, height, scaleFactor, format } = req.body;
  const imageFormat = format || "png";
  const htmlFilePath = path.join(__dirname, req.file.path);
  const transparentRequested = validation.transparentRequested;

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
      ...(transparentRequested ? { omitBackground: true } : {}),
    });

    await browser.close();
    fs.unlinkSync(htmlFilePath);

    log("INFO", "Image generated successfully", {
      width: viewportWidth,
      height: viewportHeight,
      scaleFactor: viewportscaleFactor,
      format: imageFormat,
      transparent: transparentRequested,
      ip: req.ip,
    });

    res.set("Content-Type", `image/${imageFormat}`);
    res.send(screenshot);
  } catch (error) {
    log("ERROR", "Error processing request", {
      error: error.message,
      stack: error.stack,
      path: req.path,
      ip: req.ip,
    });
    res.status(500).send("Internal Server Error");
  }
});

app.post("/html-to-pdf", upload.single("file"), async (req, res) => {
  const validation = validatePdfRequest(req);
  if (!validation.isValid) {
    log("WARNING", "Invalid request parameters", {
      path: req.path,
      method: req.method,
      ip: req.ip,
      error: validation.message,
    });
    return res.status(400).send(validation.message);
  }

  const { width, height, landscape, printBackground } = req.body;
  const htmlFilePath = path.join(__dirname, req.file.path);

  const viewportWidth = width ? parseInt(width, 10) : 1920;
  const viewportHeight = height ? parseInt(height, 10) : 1080;
  const landscapeMode = parseBoolean(landscape);
  const printBg = printBackground === undefined ? true : parseBoolean(printBackground);

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
    });

    const htmlContent = fs.readFileSync(htmlFilePath, "utf8");
    await page.setContent(htmlContent);

    const pdfWidth = Math.round(viewportWidth * PDF_DPI_CORRECTION_FACTOR);
    const pdfHeight = Math.round(viewportHeight * PDF_DPI_CORRECTION_FACTOR);

    const pdf = await page.pdf({
      width: `${pdfWidth}px`,
      height: `${pdfHeight}px`,
      landscape: landscapeMode,
      printBackground: printBg,
    });

    await browser.close();
    fs.unlinkSync(htmlFilePath);

    log("INFO", "PDF generated successfully", {
      width: viewportWidth,
      height: viewportHeight,
      landscape: landscapeMode,
      printBackground: printBg,
      ip: req.ip,
    });

    res.set("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (error) {
    log("ERROR", "Error processing PDF request", {
      error: error.message,
      stack: error.stack,
      path: req.path,
      ip: req.ip,
    });
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  log("INFO", "Server started", {
    url: `http://0.0.0.0:${PORT}`,
    apiKeyProtection: Boolean(API_KEY),
  });
  if (API_KEY) {
    log("NOTICE", "API Key protection enabled (header only)");
  }
});

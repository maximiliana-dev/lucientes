import express from "express";
import puppeteer from "puppeteer";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const ALLOW_JAVASCRIPT = process.env.ALLOW_JAVASCRIPT === "true";
const ALLOW_EXTERNAL_REQUESTS = process.env.ALLOW_EXTERNAL_REQUESTS === "true";
const MAX_DIMENSION = parseInt(process.env.MAX_DIMENSION, 10) || 4096;
const PAGE_TIMEOUT_MS = parseInt(process.env.PAGE_TIMEOUT_MS, 10) || 30000;

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

const secureCompare = (a, b) => {
  if (!a || !b) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
};

const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (!API_KEY) return next();
  const provided = req.header("x-api-key");
  if (!secureCompare(provided, API_KEY)) {
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

const BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--disable-gpu",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-sync",
  "--disable-translate",
  "--hide-scrollbars",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-first-run",
  "--safebrowsing-disable-auto-update",
];

const setupPageSecurity = async (page) => {
  page.setDefaultTimeout(PAGE_TIMEOUT_MS);

  if (!ALLOW_JAVASCRIPT) {
    await page.setJavaScriptEnabled(false);
  }

  if (!ALLOW_EXTERNAL_REQUESTS) {
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      if (url.startsWith("data:") || url === "about:blank") {
        request.continue();
      } else {
        log("WARNING", "Blocked external request", { url });
        request.abort("blockedbyclient");
      }
    });
  }
};

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
  if (width && parseInt(width, 10) > MAX_DIMENSION) {
    return { isValid: false, message: `Width exceeds maximum of ${MAX_DIMENSION}px` };
  }
  if (height && parseInt(height, 10) > MAX_DIMENSION) {
    return { isValid: false, message: `Height exceeds maximum of ${MAX_DIMENSION}px` };
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
  if (width && parseInt(width, 10) > MAX_DIMENSION) {
    return { isValid: false, message: `Width exceeds maximum of ${MAX_DIMENSION}px` };
  }
  if (height && parseInt(height, 10) > MAX_DIMENSION) {
    return { isValid: false, message: `Height exceeds maximum of ${MAX_DIMENSION}px` };
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
    const browser = await puppeteer.launch({ args: BROWSER_ARGS });
    const page = await browser.newPage();
    await setupPageSecurity(page);

    const viewportWidth = width ? parseInt(width, 10) : 1920;
    const viewportHeight = height ? parseInt(height, 10) : 1080;
    const viewportscaleFactor = scaleFactor ? parseFloat(scaleFactor) : 3;

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
      scaleFactor: viewportscaleFactor,
    });

    const htmlContent = fs.readFileSync(htmlFilePath, "utf8");
    await page.setContent(htmlContent, {
      waitUntil: ALLOW_JAVASCRIPT ? "load" : "domcontentloaded"
    });

    const screenshot = await page.screenshot({
      type: imageFormat,
      fullPage: true,
      encoding: "binary",
      ...(transparentRequested ? { omitBackground: true } : {}),
    });

    await browser.close();

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
  } finally {
    fs.unlink(htmlFilePath, () => {});
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
    const browser = await puppeteer.launch({ args: BROWSER_ARGS });
    const page = await browser.newPage();
    await setupPageSecurity(page);

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
    });

    const htmlContent = fs.readFileSync(htmlFilePath, "utf8");
    await page.setContent(htmlContent, {
      waitUntil: ALLOW_JAVASCRIPT ? "load" : "domcontentloaded"
    });

    const pdfWidth = Math.round(viewportWidth * PDF_DPI_CORRECTION_FACTOR);
    const pdfHeight = Math.round(viewportHeight * PDF_DPI_CORRECTION_FACTOR);

    const pdf = await page.pdf({
      width: `${pdfWidth}px`,
      height: `${pdfHeight}px`,
      landscape: landscapeMode,
      printBackground: printBg,
    });

    await browser.close();

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
  } finally {
    fs.unlink(htmlFilePath, () => {});
  }
});

app.listen(PORT, "0.0.0.0", () => {
  log("INFO", "Server started", {
    url: `http://0.0.0.0:${PORT}`,
    apiKeyProtection: Boolean(API_KEY),
    javascriptEnabled: ALLOW_JAVASCRIPT,
    externalRequestsEnabled: ALLOW_EXTERNAL_REQUESTS,
    maxDimension: MAX_DIMENSION,
    pageTimeoutMs: PAGE_TIMEOUT_MS,
  });
  if (!ALLOW_JAVASCRIPT) {
    log("NOTICE", "JavaScript execution is DISABLED (set ALLOW_JAVASCRIPT=true to enable)");
  }
  if (!ALLOW_EXTERNAL_REQUESTS) {
    log("NOTICE", "External requests are BLOCKED (set ALLOW_EXTERNAL_REQUESTS=true to enable)");
  }
});

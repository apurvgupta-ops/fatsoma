import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";
import { authenticate } from "../middleware/auth";

const UPLOADS_DIR = path.resolve(process.cwd(), "../../uploads");

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString("hex")}`;
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();

uploadRouter.post("/", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ ok: false, message: "No file provided" });
    return;
  }

  const url = `/uploads/${req.file.filename}`;
  res.json({ ok: true, message: "File uploaded", data: { url, filename: req.file.filename } });
});

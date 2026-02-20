"use server";

import { writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return {
        ok: false,
        error: "No file provided",
      };
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        ok: false,
        error: "Only image files are allowed",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        ok: false,
        error: "File size must be less than 5MB",
      };
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with timestamp and random string
    const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString("hex")}`;
    const fileExtension = path.extname(file.name);
    const filename = `${path.basename(
      file.name,
      fileExtension
    )}-${uniqueSuffix}${fileExtension}`;

    // Save to uploads directory
    const uploadsDir = path.join(process.cwd(), "uploads");
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);
    revalidatePath("/events");
    // Return the URL path (proxy through API route)
    const url = `/api/uploads/${filename}`;

    return {
      ok: true,
      url,
      filename,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

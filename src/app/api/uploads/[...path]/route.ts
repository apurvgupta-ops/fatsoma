import { NextRequest, NextResponse } from "next/server";
import { createReadStream, statSync } from "fs";
import { join } from "path";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const filePath = join(process.cwd(), "public", "uploads", ...params.path);

  try {
    const stat = statSync(filePath);
    if (!stat.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const stream = createReadStream(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase();
    const mimeType =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "png"
        ? "image/png"
        : ext === "gif"
        ? "image/gif"
        : ext === "webp"
        ? "image/webp"
        : "application/octet-stream";

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    return new NextResponse("Not Found", { status: 404 });
  }
}

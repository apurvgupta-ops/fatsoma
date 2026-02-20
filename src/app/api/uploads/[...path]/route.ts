import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathSegments } = await params;
    const filePath = path.join(process.cwd(), 'uploads', ...pathSegments);
    const data = await fs.readFile(filePath);
    return new NextResponse(data, { 
      headers: { 'Cache-Control': 'public, max-age=31536000' } 
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
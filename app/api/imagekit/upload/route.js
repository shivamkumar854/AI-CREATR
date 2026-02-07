import { NextResponse } from "next/server";
import ImageKit from "@imagekit/nodejs";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Initialize ImageKit (server-side only)
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

export async function POST(request) {
  try {
    // 🔐 Clerk authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file");
    const fileName = formData.get("fileName");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file → Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate safe unique filename
    const safeName =
      fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") || "upload";
    const uniqueFileName = `${userId}/${Date.now()}_${safeName}`;

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: uniqueFileName,
      folder: "/blog_images",
    });

    // ✅ Consistent response format
    return NextResponse.json({
      success: true,
      data: {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
        width: uploadResponse.width,
        height: uploadResponse.height,
        size: uploadResponse.size,
        name: uploadResponse.name,
      },
    });
  } catch (error) {
    console.error("ImageKit upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image",
      },
      { status: 500 }
    );
  }
}

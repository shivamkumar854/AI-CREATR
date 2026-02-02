import { NextResponse } from "next/server";
import ImageKit from "@imagekit/nodejs";
import { auth } from "@clerk/nextjs/server";

// IMPORTANT: ensure Node runtime (for Buffer)
export const runtime = "nodejs";

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

export async function POST(request) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Read form data
    const formData = await request.formData();
    const file = formData.get("file");
    const fileName = formData.get("fileName");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file → buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const timestamp = Date.now();
    const safeName =
      fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") || "upload";

    const uniqueFileName = `${userId}/${timestamp}_${safeName}`;

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: uniqueFileName,
      folder: "/blog_images",
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      width: uploadResponse.width,
      height: uploadResponse.height,
      size: uploadResponse.size,
      name: uploadResponse.name,
    });
  } catch (error) {
    console.error("ImageKit upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

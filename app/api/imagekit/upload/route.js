import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export const runtime = "nodejs";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

export async function POST(request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const fileName = formData.get("fileName");
    const userId = formData.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName =
      fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") || "upload";

    const uniqueFileName = `${userId}/${Date.now()}_${safeName}`;

    // ✅ THIS NOW WORKS
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: uniqueFileName,
      folder: "/blog_images",
    });

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
        error: error.message || "Failed to upload image",
      },
      { status: 500 }
    );
  }
}

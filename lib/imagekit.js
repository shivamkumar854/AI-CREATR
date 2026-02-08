// ---------------------------------------------
// Helper to build ImageKit transformation URLs
// ---------------------------------------------
export const buildTransformationUrl = (src, transformations = []) => {
  if (!transformations.length) return src;

  const transformParams = transformations
    .map((transform) => {
      const params = [];

      // Resize & crop
      if (transform.width) params.push(`w-${transform.width}`);
      if (transform.height) params.push(`h-${transform.height}`);
      if (transform.focus) params.push(`fo-${transform.focus}`);
      if (transform.cropMode) params.push(`cm-${transform.cropMode}`);

      // Effects
      if (transform.effect) params.push(`e-${transform.effect}`);

      // Background
      if (transform.background) params.push(`bg-${transform.background}`);

      // Text overlay
      if (transform.overlayText) {
        const gravityMap = {
          center: "center",
          north_west: "top_left",
          north_east: "top_right",
          south_west: "bottom_left",
          south_east: "bottom_right",
          north: "top",
          south: "bottom",
          west: "left",
          east: "right",
        };

        const layer = [
          "l-text",
          `i-${encodeURIComponent(transform.overlayText)}`,
          "tg-bold",
        ];

        if (transform.overlayTextFontSize)
          layer.push(`fs-${transform.overlayTextFontSize}`);

        if (transform.overlayTextColor)
          layer.push(`co-${transform.overlayTextColor}`);

        if (transform.gravity) {
          layer.push(
            `lfo-${gravityMap[transform.gravity] || transform.gravity}`
          );
        }

        if (transform.overlayTextPadding)
          layer.push(`pa-${transform.overlayTextPadding}`);

        layer.push("l-end");

        return layer.join(",");
      }

      return params.join(",");
    })
    .filter(Boolean)
    .join(":");

  // Insert transformations into ImageKit URL
  if (src.includes("/tr:")) {
    return src.replace("/tr:", `/tr:${transformParams}:`);
  }

  const parts = src.split("/");
  parts.splice(parts.length - 1, 0, `tr:${transformParams}`);
  return parts.join("/");
};

// ---------------------------------------------
// Upload file to ImageKit (SAFE VERSION)
// ---------------------------------------------
export const uploadToImageKit = async (file, fileName,userId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", fileName);
  formData.append("userId", userId);

  try {
    const response = await fetch("/api/imagekit/upload", {
      method: "POST",
      body: formData,
    });

    // 🔒 CRITICAL: never assume JSON
    if (!response.ok) {
      const text = await response.text();
      console.error("ImageKit API error (HTML or text):", text);

      return {
        success: false,
        error: "Image upload failed",
      };
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Upload failed",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("ImageKit upload exception:", error);

    return {
      success: false,
      error: "Unexpected upload error",
    };
  }
};

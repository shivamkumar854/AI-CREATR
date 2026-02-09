"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateBlogContent(title, category = "", tags = []) {
  try {
    if (!title || title.trim().length === 0) {
      throw new Error("Title is required to generate content");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create a detailed prompt for blog content generation
    const prompt = `
Write a comprehensive blog post with the title: "${title}"

${category ? `Category: ${category}` : ""}
${tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}

Requirements:
- Write engaging, informative content that matches the title
- Use proper HTML formatting with headers (h2, h3), paragraphs, lists, and emphasis
- Include 3-5 main sections with clear subheadings
- Write in a conversational yet professional tone
- Make it approximately 800-1200 words
- Include practical insights, examples, or actionable advice where relevant
- Use <h2> for main sections and <h3> for subsections
- Use <p> tags for paragraphs
- Use <ul> and <li> for bullet points when appropriate
- Use <strong> and <em> for emphasis
- Ensure the content is original and valuable to readers

Do not include the title in the content as it will be added separately.
Start directly with the introduction paragraph.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    // Basic validation
    if (!content || content.trim().length < 100) {
      throw new Error("Generated content is too short or empty");
    }

    return {
      success: true,
      content: content.trim(),
    };
  } catch (error) {
    console.error("Gemini AI Error:", error);

    // Handle specific error types
    if (error.message?.includes("API key")) {
      return {
        success: false,
        error: "AI service configuration error. Please try again later.",
      };
    }

    if (error.message?.includes("quota") || error.message?.includes("limit")) {
      return {
        success: false,
        error: "AI service is temporarily unavailable. Please try again later.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to generate content. Please try again.",
    };
  }
}

export async function improveContent(
  title,
  _content,
  improvementType = "enhance"
) {
  try {
    if (!title || title.trim().length === 0) {
      throw new Error("Title is required for improvement");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let task = "";

    switch (improvementType) {
      case "expand":
        task = "Write a more detailed and in-depth blog post.";
        break;
      case "simplify":
        task = "Write a clear, concise, easy-to-read blog post.";
        break;
      default:
        task = "Write a high-quality, engaging, well-structured blog post.";
    }

    const prompt = `
You are a professional blog writer.

Blog title:
"${title}"

Task:
${task}

Strict rules:
- Generate blog content based ONLY on the title
- Return HTML only
- Do NOT explain anything
- Do NOT include markdown, code blocks, or backticks
- Do NOT include the title
- Start directly with the introduction paragraph
- Use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>

If you include anything other than HTML, the response is invalid.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return {
      success: true,
      content: response.text().trim(),
    };
  } catch (error) {
    console.error("Content improvement error:", error);
    return {
      success: false,
      error: error.message || "Failed to improve content. Please try again.",
    };
  }
}
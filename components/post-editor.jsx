"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";

import PostEditorHeader from "./post-editor-header";
import PostEditorContent from "./post-editor-content";
import PostEditorSettings from "./post-editor-settings";
import ImageUploadModal from "./image-upload-modal";

const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10),
  featuredImage: z.string().optional(),
  scheduledFor: z.string().optional(),
});

export default function PostEditor({ initialData = null, mode = "create" }) {
  const router = useRouter();

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalType, setImageModalType] = useState("featured");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quillRef, setQuillRef] = useState(null);

  const { mutate: createPost, isLoading: isCreateLoading } =
    useConvexMutation(api.posts.create);

  const { mutate: updatePost, isLoading: isUpdating } =
    useConvexMutation(api.posts.update);

  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      category: initialData?.category || "",
      tags: initialData?.tags || [],
      featuredImage: initialData?.featuredImage || "",
      scheduledFor: initialData?.scheduledFor
        ? new Date(initialData.scheduledFor).toISOString().slice(0, 16)
        : "",
    },
  });

  const { handleSubmit, watch, setValue } = form;
  const watchedValues = watch();

  // --------------------
  // Submit handler
  // --------------------
  const onSubmit = useCallback(
    async (data, action, silent = false) => {
      try {
        const postData = {
          title: data.title,
          content: data.content,
          category: data.category || undefined,
          tags: data.tags,
          featuredImage: data.featuredImage || undefined,
          status:
            action === "publish"
              ? "published"
              : action === "schedule"
              ? "scheduled"
              : "draft",
          scheduledFor: data.scheduledFor
            ? new Date(data.scheduledFor).getTime()
            : undefined,
        };

        let resultId;

        if (initialData?._id) {
          resultId = await updatePost({
            id: initialData._id,
            ...postData,
          });
        } else {
          resultId = await createPost(postData);
        }

        if (!silent) {
          toast.success(
            action === "publish"
              ? "Post published!"
              : action === "schedule"
              ? "Post scheduled!"
              : "Draft saved!"
          );

          if (action === "publish") router.push("/dashboard/posts");
        }

        return resultId;
      } catch (err) {
        if (!silent) toast.error(err.message || "Failed to save post");
        throw err;
      }
    },
    [createPost, updatePost, initialData, router]
  );

  // --------------------
  // Handlers
  // --------------------
  const handleSave = useCallback(
    (silent = false) => {
      handleSubmit((data) => onSubmit(data, "draft", silent))();
    },
    [handleSubmit, onSubmit]
  );

  const handlePublish = useCallback(() => {
    handleSubmit((data) => onSubmit(data, "publish"))();
  }, [handleSubmit, onSubmit]);

  const handleSchedule = useCallback(() => {
    if (!watchedValues.scheduledFor) {
      toast.error("Please select a date and time");
      return;
    }
    handleSubmit((data) => onSubmit(data, "schedule"))();
  }, [handleSubmit, onSubmit, watchedValues.scheduledFor]);

  // --------------------
  // Auto-save
  // --------------------
  useEffect(() => {
    if (!watchedValues.title && !watchedValues.content) return;

    const interval = setInterval(() => {
      if (mode === "create") handleSave(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [watchedValues.title, watchedValues.content, handleSave, mode]);

  // --------------------
  // Image handling
  // --------------------
  const handleImageSelect = (imageData) => {
    if (imageModalType === "featured") {
      setValue("featuredImage", imageData.url);
      toast.success("Featured image added!");
    } else if (imageModalType === "content" && quillRef?.getEditor) {
      const quill = quillRef.getEditor();
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();

      quill.insertEmbed(index, "image", imageData.url);
      quill.setSelection(index + 1);
      toast.success("Image inserted!");
    }
    setIsImageModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <PostEditorHeader
        mode={mode}
        initialData={initialData}
        isPublishing={isCreateLoading || isUpdating}
        onSave={handleSave}
        onPublish={handlePublish}
        onSchedule={handleSchedule}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onBack={() => router.push("/dashboard")}
      />

      <PostEditorContent
        form={form}
        setQuillRef={setQuillRef}
        onImageUpload={(type) => {
          setImageModalType(type);
          setIsImageModalOpen(true);
        }}
      />

      <PostEditorSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        form={form}
        mode={mode}
      />

      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageSelect={handleImageSelect}
        title={
          imageModalType === "featured"
            ? "Upload Featured Image"
            : "Insert Image"
        }
      />
    </div>
  );
}

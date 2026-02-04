"use client";

import React, { useEffect, useState } from "react";
import PublicHeader from "../_components/public-header";
import { useUser } from "@clerk/nextjs";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BarLoader } from "react-spinners";

export default function PostPage({ params }) {
  // ✅ FIXED: DO NOT USE React.use()
  const { username, postId } = params;

  const { user: currentUser } = useUser();
  const [commentContent, setCommentContent] = useState("");

  const { data: currentConvexUser } = useConvexQuery(
    api.users.getCurrentUser,
    currentUser ? {} : "skip"
  );

  const {
    data: post,
    isLoading: postLoading,
    error: postError,
  } = useConvexQuery(api.public.getPublishedPost, { username, postId });

  const { data: comments, isLoading: commentsLoading } = useConvexQuery(
    api.comments.getPostComments,
    { postId }
  );

  const { data: hasLiked } = useConvexQuery(
    api.likes.hasUserLiked,
    currentUser ? { postId } : "skip"
  );

  const toggleLike = useConvexMutation(api.likes.toggleLike);
  const { mutate: addComment, isLoading: isSubmittingComment } =
    useConvexMutation(api.comments.addComment);
  const deleteComment = useConvexMutation(api.comments.deleteComment);
  const incrementView = useConvexMutation(api.public.incrementViewCount);

  // ✅ View count
  useEffect(() => {
    if (post) {
      incrementView.mutate({ postId });
    }
  }, [post, postId]);

  if (postLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
      </div>
    );
  }

  if (postError || !post) {
    notFound();
  }

  const handleLikeToggle = async () => {
    if (!currentUser) {
      toast.error("Please sign in to like posts");
      return;
    }
    await toggleLike.mutate({ postId });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return toast.error("Sign in to comment");
    if (!commentContent.trim()) return toast.error("Comment cannot be empty");

    await addComment({ postId, content: commentContent.trim() });
    setCommentContent("");
    toast.success("Comment added");
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment.mutate({ commentId });
    toast.success("Comment deleted");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <PublicHeader link={`/${username}`} title="Back to Profile" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative w-full h-96 rounded-xl overflow-hidden mb-8">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
          <Link href={`/${username}`} className="hover:text-white">
            @{post.author.username}
          </Link>

          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <Eye size={16} /> {post.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              {new Date(post.publishedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Like & Comment Count */}
        <div className="flex gap-6 mt-8 border-t border-slate-700 pt-4">
          <Button variant="ghost" onClick={handleLikeToggle}>
            <Heart className={hasLiked ? "fill-red-500 text-red-500" : ""} />
            {post.likeCount}
          </Button>

          <div className="flex items-center gap-2 text-slate-400">
            <MessageCircle size={18} />
            {comments?.length || 0}
          </div>
        </div>

        {/* Comments */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>

          {currentUser && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <form onSubmit={handleCommentSubmit}>
                  <Textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                  />
                  <Button
                    className="mt-3"
                    disabled={isSubmittingComment}
                    type="submit"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Comment
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {commentsLoading ? (
            <BarLoader width="100%" color="#D8B4FE" />
          ) : comments?.length ? (
            comments.map((comment) => (
              <Card key={comment._id} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <p className="font-medium">{comment.author?.name}</p>
                    {currentConvexUser?._id === comment.authorId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  <p className="text-slate-300 mt-2">{comment.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-slate-400">No comments yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

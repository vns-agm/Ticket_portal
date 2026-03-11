'use client';

import { useState, useEffect } from 'react';
import { Comment } from './types';

interface CommentTimelineProps {
  issueId: string;
  onAddComment?: (comment: Comment) => void;
  isEditable?: boolean;
}

export default function CommentTimeline({ issueId, onAddComment, isEditable = false }: CommentTimelineProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments for this issue
  useEffect(() => {
    const fetchComments = async () => {
      if (!issueId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/comments?issueId=${encodeURIComponent(issueId)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch comments: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          // Sort comments by creation time (oldest first)
          const sortedComments = (result.data || []).sort(
            (a: Comment, b: Comment) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setComments(sortedComments);
        } else {
          console.error('Failed to fetch comments:', result.error);
          setComments([]);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [issueId]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !issueId) return;

    setIsSubmitting(true);
    try {
      // Save comment via API
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueId,
          text: newComment.trim(),
          createdBy: 'User', // You can get this from auth context in the future
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Add new comment to local state (sorted by time)
        const updatedComments = [...comments, result.data].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setComments(updatedComments);
        setNewComment('');
        
        // Notify parent component if callback provided
        if (onAddComment) {
          onAddComment(result.data);
        }
      } else {
        throw new Error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow submitting with Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddComment();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Comments Timeline ({comments.length})
        </h3>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        {comments.length > 0 && (
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
        )}

        {/* Comments */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment, index) => (
              <div key={comment.id} className="relative flex items-start space-x-3">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Comment content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.createdBy || 'User'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Comment Section - Using div instead of form to avoid nested forms */}
      {isEditable && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label
              htmlFor="newComment"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Add Comment
            </label>
            <textarea
              id="newComment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="Write a comment... (Ctrl+Enter or Cmd+Enter to submit)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


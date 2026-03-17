import { NextRequest, NextResponse } from 'next/server';
import { Comment } from '@/app/components/types';
import { readJson, writeJson } from '@/app/lib/store';

// GET - Fetch all comments for a specific issue or all comments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId');

    const allComments = await readJson<Comment[]>('comments', []);

    if (issueId) {
      // Filter comments by issueId
      const issueComments = allComments.filter(
        (comment) => comment.issueId === issueId
      );
      return NextResponse.json(
        { success: true, data: issueComments },
        { status: 200 }
      );
    }

    // Return all comments if no issueId specified
    return NextResponse.json({ success: true, data: allComments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueId, text, createdBy } = body;

    // Validation
    if (!issueId || !text) {
      return NextResponse.json(
        { success: false, error: 'issueId and text are required' },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Comment text cannot be empty' },
        { status: 400 }
      );
    }

    // Read existing comments
    const comments = await readJson<Comment[]>('comments', []);

    // Create new comment
    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      issueId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'User',
    };

    // Add to comments array
    comments.push(newComment);

    await writeJson('comments', comments);

    console.log(`Comment created: ${newComment.id} for issue: ${issueId}`);

    return NextResponse.json(
      { success: true, data: newComment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}


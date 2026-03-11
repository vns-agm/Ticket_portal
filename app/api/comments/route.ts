import { NextRequest, NextResponse } from 'next/server';
import { Comment } from '@/app/components/types';
import fs from 'fs';
import path from 'path';

// File path for storing comments
const dataFilePath = path.join(process.cwd(), 'data', 'comments.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read comments from file
function readComments(): Comment[] {
  ensureDataDirectory();
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading comments:', error);
    return [];
  }
}

// Write comments to file
function writeComments(comments: Comment[]): void {
  ensureDataDirectory();
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(comments, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing comments:', error);
    throw error;
  }
}

// Extended Comment interface with issueId
interface CommentWithIssueId extends Comment {
  issueId: string;
}

// GET - Fetch all comments for a specific issue or all comments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId');

    const allComments = readComments();

    if (issueId) {
      // Filter comments by issueId
      const issueComments = allComments.filter(
        (comment: CommentWithIssueId) => comment.issueId === issueId
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
    const comments = readComments();

    // Create new comment
    const newComment: CommentWithIssueId = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      issueId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'User',
    };

    // Add to comments array
    comments.push(newComment);

    // Write back to file
    writeComments(comments);

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


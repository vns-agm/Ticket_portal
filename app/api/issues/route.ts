import { NextRequest, NextResponse } from 'next/server';
import { Issue } from '@/app/components/types';
import { readJson, writeJson } from '@/app/lib/store';

// GET - Fetch all issues
export async function GET() {
  try {
    const issues = await readJson<Issue[]>('issues', []);
    return NextResponse.json({ success: true, data: issues }, { status: 200 });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

// POST - Create a new issue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignedTo, dueDate, priority, description } = body;

    // Validation
    if (!assignedTo || !dueDate || !priority || !description) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dueDate)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate due date is within 30 days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);

    if (dueDateObj < today) {
      return NextResponse.json(
        { success: false, error: 'Due date cannot be in the past' },
        { status: 400 }
      );
    }

    if (dueDateObj > maxDate) {
      return NextResponse.json(
        { success: false, error: 'Cannot select more than 30 days from the current date' },
        { status: 400 }
      );
    }

    const issues = await readJson<Issue[]>('issues', []);

    // Create new issue
    // Comments are stored separately via /api/comments endpoint
    const newIssue: Issue = {
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assignedTo,
      dueDate,
      priority,
      description,
      createdAt: new Date().toISOString(),
      status: 'open',
    };

    issues.push(newIssue);
    await writeJson('issues', issues);

    return NextResponse.json(
      { success: true, data: newIssue },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}


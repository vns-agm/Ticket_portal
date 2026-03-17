import { NextRequest, NextResponse } from 'next/server';
import { Issue } from '@/app/components/types';
import { readJson, writeJson } from '@/app/lib/store';

// GET - Fetch a single issue by unique key (id)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate unique key (id)
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Issue ID (unique key) is required' },
        { status: 400 }
      );
    }

    const issues = await readJson<Issue[]>('issues', []);
    const issue = issues.find((i) => i.id === id);

    if (!issue) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Issue with ID "${id}" not found`,
          id: id 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: issue }, { status: 200 });
  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch issue' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing issue by unique key (id)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate unique key (id)
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Issue ID (unique key) is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { assignedTo, dueDate, priority, description } = body;

    // Validation - all fields are required
    if (!assignedTo || !dueDate || !priority || !description) {
      return NextResponse.json(
        { success: false, error: 'All fields are required: assignedTo, dueDate, priority, description' },
        { status: 400 }
      );
    }

    // Validate priority value
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority. Must be one of: low, medium, high, urgent' },
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

    // Read existing issues
    const issues = await readJson<Issue[]>('issues', []);
    const issueIndex = issues.findIndex((i) => i.id === id);

    if (issueIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Issue with ID "${id}" not found`,
          id: id 
        },
        { status: 404 }
      );
    }

    // Update issue while preserving the original id and createdAt
    // Comments are now stored separately via /api/comments endpoint
    const updatedIssue: Issue = {
      ...issues[issueIndex],
      assignedTo: assignedTo.trim(),
      dueDate: dueDate.trim(),
      priority: priority.toLowerCase().trim(),
      description: description.trim(),
      // Preserve original metadata
      id: issues[issueIndex].id,
      createdAt: issues[issueIndex].createdAt,
    };

    issues[issueIndex] = updatedIssue;

    await writeJson('issues', issues);

    console.log(`Issue updated successfully: ${id}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Issue updated successfully',
        data: updatedIssue 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update issue' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an issue by unique key (id)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate unique key (id)
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Issue ID (unique key) is required' },
        { status: 400 }
      );
    }

    // Read existing issues
    const issues = await readJson<Issue[]>('issues', []);
    const issueIndex = issues.findIndex((i) => i.id === id);

    if (issueIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Issue with ID "${id}" not found`,
          id: id 
        },
        { status: 404 }
      );
    }

    // Store the issue data before deletion (for response)
    const deletedIssue = issues[issueIndex];

    // Remove issue from array
    issues.splice(issueIndex, 1);

    await writeJson('issues', issues);

    console.log(`Issue deleted successfully: ${id}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Issue deleted successfully',
        data: deletedIssue,
        deletedId: id 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete issue' 
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { Issue } from '@/app/components/types';
import fs from 'fs';
import path from 'path';

// File path for storing issues
const dataFilePath = path.join(process.cwd(), 'data', 'issues.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read issues from file
function readIssues(): Issue[] {
  ensureDataDirectory();
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading issues:', error);
    return [];
  }
}

// Write issues to file
function writeIssues(issues: Issue[]): void {
  ensureDataDirectory();
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(issues, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing issues:', error);
    throw error;
  }
}

// GET - Fetch all issues
export async function GET() {
  try {
    const issues = readIssues();
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

    // Read existing issues
    const issues = readIssues();

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

    // Add to issues array
    issues.push(newIssue);

    // Write back to file
    writeIssues(issues);

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


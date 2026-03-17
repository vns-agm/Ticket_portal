import { NextRequest, NextResponse } from 'next/server';
import { Issue } from '@/app/components/types';
import fs from 'fs';
import { ensureDataDirectory, getDataFilePath } from '@/app/lib/data-path';

const dataFilePath = getDataFilePath('issues.json');

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

function writeIssues(issues: Issue[]): void {
  ensureDataDirectory();
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(issues, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing issues:', error);
    throw error;
  }
}

// POST - Close multiple issues by array of IDs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    // Validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate all IDs are strings
    if (!ids.every((id: any) => typeof id === 'string' && id.trim() !== '')) {
      return NextResponse.json(
        { success: false, error: 'All IDs must be non-empty strings' },
        { status: 400 }
      );
    }

    // Read existing issues
    const issues = readIssues();
    const closedIssues: Issue[] = [];
    const notFoundIds: string[] = [];

    // Close each issue
    ids.forEach((id: string) => {
      const issueIndex = issues.findIndex((i) => i.id === id);
      
      if (issueIndex === -1) {
        notFoundIds.push(id);
      } else {
        // Update issue status to closed
        const updatedIssue: Issue = {
          ...issues[issueIndex],
          status: 'closed',
          closedAt: new Date().toISOString(),
        };
        
        issues[issueIndex] = updatedIssue;
        closedIssues.push(updatedIssue);
      }
    });

    // Write back to file
    writeIssues(issues);

    console.log(`Closed ${closedIssues.length} issue(s)`);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully closed ${closedIssues.length} issue(s)`,
        data: {
          closed: closedIssues,
          closedCount: closedIssues.length,
          notFound: notFoundIds,
          notFoundCount: notFoundIds.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error closing issues:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close issues',
      },
      { status: 500 }
    );
  }
}


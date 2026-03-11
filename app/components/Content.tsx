'use client';

import { useState, useEffect } from 'react';
import RaiseIssueModal from './RaiseIssueModal';
import ViewIssueModal from './ViewIssueModal';
import IssuesTable from './IssuesTable';
import { IssueFormData, Issue } from './types';

export default function Content() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSelection, setShowSelection] = useState(false);

  // Fetch issues from API
  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/issues');
      const result = await response.json();

      if (result.success) {
        setIssues(result.data);
      } else {
        setError(result.error || 'Failed to fetch issues');
      }
    } catch (err) {
      setError('Failed to fetch issues');
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch issues on component mount
  useEffect(() => {
    fetchIssues();
  }, []);

  const handleOpenModal = () => {
    setEditingIssue(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIssue(null);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setIsModalOpen(true);
  };

  const handleSubmitIssue = async (data: IssueFormData) => {
    try {
      setError(null);
      if (editingIssue) {
        // Update existing issue
        const response = await fetch(`/api/issues/${editingIssue.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          // Refresh issues list
          await fetchIssues();
          handleCloseModal();
        } else {
          setError(result.error || 'Failed to update issue');
        }
      } else {
        // Create new issue
        const response = await fetch('/api/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          // Refresh issues list
          await fetchIssues();
          handleCloseModal();
        } else {
          setError(result.error || 'Failed to create issue');
        }
      }
    } catch (err) {
      setError('Failed to save issue');
      console.error('Error saving issue:', err);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/issues/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Refresh issues list
        await fetchIssues();
      } else {
        setError(result.error || 'Failed to delete issue');
      }
    } catch (err) {
      setError('Failed to delete issue');
      console.error('Error deleting issue:', err);
    }
  };

  const handleUpdateDescription = async (id: string, description: string) => {
    try {
      setError(null);
      // Get the current issue to preserve other fields
      const currentIssue = issues.find((issue) => issue.id === id);
      if (!currentIssue) {
        throw new Error('Issue not found');
      }

      // Update only the description field
      const response = await fetch(`/api/issues/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedTo: currentIssue.assignedTo,
          dueDate: currentIssue.dueDate,
          priority: currentIssue.priority,
          description: description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh issues list
        await fetchIssues();
      } else {
        setError(result.error || 'Failed to update description');
        throw new Error(result.error || 'Failed to update description');
      }
    } catch (err) {
      setError('Failed to update description');
      console.error('Error updating description:', err);
      throw err;
    }
  };

  const handleViewIssue = async (id: string) => {
    try {
      setViewLoading(true);
      setError(null);
      setIsViewModalOpen(true);
      setViewingIssue(null); // Clear previous issue while loading

      // Fetch the latest issue data from API
      const response = await fetch(`/api/issues/${id}`);
      const result = await response.json();

      if (result.success) {
        setViewingIssue(result.data);
      } else {
        setError(result.error || 'Failed to fetch issue details');
        setIsViewModalOpen(false);
      }
    } catch (err) {
      setError('Failed to fetch issue details');
      console.error('Error fetching issue:', err);
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingIssue(null);
  };

  const handleToggleSelection = () => {
    setShowSelection(!showSelection);
    setSelectedIds([]); // Clear selection when toggling
  };

  const handleSelectChange = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    const openIssues = issues.filter(issue => issue.status !== 'closed');
    if (selected) {
      setSelectedIds(openIssues.map(issue => issue.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleCloseSelectedTickets = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one ticket to close.');
      return;
    }

    if (confirm(`Are you sure you want to close ${selectedIds.length} selected ticket(s)?`)) {
      try {
        setError(null);
        const response = await fetch('/api/issues/close', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: selectedIds }),
        });

        const result = await response.json();

        if (result.success) {
          // Refresh issues list
          await fetchIssues();
          setSelectedIds([]);
          setShowSelection(false);
          alert(`Successfully closed ${result.data.closedCount} ticket(s).`);
        } else {
          setError(result.error || 'Failed to close tickets');
        }
      } catch (err) {
        setError('Failed to close tickets');
        console.error('Error closing tickets:', err);
      }
    }
  };

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Ticket Portal
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                by Agam Srivastava
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Manage and track issues efficiently. Raise tickets, assign tasks, and monitor progress all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-base font-medium text-white shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Raise Issue
              </button>
              {!showSelection ? (
                <button
                  onClick={handleToggleSelection}
                  className="inline-flex items-center justify-center rounded-md border-2 border-orange-300 dark:border-orange-600 px-8 py-3 text-base font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select Tickets to Close
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCloseSelectedTickets}
                    disabled={selectedIds.length === 0}
                    className="inline-flex items-center justify-center rounded-md bg-orange-600 px-6 py-3 text-base font-medium text-white hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Close Selected ({selectedIds.length})
                  </button>
                  <button
                    onClick={handleToggleSelection}
                    className="inline-flex items-center justify-center rounded-md border-2 border-gray-300 dark:border-gray-600 px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Issues Table */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Open Incidents ({issues.length})
              </h2>
              {loading ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading issues...</p>
                </div>
              ) : (
                <IssuesTable
                  issues={issues}
                  onEdit={handleEditIssue}
                  onDelete={handleDeleteIssue}
                  onUpdateDescription={handleUpdateDescription}
                  onView={handleViewIssue}
                  selectedIds={selectedIds}
                  onSelectChange={handleSelectChange}
                  onSelectAll={handleSelectAll}
                  showSelection={showSelection}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ticket Management Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage issues efficiently, all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Experience blazing-fast performance with our optimized infrastructure.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Secure & Safe</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is protected with enterprise-grade security measures.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">User Friendly</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intuitive design that makes complex tasks simple and enjoyable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              About
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Hi, I&apos;m Agam Srivastava. This Ticket Portal is my personal project—a place to manage and track issues, 
              raise tickets, and keep things organized in one place.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Built as a side project to learn and share something useful. Feel free to raise a ticket if you need help or have feedback.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Need Help?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Raise a ticket and I&apos;ll get back to you as soon as possible.
            </p>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3 text-base font-medium text-blue-600 shadow-lg hover:bg-gray-100 transition-colors transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Raise Issue
            </button>
          </div>
        </div>
      </section>

      {/* Raise Issue Modal */}
      <RaiseIssueModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitIssue}
        editingIssue={editingIssue}
      />

      {/* View Issue Modal */}
      <ViewIssueModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        issue={viewingIssue}
        loading={viewLoading}
      />
    </main>
  );
}


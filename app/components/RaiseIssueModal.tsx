'use client';

import { useState, useEffect } from 'react';
import { IssueFormData, Issue } from './types';
import CommentTimeline from './CommentTimeline';

interface RaiseIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IssueFormData) => void;
  editingIssue?: Issue | null;
}

export default function RaiseIssueModal({ isOpen, onClose, onSubmit, editingIssue }: RaiseIssueModalProps) {
  const [formData, setFormData] = useState<IssueFormData>({
    assignedTo: '',
    dueDate: '',
    priority: '',
    description: '',
    newComment: '',
  });

  const [errors, setErrors] = useState<Partial<IssueFormData>>({});

  useEffect(() => {
    if (editingIssue) {
      setFormData({
        assignedTo: editingIssue.assignedTo,
        dueDate: editingIssue.dueDate,
        priority: editingIssue.priority,
        description: editingIssue.description,
        newComment: '',
      });
    } else {
      setFormData({
        assignedTo: '',
        dueDate: '',
        priority: '',
        description: '',
        newComment: '',
      });
    }
    setErrors({});
  }, [editingIssue, isOpen]);

  if (!isOpen) return null;

  // Calculate max date (30 days from today)
  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Calculate min date (today)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof IssueFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<IssueFormData> = {};

    if (!formData.assignedTo.trim()) {
      newErrors.assignedTo = 'Please select an assignee';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Please select a due date';
    } else {
      // Validate due date is within 30 days
      const today = new Date();
      const dueDate = new Date(formData.dueDate);
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 30);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      } else if (dueDate > maxDate) {
        newErrors.dueDate = 'Due date cannot be more than 30 days from today';
      }
    }
    if (!formData.priority) {
      newErrors.priority = 'Please select a priority';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Submit form data (including newComment if any)
      onSubmit(formData);
      // Reset form
      setFormData({
        assignedTo: '',
        dueDate: '',
        priority: '',
        description: '',
        newComment: '',
      });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      assignedTo: '',
      dueDate: '',
      priority: '',
      description: '',
      newComment: '',
    });
    setErrors({});
    onClose();
  };

  const handleAddComment = async (commentText: string) => {
    if (!editingIssue || !commentText.trim()) return;
    
    // Add comment immediately to the editing issue for UI update
    // The comment will be saved when the form is submitted
    setFormData(prev => ({
      ...prev,
      newComment: commentText,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingIssue ? 'Edit Issue' : 'Raise New Issue'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Assigned To */}
          <div>
            <label
              htmlFor="assignedTo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Assigned To <span className="text-red-500">*</span>
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.assignedTo
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Select assignee...</option>
              <option value="Agam Srivastava">Agam Srivastava</option>
            </select>
            {errors.assignedTo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.assignedTo}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              min={editingIssue ? undefined : getMinDate()}
              max={getMaxDate()}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.dueDate
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Due date must be within 30 days from today
            </p>
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.dueDate}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.priority
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Select priority...</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.priority}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe the issue in detail..."
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                errors.description
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          {/* Comment Timeline - Only show when editing */}
          {editingIssue && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <CommentTimeline
                issueId={editingIssue.id}
                isEditable={true}
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
            >
              {editingIssue ? 'Update Issue' : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


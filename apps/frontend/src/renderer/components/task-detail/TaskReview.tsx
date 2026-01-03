import { useState, useEffect } from 'react';
import type { Task, WorktreeStatus, WorktreeDiff, MergeConflict, MergeStats, GitConflictInfo, ImplementationPlan } from '../../../shared/types';
import {
  StagedSuccessMessage,
  WorkspaceStatus,
  QAFeedbackSection,
  DiscardDialog,
  DiffViewDialog,
  ConflictDetailsDialog,
  LoadingMessage,
  NoWorkspaceMessage,
  StagedInProjectMessage,
  PlanReview,
  PlanEditDialog
} from './task-review';

interface TaskReviewProps {
  task: Task;
  feedback: string;
  isSubmitting: boolean;
  worktreeStatus: WorktreeStatus | null;
  worktreeDiff: WorktreeDiff | null;
  isLoadingWorktree: boolean;
  isMerging: boolean;
  isDiscarding: boolean;
  showDiscardDialog: boolean;
  showDiffDialog: boolean;
  workspaceError: string | null;
  stageOnly: boolean;
  stagedSuccess: string | null;
  stagedProjectPath: string | undefined;
  suggestedCommitMessage: string | undefined;
  mergePreview: { files: string[]; conflicts: MergeConflict[]; summary: MergeStats; gitConflicts?: GitConflictInfo; uncommittedChanges?: { hasChanges: boolean; files: string[]; count: number } | null } | null;
  isLoadingPreview: boolean;
  showConflictDialog: boolean;
  onFeedbackChange: (value: string) => void;
  onReject: () => void;
  onMerge: () => void;
  onDiscard: () => void;
  onShowDiscardDialog: (show: boolean) => void;
  onShowDiffDialog: (show: boolean) => void;
  onStageOnlyChange: (value: boolean) => void;
  onShowConflictDialog: (show: boolean) => void;
  onLoadMergePreview: () => void;
  onClose?: () => void;
  onSwitchToTerminals?: () => void;
  onOpenInbuiltTerminal?: (id: string, cwd: string) => void;
}

/**
 * TaskReview Component
 *
 * Main component for reviewing task completion, displaying workspace status,
 * merge previews, and providing options to merge, stage, or discard changes.
 *
 * This component has been refactored into smaller, focused sub-components for better
 * maintainability. See ./task-review/ directory for individual component implementations.
 */
export function TaskReview({
  task,
  feedback,
  isSubmitting,
  worktreeStatus,
  worktreeDiff,
  isLoadingWorktree,
  isMerging,
  isDiscarding,
  showDiscardDialog,
  showDiffDialog,
  workspaceError,
  stageOnly,
  stagedSuccess,
  stagedProjectPath,
  suggestedCommitMessage,
  mergePreview,
  isLoadingPreview,
  showConflictDialog,
  onFeedbackChange,
  onReject,
  onMerge,
  onDiscard,
  onShowDiscardDialog,
  onShowDiffDialog,
  onStageOnlyChange,
  onShowConflictDialog,
  onLoadMergePreview,
  onClose,
  onSwitchToTerminals,
  onOpenInbuiltTerminal
}: TaskReviewProps) {
  const isPlanReview = task.reviewReason === 'plan_review';
  const [implementationPlan, setImplementationPlan] = useState<ImplementationPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Load implementation plan when task enters plan review
  useEffect(() => {
    if (isPlanReview) {
      setIsLoadingPlan(true);
      window.electronAPI.getImplementationPlan(task.id)
        .then(result => {
          if (result.success && result.data) {
            setImplementationPlan(result.data);
          } else {
            console.error('Failed to load implementation plan:', result.error);
          }
        })
        .catch(error => {
          console.error('Error loading implementation plan:', error);
        })
        .finally(() => {
          setIsLoadingPlan(false);
        });
    }
  }, [isPlanReview, task.id]);

  const handlePlanApprove = () => {
    // Approve the plan and proceed to coding
    onReject(); // Reusing the existing submit review mechanism
  };

  const handlePlanReject = (planFeedback: string) => {
    // Reject the plan with feedback
    onFeedbackChange(planFeedback);
    onReject();
  };

  const handlePlanEdit = () => {
    setShowEditDialog(true);
  };

  const handlePlanSave = async (updates: Partial<ImplementationPlan>) => {
    const result = await window.electronAPI.updateImplementationPlan(task.id, updates);
    if (result.success) {
      // Reload the plan
      const updatedResult = await window.electronAPI.getImplementationPlan(task.id);
      if (updatedResult.success && updatedResult.data) {
        setImplementationPlan(updatedResult.data);
      }
    }
  };

  const handlePlanRegenerate = async (planFeedback: string) => {
    const result = await window.electronAPI.regeneratePlan(task.id, planFeedback);
    if (result.success) {
      // Show success message or notification
      console.log('Plan regeneration requested');
    }
  };

  return (
    <div className="space-y-4">
      {/* Section divider */}
      <div className="section-divider-gradient" />

      {/* Plan Review Section - Show when reviewReason is 'plan_review' */}
      {isPlanReview ? (
        <>
          {isLoadingPlan ? (
            <LoadingMessage />
          ) : implementationPlan ? (
            <>
              <PlanReview
                task={task}
                plan={implementationPlan}
                onApprove={handlePlanApprove}
                onReject={handlePlanReject}
                onEdit={handlePlanEdit}
                onRegenerate={handlePlanRegenerate}
              />
              <PlanEditDialog
                open={showEditDialog}
                plan={implementationPlan}
                onOpenChange={setShowEditDialog}
                onSave={handlePlanSave}
              />
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              Failed to load implementation plan
            </div>
          )}
        </>
      ) : (
        <>
          {/* Staged Success Message */}
          {stagedSuccess && (
            <StagedSuccessMessage
              stagedSuccess={stagedSuccess}
              suggestedCommitMessage={suggestedCommitMessage}
            />
          )}

          {/* Workspace Status - hide if staging was successful (worktree is deleted after staging) */}
          {isLoadingWorktree ? (
            <LoadingMessage />
          ) : worktreeStatus?.exists && !stagedSuccess ? (
            <WorkspaceStatus
              worktreeStatus={worktreeStatus}
              workspaceError={workspaceError}
              stageOnly={stageOnly}
              mergePreview={mergePreview}
              isLoadingPreview={isLoadingPreview}
              isMerging={isMerging}
              isDiscarding={isDiscarding}
              onShowDiffDialog={onShowDiffDialog}
              onShowDiscardDialog={onShowDiscardDialog}
              onShowConflictDialog={onShowConflictDialog}
              onLoadMergePreview={onLoadMergePreview}
              onStageOnlyChange={onStageOnlyChange}
              onMerge={onMerge}
              onClose={onClose}
              onSwitchToTerminals={onSwitchToTerminals}
              onOpenInbuiltTerminal={onOpenInbuiltTerminal}
            />
          ) : task.stagedInMainProject && !stagedSuccess ? (
            <StagedInProjectMessage
              task={task}
              projectPath={stagedProjectPath}
              hasWorktree={worktreeStatus?.exists || false}
              onClose={onClose}
            />
          ) : (
            <NoWorkspaceMessage task={task} onClose={onClose} />
          )}

          {/* QA Feedback Section */}
          <QAFeedbackSection
            feedback={feedback}
            isSubmitting={isSubmitting}
            onFeedbackChange={onFeedbackChange}
            onReject={onReject}
          />
        </>
      )}

      {/* Discard Confirmation Dialog */}
      <DiscardDialog
        open={showDiscardDialog}
        task={task}
        worktreeStatus={worktreeStatus}
        isDiscarding={isDiscarding}
        onOpenChange={onShowDiscardDialog}
        onDiscard={onDiscard}
      />

      {/* Diff View Dialog */}
      <DiffViewDialog
        open={showDiffDialog}
        worktreeDiff={worktreeDiff}
        onOpenChange={onShowDiffDialog}
      />

      {/* Conflict Details Dialog */}
      <ConflictDetailsDialog
        open={showConflictDialog}
        mergePreview={mergePreview}
        stageOnly={stageOnly}
        onOpenChange={onShowConflictDialog}
        onMerge={onMerge}
      />
    </div>
  );
}

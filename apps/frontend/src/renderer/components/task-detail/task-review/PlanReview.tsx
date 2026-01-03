import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileCode, CheckCircle2, Edit2, RefreshCw, Check, X } from 'lucide-react';
import type { Task, ImplementationPlan, Phase } from '../../../../shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';

interface PlanReviewProps {
  task: Task;
  plan: ImplementationPlan;
  onApprove: () => void;
  onReject: (feedback: string) => void;
  onEdit: () => void;
  onRegenerate: (feedback: string) => void;
}

export function PlanReview({
  task,
  plan,
  onApprove,
  onReject,
  onEdit,
  onRegenerate,
}: PlanReviewProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleReject = () => {
    if (feedback.trim()) {
      onReject(feedback);
      setFeedback('');
      setShowFeedback(false);
    }
  };

  const handleRegenerate = async () => {
    if (feedback.trim()) {
      setIsRegenerating(true);
      try {
        await onRegenerate(feedback);
        setFeedback('');
        setShowFeedback(false);
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Plan Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            {t('tasks:planReview.approach')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {plan.description || plan.title || plan.feature || t('tasks:planReview.noDescription')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {t('tasks:planReview.workflow')}: {plan.workflow_type}
            </Badge>
            {plan.services_involved && plan.services_involved.length > 0 && (
              <Badge variant="outline">
                {t('tasks:planReview.services')}: {plan.services_involved.join(', ')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phases Overview */}
      {plan.phases && plan.phases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('tasks:planReview.phases')} ({plan.phases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.phases.map((phase: Phase) => (
                <PhaseCard key={phase.phase} phase={phase} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acceptance Criteria */}
      {plan.final_acceptance && plan.final_acceptance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t('tasks:planReview.acceptance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.final_acceptance.map((criterion: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Feedback Section */}
      {showFeedback && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('tasks:planReview.feedbackTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('tasks:planReview.feedbackPlaceholder')}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={!feedback.trim()}
              >
                <X className="h-4 w-4 mr-2" />
                {t('tasks:planReview.actions.reject')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRegenerate}
                disabled={!feedback.trim() || isRegenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                {t('tasks:planReview.actions.regenerate')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowFeedback(false);
                  setFeedback('');
                }}
              >
                {t('common:cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!showFeedback && (
        <>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={onApprove}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              {t('tasks:planReview.actions.approve')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {t('tasks:planReview.actions.edit')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFeedback(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('tasks:planReview.actions.requestChanges')}
            </Button>
          </div>

          {/* Info Message */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
            {t('tasks:planReview.infoMessage')}
          </div>
        </>
      )}
    </div>
  );
}

function PhaseCard({ phase }: { phase: Phase }) {
  const { t } = useTranslation('tasks');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {t('tasks:planReview.phase')} {phase.phase}
          </Badge>
          <span className="text-sm font-medium">{phase.name}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {phase.subtasks.length} {t('tasks:planReview.subtasks')}
        </Badge>
      </div>

      {isExpanded && phase.subtasks && phase.subtasks.length > 0 && (
        <div className="mt-3 space-y-2 pl-4 border-l-2 border-border">
          {phase.subtasks.map((subtask) => (
            <div key={subtask.id} className="text-sm">
              <div className="font-medium text-foreground">{subtask.title}</div>
              {subtask.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {subtask.description}
                </p>
              )}
              {subtask.files && subtask.files.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {subtask.files.map((file, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-mono">
                      <FileCode className="h-3 w-3 mr-1" />
                      {file.split('/').pop()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

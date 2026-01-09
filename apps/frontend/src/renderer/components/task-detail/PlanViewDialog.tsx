import { useTranslation } from 'react-i18next';
import { Settings, Zap } from 'lucide-react';
import type { Task, ImplementationPlan, Phase, PlanSubtask } from '../../../shared/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

interface PlanViewDialogProps {
  open: boolean;
  task: Task;
  plan: ImplementationPlan | null;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanViewDialog({
  open,
  task,
  plan,
  isLoading,
  onOpenChange,
}: PlanViewDialogProps) {
  const { t } = useTranslation(['tasks', 'common']);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {plan?.feature || plan?.title || task.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">
                {t('common:loading')}...
              </div>
            </div>
          ) : !plan ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">
                No plan available
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Stats */}
              <PlanStats
                phases={plan.phases || []}
                services={plan.services_involved || []}
              />

              {/* Phases Breakdown */}
              {plan.phases && plan.phases.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">
                    {t('tasks:planView.phases')}:
                  </h3>
                  {plan.phases.map((phase) => (
                    <PhaseSection key={phase.phase} phase={phase} />
                  ))}
                </div>
              )}

              {/* Parallelism Info */}
              {plan.summary?.parallelism?.recommended_workers &&
                plan.summary.parallelism.recommended_workers > 1 && (
                  <div className="flex items-center gap-2 text-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-lg border border-blue-500/20">
                    <Zap className="h-4 w-4" />
                    <span>
                      {t('tasks:planView.parallelism')}:{' '}
                      {plan.summary.parallelism.recommended_workers}{' '}
                      {t('tasks:planView.workers')}
                    </span>
                  </div>
                )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function PlanStats({
  phases,
  services,
}: {
  phases: Phase[];
  services: string[];
}) {
  const { t } = useTranslation('tasks');

  const totalSubtasks = phases.reduce(
    (sum, p) => sum + (p.subtasks?.length || 0),
    0
  );
  const completedSubtasks = phases.reduce(
    (sum, p) =>
      sum + (p.subtasks?.filter((s) => s.status === 'completed').length || 0),
    0
  );

  return (
    <div className="text-sm space-y-1 bg-muted/50 p-4 rounded-lg border border-border">
      <div className="text-muted-foreground">
        {t('tasks:planView.stats.phases')}:{' '}
        <span className="text-foreground font-medium">{phases.length}</span>
      </div>
      <div className="text-muted-foreground">
        {t('tasks:planView.stats.subtasks')}:{' '}
        <span className="text-foreground font-medium">
          {completedSubtasks}/{totalSubtasks} {t('tasks:planView.stats.completed')}
        </span>
      </div>
      {services.length > 0 && (
        <div className="text-muted-foreground">
          {t('tasks:planView.stats.services')}:{' '}
          <span className="text-foreground font-medium">
            {services.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}

function PhaseSection({ phase }: { phase: Phase }) {
  const { t } = useTranslation('tasks');

  const subtasks = phase.subtasks || [];
  const completed = subtasks.filter((s) => s.status === 'completed').length;
  const total = subtasks.length;
  const isComplete = completed === total && total > 0;
  const hasProgress = completed > 0 && !isComplete;

  // Status icon logic (matching CLI)
  const statusIcon = isComplete ? '✓' : hasProgress ? '◐' : '○';
  const statusColor = isComplete
    ? 'text-green-500'
    : hasProgress
      ? 'text-blue-500'
      : 'text-gray-400';

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`${statusColor} text-lg`}>{statusIcon}</span>
        <span className="font-medium">
          {t('tasks:planReview.phase')} {phase.phase}: {phase.name}
        </span>
        <span className="text-xs text-muted-foreground">
          ({completed}/{total} {t('tasks:planReview.subtasks')})
        </span>
      </div>

      {/* Show up to 3 subtasks for incomplete phases */}
      {completed < total && subtasks.length > 0 && (
        <div className="ml-6 space-y-2">
          {subtasks.slice(0, 3).map((subtask) => (
            <SubtaskRow key={subtask.id} subtask={subtask} />
          ))}
          {subtasks.length > 3 && (
            <div className="text-xs text-muted-foreground">
              ... {subtasks.length - 3} {t('tasks:planView.moreSubtasks')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubtaskRow({ subtask }: { subtask: PlanSubtask }) {
  const icon =
    subtask.status === 'completed'
      ? '✓'
      : subtask.status === 'in_progress'
        ? '◐'
        : '○';
  const iconColor =
    subtask.status === 'completed'
      ? 'text-green-500'
      : subtask.status === 'in_progress'
        ? 'text-blue-500'
        : 'text-gray-400';

  const descShort =
    subtask.description && subtask.description.length > 50
      ? subtask.description.substring(0, 50) + '...'
      : subtask.description || subtask.title || '';

  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={iconColor}>{icon}</span>
      <span className="font-mono text-xs text-muted-foreground shrink-0">
        {subtask.id}:
      </span>
      <span className="flex-1">{descShort}</span>
    </div>
  );
}

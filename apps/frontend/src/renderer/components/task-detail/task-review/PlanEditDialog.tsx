import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, X } from 'lucide-react';
import type { ImplementationPlan, Phase, PlanSubtask } from '../../../../shared/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { ScrollArea } from '../../ui/scroll-area';

interface PlanEditDialogProps {
  open: boolean;
  plan: ImplementationPlan;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedPlan: Partial<ImplementationPlan>) => Promise<void>;
}

export function PlanEditDialog({
  open,
  plan,
  onOpenChange,
  onSave,
}: PlanEditDialogProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPlan, setEditedPlan] = useState<ImplementationPlan>(plan);

  // Reset edited plan when dialog opens with new plan
  useEffect(() => {
    if (open) {
      setEditedPlan(plan);
    }
  }, [open, plan]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        description: editedPlan.description,
        title: editedPlan.title,
        feature: editedPlan.feature,
        workflow_type: editedPlan.workflow_type,
        phases: editedPlan.phases,
        final_acceptance: editedPlan.final_acceptance,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const updateDescription = (value: string) => {
    setEditedPlan({ ...editedPlan, description: value });
  };

  const updateWorkflowType = (value: string) => {
    setEditedPlan({ ...editedPlan, workflow_type: value });
  };

  const updateAcceptanceCriteria = (index: number, value: string) => {
    const newAcceptance = [...(editedPlan.final_acceptance || [])];
    newAcceptance[index] = value;
    setEditedPlan({ ...editedPlan, final_acceptance: newAcceptance });
  };

  const addAcceptanceCriterion = () => {
    const newAcceptance = [...(editedPlan.final_acceptance || []), ''];
    setEditedPlan({ ...editedPlan, final_acceptance: newAcceptance });
  };

  const removeAcceptanceCriterion = (index: number) => {
    const newAcceptance = (editedPlan.final_acceptance || []).filter((_, i) => i !== index);
    setEditedPlan({ ...editedPlan, final_acceptance: newAcceptance });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('tasks:planReview.editDialog.title')}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="plan-description">
                {t('tasks:planReview.editDialog.description')}
              </Label>
              <Textarea
                id="plan-description"
                value={editedPlan.description || editedPlan.title || editedPlan.feature || ''}
                onChange={(e) => updateDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Workflow Type */}
            <div className="space-y-2">
              <Label htmlFor="workflow-type">
                {t('tasks:planReview.editDialog.workflowType')}
              </Label>
              <Input
                id="workflow-type"
                value={editedPlan.workflow_type}
                onChange={(e) => updateWorkflowType(e.target.value)}
              />
            </div>

            {/* Acceptance Criteria */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('tasks:planReview.editDialog.acceptanceCriteria')}</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addAcceptanceCriterion}
                >
                  {t('tasks:planReview.editDialog.addCriterion')}
                </Button>
              </div>
              <div className="space-y-2">
                {(editedPlan.final_acceptance || []).map((criterion, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={criterion}
                      onChange={(e) => updateAcceptanceCriteria(index, e.target.value)}
                      placeholder={t('tasks:planReview.editDialog.criterionPlaceholder')}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAcceptanceCriterion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase Info (Read-only for now) */}
            {editedPlan.phases && editedPlan.phases.length > 0 && (
              <div className="space-y-2">
                <Label>{t('tasks:planReview.editDialog.phases')}</Label>
                <div className="text-sm text-muted-foreground">
                  {editedPlan.phases.length} {t('tasks:planReview.editDialog.phasesCount')}
                  <br />
                  <span className="text-xs">
                    {t('tasks:planReview.editDialog.phasesNote')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                {t('tasks:planReview.editDialog.saving')}
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('tasks:planReview.editDialog.save')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

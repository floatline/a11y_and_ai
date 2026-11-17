import { useEffect, useRef, useState } from 'react';
import { Card, Text, Button, Icon, Progress } from '@gravity-ui/uikit';
import { Plus, Pencil, TrashBin, ChevronDown, ChevronUp } from '@gravity-ui/icons';
import type { Checklist, Task } from '../../types';
import { useDemo } from '../../hooks/useDemo';
import { DemoDialog } from '../../demo/DemoDialog';
import { TaskItem } from '../TaskItem';
import './ChecklistCard.css';

interface ChecklistCardProps {
  checklist: Checklist;
  onAddTask: (checklistId: string) => void;
  onEditChecklist: (checklist: Checklist) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onToggleTask: (checklistId: string, taskId: string) => void;
  onEditTask: (checklistId: string, task: Task) => void;
  onDeleteTask: (checklistId: string, taskId: string) => void;
}

export const ChecklistCard = ({
  checklist,
  onAddTask,
  onEditChecklist,
  onDeleteChecklist,
  onToggleTask,
  onEditTask,
  onDeleteTask,
}: ChecklistCardProps) => {
  const { faults } = useDemo();
  const missing = faults.missingNames;
  // Collapsed at start so that finding and opening the checklist is part of the task.
  const [isExpanded, setIsExpanded] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task>();
  const [confirmChecklistDelete, setConfirmChecklistDelete] = useState(false);
  const deleteChecklistRef = useRef<HTMLButtonElement>(null);
  const completedTasks = checklist.tasks.filter((task) => task.completed).length;
  const totalTasks = checklist.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  // With reverseOrder the DOM is reversed and CSS column-reverse restores the visual order.
  const tasks = faults.reverseOrder ? [...checklist.tasks].reverse() : checklist.tasks;
  const confirmTitleId = `delete-task-title-${checklist.id}`;

  useEffect(() => {
    if (!taskToDelete || !faults.stealAutofocus) return;
    // Fault: the confirmation opens, but focus lands on «delete checklist» behind it.
    const timer = setTimeout(() => deleteChecklistRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [taskToDelete, faults.stealAutofocus]);

  return (
    <Card className="checklist-card">
      <div className="checklist-card__header">
        <div className="checklist-card__header-row">
          {/* Accordion pattern: the toggle sits inside a heading, so NVDA's H key jumps between checklists */}
          <h3 className="checklist-card__heading">
            <button
              type="button"
              className="checklist-card__expand-button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={missing ? undefined : isExpanded}
            >
              <Icon data={isExpanded ? ChevronUp : ChevronDown} size={20} />
              <span className="checklist-card__title-text">
                {checklist.title}
              </span>
            </button>
          </h3>
          <div className="checklist-card__actions">
            <Button
              view="action"
              size="m"
              onClick={() => onAddTask(checklist.id)}
              aria-label={missing ? undefined : `Добавить задачу в «${checklist.title}»`}
            >
              <Icon data={Plus} size={16} />
            </Button>
            <Button
              view="outlined"
              size="m"
              onClick={() => onEditChecklist(checklist)}
              aria-label={missing ? undefined : `Редактировать чеклист «${checklist.title}»`}
            >
              <Icon data={Pencil} size={16} />
            </Button>
            <Button
              ref={deleteChecklistRef}
              view="outlined"
              size="m"
              // Deleting a whole list asks first (WCAG 3.3.4). With broken dialogs it deletes at once:
              // that is the trap in «Удалить черновик», where focus is stolen onto this button.
              onClick={() =>
                faults.brokenModal ? onDeleteChecklist(checklist.id) : setConfirmChecklistDelete(true)
              }
              aria-label={missing ? undefined : `Удалить чеклист «${checklist.title}»`}
            >
              <Icon data={TrashBin} size={16} />
            </Button>
          </div>
        </div>
        {checklist.description && (
          <Text variant="body-1" color="secondary" className="checklist-card__description">
            {checklist.description}
          </Text>
        )}
        {totalTasks > 0 && (
          <div className="checklist-card__progress">
            <div className="checklist-card__progress-info">
              <Text variant="caption-2" color="secondary">
                Выполнено
              </Text>
              <Text variant="caption-2" color="secondary">
                {completedTasks} / {totalTasks}
              </Text>
            </div>
            <Progress value={progress} size="s" theme="success" className="checklist-card__progress-bar" />
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="checklist-card__tasks">
          {tasks.length === 0 ? (
            <Text variant="body-1" color="secondary" className="checklist-card__empty">
              Задач пока нет.
            </Text>
          ) : (
            <ul className="checklist-card__task-list" role="list">
              {tasks.map((task) => (
                <li key={task.id} className="checklist-card__task-list-item" role="listitem">
                  <TaskItem
                    task={task}
                    onToggle={(taskId) => onToggleTask(checklist.id, taskId)}
                    onEdit={(task) => onEditTask(checklist.id, task)}
                    onDelete={() => setTaskToDelete(task)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <DemoDialog open={Boolean(taskToDelete)} onClose={() => setTaskToDelete(undefined)} titleId={confirmTitleId}>
        <div className="checklist-card__confirm">
          <Text as="h2" variant="subheader-3" id={confirmTitleId}>
            Удалить задачу «{taskToDelete?.title}»?
          </Text>
          <div className="checklist-card__confirm-actions">
            <Button view="flat" size="l" onClick={() => setTaskToDelete(undefined)}>
              Отмена
            </Button>
            <Button
              view="action"
              size="l"
              onClick={() => {
                if (taskToDelete) onDeleteTask(checklist.id, taskToDelete.id);
                setTaskToDelete(undefined);
              }}
            >
              Удалить
            </Button>
          </div>
        </div>
      </DemoDialog>

      <DemoDialog
        open={confirmChecklistDelete}
        onClose={() => setConfirmChecklistDelete(false)}
        titleId={`delete-checklist-title-${checklist.id}`}
      >
        <div className="checklist-card__confirm">
          <Text as="h2" variant="subheader-3" id={`delete-checklist-title-${checklist.id}`}>
            Удалить чеклист «{checklist.title}» вместе со всеми задачами?
          </Text>
          <div className="checklist-card__confirm-actions">
            <Button view="flat" size="l" onClick={() => setConfirmChecklistDelete(false)}>
              Отмена
            </Button>
            <Button view="action" size="l" onClick={() => onDeleteChecklist(checklist.id)}>
              Удалить
            </Button>
          </div>
        </div>
      </DemoDialog>
    </Card>
  );
};

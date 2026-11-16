import { useEffect, useState } from 'react';
import { Button, Icon, Text } from '@gravity-ui/uikit';
import { Plus } from '@gravity-ui/icons';
import type { Checklist, Priority, Task } from '../../types';
import { ChecklistCard } from '../ChecklistCard';
import { ChecklistModal } from '../ChecklistModal';
import { TaskModal } from '../TaskModal';
import { useChecklists } from '../../hooks/useChecklists';
import { useModal } from '../../hooks/useModal';
import { useDemo } from '../../hooks/useDemo';
import { getCase } from '../../demo/cases';

export const TodoScreen = () => {
  const {
    checklists,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
  } = useChecklists();
  const { caseId, report } = useDemo();
  // The board is shared across quest items; this screen mounts per item, so this is the board at item start.
  const [atStart] = useState(checklists);

  const checklistModal = useModal<Checklist>();
  const taskModal = useModal<{ checklistId: string; task?: Task }>();

  useEffect(() => {
    const progress = getCase(caseId).progress?.(checklists, atStart);
    if (progress) report(progress);
  }, [caseId, checklists, atStart, report]);

  const handleSaveChecklist = (title: string, description: string) => {
    if (checklistModal.data) {
      updateChecklist(checklistModal.data.id, title, description);
    } else {
      createChecklist(title, description);
    }
  };

  const handleSaveTask = (
    title: string,
    description: string,
    deadline: string,
    priority: Priority
  ) => {
    if (!taskModal.data) return;

    if (taskModal.data.task) {
      updateTask(
        taskModal.data.checklistId,
        taskModal.data.task.id,
        title,
        description,
        deadline,
        priority
      );
    } else {
      createTask(taskModal.data.checklistId, title, description, deadline, priority);
    }
  };

  return (
    <>
      <div className="app__header">
        <Text as="h2" variant="display-1">Списки задач</Text>
        <Button view="action" size="l" onClick={() => checklistModal.open()}>
          <Icon data={Plus} size={18} />
          Новый чеклист
        </Button>
      </div>

      <div className="app__content">
        {checklists.length === 0 ? (
          <div className="app__empty">
            <Text variant="body-2" color="secondary">
              Чеклистов пока нет. Создайте первый.
            </Text>
          </div>
        ) : (
          <ul className="app__checklist-list" role="list">
            {checklists.map((checklist) => (
              <li key={checklist.id} className="app__checklist-list-item" role="listitem">
                <ChecklistCard
                  checklist={checklist}
                  onAddTask={(checklistId) => taskModal.open({ checklistId })}
                  onEditChecklist={checklistModal.open}
                  onDeleteChecklist={deleteChecklist}
                  onToggleTask={toggleTask}
                  onEditTask={(checklistId, task) => taskModal.open({ checklistId, task })}
                  onDeleteTask={deleteTask}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ChecklistModal
        open={checklistModal.isOpen}
        checklist={checklistModal.data}
        onClose={checklistModal.close}
        onSave={handleSaveChecklist}
      />

      <TaskModal
        open={taskModal.isOpen}
        task={taskModal.data?.task}
        onClose={taskModal.close}
        onSave={handleSaveTask}
      />
    </>
  );
};

import { Card, Checkbox, Text, Button, Icon, Label } from '@gravity-ui/uikit';
import { Pencil, TrashBin } from '@gravity-ui/icons';
import type { Task } from '../../types';
import { useDemo } from '../../hooks/useDemo';
import { PRIORITY_OPTIONS } from '../../constants';
import taskFieldsConfig from '../../config/taskFieldsConfig.json';
import './TaskItem.css';

const isFieldVisible = (fieldName: string): boolean =>
  taskFieldsConfig.fields.find((f) => f.name === fieldName)?.visible ?? true;

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem = ({ task, onToggle, onEdit, onDelete }: TaskItemProps) => {
  const { faults } = useDemo();
  const missing = faults.missingNames;
  const deadlineDate = new Date(task.deadline);
  const isValidDate = !isNaN(deadlineDate.getTime());
  const formattedDeadline = isValidDate
    ? deadlineDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : task.deadline;

  return (
    <Card className="task-item">
      <div className="task-item__content">
        <Checkbox
          checked={task.completed}
          onUpdate={() => onToggle(task.id)}
          size="l"
          controlProps={{ 'aria-label': missing ? undefined : `Выполнено: ${task.title}` }}
        />
        <div className="task-item__details">
          {isFieldVisible('title') && (
            <div className="task-item__header">
              <Text
                variant="body-2"
                className={`task-item__title ${task.completed ? 'task-item__title--completed' : ''}`}
              >
                {task.title}
              </Text>
            </div>
          )}
          {isFieldVisible('priority') && (
            <div className="task-item__status-row">
              <Label
                theme={task.priority === 'critical' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}
                size="xs"
              >
                {PRIORITY_OPTIONS.find((o) => o.value === task.priority)?.content ?? task.priority}
              </Label>
            </div>
          )}
          {isFieldVisible('description') && task.description && (
            <Text variant="body-1" color="secondary" className="task-item__description">
              {task.description.split('\n').map((line, index) => (
                <span key={index}>
                  {line}
                  {index < task.description.split('\n').length - 1 && <br />}
                </span>
              ))}
            </Text>
          )}
          {isFieldVisible('deadline') && task.deadline && (
            <div className="task-item__deadline">
              <Text variant="caption-2" color="secondary">
                Срок: {formattedDeadline}
              </Text>
            </div>
          )}
        </div>
        <div className="task-item__actions">
          <Button view="flat" size="s" onClick={() => onEdit(task)} aria-label={missing ? undefined : `Редактировать задачу «${task.title}»`}>
            <Icon data={Pencil} size={16} />
          </Button>
          <Button view="flat" size="s" onClick={() => onDelete(task.id)} aria-label={missing ? undefined : `Удалить задачу «${task.title}»`}>
            <Icon data={TrashBin} size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

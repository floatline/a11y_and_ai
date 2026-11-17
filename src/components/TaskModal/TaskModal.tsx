import { useState } from 'react';
import { TextInput, TextArea, Button, Select, Text } from '@gravity-ui/uikit';
import type { Task, Priority } from '../../types';
import { PRIORITY_OPTIONS, DEFAULT_PRIORITY } from '../../constants';
import { useDemo } from '../../hooks/useDemo';
import { DemoDialog } from '../../demo/DemoDialog';
import taskFieldsConfig from '../../config/taskFieldsConfig.json';
import './TaskModal.css';

const isFieldVisible = (fieldName: string): boolean =>
  taskFieldsConfig.fields.find((f) => f.name === fieldName)?.visible ?? true;

interface TaskModalProps {
  open: boolean;
  task?: Task;
  onClose: () => void;
  onSave: (title: string, description: string, deadline: string, priority: Priority) => void;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  deadline?: string;
}

function TaskModalContent({ task, onClose, onSave }: Omit<TaskModalProps, 'open'>) {
  const { faults } = useDemo();
  const missing = faults.missingNames;
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || DEFAULT_PRIORITY);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ title?: boolean; description?: boolean; deadline?: boolean }>({});

  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Введите название';
    }
    if (value.trim().length < 3) {
      return 'Название — не короче 3 символов';
    }
    if (value.trim().length > 100) {
      return 'Название — не длиннее 100 символов';
    }
    return undefined;
  };

  const validateDescription = (value: string): string | undefined => {
    if (value.trim().length > 500) {
      return 'Описание — не длиннее 500 символов';
    }
    return undefined;
  };

  const validateDeadline = (value: string): string | undefined => {
    // Deadline is optional, only validate if provided
    if (value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return 'Срок не может быть в прошлом';
      }
    }
    return undefined;
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (touched.title) {
      const error = validateTitle(value);
      setErrors(prev => ({ ...prev, title: error }));
    }
  };

  const handleTitleBlur = () => {
    setTouched(prev => ({ ...prev, title: true }));
    const error = validateTitle(title);
    setErrors(prev => ({ ...prev, title: error }));
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (touched.description) {
      const error = validateDescription(value);
      setErrors(prev => ({ ...prev, description: error }));
    }
  };

  const handleDescriptionBlur = () => {
    setTouched(prev => ({ ...prev, description: true }));
    const error = validateDescription(description);
    setErrors(prev => ({ ...prev, description: error }));
  };

  const handleDeadlineChange = (value: string) => {
    setDeadline(value);
    if (touched.deadline) {
      const error = validateDeadline(value);
      setErrors(prev => ({ ...prev, deadline: error }));
    }
  };

  const handleDeadlineBlur = () => {
    setTouched(prev => ({ ...prev, deadline: true }));
    const error = validateDeadline(deadline);
    setErrors(prev => ({ ...prev, deadline: error }));
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    // Validate all fields
    const titleError = validateTitle(title);
    const descriptionError = validateDescription(description);
    const deadlineError = validateDeadline(deadline);

    setTouched({ title: true, description: true, deadline: true });
    setErrors({
      title: titleError,
      description: descriptionError,
      deadline: deadlineError,
    });

    // Only save if there are no errors
    if (!titleError && !descriptionError && !deadlineError) {
      onSave(title.trim(), description.trim(), deadline, priority);
      onClose();
      return;
    }
    // Accessible version: focus the first error so a screen reader reads it; the broken one stays silent
    if (missing) return;
    const firstError = titleError ? 'task-title' : descriptionError ? 'task-description' : 'task-deadline';
    document.getElementById(firstError)?.focus();
  };

  return (
    <div className="task-modal__form">
      <h2 id="task-modal-title" className="task-modal__title">
        {task ? 'Редактировать задачу' : 'Новая задача'}
      </h2>
      <Text as="p" color="secondary" className="task-modal__note">
        Название — обязательное поле.
      </Text>
      {isFieldVisible('title') && (
        <div>
          <label className="sr-only" htmlFor={'task-title'}>
            Название <span aria-hidden="true" style={{ color: 'var(--g-color-text-danger)' }}>*</span>
          </label>
          <TextInput
            id="task-title"
            controlProps={{ 'aria-required': true }}
            value={title}
            onUpdate={handleTitleChange}
            onBlur={handleTitleBlur}
            placeholder="Купить билеты на поезд"
            size="l"
            // Fault: no autofocus, so with the broken dialog focus stays on «+» behind it
            autoFocus={!faults.stealAutofocus}
            validationState={touched.title && errors.title ? 'invalid' : undefined}
            errorMessage={touched.title ? errors.title : undefined}
          />
        </div>
      )}
      {isFieldVisible('description') && (
        <div>
          <label className="sr-only" htmlFor={'task-description'}>Описание</label>
          <TextArea
            id="task-description"
            value={description}
            onUpdate={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            placeholder="Взять зарядку и кликер"
            rows={3}
            size="l"
            validationState={touched.description && errors.description ? 'invalid' : undefined}
            errorMessage={touched.description ? errors.description : undefined}
          />
        </div>
      )}
      <div className="task-modal__row">
        {isFieldVisible('deadline') && (
          <div>
            <label className="sr-only" htmlFor={'task-deadline'}>
              Срок (необязательно)
            </label>
            <input
              id="task-deadline"
              type="date"
              value={deadline}
              onChange={(e) => handleDeadlineChange(e.target.value)}
              onBlur={handleDeadlineBlur}
              className="task-modal__date-input"
              aria-invalid={missing ? undefined : (touched.deadline && errors.deadline ? 'true' : 'false')}
              aria-describedby={missing ? undefined : (touched.deadline && errors.deadline ? 'deadline-error' : undefined)}
            />
            {touched.deadline && errors.deadline && (
              <Text
                id="deadline-error"
                variant="caption-2"
                color="danger"
                aria-live={missing ? undefined : "assertive"}
                style={{ marginTop: '4px', display: 'block' }}
              >
                {errors.deadline}
              </Text>
            )}
          </div>
        )}
        {isFieldVisible('priority') && (
          <div>
            <label className="sr-only" htmlFor={'task-priority'}>Приоритет</label>
            <Select
              id="task-priority"
              value={[priority]}
              onUpdate={(values) => setPriority(values[0] as Priority)}
              options={PRIORITY_OPTIONS}
              size="l"
            />
          </div>
        )}
      </div>
      <div className="task-modal__actions">
        <Button view="flat" size="l" onClick={handleClose}>
          Отмена
        </Button>
        <Button
          view="action"
          size="l"
          onClick={handleSave}
        >
          {task ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </div>
  );
}

export const TaskModal = ({ open, task, onClose, onSave }: TaskModalProps) => {
  return (
    <DemoDialog open={open} onClose={onClose} titleId="task-modal-title">
      <TaskModalContent
        key={task?.id || 'new'}
        task={task}
        onClose={onClose}
        onSave={onSave}
      />
    </DemoDialog>
  );
};

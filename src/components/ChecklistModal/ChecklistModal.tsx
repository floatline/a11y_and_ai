import { useState } from 'react';
import { TextInput, TextArea, Button, Text } from '@gravity-ui/uikit';
import type { Checklist } from '../../types';
import { useDemo } from '../../hooks/useDemo';
import { DemoDialog } from '../../demo/DemoDialog';
import './ChecklistModal.css';

interface ChecklistModalProps {
  open: boolean;
  checklist?: Checklist;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

interface ValidationErrors {
  title?: string;
  description?: string;
}

function ChecklistModalContent({ checklist, onClose, onSave }: Omit<ChecklistModalProps, 'open'>) {
  const { faults } = useDemo();
  const missing = faults.missingNames;
  const [title, setTitle] = useState(checklist?.title || '');
  const [description, setDescription] = useState(checklist?.description || '');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ title?: boolean; description?: boolean }>({});

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

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    // Validate all fields
    const titleError = validateTitle(title);
    const descriptionError = validateDescription(description);

    setTouched({ title: true, description: true });
    setErrors({
      title: titleError,
      description: descriptionError,
    });

    // Only save if there are no errors
    if (!titleError && !descriptionError) {
      onSave(title.trim(), description.trim());
      onClose();
      return;
    }
    // Accessible version: focus the first error so a screen reader reads it; the broken one stays silent
    if (missing) return;
    document.getElementById(titleError ? 'checklist-title' : 'checklist-description')?.focus();
  };

  return (
    <div className="checklist-modal__form">
      <h2 id="checklist-modal-title" className="checklist-modal__title">
        {checklist ? 'Редактировать чеклист' : 'Новый чеклист'}
      </h2>
      <Text as="p" color="secondary" className="checklist-modal__note">
        Название — обязательное поле.
      </Text>
      <div>
        <label className="sr-only" htmlFor={'checklist-title'}>
          Название <span aria-hidden="true" style={{ color: 'var(--g-color-text-danger)' }}>*</span>
        </label>
        <TextInput
          id="checklist-title"
          controlProps={{ 'aria-required': true }}
          value={title}
          onUpdate={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="Поездка в Казань"
          size="l"
          autoFocus
          validationState={touched.title && errors.title ? 'invalid' : undefined}
          errorMessage={touched.title ? errors.title : undefined}
        />
      </div>
      <div>
        <label className="sr-only" htmlFor={'checklist-description'}>Описание (необязательно)</label>
        <TextArea
          id="checklist-description"
          value={description}
          onUpdate={handleDescriptionChange}
          onBlur={handleDescriptionBlur}
          placeholder="Всё, что нужно до выезда"
          rows={3}
          size="l"
          validationState={touched.description && errors.description ? 'invalid' : undefined}
          errorMessage={touched.description ? errors.description : undefined}
        />
      </div>
      <div className="checklist-modal__actions">
        <Button view="flat" size="l" onClick={handleClose}>
          Отмена
        </Button>
        <Button view="action" size="l" onClick={handleSave}>
          {checklist ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </div>
  );
}

export const ChecklistModal = ({ open, checklist, onClose, onSave }: ChecklistModalProps) => {
  return (
    <DemoDialog open={open} onClose={onClose} titleId="checklist-modal-title">
      <ChecklistModalContent
        key={checklist?.id || 'new'}
        checklist={checklist}
        onClose={onClose}
        onSave={onSave}
      />
    </DemoDialog>
  );
};

import { useEffect, useState, type ReactNode } from 'react';
import { Button, Checkbox, Select, Text, TextInput } from '@gravity-ui/uikit';
import { useDemo } from '../hooks/useDemo';
import { DemoDialog } from './DemoDialog';
import './demo-cases.css';

type TextField = 'name' | 'email' | 'topic';
type Field = TextField | 'format';
type Block = Field | 'consent' | 'submit';

const FIELDS: { id: TextField; label: string; type: 'text' | 'email' }[] = [
  { id: 'name', label: 'Имя', type: 'text' },
  { id: 'email', label: 'Email', type: 'email' },
  { id: 'topic', label: 'Тема доклада', type: 'text' },
];

const FORMAT_OPTIONS = [
  { value: 'talk', content: 'Доклад' },
  { value: 'workshop', content: 'Воркшоп' },
];

const VISUAL_ORDER: Block[] = ['name', 'email', 'topic', 'format', 'consent', 'submit'];
// reverseOrder: the DOM (Tab and reading order) is shuffled, CSS `order` keeps the visual order.
const SHUFFLED_ORDER: Block[] = ['topic', 'name', 'submit', 'email', 'consent', 'format'];

type Values = Record<Field, string>;

const validate = (v: Values): Partial<Record<Field, string>> => ({
  name: v.name.trim().length < 2 ? 'Введите имя' : undefined,
  email: /^\S+@\S+\.\S+$/.test(v.email.trim()) ? undefined : 'Введите email вида name@example.com',
  topic: v.topic.trim().length < 3 ? 'Тема — не короче 3 символов' : undefined,
  format: v.format ? undefined : 'Выберите формат',
});

export const RegisterCase = () => {
  const { faults, report } = useDemo();
  const missing = faults.missingNames;
  const [values, setValues] = useState<Values>({ name: '', email: '', topic: '', format: '' });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const errors = validate(values);
  const fieldsValid = Object.values(errors).every((e) => !e);

  useEffect(() => {
    report({ steps: [fieldsValid, consent, submitted], mistakes: 0 });
  }, [fieldsValid, consent, submitted, report]);

  if (submitted) {
    return (
      <Text as="p" variant="header-1" role="status">
        Заявка отправлена.
      </Text>
    );
  }

  const blocks: Record<Block, ReactNode> = {
    consent: (
      <div className="register__consent">
        {missing ? (
          <>
            <Checkbox size="l" checked={consent} onUpdate={setConsent} />
            <span>Я принимаю</span>
          </>
        ) : (
          <Checkbox size="l" checked={consent} onUpdate={setConsent}>
            Я принимаю условия использования
          </Checkbox>
        )}
        <Button view="flat-info" size="m" onClick={() => setTermsOpen(true)}>
          {missing ? 'условия' : 'Прочитать условия'}
        </Button>
      </div>
    ),
    submit: (
      <Button type="submit" view="action" size="l">
        Отправить заявку
      </Button>
    ),
    format: (
      <div>
        {!missing && (
          <label className="register__label" htmlFor="register-format">
            Формат
          </label>
        )}
        <Select
          id="register-format"
          size="l"
          width="max"
          placeholder="Формат"
          options={FORMAT_OPTIONS}
          value={values.format ? [values.format] : []}
          onUpdate={([format]) => setValues((v) => ({ ...v, format }))}
          validationState={triedSubmit && errors.format ? 'invalid' : undefined}
          errorMessage={triedSubmit ? errors.format : undefined}
        />
      </div>
    ),
    ...Object.fromEntries(
      FIELDS.map((f) => {
        const showError = (touched[f.id] || triedSubmit) && errors[f.id];
        return [
          f.id,
          <div key={f.id}>
            {/* Fault: placeholder only, it disappears once you type */}
            {!missing && (
              <label className="register__label" htmlFor={`register-${f.id}`}>
                {f.label}
              </label>
            )}
            <TextInput
              id={`register-${f.id}`}
              type={f.type}
              size="l"
              placeholder={f.label}
              value={values[f.id]}
              onUpdate={(value) => setValues((v) => ({ ...v, [f.id]: value }))}
              onBlur={() => setTouched((t) => ({ ...t, [f.id]: true }))}
              // Fault: autofocus lands on the second field, so the name ends up in «Email»
              autoFocus={f.id === (faults.stealAutofocus ? 'email' : 'name')}
              validationState={showError ? 'invalid' : undefined}
              errorMessage={showError ? errors[f.id] : undefined}
            />
          </div>,
        ];
      })
    ) as Record<TextField, ReactNode>,
  };

  const order = faults.reverseOrder ? SHUFFLED_ORDER : VISUAL_ORDER;

  return (
    <>
      <Text as="h2" variant="display-1" className="register__title">
        Заявка на доклад
      </Text>
      <form
        className="register"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTriedSubmit(true);
          if (fieldsValid && consent) setSubmitted(true);
        }}
      >
        {order.map((block) => (
          <div key={block} style={{ order: VISUAL_ORDER.indexOf(block) }}>
            {blocks[block]}
          </div>
        ))}
        {triedSubmit && !consent && (
          <Text color="danger" style={{ order: VISUAL_ORDER.length }}>
            Примите условия использования
          </Text>
        )}
      </form>

      <DemoDialog open={termsOpen} onClose={() => setTermsOpen(false)} titleId="terms-title">
        <div className="register__terms">
          <Text as="h2" variant="subheader-3" id="terms-title">
            Условия использования
          </Text>
          <Text as="p">
            Мы храним только то, что вы ввели в этой форме, и удаляем всё при сбросе стенда.
            Никаких писем и рассылок.
          </Text>
          <Button view="action" size="l" onClick={() => setTermsOpen(false)}>
            Понятно
          </Button>
        </div>
      </DemoDialog>
    </>
  );
};

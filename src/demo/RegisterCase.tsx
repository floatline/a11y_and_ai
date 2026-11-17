import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Button, Checkbox, Select, Text, TextInput } from '@gravity-ui/uikit';
import { useDemo } from '../hooks/useDemo';
import { DemoDialog } from './DemoDialog';
import './demo-cases.css';

type TextField = 'name' | 'email' | 'topic';
type Field = TextField | 'format';
type Block = Field | 'consent' | 'submit';

// The label is for screen readers only (.sr-only), sighted users see an example in the field.
const FIELDS: { id: TextField; label: string; example: string; type: 'text' | 'email'; autoComplete: string }[] = [
  { id: 'name', label: 'Имя', example: 'Иванов Иван Иванович', type: 'text', autoComplete: 'name' },
  { id: 'email', label: 'Email', example: 'ivan@example.com', type: 'email', autoComplete: 'email' },
  { id: 'topic', label: 'Тема доклада', example: 'Доступность и ИИ на практике', type: 'text', autoComplete: 'off' },
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

  // In the accessible version the consent error is tied to its checkbox, like the field errors.
  const consentError = triedSubmit && !consent && !missing;

  const blocks: Record<Block, ReactNode> = {
    consent: (
      <div className="register__consent">
        {missing ? (
          <>
            <Checkbox size="l" checked={consent} onUpdate={setConsent} />
            <span>Я принимаю</span>
          </>
        ) : (
          <Checkbox
            size="l"
            checked={consent}
            onUpdate={setConsent}
            id="register-consent"
            controlProps={{
              'aria-invalid': consentError || undefined,
              'aria-describedby': consentError ? 'register-consent-error' : undefined,
            }}
          >
            Я принимаю условия использования
          </Checkbox>
        )}
        <Button view="flat-info" size="m" onClick={() => setTermsOpen(true)}>
          {missing ? 'условия' : 'Прочитать условия'}
        </Button>
        {triedSubmit && !consent && (
          <Text id="register-consent-error" color="danger" className="register__consent-error">
            Примите условия использования
          </Text>
        )}
      </div>
    ),
    submit: (
      <Button type="submit" view="action" size="l">
        Отправить заявку
      </Button>
    ),
    format: (
      <>
        <label className="sr-only" htmlFor={'register-format'}>
          Формат
        </label>
        <Select
          id="register-format"
          size="l"
          width="max"
          placeholder="Доклад или воркшоп"
          options={FORMAT_OPTIONS}
          value={values.format ? [values.format] : []}
          onUpdate={([format]) => setValues((v) => ({ ...v, format }))}
          validationState={triedSubmit && errors.format ? 'invalid' : undefined}
          errorMessage={triedSubmit ? errors.format : undefined}
        />
      </>
    ),
    ...Object.fromEntries(
      FIELDS.map((f) => {
        const showError = (touched[f.id] || triedSubmit) && errors[f.id];
        return [
          f.id,
          <Fragment key={f.id}>
            {/* Linked in both modes: NVDA must always hear the field name; the form's faults are order, autofocus and focus */}
            <label className="sr-only" htmlFor={`register-${f.id}`}>
              {f.label}
            </label>
            <TextInput
              id={`register-${f.id}`}
              type={f.type}
              size="l"
              placeholder={f.example}
              autoComplete={f.autoComplete}
              controlProps={{ 'aria-required': true }}
              value={values[f.id]}
              onUpdate={(value) => setValues((v) => ({ ...v, [f.id]: value }))}
              onBlur={() => setTouched((t) => ({ ...t, [f.id]: true }))}
              // Fault: autofocus lands on the second field, so the name ends up in «Email»
              autoFocus={f.id === (faults.stealAutofocus ? 'email' : 'name')}
              validationState={showError ? 'invalid' : undefined}
              errorMessage={showError ? errors[f.id] : undefined}
            />
          </Fragment>,
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
      <Text as="p" color="secondary" className="register__note">
        Все поля обязательны.
      </Text>
      <form
        className="register"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTriedSubmit(true);
          if (fieldsValid && consent) {
            setSubmitted(true);
            return;
          }
          // Accessible version: move focus to the first error, otherwise a screen reader user hears nothing
          // after pressing the button. The broken version leaves focus on the button.
          if (missing) return;
          const firstInvalid = VISUAL_ORDER.find((b) => (b === 'consent' ? !consent : errors[b as Field]));
          if (firstInvalid) document.getElementById(`register-${firstInvalid}`)?.focus();
        }}
      >
        {order.map((block) => (
          <div key={block} style={{ order: VISUAL_ORDER.indexOf(block) }}>
            {blocks[block]}
          </div>
        ))}
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

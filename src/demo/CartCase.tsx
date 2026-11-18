import { useEffect, useState, type ReactNode, type SVGProps } from 'react';
import { Button, Card, Text } from '@gravity-ui/uikit';
import { useDemo } from '../hooks/useDemo';
import { DemoDialog } from './DemoDialog';
import type { Progress } from './cases';
import './demo-cases.css';

interface Item {
  id: string;
  title: string;
  price: number;
  qty: number;
  /** Merch: the picture is the only thing that says what the item is. */
  image?: { src: string; alt: string };
}

type Qty = (id: string) => number;

const MUG = 'merch-2';

const SHOPS = {
  tickets: {
    title: 'Билеты на конференцию',
    seed: [
      { id: 'speaker', title: 'Билет спикера', price: 0, qty: 1 },
      { id: 'guest', title: 'Гость +1', price: 5000, qty: 0 },
      { id: 'party', title: 'Афтерпати', price: 2000, qty: 1 },
    ] as Item[],
    progress: (qty: Qty, ordered: boolean): Progress => ({
      steps: [qty('guest') === 1, qty('party') === 0, ordered],
      // The order should be exactly: own ticket, one guest, no afterparty.
      mistakes: ordered ? Number(qty('guest') !== 1) + Number(qty('party') > 0) + Number(qty('speaker') !== 1) : 0,
      done: ordered,
    }),
  },
  merch: {
    title: 'Мерч конференции',
    seed: [
      { id: 'merch-1', title: 'Мерч №1', price: 3500, qty: 0, image: { src: `${import.meta.env.BASE_URL}merch/hoodie.svg`, alt: 'Зелёное худи с капюшоном' } },
      { id: MUG, title: 'Мерч №2', price: 900, qty: 0, image: { src: `${import.meta.env.BASE_URL}merch/mug.svg`, alt: 'Синяя кружка с надписью a11y' } },
      { id: 'merch-3', title: 'Мерч №3', price: 1500, qty: 0, image: { src: `${import.meta.env.BASE_URL}merch/tshirt.svg`, alt: 'Красная футболка с надписью a11y' } },
    ] as Item[],
    progress: (qty: Qty, ordered: boolean): Progress => ({
      steps: [qty(MUG) > 0, ordered],
      mistakes: ordered ? Number(qty(MUG) === 0) + qty('merch-1') + qty('merch-3') : 0,
      done: ordered,
    }),
  },
};

const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

// Own SVG instead of Gravity icons, so the nestedSvg fault can give it a junk <title>.
const Glyph = ({ d, junk, ...rest }: { d: string; junk?: string } & SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    focusable="false"
    role={junk ? 'img' : undefined}
    aria-hidden={junk ? undefined : true}
    {...rest}
  >
    {junk && <title>{junk}</title>}
    <path d={d} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const MINUS = 'M3 8h10';
const PLUS = 'M3 8h10M8 3v10';
const TRASH = 'M3 4h10M6.5 4V2.5h3V4M4.5 4l.7 9.5h5.6l.7-9.5';

export const CartCase = ({ shop }: { shop: keyof typeof SHOPS }) => {
  const { faults, report } = useDemo();
  const missing = faults.missingNames;
  const nested = faults.nestedSvg;
  const { title, seed, progress } = SHOPS[shop];
  const [items, setItems] = useState(seed);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const qty = (id: string) => items.find((i) => i.id === id)?.qty ?? 0;
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  useEffect(() => {
    report(progress((id) => items.find((i) => i.id === id)?.qty ?? 0, ordered));
  }, [items, ordered, progress, report]);

  const change = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = Math.max(0, item.qty + delta);
    setItems((list) => list.map((i) => (i.id === id ? { ...i, qty: next } : i)));
    setAnnouncement(`${item.title}: ${next} шт. Итого: ${rub(total + item.price * (next - item.qty))}`);
  };
  const remove = (id: string) => change(id, -qty(id));

  const iconButton = (label: string, glyph: string, junk: string, onClick: () => void, svgOnly = false) =>
    svgOnly ? (
      // Fault: a bare clickable <svg>, not a button: no focus, no role, no name — mouse and touch only.
      <Glyph
        className="cart__svg-button"
        d={glyph}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      />
    ) : (
      <Button
        view="outlined"
        size="m"
        aria-label={missing ? undefined : label}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <Glyph d={glyph} junk={nested ? junk : undefined} />
      </Button>
    );

  const card = (item: Item): ReactNode => {
    const name = item.image ? `${item.title}, ${item.image.alt.toLowerCase()}` : item.title;
    return (
      <>
        {item.image && (
          // Fault: alt="" hides an informative image from screen readers
          <img className="cart__image" src={item.image.src} alt={faults.emptyAlts ? '' : item.image.alt} width={64} height={64} />
        )}
        <div className="cart__info">
          <Text variant="subheader-3">{item.title}</Text>
          <Text color="secondary">{rub(item.price)}</Text>
        </div>
        <div className="cart__controls">
          {iconButton(`Уменьшить количество: ${name}, сейчас ${item.qty}`, MINUS, 'icon-minus-24', () =>
            change(item.id, -1)
          )}
          <Text className="cart__qty">{item.qty} шт.</Text>
          {iconButton(`Увеличить количество: ${name}, сейчас ${item.qty}`, PLUS, 'icon-plus-24', () =>
            change(item.id, 1)
          )}
          {iconButton(`Убрать из корзины: ${name}`, TRASH, 'ic_trash_outline', () => remove(item.id), faults.svgButton)}
        </div>
      </>
    );
  };

  return (
    <>
      <Text as="h2" variant="display-1" className="cart__title">
        {title}
      </Text>
      <ul className="cart" role="list">
        {items.map((item) => (
          <li key={item.id}>
            {nested ? (
              // Fault: the whole card is clickable and focusable (tap adds one more) around the real buttons.
              // No role="button" on purpose: with it screen readers treat the card as a leaf and never reach the buttons.
              // Plain div: Gravity Card ignores onClick unless it is an action card, which is a button again.
              // No tabIndex either: a focusable card made NVDA activate the card instead of the +/− inside it.
              <div className="cart__item_clickable" onClick={() => change(item.id, 1)}>
                <Card className="cart__item">{card(item)}</Card>
              </div>
            ) : (
              <Card className="cart__item">{card(item)}</Card>
            )}
          </li>
        ))}
      </ul>
      {/* Quantity and total are plain text: the accessible version says what changed, the broken one stays silent. */}
      <p className="sr-only" aria-live="polite">
        {missing ? '' : announcement}
      </p>
      <div className="cart__footer">
        <Text variant="subheader-3">Итого: {rub(total)}</Text>
        <Button view="action" size="l" disabled={total === 0} onClick={() => setConfirmOpen(true)}>
          Оформить заказ
        </Button>
      </div>

      <DemoDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} titleId="order-title">
        <div className="cart__confirm">
          <Text as="h2" variant="subheader-3" id="order-title">
            Оформить заказ на {rub(total)}?
          </Text>
          <div className="cart__confirm-actions">
            <Button view="flat" size="l" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button
              view="action"
              size="l"
              onClick={() => {
                setConfirmOpen(false);
                setOrdered(true);
              }}
            >
              Оформить
            </Button>
          </div>
        </div>
      </DemoDialog>
    </>
  );
};

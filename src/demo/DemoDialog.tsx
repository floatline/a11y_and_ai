import type { ReactNode } from 'react';
import { Modal } from '@gravity-ui/uikit';
import { useDemo } from '../hooks/useDemo';
import './demo.css';

interface DemoDialogProps {
  open: boolean;
  onClose: () => void;
  /** id of the heading inside children that names the dialog */
  titleId: string;
  children: ReactNode;
}

// Gravity Modal always traps focus, so the broken variant is a plain overlay:
// no focus trap, no scroll lock, no focus return, the page behind stays clickable.
export const DemoDialog = ({ open, onClose, titleId, children }: DemoDialogProps) => {
  const { faults } = useDemo();
  const labelledBy = faults.missingNames ? undefined : titleId;

  if (!faults.brokenModal) {
    return (
      // disablePortal keeps the dialog inside .demo-surface, so fault styles and the blank screen reach it
      // initialFocus={0}: the first field or button, not the whole dialog box, so NVDA lands where the user acts
      <Modal open={open} onClose={onClose} aria-labelledby={labelledBy} initialFocus={0} disablePortal>
        {open && children}
      </Modal>
    );
  }

  if (!open) return null;
  return (
    <div
      className="demo-dialog"
      role="dialog"
      aria-labelledby={labelledBy}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="demo-dialog__content">{children}</div>
    </div>
  );
};

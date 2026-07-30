import { forwardRef } from "react";

interface DesktopIconProps {
  label: string;
  icon: string;
  onOpen: () => void;
}

/**
 * Forwards its ref to the underlying `<button>` so `Desktop` can return focus
 * here after a window closes (see `Desktop.tsx`'s focus-return effect).
 */
const DesktopIcon = forwardRef<HTMLButtonElement, DesktopIconProps>(function DesktopIcon(
  { label, icon, onOpen },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      aria-label={label}
      /* `.desktop-icon` is unlayered CSS in index.css. Tailwind utilities cannot undo
         98.css's button styling here — see the cascade note in Task 1, Step 5. */
      className="desktop-icon"
    >
      <span aria-hidden="true" className="text-4xl">
        {icon}
      </span>
      <span className="text-center text-xs leading-tight">{label}</span>
    </button>
  );
});

export default DesktopIcon;

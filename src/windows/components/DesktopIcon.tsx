interface DesktopIconProps {
  /** DOM id, e.g. `icon-projects` — `Window.tsx` looks this up by id to return focus here
   *  after this window closes (see the comment on its Close/Escape handlers). */
  id: string;
  label: string;
  icon: string;
  onOpen: () => void;
}

export default function DesktopIcon({ id, label, icon, onOpen }: DesktopIconProps) {
  return (
    <button
      id={id}
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
}

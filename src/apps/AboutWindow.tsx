import { profile } from "../content/profile";

export default function AboutWindow() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-1 text-sm">
      <h2 className="text-lg font-bold">{profile.name}</h2>
      <p className="text-xs">{profile.headline}</p>
      <p>{profile.summary}</p>
      <p>
        This site is a Windows 95 desktop in the browser. The windows are draggable,
        focusable and minimisable, all driven by a hand-written reducer — open a few at
        once and stack them.
      </p>
    </div>
  );
}

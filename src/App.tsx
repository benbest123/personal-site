import PointerTrail from "./cursor/PointerTrail";
import Desktop from "./windows/components/Desktop";
import { WindowsProvider } from "./windows/WindowsProvider";

export default function App() {
  return (
    <>
      <WindowsProvider>
        <Desktop />
      </WindowsProvider>
      {/* Outside the provider: the trail is pure decoration and knows nothing about
          windows. It is a fixed overlay, so it sits outside `<main>` and is unaffected
          by the `inert` the desktop applies to itself on mobile. */}
      <PointerTrail />
    </>
  );
}

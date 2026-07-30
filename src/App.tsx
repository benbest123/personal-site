import Desktop from "./windows/components/Desktop";
import { WindowsProvider } from "./windows/WindowsProvider";

export default function App() {
  return (
    <WindowsProvider>
      <Desktop />
    </WindowsProvider>
  );
}

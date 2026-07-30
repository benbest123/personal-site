import { DESKTOP_ORDER, REGISTRY } from "../registry";
import { useWindows } from "../useWindows";
import Window from "./Window";

/**
 * Rendered in the fixed `DESKTOP_ORDER`, never in the reducer's array order. Stacking is
 * still fully determined by array order via `zIndex` below — but if the DOM order tracked
 * the array too, focusing a background window would reorder this keyed list and React
 * would move that window's DOM node. Moving the element that currently holds pointer
 * capture implicitly releases it (Pointer Events spec), which would silently break a drag
 * that starts on a window brought forward by the same gesture. A fixed DOM order sidesteps
 * that entirely: only `style.zIndex` changes, never which node sits where in the tree.
 */
export default function WindowLayer() {
  const { windows, focused } = useWindows();

  return (
    <>
      {DESKTOP_ORDER.map(id => {
        const instance = windows.find(w => w.id === id);
        if (!instance || instance.minimised) return null;
        const zIndex = windows.indexOf(instance) + 1;
        const def = REGISTRY[id];
        const Body = def.component;
        return (
          <Window
            key={id}
            id={id}
            title={def.title}
            position={instance.position}
            size={instance.size}
            zIndex={zIndex}
            focused={focused === id}
          >
            <Body />
          </Window>
        );
      })}
    </>
  );
}

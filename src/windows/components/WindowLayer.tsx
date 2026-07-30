import { REGISTRY } from "../registry";
import { useWindows } from "../useWindows";
import Window from "./Window";

export default function WindowLayer() {
  const { windows, focused } = useWindows();

  return (
    <>
      {windows.map((instance, index) => {
        if (instance.minimised) return null;
        const def = REGISTRY[instance.id];
        const Body = def.component;
        return (
          <Window
            key={instance.id}
            id={instance.id}
            title={def.title}
            position={instance.position}
            size={instance.size}
            zIndex={index + 1}
            focused={focused === instance.id}
          >
            <Body />
          </Window>
        );
      })}
    </>
  );
}

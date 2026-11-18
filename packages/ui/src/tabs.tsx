import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export type TabItem = { id: string; label: string; content: ReactNode };

export function Tabs({
  items,
  label,
  defaultId,
  onChange,
}: {
  items: TabItem[];
  label: string;
  defaultId?: string;
  onChange?: (id: string) => void;
}) {
  const baseId = useId();
  const [active, setActive] = useState(defaultId ?? items[0]?.id ?? "");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === active);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    const target = items[next];
    if (!target) return;
    select(target.id);
    refs.current[next]?.focus();
  };

  const current = items.find((item) => item.id === active) ?? items[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface-2 p-1"
      >
        {items.map((item, index) => {
          const selected = item.id === current?.id;
          return (
            <button
              key={item.id}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selected ? "bg-surface text-fg shadow-e1" : "text-fg-muted hover:text-fg"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {current ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${current.id}`}
          aria-labelledby={`${baseId}-tab-${current.id}`}
          tabIndex={0}
          className="mt-4"
        >
          {current.content}
        </div>
      ) : null}
    </div>
  );
}
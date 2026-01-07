import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  label?: string;
};

export default function CategoryInput({
  value,
  onChange,
  suggestions,
  placeholder = "Ej: Mercado, Arriendo, Netflix…",
  hint = "Puedes escribir libremente. Lo que escribas quedará guardado como categoría.",
  disabled,
  label = "Categoría"
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const items = suggestions
      .map((s) => s.trim())
      .filter(Boolean);

    if (!q) return items.slice(0, 8);

    return items
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 8);
  }, [value, suggestions]);

  useEffect(() => {
    function onDocDown(e: MouseEvent | TouchEvent) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, []);

  function selectItem(item: string) {
    onChange(item);
    setOpen(false);
    // devuelve foco al input (nice en mobile)
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" && filtered.length) {
        setOpen(true);
        setActive(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowDown") {
      setActive((a) => Math.min(a + 1, filtered.length - 1));
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowUp") {
      setActive((a) => Math.max(a - 1, 0));
      e.preventDefault();
      return;
    }

    if (e.key === "Enter") {
      const item = filtered[active];
      if (item) selectItem(item);
      e.preventDefault();
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>

      <div ref={rootRef} className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoCorrect="off"
          autoCapitalize="sentences"
          className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
        />

        <p className="mt-1 text-[11px] text-gray-500">{hint}</p>

        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-[42px] z-50 border bg-white shadow-sm">
            <ul className="max-h-52 overflow-auto py-1">
              {filtered.map((item, idx) => {
                const isActive = idx === active;
                return (
                  <li key={item}>
                    <button
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm ${isActive ? "bg-gray-100" : "bg-white"
                        }`}
                      onMouseDown={(e) => e.preventDefault()} // evita blur antes del click
                      onClick={() => selectItem(item)}
                    >
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>

  );
}

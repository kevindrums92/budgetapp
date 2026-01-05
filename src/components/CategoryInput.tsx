import { useId } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  categories: string[];
  label?: string;
};

export default function CategoryInput({ value, onChange, categories, label = "Categoría" }: Props) {
  const listId = useId();

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        placeholder="Ej: Mercado, Transporte..."
        className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
      />

      <datalist id={listId}>
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <p className="mt-1 text-xs text-gray-500">
        Puedes escribir libremente. Lo que escribas quedará guardado como categoría.
      </p>
    </div>
  );
}

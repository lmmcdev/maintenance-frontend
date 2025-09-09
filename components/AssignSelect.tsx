import { searchPersons, type Person } from "@/lib/api/client";
import React, { useEffect, useState } from "react";

function AssignSelect({
  apiBase,
  disabled,
  onAssign,
  limit = 10,
}: {
  apiBase: string;
  disabled?: boolean;
  onAssign: (personId: string) => Promise<void> | void;
  limit?: number;
}) {
  const [options, setOptions] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");

  async function loadDefault() {
    try {
      setLoading(true);
      const items = await searchPersons({ apiBase }, "", limit);
      setOptions(items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDefault(); // carga inicial
  }, [apiBase, limit]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const personId = e.target.value;
    setValue(personId);
    if (personId) {
      await onAssign(personId);
      //setValue(e.target.value); // vuelve a placeholder post-asignación
    }
  }

  return (
    <select
      className="rounded-xl border border-gray-300 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm w-full"
      value={value}
      onChange={handleChange}
      onFocus={() => {
        if (!options.length) loadDefault(); // re-carga si está vacío
      }}
      disabled={disabled || loading}
    >
      <option value="">{loading ? "Cargando…" : "Asignar a…"}</option>
      {options.map((p) => (
        <option key={p.id} value={p.id}>
          {p.firstName} {p.lastName}
        </option>
      ))}
    </select>
  );
}

export default AssignSelect;

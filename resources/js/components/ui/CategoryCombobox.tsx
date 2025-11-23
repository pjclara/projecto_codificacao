import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

export default function CategoryCombobox({
  kind,
  value,
  onChange,
  onCreate,
  selectedLabel,
}: {
  kind: string;
  value: number | null;
  onChange: (id: number | null) => void;
  // onCreate can optionally accept a specialty id for the new category
  onCreate: (name: string, specialty_id?: number | null) => Promise<void>;
  // optional display label to prefill the input when editing
  selectedLabel?: string | null;
}) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<{ id: number; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const ref = useRef<HTMLDivElement | null>(null);
  const [specialties, setSpecialties] = useState<{ id: number; name: string }[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(null);

  // simple debounce
  const useDebounce = <T,>(value: T, delay = 300) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const id = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
  };

  const debouncedQ = useDebounce(q, 250);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        // if query empty, preload popular/recent categories
        const params: any = { kind };
        if (debouncedQ) params.q = debouncedQ;
        const res = await axios.get('/api/categories', {
          params: { kind: 'diagnosticos' },
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setItems(data);
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [debouncedQ, kind]);

  // load specialties for optional association when creating a category
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/specialties');
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data ?? [];
        setSpecialties(data);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    // reset highlight when items change
    setHighlight(items.length ? 0 : -1);
  }, [items]);

  // when an external selected label is provided (edit case), prefill the input
  useEffect(() => {
    if (selectedLabel && q === '') {
      setQ(selectedLabel);
    }
    // only respond when selectedLabel changes or q is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLabel]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0 && items[highlight]) {
        const it = items[highlight];
        onChange(it.id);
        setQ(it.name);
        setOpen(false);
      }
    }
  };

  return (
    <div ref={ref} className="mb-4 relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          placeholder="Buscar ou criar categoria..."
          className="w-full rounded border p-2"
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-expanded={open}
        />
        <button
          type="button"
          className="rounded bg-blue-500 px-3 py-2 text-white"
          onClick={async () => {
            const name = q.trim();
            if (!name) return;
            await onCreate(name, selectedSpecialtyId ?? null);
            setQ('');
            setOpen(false);
          }}
        >
          Criar
        </button>
      </div>

      <div className="mt-2">
        <label className="mb-1 block text-sm">Especialidade (opcional)</label>
        <select
          value={selectedSpecialtyId ?? ''}
          onChange={(e) => setSelectedSpecialtyId(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="w-full rounded border p-2"
        >
          <option value="">-- Nenhuma --</option>
          {specialties.map((s) => (
            <option key={s.id} value={String(s.id)}>{s.name}</option>
          ))}
        </select>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded border bg-white shadow">
          {loading ? (
            <div className="p-2 text-sm text-gray-600">Buscando...</div>
          ) : items.length === 0 ? (
            <div className="p-2 text-sm text-gray-600">Nenhuma categoria</div>
          ) : (
            <ul>
              {items.map((it, i) => (
                <li
                  key={it.id}
                  className={`cursor-pointer p-2 hover:bg-gray-50 ${i === highlight ? 'bg-gray-100' : ''}`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    onChange(it.id);
                    setQ(it.name);
                    setOpen(false);
                  }}
                >
                  {it.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

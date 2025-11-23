import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, FileText, Folder, Star } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface Codigo {
  id: number;
  codigo: string;
  descricao_longa: string;
  descricao_curta: string;
}

interface Categoria {
  id: number;
  name: string;
  specialty?: { name: string };
}

interface Diagnostico {
  id: number;
  nome: string | null;
  category?: Categoria | string | null;
  specialties?: Categoria | string | null;
  codigo?: Codigo | null;
  notes?: string | null;
}

interface DiagnosticosPublicosProps {
  search: string;
  favoritos?: { 
    id: number; 
    codigo: string; 
    origem?: string; 
    tabela_origem?: string }[];
}

const normalize = (s: string) =>
  s
    ?.normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase() ?? '';

const DiagnosticosPublicos: React.FC<DiagnosticosPublicosProps> = ({ search, favoritos = [] }) => {
  const [items, setItems] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSpecs, setOpenSpecs] = useState<Record<string, boolean>>({});
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [filterCat, setFilterCat] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [copiado, setCopiado] = useState<number | null>(null);

  const favCodes = new Set(favoritos.map((f) => f.codigo));

  useEffect(() => {
    let active = true;
    axios
      .get('/api/diagnosticos-publicos')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (active) setItems(data);
      })
      .catch(() => active && setError('Erro ao carregar diagnósticos'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const termo = normalize(search);

  const filtrados = useMemo(() => {
    return items.filter((d) => {
      const nome = normalize(d.nome ?? '');
      if (nome.includes(termo)) return true;

      if (d.codigo) {
        return (
          normalize(d.codigo.codigo).includes(termo) ||
          normalize(d.codigo.descricao_longa).includes(termo) ||
          normalize(d.codigo.descricao_curta).includes(termo)
        );
      }
      return false;
    });
  }, [items, termo]);

  const tree = useMemo(() => {
    type Tree = Record<string, Record<string, Diagnostico[]>>;
    const t: Tree = {};

    for (const d of filtrados) {
      const catObj = typeof d.category === 'object' && d.category !== null ? d.category : null;
      const categoryName = catObj?.name ?? (typeof d.category === 'string' ? d.category : 'Sem categoria');

      const specialtiesList: string[] = [];

      if (catObj?.specialty?.name) specialtiesList.push(catObj.specialty.name);

      if (Array.isArray(d.specialties)) {
        for (const s of d.specialties) {
          if (typeof s === 'object' && s !== null) specialtiesList.push(s.name ?? 'Sem especialidade');
          else if (typeof s === 'string') specialtiesList.push(s);
        }
      } else if (typeof d.specialties === 'string') {
        specialtiesList.push(d.specialties);
      }

      if (specialtiesList.length === 0) specialtiesList.push('Sem especialidade');

      for (const specName of specialtiesList) {
        if (!t[specName]) t[specName] = {};
        if (!t[specName][categoryName]) t[specName][categoryName] = [];
        t[specName][categoryName].push(d);
      }
    }

    return t;
  }, [filtrados]);

  const specialtyKeys = useMemo(() => {
    return Object.keys(tree).sort((a, b) => {
      if (a === 'Sem especialidade') return 1;
      if (b === 'Sem especialidade') return -1;
      return a.localeCompare(b);
    });
  }, [tree]);

  const toggleSpec = (spec: string) => {
    setOpenSpecs((prev) => ({ ...prev, [spec]: !prev[spec] }));
  };

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleCopy = (id: number, codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1500);
  };

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (filtrados.length === 0) return <p className="text-sm text-gray-500">Nenhum diagnóstico encontrado.</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Filtrar categorias..."
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <input
          type="text"
          placeholder="Filtrar especialidades..."
          value={filterSpec}
          onChange={(e) => setFilterSpec(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="space-y-2">
        {specialtyKeys
          .filter((spec) => normalize(spec).includes(normalize(filterSpec)))
          .map((spec) => (
            <div key={spec}>
              <button
                onClick={() => toggleSpec(spec)}
                className="flex w-full items-center gap-2 text-lg font-bold text-gray-800 transition hover:text-blue-500 dark:text-gray-100"
              >
                {openSpecs[spec] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Folder size={16} className="text-yellow-500" />
                {spec}
              </button>

              <AnimatePresence>
                {openSpecs[spec] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 ml-5 space-y-1 border-l border-gray-300 pl-3"
                  >
                    {Object.keys(tree[spec])
                      .filter((cat) => normalize(cat).includes(normalize(filterCat)))
                      .map((cat) => {
                        const catKey = `${spec}||${cat}`;
                        const diagnos = tree[spec][cat];
                        return (
                          <div key={catKey}>
                            <button
                              onClick={() => toggleCat(catKey)}
                              className="flex w-full items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-blue-400 dark:text-gray-200"
                            >
                              {openCats[catKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <Folder size={14} className="text-amber-600" />
                              {cat} <span className="text-xs text-gray-500">({diagnos.length})</span>
                            </button>

                            <AnimatePresence>
                              {openCats[catKey] && (
                                <motion.ul
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="mt-1 ml-6 space-y-2"
                                >
                                  {diagnos.map((d) => (
                                    <li
                                      key={d.id}
                                      className="flex items-start gap-2 rounded-md border border-gray-200 bg-white p-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900"
                                    >
                                      <FileText size={14} className="mt-1 text-gray-500" />
                                      <div>
                                        {d.codigo && (
                                          <p className="relative inline-block font-medium text-gray-800 dark:text-gray-100">
                                            {d.codigo.descricao_longa}{' '}
                                            <span
                                              className="ml-1 cursor-pointer rounded bg-gray-100 px-1 py-0.5 text-xs transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                              onClick={() => handleCopy(d.id, d.codigo!.codigo)}
                                            >
                                              {d.codigo.codigo}
                                              <AnimatePresence>
                                                {copiado === d.id && (
                                                  <motion.span
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: -10 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-black px-1.5 py-0.5 text-[10px] text-white shadow"
                                                  >
                                                    Copiado!
                                                  </motion.span>
                                                )}
                                              </AnimatePresence>
                                            </span>
                                            {favCodes.has(d.codigo.codigo) && (
                                              <Star size={12} className="ml-2 inline-block text-yellow-500" />
                                            )}
                                          </p>
                                        )}
                                        {d.notes && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Notas: <span className="italic">{d.notes}</span></p>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DiagnosticosPublicos;

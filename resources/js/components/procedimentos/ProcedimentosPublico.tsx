import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, FileText, Star } from 'lucide-react';

interface Codigo {
	id: number;
	codigo: string;
	descricao_longa: string;
}

interface Categoria {
	id: number;
	name: string;
	specialty?: { name: string };
}

interface Procedimento {
	id: number;
	nome: string;
	category?: Categoria | string | null;
	notes?: string | null;
	codigos: Codigo[];
}

interface ProcedimentosPublicosProps {
	search: string;
	favoritos?: { id: number; codigo: string; origem?: string; tabela_origem?: string }[];
}

const ProcedimentosPublicos: React.FC<ProcedimentosPublicosProps> = ({ search, favoritos = [] }) => {
	const [items, setItems] = useState<Procedimento[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [openSpecs, setOpenSpecs] = useState<Set<string>>(new Set());
	const [openCats, setOpenCats] = useState<Set<string>>(new Set());
	const [filterCat, setFilterCat] = useState('');
	const [filterSpec, setFilterSpec] = useState('');
	const [copiado, setCopiado] = useState<number | null>(null);

	const favCodes = new Set(favoritos.map((f) => f.codigo));

	useEffect(() => {
		let active = true;
		axios
			.get('/api/procedimentos-publicos')
			.then((res) => {
				const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
				if (active) setItems(data);
			})
			.catch(() => active && setError('Erro ao carregar procedimentos'))
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, []);

	if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;
	if (error) return <p className="text-sm text-red-500">{error}</p>;

	// 🔎 Filtro de busca
	const termo = search.toLowerCase();
	const filtrados = items.filter((p) => {
		if (p.nome && p.nome.toLowerCase().includes(termo)) return true;
		return p.codigos.some((c) =>
			c.codigo.toLowerCase().includes(termo) || c.descricao_longa.toLowerCase().includes(termo)
		);
	});

	if (filtrados.length === 0)
		return <p className="text-sm text-gray-500">Nenhum procedimento encontrado.</p>;

	// 📂 Construção da árvore
	type Tree = Record<string, Record<string, Procedimento[]>>;
	const tree: Tree = {};
	for (const p of filtrados) {
		const categoryObj = typeof p.category === 'object' ? p.category : null;
		const categoryName =
			categoryObj?.name ?? (typeof p.category === 'string' ? p.category : null) ?? 'Sem categoria';
		const specialtyName = categoryObj?.specialty?.name ?? 'Sem especialidade';

		tree[specialtyName] ??= {};
		tree[specialtyName][categoryName] ??= [];
		tree[specialtyName][categoryName].push(p);
	}

	const specialtyKeys = Object.keys(tree).sort((a, b) => {
		if (a === 'Sem especialidade') return 1;
		if (b === 'Sem especialidade') return -1;
		return a.localeCompare(b);
	});

	const toggleSpec = (spec: string) => {
		const newSet = new Set(openSpecs);
		newSet.has(spec) ? newSet.delete(spec) : newSet.add(spec);
		setOpenSpecs(newSet);
	};

	const toggleCat = (catKey: string) => {
		const newSet = new Set(openCats);
		newSet.has(catKey) ? newSet.delete(catKey) : newSet.add(catKey);
		setOpenCats(newSet);
	};

	const handleCopy = (codigoId: number, codigo: string) => {
		navigator.clipboard.writeText(codigo);
		setCopiado(codigoId);
		setTimeout(() => setCopiado(null), 1500);
	};

	return (
		<div className="space-y-6">
			{/* 🔍 Filtros */}
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

			{/* 🌳 Árvore completa */}
			<div className="space-y-2">
				{specialtyKeys
					.filter((spec) =>
						filterSpec.trim() === '' ? true : spec.toLowerCase().includes(filterSpec.toLowerCase())
					)
					.map((spec) => (
						<div key={spec}>
							{/* Especialidade */}
							<button
								onClick={() => toggleSpec(spec)}
								className="flex items-center gap-2 w-full font-bold text-lg text-gray-800 dark:text-gray-100 hover:text-blue-500 transition"
							>
								{openSpecs.has(spec) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
								<Folder size={16} className="text-yellow-500" />
								{spec}
							</button>

							<AnimatePresence>
								{openSpecs.has(spec) && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										transition={{ duration: 0.3 }}
										className="ml-5 mt-2 space-y-1 border-l border-gray-300 pl-3"
									>
										{Object.keys(tree[spec])
											.filter((cat) =>
												filterCat.trim() === '' ? true : cat.toLowerCase().includes(filterCat.toLowerCase())
											)
											.map((cat) => {
												const catKey = `${spec}||${cat}`;
												const procs = tree[spec][cat];
												return (
													<div key={catKey}>
														{/* Categoria */}
														<button
															onClick={() => toggleCat(catKey)}
															className="flex items-center gap-2 w-full text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-400 transition"
														>
															{openCats.has(catKey) ? (
																<ChevronDown size={14} />
															) : (
																<ChevronRight size={14} />
															)}
															<Folder size={14} className="text-amber-600" />
															{cat} <span className="text-xs text-gray-500">({procs.length})</span>
														</button>

														<AnimatePresence>
															{openCats.has(catKey) && (
																<motion.ul
																	initial={{ opacity: 0, height: 0 }}
																	animate={{ opacity: 1, height: 'auto' }}
																	exit={{ opacity: 0, height: 0 }}
																	transition={{ duration: 0.25 }}
																	className="ml-6 mt-1 space-y-2"
																>
																	{procs.map((p) => (
																		<li
																			key={p.id}
																			className="flex items-start gap-2 rounded-md border border-gray-200 bg-white p-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900"
																		>
																			<FileText size={14} className="text-gray-500 mt-1" />
																			<div>
																				<p className="font-medium text-gray-800 dark:text-gray-100">
																					{p.nome}
																				</p>

																				{/* Códigos */}
																				<div className="mt-1 flex flex-wrap gap-1 text-sm text-gray-600 dark:text-gray-400">
																					{p.codigos.map((c) => (
																							<span
																								key={c.id}
																								className="relative cursor-pointer rounded bg-gray-100 px-2 py-0.5 text-xs transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
																								onClick={() => handleCopy(c.id, c.codigo)}
																								title="Clique para copiar o código"
																							>
																								{c.codigo}
																								<AnimatePresence>
																									{copiado === c.id && (
																										<motion.span
																											initial={{ opacity: 0, y: -5 }}
																											animate={{ opacity: 1, y: -10 }}
																											exit={{ opacity: 0, y: -5 }}
																											transition={{ duration: 0.2 }}
																											className="absolute left-1/2 -translate-x-1/2 -top-5 bg-black text-white text-[10px] px-1.5 py-0.5 rounded shadow"
																										>
																											Copiado!
																										</motion.span>
																									)}
																								</AnimatePresence>
																								{favCodes.has(c.codigo) && (
																									<Star size={12} className="ml-2 inline-block text-yellow-500" />
																								)}
																							</span>
																						))}
																				</div>

																				{p.notes && (
																					<p className="text-xs text-gray-500 dark:text-gray-400">
																						Notas: <span className="italic">{p.notes}</span>
																					</p>
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

export default ProcedimentosPublicos;



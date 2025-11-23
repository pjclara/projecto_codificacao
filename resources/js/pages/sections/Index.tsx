import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FolderTree, Trash2, Edit, Plus, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Specialty {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
  kind: 'icd10cms' | 'icd10pcs';
  specialty_id?: number | null;
  notes?: string;
  specialty?: Specialty;
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse {
  data: Section[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export default function SectionsIndex() {
  const [sections, setSections] = useState<Section[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'icd10cms' | 'icd10pcs'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    kind: 'icd10cms' as 'icd10cms' | 'icd10pcs',
    specialty_id: null as number | null,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSections();
    fetchSpecialties();
  }, [currentPage, debouncedSearchTerm, filterKind]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, filterKind]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '15',
      });

      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filterKind !== 'all') params.append('kind', filterKind);

      const res = await axios.get(`/api/sections?${params.toString()}`);
      const data = res.data;

      setSections(data.data || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        per_page: data.per_page || 15,
        total: data.total || 0,
        from: data.from || 0,
        to: data.to || 0,
      });
    } catch (err) {
      toast.error('Erro ao carregar secções');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const res = await axios.get('/api/specialties');
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setSpecialties(data);
    } catch {
      // silent
    }
  };

  const handleCreate = () => {
    setEditingSection(null);
    setFormData({
      name: '',
      kind: 'icd10cms',
      specialty_id: null,
      notes: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      kind: section.kind,
      specialty_id: section.specialty_id ?? null,
      notes: section.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta secção?')) return;

    try {
      await axios.delete(`/api/sections/${id}`);
      toast.success('Secção removida com sucesso!');
      fetchSections();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover secção');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    try {
      if (editingSection) {
        await axios.put(`/api/sections/${editingSection.id}`, formData);
        toast.success('Secção atualizada com sucesso!');
      } else {
        await axios.post('/api/sections', formData);
        toast.success('Secção criada com sucesso!');
      }
      setShowModal(false);
      fetchSections();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Erro ao salvar secção');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSection(null);
    setFormData({
      name: '',
      kind: 'icd10cms',
      specialty_id: null,
      notes: '',
    });
    setFormErrors({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setCurrentPage(newPage);
    }
  };

  const stats = {
    total: pagination.total,
    icd10cms: sections.filter((s) => s.kind === 'icd10cms').length,
    icd10pcs: sections.filter((s) => s.kind === 'icd10pcs').length,
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <FolderTree className="text-indigo-500" size={32} />
            Gerenciar Secções
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Organize e gerencie as secções dos códigos ICD-10
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Total</div>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">ICD-10-CM</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.icd10cms}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">ICD-10-PCS</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.icd10pcs}</div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                💡 Dica: Use várias palavras para refinar a busca
              </p>
            </div>

            {/* Filter by Kind */}
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos os Tipos</option>
              <option value="icd10cms">ICD-10-CM</option>
              <option value="icd10pcs">ICD-10-PCS</option>
            </select>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={18} />
              Nova Secção
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : sections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhuma secção encontrada</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Especialidade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Notas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sections.map((section) => (
                    <tr
                      key={section.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {section.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            section.kind === 'icd10cms'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                          }`}
                        >
                          {section.kind === 'icd10cms' ? 'ICD-10-CM' : 'ICD-10-PCS'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {section.specialty?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                        {section.notes || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleEdit(section)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(section.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {pagination.from} a {pagination.to} de {pagination.total} secções
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.current_page === 1}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  ««
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  «
                </button>

                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  let pageNum;
                  if (pagination.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.current_page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.current_page >= pagination.last_page - 2) {
                    pageNum = pagination.last_page - 4 + i;
                  } else {
                    pageNum = pagination.current_page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded border transition ${
                        pagination.current_page === pageNum
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  »
                </button>
                <button
                  onClick={() => handlePageChange(pagination.last_page)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {editingSection ? 'Editar Secção' : 'Nova Secção'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      required
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>
                    )}
                  </div>

                  {/* Kind */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.kind}
                      onChange={(e) =>
                        setFormData({ ...formData, kind: e.target.value as 'icd10cms' | 'icd10pcs' })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      required
                    >
                      <option value="diagnosticos">Diagnósticos</option>
                      <option value="procedimentos">Procedimentos</option>
                    </select>
                    {formErrors.kind && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.kind[0]}</p>
                    )}
                  </div>

                  {/* Specialty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Especialidade
                    </label>
                    <select
                      value={formData.specialty_id ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialty_id: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">-- Nenhuma --</option>
                      {specialties.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.specialty_id && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.specialty_id[0]}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="Informações adicionais sobre a secção..."
                    />
                    {formErrors.notes && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.notes[0]}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      {editingSection ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

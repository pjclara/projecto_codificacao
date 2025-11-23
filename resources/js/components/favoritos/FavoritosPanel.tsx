import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';
import useFavoritos from './useFavoritos';
import { Star, Trash2, ChevronDown, ChevronRight, Folder, FolderOpen, Loader2, Users, UserMinus, UserPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { type SharedData } from '@/types';

interface Favorito {
  id: number;
  codigo: string;
  descricao: string;
  origem: string;
  category?: { id: number; name: string };
  specialty?: string;
  section?: string;
  users?: Array<{ id: number; name: string; email: string }>;
}

export default function FavoritosPanel() {
  const page = usePage<SharedData>();
  const authUser = page.props.auth?.user;
  const { favoritos, loading, removeFavorito, getFavCodigo, getFavDescricao, attachUser, detachUser, getUsers } = useFavoritos();

  const [copiado, setCopiado] = useState<number | null>(null);
  const [copiadoModal, setCopiadoModal] = useState<number | null>(null);
  const [filtro, setFiltro] = useState('');
  const [abertoSpecialty, setAbertoSpecialty] = useState<Record<string, boolean>>({});
  const [abertoCategory, setAbertoCategory] = useState<Record<string, boolean>>({});
  const [abertoSection, setAbertoSection] = useState<Record<string, boolean>>({});
  const [selectedFavoritoForUsers, setSelectedFavoritoForUsers] = useState<number | null>(null);
  const [favoritoUsers, setFavoritoUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState<number | null>(null);
  const [showMyFavoritos, setShowMyFavoritos] = useState(false);
  const [myFavAbertoSpecialty, setMyFavAbertoSpecialty] = useState<Record<string, boolean>>({});
  const [myFavAbertoCategory, setMyFavAbertoCategory] = useState<Record<string, boolean>>({});
  const [myFavAbertoSection, setMyFavAbertoSection] = useState<Record<string, boolean>>({});

  // Mostrar spinner durante o carregamento
  if (loading) {
    return (
      <div className="mx-auto mb-8 w-full max-w-6xl">
        <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
          <Star className="text-yellow-500" /> Favoritos
        </h3>
        <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-gray-400" size={32} />
            <p className="text-sm text-gray-500 dark:text-gray-400">Carregando favoritos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!favoritos || favoritos.length === 0) return null;

  // Separar favoritos por tipo (Diagnósticos vs Procedimentos)
  const diagnosticos = favoritos.filter((f: any) => f.tabela_origem === 'icd10cms');
  const procedimentos = favoritos.filter((f: any) => f.tabela_origem === 'icd10pcs');

  // Estruturar favoritos hierarquicamente: Specialty → Category → Section
  const estruturarFavoritos = (favs: any[]) => {
    return favs.reduce((acc: any, fav: any) => {
      const specialtyKey = fav.specialty?? 'Sem Especialidade';
      const categoryKey = fav.category?.name ?? 'Sem Categoria';
      const sectionKey = fav.section ?? 'Outros';

      if (!acc[specialtyKey]) acc[specialtyKey] = {};
      if (!acc[specialtyKey][categoryKey]) acc[specialtyKey][categoryKey] = {};
      if (!acc[specialtyKey][categoryKey][sectionKey]) acc[specialtyKey][categoryKey][sectionKey] = [];

      acc[specialtyKey][categoryKey][sectionKey].push(fav);
      return acc;
    }, {});
  };

  const estruturadoDiagnosticos = estruturarFavoritos(diagnosticos);
  const estruturadoProcedimentos = estruturarFavoritos(procedimentos);

  const handleCopy = (id: number, codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiado(id);
    toast.success(`Código copiado: ${codigo}`, {
      position: 'bottom-right',
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    setTimeout(() => setCopiado(null), 1200);
  };

  const handleCopyModal = (id: number, codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiadoModal(id);
    toast.success(`Código copiado: ${codigo}`, {
      position: 'bottom-right',
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    setTimeout(() => setCopiadoModal(null), 1200);
  };

  const isUserAssociated = (fav: any): boolean => {
    if (!authUser || !fav.users) return false;
    return fav.users.some((u: any) => u.id === authUser.id);
  };

  const handleToggleUserAssociation = async (fav: any) => {
    if (!authUser) return;
    
    setLoadingToggle(fav.id);
    try {
      const isAssociated = isUserAssociated(fav);
      
      if (isAssociated) {
        // Remove user
        await detachUser(fav.id, authUser.id);
        toast.success('Removido de favoritos');
      } else {
        // Add user
        await attachUser(fav.id, authUser.id);
        toast.success('Adicionado a favoritos');
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.info('Já está em favoritos');
      } else {
        toast.error('Erro ao atualizar favorito');
        console.error('Error toggling user association:', error);
      }
    } finally {
      setLoadingToggle(null);
    }
  };

  const handleOpenUserModal = async (favoritoId: number) => {
    setSelectedFavoritoForUsers(favoritoId);
    setLoadingUsers(true);
    try {
      const users = await getUsers(favoritoId);
      setFavoritoUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      setFavoritoUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDetachUser = async (favoritoId: number, userId: number) => {
    try {
      await detachUser(favoritoId, userId);
      // Refetch users for the modal
      const users = await getUsers(favoritoId);
      setFavoritoUsers(users);
    } catch (error) {
      console.error('Error detaching user:', error);
    }
  };

  const toggleSpecialty = (k: string) => {
    setAbertoSpecialty((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const toggleCategory = (k: string) => {
    setAbertoCategory((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const toggleSection = (k: string) => {
    setAbertoSection((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const filtrar = (fav: any) => {
    const termo = filtro.toLowerCase();
    const codigo = (fav.codigo ?? getFavCodigo(fav) ?? '').toLowerCase();
    const descricao = (fav.descricao ?? getFavDescricao(fav) ?? '').toLowerCase();
    return codigo.includes(termo) || descricao.includes(termo);
  };

  const getMyFavoritos = (): any[] => {
    if (!authUser) return [];
    return favoritos.filter((fav: any) => isUserAssociated(fav));
  };

  const estruturarMyFavoritos = (favs: any[]) => {
    return favs.reduce((acc: any, fav: any) => {
      const specialtyKey = fav.specialty?? 'Sem Especialidade';
      const categoryKey = fav.category?.name ?? 'Sem Categoria';
      const sectionKey = fav.section ?? 'Outros';

      if (!acc[specialtyKey]) acc[specialtyKey] = {};
      if (!acc[specialtyKey][categoryKey]) acc[specialtyKey][categoryKey] = {};
      if (!acc[specialtyKey][categoryKey][sectionKey]) acc[specialtyKey][categoryKey][sectionKey] = [];

      acc[specialtyKey][categoryKey][sectionKey].push(fav);
      return acc;
    }, {});
  };

  const contarFavoritos = (obj: any): number => {
    if (Array.isArray(obj)) return obj.filter(filtrar).length;
    return Object.values(obj).reduce((sum: number, val: any) => sum + contarFavoritos(val), 0);
  };

  const renderHierarquia = (estruturado: any, tipo: 'diagnosticos' | 'procedimentos') => {
    const cores = tipo === 'diagnosticos' 
      ? { primary: 'blue', secondary: 'green' }
      : { primary: 'purple', secondary: 'pink' };

    return Object.keys(estruturado).map((specialtyKey) => {
      const specialtyData = estruturado[specialtyKey];
      const totalSpecialty = contarFavoritos(specialtyData);
      
      if (totalSpecialty === 0) return null;

      return (
        <div
          key={`${tipo}-${specialtyKey}`}
          className={`rounded-lg border border-${cores.primary}-200 bg-${cores.primary}-50/50 dark:bg-${cores.primary}-900/20 dark:border-${cores.primary}-800 overflow-hidden`}
        >
          {/* Cabeçalho Especialidade */}
          <button
            onClick={() => toggleSpecialty(`${tipo}-${specialtyKey}`)}
            className={`flex w-full items-center justify-between p-3 text-left font-semibold text-${cores.primary}-900 dark:text-${cores.primary}-200 hover:bg-${cores.primary}-100 dark:hover:bg-${cores.primary}-900/40 transition`}
          >
            <div className="flex items-center gap-2">
              {abertoSpecialty[`${tipo}-${specialtyKey}`] ? (
                <FolderOpen size={18} className={`text-${cores.primary}-600 dark:text-${cores.primary}-400`} />
              ) : (
                <Folder size={18} className={`text-${cores.primary}-600 dark:text-${cores.primary}-400`} />
              )}
              <span>{specialtyKey}</span>
              <span className={`text-xs font-normal text-${cores.primary}-700 dark:text-${cores.primary}-300`}>
                ({totalSpecialty})
              </span>
            </div>
            {abertoSpecialty[`${tipo}-${specialtyKey}`] ? (
              <ChevronDown size={18} className={`text-${cores.primary}-500`} />
            ) : (
              <ChevronRight size={18} className={`text-${cores.primary}-500`} />
            )}
          </button>

          {/* Categorias dentro da Especialidade */}
          <AnimatePresence initial={false}>
            {abertoSpecialty[`${tipo}-${specialtyKey}`] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 px-3 pb-3"
              >
                {Object.keys(specialtyData).map((categoryKey) => {
                  const categoryData = specialtyData[categoryKey];
                  const totalCategory = contarFavoritos(categoryData);
                  
                  if (totalCategory === 0) return null;

                  return (
                    <div
                      key={`${tipo}-${categoryKey}`}
                      className={`rounded-md border border-${cores.secondary}-200 bg-${cores.secondary}-50/50 dark:bg-${cores.secondary}-900/20 dark:border-${cores.secondary}-800 overflow-hidden ml-4`}
                    >
                      {/* Cabeçalho Categoria */}
                      <button
                        onClick={() => toggleCategory(`${tipo}-${categoryKey}`)}
                        className={`flex w-full items-center justify-between p-2 text-left font-medium text-${cores.secondary}-900 dark:text-${cores.secondary}-200 hover:bg-${cores.secondary}-100 dark:hover:bg-${cores.secondary}-900/40 transition text-sm`}
                      >
                        <div className="flex items-center gap-2">
                          {abertoCategory[`${tipo}-${categoryKey}`] ? (
                            <FolderOpen size={16} className={`text-${cores.secondary}-600 dark:text-${cores.secondary}-400`} />
                          ) : (
                            <Folder size={16} className={`text-${cores.secondary}-600 dark:text-${cores.secondary}-400`} />
                          )}
                          <span>{categoryKey}</span>
                          <span className={`text-xs font-normal text-${cores.secondary}-700 dark:text-${cores.secondary}-300`}>
                            ({totalCategory})
                          </span>
                        </div>
                        {abertoCategory[`${tipo}-${categoryKey}`] ? (
                          <ChevronDown size={16} className={`text-${cores.secondary}-500`} />
                        ) : (
                          <ChevronRight size={16} className={`text-${cores.secondary}-500`} />
                        )}
                      </button>

                      {/* Seções dentro da Categoria */}
                      <AnimatePresence initial={false}>
                        {abertoCategory[`${tipo}-${categoryKey}`] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2 px-2 pb-2"
                          >
                            {Object.keys(categoryData).map((sectionKey) => {
                              const sectionFavs = categoryData[sectionKey].filter(filtrar);
                              
                              if (sectionFavs.length === 0) return null;

                              return (
                                <div
                                  key={`${tipo}-${sectionKey}`}
                                  className="rounded border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 overflow-visible ml-4"
                                >
                                  {/* Cabeçalho Seção */}
                                  <button
                                    onClick={() => toggleSection(`${tipo}-${sectionKey}`)}
                                    className="flex w-full items-center justify-between p-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{sectionKey}</span>
                                      <span className="text-xs text-gray-500">
                                        ({sectionFavs.length})
                                      </span>
                                    </div>
                                    {abertoSection[`${tipo}-${sectionKey}`] ? (
                                      <ChevronDown size={14} className="text-gray-500" />
                                    ) : (
                                      <ChevronRight size={14} className="text-gray-500" />
                                    )}
                                  </button>

                                  {/* Lista de Favoritos */}
                                  <AnimatePresence initial={false}>
                                    {abertoSection[`${tipo}-${sectionKey}`] && (
                                      <motion.ul
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-1 pt-3 px-2 pb-2 text-xs max-h-80 overflow-y-auto"
                                      >
                                        {sectionFavs.map((fav: any) => {
                                          const codigo = fav.codigo ?? getFavCodigo(fav);
                                          const descricao = fav.descricao ?? getFavDescricao(fav);

                                          return (
                                            <li
                                              key={fav.id}
                                              className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 dark:bg-gray-900/50 group hover:bg-gray-100 dark:hover:bg-gray-900 relative"
                                            >
                                              <div className="flex-1 min-w-0">
                                                {/* Código clicável */}
                                                <div
                                                  className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                                                  onClick={() => handleCopy(fav.id, codigo)}
                                                  title="Clique para copiar o código"
                                                >
                                                  <div className="relative inline-block">
                                                    {codigo}
                                                    <AnimatePresence>
                                                      {copiado === fav.id && (
                                                        <motion.span
                                                          initial={{ opacity: 0, y: -5 }}
                                                          animate={{ opacity: 1, y: -10 }}
                                                          exit={{ opacity: 0, y: -5 }}
                                                          transition={{ duration: 0.2 }}
                                                          className="absolute left-1/2 -translate-x-1/2 -top-6 bg-black text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20"
                                                        >
                                                          Copiado!
                                                        </motion.span>
                                                      )}
                                                    </AnimatePresence>
                                                  </div>
                                                </div>

                                                {/* Descrição */}
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                  {descricao}
                                                </div>
                                              </div>

                                              {/* Botão de adicionar/remover usuário autenticado - apenas se logado */}
                                              {authUser && (
                                                <button
                                                  onClick={() => handleToggleUserAssociation(fav)}
                                                  disabled={loadingToggle === fav.id}
                                                  className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                                                    isUserAssociated(fav)
                                                      ? 'hover:bg-green-100 dark:hover:bg-green-900 text-green-600'
                                                      : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                  } ${loadingToggle === fav.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                  title={isUserAssociated(fav) ? 'Remover de favoritos' : 'Adicionar a favoritos'}
                                                >
                                                  {loadingToggle === fav.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                  ) : isUserAssociated(fav) ? (
                                                    <UserMinus size={14} />
                                                  ) : (
                                                    <UserPlus size={14} />
                                                  )}
                                                </button>
                                              )}
                                            </li>
                                          );
                                        })}
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
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  return (
    <div className="mx-auto mb-8 w-full max-w-6xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <Star className="text-yellow-500" /> Favoritos
        </h3>
        {authUser && (
          <button
            onClick={() => setShowMyFavoritos(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
          >
            <Users size={16} />
            Meus Favoritos
          </button>
        )}
      </div>

      {/* Campo de busca */}
      <input
        type="text"
        placeholder="Filtrar favoritos..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="mb-4 w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Diagnósticos */}
        {diagnosticos.length > 0 && (
          <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 dark:border-blue-700 p-4 shadow-lg">
            <h4 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Diagnósticos ({diagnosticos.filter(filtrar).length})
            </h4>
            <div className="space-y-3">
              {renderHierarquia(estruturadoDiagnosticos, 'diagnosticos')}
            </div>
          </div>
        )}

        {/* Card de Procedimentos */}
        {procedimentos.length > 0 && (
          <div className="rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 dark:border-purple-700 p-4 shadow-lg">
            <h4 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Procedimentos ({procedimentos.filter(filtrar).length})
            </h4>
            <div className="space-y-3">
              {renderHierarquia(estruturadoProcedimentos, 'procedimentos')}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Gerenciar Usuários */}
      <AnimatePresence>
        {selectedFavoritoForUsers !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4"
            onClick={() => setSelectedFavoritoForUsers(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-lg bg-white dark:bg-gray-800 shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users size={20} />
                Gerenciar Usuários
              </h2>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {favoritoUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                      Nenhum usuário associado ainda
                    </p>
                  ) : (
                    favoritoUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded bg-gray-100 dark:bg-gray-700"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                        <button
                          onClick={() => handleDetachUser(selectedFavoritoForUsers, user.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition text-red-600"
                          title="Remover usuário"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              <button
                onClick={() => setSelectedFavoritoForUsers(null)}
                className="mt-6 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal - Meus Favoritos */}
      <AnimatePresence>
        {showMyFavoritos && authUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4"
            onClick={() => setShowMyFavoritos(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-lg bg-white dark:bg-gray-800 shadow-xl w-full max-w-4xl p-6 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users size={24} />
                  Meus Favoritos
                </h2>
                <button
                  onClick={() => setShowMyFavoritos(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              {getMyFavoritos().length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    Você ainda não adicionou nenhum favorito
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Diagnósticos */}
                    {getMyFavoritos().filter((f: any) => f.tabela_origem === 'icd10cms').length > 0 && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800 p-3">
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Diagnósticos
                        </h3>
                        <div className="space-y-2">
                          {Object.keys(estruturarMyFavoritos(getMyFavoritos().filter((f: any) => f.tabela_origem === 'icd10cms'))).map((specialtyKey) => {
                            const specialtyData = estruturarMyFavoritos(getMyFavoritos().filter((f: any) => f.tabela_origem === 'icd10cms'))[specialtyKey];
                            const keyId = `mydiag-${specialtyKey}`;

                            return (
                              <div key={keyId} className="rounded border border-blue-200 dark:border-blue-700 overflow-hidden bg-white dark:bg-gray-800">
                                <button
                                  onClick={() => setMyFavAbertoSpecialty((prev) => ({ ...prev, [keyId]: !prev[keyId] }))}
                                  className="w-full flex items-center justify-between p-2 text-left text-sm font-medium text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                >
                                  <span>{specialtyKey}</span>
                                  {myFavAbertoSpecialty[keyId] ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </button>
                                <AnimatePresence initial={false}>
                                  {myFavAbertoSpecialty[keyId] && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="space-y-1 px-2 pb-2"
                                    >
                                      {Object.keys(specialtyData).map((categoryKey) => {
                                        const categoryData = specialtyData[categoryKey];
                                        const catKeyId = `mydiag-${categoryKey}`;

                                        return (
                                          <div key={catKeyId} className="rounded border border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800 overflow-hidden">
                                            <button
                                              onClick={() => setMyFavAbertoCategory((prev) => ({ ...prev, [catKeyId]: !prev[catKeyId] }))}
                                              className="w-full flex items-center justify-between p-2 text-left text-xs font-medium text-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                                            >
                                              <span>{categoryKey}</span>
                                              {myFavAbertoCategory[catKeyId] ? (
                                                <ChevronDown size={14} />
                                              ) : (
                                                <ChevronRight size={14} />
                                              )}
                                            </button>
                                            <AnimatePresence initial={false}>
                                              {myFavAbertoCategory[catKeyId] && (
                                                <motion.div
                                                  initial={{ opacity: 0, height: 0 }}
                                                  animate={{ opacity: 1, height: 'auto' }}
                                                  exit={{ opacity: 0, height: 0 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="space-y-1 px-1 pb-1"
                                                >
                                                  {Object.keys(categoryData).map((sectionKey) => {
                                                    const sectionFavs = categoryData[sectionKey];
                                                    const secKeyId = `mydiag-${sectionKey}`;

                                                    return (
                                                      <div key={secKeyId} className="rounded border border-gray-200 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden">
                                                        <button
                                                          onClick={() => setMyFavAbertoSection((prev) => ({ ...prev, [secKeyId]: !prev[secKeyId] }))}
                                                          className="w-full flex items-center justify-between p-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition"
                                                        >
                                                          <span className="font-medium">{sectionKey}</span>
                                                          {myFavAbertoSection[secKeyId] ? (
                                                            <ChevronDown size={12} />
                                                          ) : (
                                                            <ChevronRight size={12} />
                                                          )}
                                                        </button>
                                                        <AnimatePresence initial={false}>
                                                          {myFavAbertoSection[secKeyId] && (
                                                            <motion.ul
                                                              initial={{ opacity: 0, height: 0 }}
                                                              animate={{ opacity: 1, height: 'auto' }}
                                                              exit={{ opacity: 0, height: 0 }}
                                                              transition={{ duration: 0.2 }}
                                                              className="space-y-0.5 pt-1.5 px-1 pb-1 text-[11px] max-h-40 overflow-y-auto"
                                                            >
                                                              {sectionFavs.map((fav: any) => {
                                                                const codigo = fav.codigo ?? getFavCodigo(fav);
                                                                const descricao = fav.descricao ?? getFavDescricao(fav);

                                                                return (
                                                                  <li
                                                                    key={fav.id}
                                                                    className="flex items-center justify-between rounded bg-white dark:bg-gray-800 px-1.5 py-0.5 group hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer relative"
                                                                  >
                                                                    <div
                                                                      className="flex-1 min-w-0"
                                                                      onClick={() => handleCopyModal(fav.id, codigo)}
                                                                      title="Clique para copiar o código"
                                                                    >
                                                                      <div className="font-medium text-gray-900 dark:text-gray-100 relative inline-block">{codigo}
                                                                        <AnimatePresence>
                                                                          {copiadoModal === fav.id && (
                                                                            <motion.span
                                                                              initial={{ opacity: 0, y: -5 }}
                                                                              animate={{ opacity: 1, y: -10 }}
                                                                              exit={{ opacity: 0, y: -5 }}
                                                                              transition={{ duration: 0.2 }}
                                                                              className="absolute left-1/2 -translate-x-1/2 -top-6 bg-black text-white text-[9px] px-1 py-0.5 rounded shadow whitespace-nowrap z-20"
                                                                            >
                                                                              Copiado!
                                                                            </motion.span>
                                                                          )}
                                                                        </AnimatePresence>
                                                                      </div>
                                                                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{descricao}</div>
                                                                    </div>
                                                                    <button
                                                                      onClick={() => handleToggleUserAssociation(fav)}
                                                                      disabled={loadingToggle === fav.id}
                                                                      className="ml-1 flex-shrink-0 p-0.5 rounded text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 transition"
                                                                    >
                                                                      {loadingToggle === fav.id ? (
                                                                        <Loader2 size={12} className="animate-spin" />
                                                                      ) : (
                                                                        <UserMinus size={12} />
                                                                      )}
                                                                    </button>
                                                                  </li>
                                                                );
                                                              })}
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
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Procedimentos */}
                    {getMyFavoritos().filter((f: any) => f.tabela_origem === 'icd10pcs').length > 0 && (
                      <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-900/20 dark:border-purple-800 p-3">
                        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Procedimentos
                        </h3>
                        <div className="space-y-2">
                          {Object.keys(estruturarMyFavoritos(getMyFavoritos().filter((f: any) => f.tabela_origem === 'icd10pcs'))).map((specialtyKey) => {
                            const specialtyData = estruturarMyFavoritos(getMyFavoritos().filter((f: any) => f.tabela_origem === 'icd10pcs'))[specialtyKey];
                            const keyId = `myproc-${specialtyKey}`;

                            return (
                              <div key={keyId} className="rounded border border-purple-200 dark:border-purple-700 overflow-hidden bg-white dark:bg-gray-800">
                                <button
                                  onClick={() => setMyFavAbertoSpecialty((prev) => ({ ...prev, [keyId]: !prev[keyId] }))}
                                  className="w-full flex items-center justify-between p-2 text-left text-sm font-medium text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
                                >
                                  <span>{specialtyKey}</span>
                                  {myFavAbertoSpecialty[keyId] ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </button>
                                <AnimatePresence initial={false}>
                                  {myFavAbertoSpecialty[keyId] && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="space-y-1 px-2 pb-2"
                                    >
                                      {Object.keys(specialtyData).map((categoryKey) => {
                                        const categoryData = specialtyData[categoryKey];
                                        const catKeyId = `myproc-${categoryKey}`;

                                        return (
                                          <div key={catKeyId} className="rounded border border-pink-200 bg-pink-50/50 dark:bg-pink-900/20 dark:border-pink-800 overflow-hidden">
                                            <button
                                              onClick={() => setMyFavAbertoCategory((prev) => ({ ...prev, [catKeyId]: !prev[catKeyId] }))}
                                              className="w-full flex items-center justify-between p-2 text-left text-xs font-medium text-pink-900 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition"
                                            >
                                              <span>{categoryKey}</span>
                                              {myFavAbertoCategory[catKeyId] ? (
                                                <ChevronDown size={14} />
                                              ) : (
                                                <ChevronRight size={14} />
                                              )}
                                            </button>
                                            <AnimatePresence initial={false}>
                                              {myFavAbertoCategory[catKeyId] && (
                                                <motion.div
                                                  initial={{ opacity: 0, height: 0 }}
                                                  animate={{ opacity: 1, height: 'auto' }}
                                                  exit={{ opacity: 0, height: 0 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="space-y-1 px-1 pb-1"
                                                >
                                                  {Object.keys(categoryData).map((sectionKey) => {
                                                    const sectionFavs = categoryData[sectionKey];
                                                    const secKeyId = `myproc-${sectionKey}`;

                                                    return (
                                                      <div key={secKeyId} className="rounded border border-gray-200 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden">
                                                        <button
                                                          onClick={() => setMyFavAbertoSection((prev) => ({ ...prev, [secKeyId]: !prev[secKeyId] }))}
                                                          className="w-full flex items-center justify-between p-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition"
                                                        >
                                                          <span className="font-medium">{sectionKey}</span>
                                                          {myFavAbertoSection[secKeyId] ? (
                                                            <ChevronDown size={12} />
                                                          ) : (
                                                            <ChevronRight size={12} />
                                                          )}
                                                        </button>
                                                        <AnimatePresence initial={false}>
                                                          {myFavAbertoSection[secKeyId] && (
                                                            <motion.ul
                                                              initial={{ opacity: 0, height: 0 }}
                                                              animate={{ opacity: 1, height: 'auto' }}
                                                              exit={{ opacity: 0, height: 0 }}
                                                              transition={{ duration: 0.2 }}
                                                              className="space-y-0.5 pt-1.5 px-1 pb-1 text-[11px] max-h-40 overflow-y-auto"
                                                            >
                                                              {sectionFavs.map((fav: any) => {
                                                                const codigo = fav.codigo ?? getFavCodigo(fav);
                                                                const descricao = fav.descricao ?? getFavDescricao(fav);

                                                                return (
                                                                  <li
                                                                    key={fav.id}
                                                                    className="flex items-center justify-between rounded bg-white dark:bg-gray-800 px-1.5 py-0.5 group hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer relative"
                                                                  >
                                                                    <div
                                                                      className="flex-1 min-w-0"
                                                                      onClick={() => handleCopyModal(fav.id, codigo)}
                                                                      title="Clique para copiar o código"
                                                                    >
                                                                      <div className="font-medium text-gray-900 dark:text-gray-100 relative inline-block">{codigo}
                                                                        <AnimatePresence>
                                                                          {copiadoModal === fav.id && (
                                                                            <motion.span
                                                                              initial={{ opacity: 0, y: -5 }}
                                                                              animate={{ opacity: 1, y: -10 }}
                                                                              exit={{ opacity: 0, y: -5 }}
                                                                              transition={{ duration: 0.2 }}
                                                                              className="absolute left-1/2 -translate-x-1/2 -top-6 bg-black text-white text-[9px] px-1 py-0.5 rounded shadow whitespace-nowrap z-20"
                                                                            >
                                                                              Copiado!
                                                                            </motion.span>
                                                                          )}
                                                                        </AnimatePresence>
                                                                      </div>
                                                                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{descricao}</div>
                                                                    </div>
                                                                    <button
                                                                      onClick={() => handleToggleUserAssociation(fav)}
                                                                      disabled={loadingToggle === fav.id}
                                                                      className="ml-1 flex-shrink-0 p-0.5 rounded text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 transition"
                                                                    >
                                                                      {loadingToggle === fav.id ? (
                                                                        <Loader2 size={12} className="animate-spin" />
                                                                      ) : (
                                                                        <UserMinus size={12} />
                                                                      )}
                                                                    </button>
                                                                  </li>
                                                                );
                                                              })}
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
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

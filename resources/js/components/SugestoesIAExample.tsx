import { useState } from 'react';
import { useSugestoesIA } from '@/hooks/useSugestoesIA';

/**
 * Componente de exemplo demonstrando o uso do hook useSugestoesIA.
 * 
 * Permite ao usuário digitar uma descrição de procedimento e receber
 * sugestões de códigos ICD-10-PCS validadas por IA.
 */
export default function SugestoesIAExample() {
    const [textoBusca, setTextoBusca] = useState('');
    
    const { 
        sugestoes, 
        explicacao, 
        isLoading, 
        error, 
        totalComparacoes 
    } = useSugestoesIA(textoBusca);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">
                🤖 Busca Inteligente de Códigos ICD-10-PCS
            </h1>

            {/* Input de busca */}
            <div className="mb-6">
                <label 
                    htmlFor="busca" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    Descreva o procedimento:
                </label>
                <input
                    id="busca"
                    type="text"
                    value={textoBusca}
                    onChange={(e) => setTextoBusca(e.target.value)}
                    placeholder="Ex: remoção de apêndice, cirurgia cardíaca, transplante renal..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                    Digite pelo menos 3 caracteres para buscar
                </p>
            </div>

            {/* Estado de carregamento */}
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">
                        Analisando com IA...
                    </span>
                </div>
            )}

            {/* Erro */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                        <svg 
                            className="w-5 h-5 text-red-500 mt-0.5" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                        >
                            <path 
                                fillRule="evenodd" 
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                                clipRule="evenodd" 
                            />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Erro ao buscar sugestões
                            </h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Resultados */}
            {!isLoading && !error && sugestoes.length > 0 && (
                <div>
                    {/* Informações gerais */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <svg 
                                className="w-5 h-5 text-blue-500 mt-0.5" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                            >
                                <path 
                                    fillRule="evenodd" 
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                                    clipRule="evenodd" 
                                />
                            </svg>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                    Análise concluída
                                </h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    {totalComparacoes} códigos analisados • {sugestoes.length} sugestões validadas
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Explicação geral */}
                    {explicacao && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                💡 Explicação
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {explicacao}
                            </p>
                        </div>
                    )}

                    {/* Lista de sugestões */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            📋 Códigos Sugeridos
                        </h3>
                        
                        {sugestoes.map((sugestao, index) => (
                            <div 
                                key={sugestao.codigo}
                                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <code className="text-lg font-mono font-bold text-gray-900">
                                                {sugestao.codigo}
                                            </code>
                                        </div>
                                        
                                        <h4 className="text-base font-medium text-gray-800 mb-2">
                                            {sugestao.descricao}
                                        </h4>
                                        
                                        <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-3">
                                            <p className="text-sm text-green-800">
                                                <span className="font-semibold">Por quê?</span> {sugestao.relevancia}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(sugestao.codigo);
                                            // Você pode adicionar um toast aqui
                                        }}
                                        className="ml-4 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                        title="Copiar código"
                                    >
                                        📋 Copiar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Estado vazio */}
            {!isLoading && !error && sugestoes.length === 0 && textoBusca.trim().length >= 3 && (
                <div className="text-center py-12 text-gray-500">
                    <svg 
                        className="w-16 h-16 mx-auto mb-4 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                        />
                    </svg>
                    <p className="text-lg">Nenhuma sugestão encontrada</p>
                    <p className="text-sm mt-1">Tente reformular sua busca</p>
                </div>
            )}
        </div>
    );
}

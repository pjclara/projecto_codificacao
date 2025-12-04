import { useState } from 'react';
import AutoCompleteCIDPCS from '@/components/AutoCompleteCIDPCS';

/**
 * Exemplo de uso do componente AutoCompleteCIDPCS.
 * 
 * Demonstra integração em um formulário de registro de procedimento.
 */
export default function AutoCompleteExample() {
    const [codigoSelecionado, setCodigoSelecionado] = useState<string>('');
    const [historico, setHistorico] = useState<string[]>([]);

    const handleSelect = (codigo: string) => {
        console.log('Código selecionado:', codigo);
        setCodigoSelecionado(codigo);
        
        // Adicionar ao histórico
        setHistorico(prev => [codigo, ...prev.slice(0, 9)]);
        
        // Aqui você pode:
        // - Salvar no banco de dados
        // - Atualizar estado do formulário
        // - Navegar para outra página
        // - Mostrar confirmação
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">
                🔍 AutoComplete Inteligente CID-PCS
            </h1>

            {/* Componente AutoComplete */}
            <div className="mb-8">
                <label 
                    htmlFor="autocomplete" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    Buscar Código ICD-10-PCS
                </label>
                
                <AutoCompleteCIDPCS
                    onSelect={handleSelect}
                    placeholder="Digite: remoção de apêndice, cirurgia cardíaca, etc..."
                />
                
                <p className="mt-2 text-sm text-gray-500">
                    💡 Digite pelo menos 3 caracteres para buscar
                </p>
            </div>

            {/* Código selecionado */}
            {codigoSelecionado && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                    <div className="flex items-start">
                        <svg 
                            className="w-5 h-5 text-green-500 mt-0.5" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                        >
                            <path 
                                fillRule="evenodd" 
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                                clipRule="evenodd" 
                            />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">
                                Código Selecionado
                            </h3>
                            <p className="text-sm text-green-700 mt-1 font-mono font-bold">
                                {codigoSelecionado}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Histórico de seleções */}
            {historico.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        📜 Histórico de Seleções
                    </h2>
                    
                    <div className="space-y-2">
                        {historico.map((codigo, index) => (
                            <div 
                                key={`${codigo}-${index}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-md"
                            >
                                <span className="text-sm text-gray-500 font-medium">
                                    #{index + 1}
                                </span>
                                <code className="text-sm font-mono font-bold text-gray-900">
                                    {codigo}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(codigo);
                                        // Adicionar toast de confirmação aqui
                                    }}
                                    className="ml-auto text-xs text-blue-600 hover:text-blue-800"
                                >
                                    📋 Copiar
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <button
                        onClick={() => setHistorico([])}
                        className="mt-4 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Limpar Histórico
                    </button>
                </div>
            )}

            {/* Exemplo de uso em formulário */}
            <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    💻 Exemplo de Uso
                </h3>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
{`import AutoCompleteCIDPCS from '@/components/AutoCompleteCIDPCS';

function FormularioProcedimento() {
  const [codigo, setCodigo] = useState('');

  return (
    <form>
      <AutoCompleteCIDPCS
        onSelect={(codigo) => {
          setCodigo(codigo);
          console.log('Código selecionado:', codigo);
        }}
        placeholder="Buscar código..."
      />
      
      {codigo && (
        <p>Código: {codigo}</p>
      )}
    </form>
  );
}`}
                </pre>
            </div>

            {/* Recursos */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        ⚡ Recursos
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Debounce automático (300ms)</li>
                        <li>• Navegação por teclado (↑↓)</li>
                        <li>• Seleção com Enter</li>
                        <li>• Fechar com Esc</li>
                        <li>• Validação por IA</li>
                    </ul>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">
                        🤖 Tecnologias
                    </h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                        <li>• OpenAI Embeddings</li>
                        <li>• GPT-4o-mini</li>
                        <li>• Similaridade Cosseno</li>
                        <li>• React Hooks</li>
                        <li>• Tailwind CSS</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

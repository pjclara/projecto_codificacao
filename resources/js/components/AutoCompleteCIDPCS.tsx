import { useState, useRef, useEffect } from 'react';
import { useSugestoesIA } from '@/hooks/useSugestoesIA';

interface AutoCompleteCIDPCSProps {
    /**
     * Callback executado quando o usuário seleciona um código
     */
    onSelect: (codigo: string) => void;
    
    /**
     * Placeholder do input
     */
    placeholder?: string;
    
    /**
     * Valor inicial do input
     */
    initialValue?: string;
    
    /**
     * Classes CSS adicionais para o container
     */
    className?: string;
    
    /**
     * Desabilitar o input
     */
    disabled?: boolean;
}

/**
 * Componente de autocomplete inteligente para códigos ICD-10-PCS.
 * 
 * Utiliza IA (embeddings + GPT-4o-mini) para sugerir códigos baseados
 * na descrição em linguagem natural digitada pelo usuário.
 * 
 * @example
 * ```tsx
 * <AutoCompleteCIDPCS
 *   placeholder="Descreva o procedimento..."
 *   onSelect={(codigo) => {
 *     console.log('Código selecionado:', codigo);
 *     // Salvar código, atualizar formulário, etc.
 *   }}
 * />
 * ```
 */
export default function AutoCompleteCIDPCS({
    onSelect,
    placeholder = 'Buscar código por descrição...',
    initialValue = '',
    className = '',
    disabled = false,
}: AutoCompleteCIDPCSProps) {
    const [inputValue, setInputValue] = useState(initialValue);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Hook de sugestões IA
    const { sugestoes, isLoading, error } = useSugestoesIA(inputValue);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Abrir dropdown quando há sugestões
    useEffect(() => {
        if (sugestoes.length > 0 && inputValue.trim().length >= 3) {
            setIsDropdownOpen(true);
        } else {
            setIsDropdownOpen(false);
        }
    }, [sugestoes, inputValue]);

    /**
     * Handler para seleção de código
     */
    const handleSelect = (codigo: string, descricao: string) => {
        setInputValue(`${codigo} - ${descricao}`);
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        onSelect(codigo);
    };

    /**
     * Handler para navegação por teclado
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isDropdownOpen || sugestoes.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < sugestoes.length - 1 ? prev + 1 : 0
                );
                break;
            
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev > 0 ? prev - 1 : sugestoes.length - 1
                );
                break;
            
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < sugestoes.length) {
                    const sugestao = sugestoes[selectedIndex];
                    handleSelect(sugestao.codigo, sugestao.descricao);
                }
                break;
            
            case 'Escape':
                setIsDropdownOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };

    /**
     * Handler para mudança no input
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setSelectedIndex(-1);
    };

    /**
     * Limpar input
     */
    const handleClear = () => {
        setInputValue('');
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Input com ícones */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isLoading ? (
                        <svg 
                            className="animate-spin h-5 w-5 text-blue-500" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                        >
                            <circle 
                                className="opacity-25" 
                                cx="12" 
                                cy="12" 
                                r="10" 
                                stroke="currentColor" 
                                strokeWidth="4"
                            />
                            <path 
                                className="opacity-75" 
                                fill="currentColor" 
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    ) : (
                        <svg 
                            className="h-5 w-5 text-gray-400" 
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
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
                        w-full pl-10 pr-10 py-2.5 
                        border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                        transition-all duration-200
                        ${error ? 'border-red-300 focus:ring-red-500' : ''}
                    `}
                />

                {/* Botão limpar */}
                {inputValue && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                    >
                        <svg 
                            className="h-5 w-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M6 18L18 6M6 6l12 12" 
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Mensagem de erro */}
            {error && (
                <div className="absolute left-0 right-0 mt-1 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 z-10">
                    {error}
                </div>
            )}

            {/* Dropdown de sugestões */}
            {isDropdownOpen && sugestoes.length > 0 && !error && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                    {/* Header */}
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">
                            🤖 {sugestoes.length} sugestões validadas por IA
                        </span>
                        <span className="text-xs text-gray-500">
                            ↑↓ navegar • Enter selecionar • Esc fechar
                        </span>
                    </div>

                    {/* Lista de sugestões */}
                    <ul className="divide-y divide-gray-100">
                        {sugestoes.slice(0, 5).map((sugestao, index) => (
                            <li key={sugestao.codigo}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(sugestao.codigo, sugestao.descricao)}
                                    className={`
                                        w-full px-4 py-3 text-left 
                                        hover:bg-blue-50 
                                        transition-colors duration-150
                                        ${selectedIndex === index ? 'bg-blue-50' : ''}
                                        focus:outline-none focus:bg-blue-50
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Número */}
                                        <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mt-0.5">
                                            {index + 1}
                                        </span>

                                        {/* Conteúdo */}
                                        <div className="flex-1 min-w-0">
                                            {/* Código em destaque */}
                                            <div className="font-mono font-bold text-gray-900 text-sm mb-1">
                                                {sugestao.codigo}
                                            </div>

                                            {/* Descrição em cinza */}
                                            <div className="text-sm text-gray-600 leading-snug">
                                                {sugestao.descricao}
                                            </div>

                                            {/* Relevância (opcional) */}
                                            {sugestao.relevancia && (
                                                <div className="mt-2 text-xs text-gray-500 italic">
                                                    💡 {sugestao.relevancia}
                                                </div>
                                            )}
                                        </div>

                                        {/* Ícone de seleção */}
                                        <div className="flex-shrink-0">
                                            <svg 
                                                className={`
                                                    w-5 h-5 
                                                    ${selectedIndex === index ? 'text-blue-500' : 'text-gray-300'}
                                                    transition-colors
                                                `}
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M9 5l7 7-7 7" 
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
                        Powered by OpenAI Embeddings + GPT-4o-mini
                    </div>
                </div>
            )}

            {/* Loading state no dropdown */}
            {isLoading && inputValue.trim().length >= 3 && !error && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-6">
                    <div className="flex items-center justify-center gap-3 text-gray-600">
                        <svg 
                            className="animate-spin h-5 w-5 text-blue-500" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                        >
                            <circle 
                                className="opacity-25" 
                                cx="12" 
                                cy="12" 
                                r="10" 
                                stroke="currentColor" 
                                strokeWidth="4"
                            />
                            <path 
                                className="opacity-75" 
                                fill="currentColor" 
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span className="text-sm">Analisando com IA...</span>
                    </div>
                </div>
            )}
        </div>
    );
}

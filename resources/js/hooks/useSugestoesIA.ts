import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Sugestao {
    codigo: string;
    descricao: string;
    relevancia: string;
}

interface RespostaSugestoes {
    texto_entrada: string;
    total_comparacoes: number;
    sugestoes: Sugestao[];
    explicacao: string;
}

interface UseSugestoesIAReturn {
    sugestoes: Sugestao[];
    explicacao: string;
    isLoading: boolean;
    error: string | null;
    totalComparacoes: number;
}

/**
 * Hook para buscar sugestões de códigos ICD-10-PCS usando IA.
 * 
 * Utiliza debounce de 300ms para evitar requisições excessivas
 * enquanto o usuário está digitando.
 * 
 * @param texto - Texto digitado pelo usuário (descrição do procedimento)
 * @returns Objeto contendo sugestões, estado de carregamento e erro
 * 
 * @example
 * ```tsx
 * const { sugestoes, explicacao, isLoading, error } = useSugestoesIA(textoBusca);
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * 
 * return (
 *   <>
 *     <p>{explicacao}</p>
 *     {sugestoes.map(s => (
 *       <div key={s.codigo}>
 *         <strong>{s.codigo}</strong> - {s.descricao}
 *         <p>{s.relevancia}</p>
 *       </div>
 *     ))}
 *   </>
 * );
 * ```
 */
export function useSugestoesIA(texto: string): UseSugestoesIAReturn {
    const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
    const [explicacao, setExplicacao] = useState<string>('');
    const [totalComparacoes, setTotalComparacoes] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    // Ref para cancelar requisições anteriores
    const abortControllerRef = useRef<AbortController | null>(null);
    
    // Ref para o timer do debounce
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Limpar timer anterior
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Cancelar requisição anterior se existir
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Resetar estado se texto estiver vazio
        if (!texto || texto.trim().length < 3) {
            setSugestoes([]);
            setExplicacao('');
            setTotalComparacoes(0);
            setIsLoading(false);
            setError(null);
            return;
        }

        // Debounce: aguardar 300ms após última digitação
        debounceTimerRef.current = setTimeout(() => {
            buscarSugestoes(texto.trim());
        }, 300);

        // Cleanup
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [texto]);

    /**
     * Busca sugestões na API usando embeddings + validação GPT.
     */
    const buscarSugestoes = async (textoTrimmed: string) => {
        // Criar novo AbortController para esta requisição
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post<RespostaSugestoes>(
                '/api/ai/sugerir',
                { texto: textoTrimmed },
                { 
                    signal: abortController.signal,
                    timeout: 30000, // 30 segundos (embeddings + GPT podem demorar)
                }
            );

            // Verificar se a requisição não foi cancelada
            if (!abortController.signal.aborted) {
                setSugestoes(response.data.sugestoes || []);
                setExplicacao(response.data.explicacao || '');
                setTotalComparacoes(response.data.total_comparacoes || 0);
                setError(null);
            }
        } catch (err: any) {
            // Ignorar erros de cancelamento
            if (axios.isCancel(err) || err.name === 'CanceledError') {
                return;
            }

            // Tratar outros erros
            if (!abortController.signal.aborted) {
                const mensagemErro = err.response?.data?.message 
                    || err.response?.data?.error
                    || err.message 
                    || 'Erro ao buscar sugestões. Tente novamente.';
                
                setError(mensagemErro);
                setSugestoes([]);
                setExplicacao('');
                setTotalComparacoes(0);
                
                console.error('Erro ao buscar sugestões:', err);
            }
        } finally {
            if (!abortController.signal.aborted) {
                setIsLoading(false);
            }
        }
    };

    return {
        sugestoes,
        explicacao,
        isLoading,
        error,
        totalComparacoes,
    };
}

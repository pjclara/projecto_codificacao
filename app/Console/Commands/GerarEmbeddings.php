<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use OpenAI;

class GerarEmbeddings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'embeddings:gerar
                            {--limit= : Limitar o número de registros a processar}
                            {--skip-existing : Pular registros que já têm embeddings}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gera embeddings para todos os códigos ICD-10-PCS usando OpenAI';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Verificar se a API key está configurada
        $apiKey = config('services.openai.api_key');
        
        if (empty($apiKey)) {
            $this->error('❌ API key da OpenAI não configurada!');
            $this->info('Configure a variável OPENAI_API_KEY no arquivo .env');
            return 1;
        }

        try {
            // Criar cliente OpenAI
            $client = OpenAI::client($apiKey);
            
            // Construir query
            $query = DB::table('icd10pcs')
                ->select('id', 'codigo', 'descricao_curta', 'descricao_longa', 'embedding');
            
            // Se deve pular registros existentes
            if ($this->option('skip-existing')) {
                $query->whereNull('embedding');
            }
            
            // Se há limite
            if ($limit = $this->option('limit')) {
                $query->limit((int) $limit);
            }
            
            $registros = $query->get();
            
            if ($registros->isEmpty()) {
                $this->info('✅ Não há registros para processar.');
                return 0;
            }
            
            $total = $registros->count();
            $this->info("📊 Processando {$total} registros...\n");
            
            $progressBar = $this->output->createProgressBar($total);
            $progressBar->start();
            
            $sucessos = 0;
            $erros = 0;
            $errosDetalhes = [];
            
            foreach ($registros as $registro) {
                try {
                    // Preparar texto para embedding
                    $descricao = $registro->descricao_curta ?? $registro->descricao_longa ?? '';
                    $texto = trim($registro->codigo . ' - ' . $descricao);
                    
                    if (empty($texto)) {
                        $this->newLine();
                        $this->warn("⚠️  Registro ID {$registro->id} não tem código ou descrição. Pulando...");
                        $progressBar->advance();
                        continue;
                    }
                    
                    // Gerar embedding
                    $response = $client->embeddings()->create([
                        'model' => 'text-embedding-3-small',
                        'input' => $texto,
                    ]);
                    
                    // Extrair vetor de embedding
                    $embedding = $response->embeddings[0]->embedding;
                    
                    // Salvar no banco de dados como JSON
                    DB::table('icd10pcs')
                        ->where('id', $registro->id)
                        ->update([
                            'embedding' => json_encode($embedding),
                            'updated_at' => now(),
                        ]);
                    
                    $sucessos++;
                    
                } catch (\Exception $e) {
                    $erros++;
                    $errosDetalhes[] = [
                        'id' => $registro->id,
                        'codigo' => $registro->codigo,
                        'erro' => $e->getMessage(),
                    ];
                    
                    // Mostrar erro mas continuar processamento
                    $this->newLine();
                    $this->error("❌ Erro no registro ID {$registro->id}: " . $e->getMessage());
                }
                
                $progressBar->advance();
            }
            
            $progressBar->finish();
            $this->newLine(2);
            
            // Relatório final
            $this->info("✅ Processamento concluído!");
            $this->table(
                ['Métrica', 'Valor'],
                [
                    ['Total de registros', $total],
                    ['Sucessos', $sucessos],
                    ['Erros', $erros],
                ]
            );
            
            // Mostrar detalhes dos erros se houver
            if ($erros > 0 && $this->confirm('Deseja ver os detalhes dos erros?', true)) {
                $this->newLine();
                $this->error("Detalhes dos erros:");
                $this->table(
                    ['ID', 'Código', 'Erro'],
                    array_map(fn($e) => [$e['id'], $e['codigo'], $e['erro']], $errosDetalhes)
                );
            }
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error("❌ Erro fatal: " . $e->getMessage());
            $this->error("Stack trace: " . $e->getTraceAsString());
            return 1;
        }
    }
}

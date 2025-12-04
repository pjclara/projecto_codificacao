# Configuração de Embeddings OpenAI

## 📦 Instalação

### 1. Instalar o pacote OpenAI PHP Client

```bash
composer require openai-php/client
```

### 2. Configurar API Key no `.env`

Adicione sua chave da OpenAI no arquivo `.env`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxx
```

### 3. Adicionar configuração em `config/services.php`

Abra o arquivo `config/services.php` e adicione:

```php
'openai' => [
    'api_key' => env('OPENAI_API_KEY'),
],
```

### 4. Executar a migration

```bash
php artisan migrate
```

Isso irá adicionar a coluna `embedding` (tipo JSON) na tabela `icd10pcs`.

---

## 🚀 Uso do Comando

### Gerar embeddings para todos os registros

```bash
php artisan embeddings:gerar
```

### Gerar apenas para registros sem embeddings

```bash
php artisan embeddings:gerar --skip-existing
```

### Processar apenas os primeiros 100 registros (para testes)

```bash
php artisan embeddings:gerar --limit=100
```

### Combinar opções

```bash
php artisan embeddings:gerar --skip-existing --limit=50
```

---

## 📊 Recursos do Comando

✅ **Barra de progresso** visual no terminal  
✅ **Tratamento de exceções** individual por registro  
✅ **Relatório final** com métricas (total, sucessos, erros)  
✅ **Detalhes dos erros** em formato de tabela  
✅ **Opção para pular registros existentes** (útil para retomar processamento)  
✅ **Opção de limitar quantidade** (útil para testes)  
✅ **Validação de API key** antes de processar  
✅ **Salvamento em JSON** para compatibilidade com MySQL  

---

## 📝 Estrutura do Embedding

O comando:

1. Lê cada registro da tabela `icd10pcs` (id, codigo, descricao_curta/descricao_longa)
2. Concatena: `codigo + " - " + descricao`
3. Envia para o modelo `text-embedding-3-small` da OpenAI
4. Recebe um vetor de 1536 dimensões
5. Salva na coluna `embedding` como JSON

Exemplo de dados salvos:

```json
[0.123, -0.456, 0.789, ..., 0.321]
```

---

## 💡 Dicas

- **Custo**: O modelo `text-embedding-3-small` é muito econômico (~$0.02 por 1 milhão de tokens)
- **Rate Limits**: Se tiver muitos registros, considere adicionar um `sleep()` entre requisições
- **Retomar processamento**: Use `--skip-existing` para retomar após interrupção
- **Teste primeiro**: Use `--limit=10` para validar antes de processar tudo

---

## 🔍 Exemplo de Saída

```
📊 Processando 1500 registros...

1500/1500 [============================] 100%

✅ Processamento concluído!
+---------------------+-------+
| Métrica             | Valor |
+---------------------+-------+
| Total de registros  | 1500  |
| Sucessos            | 1498  |
| Erros               | 2     |
+---------------------+-------+

Deseja ver os detalhes dos erros? (yes/no) [yes]:
```

---

## ⚠️ Troubleshooting

### Erro: "API key da OpenAI não configurada"
- Verifique se `OPENAI_API_KEY` está no `.env`
- Rode `php artisan config:clear`

### Erro: "Class 'OpenAI' not found"
- Execute `composer require openai-php/client`
- Execute `composer dump-autoload`

### Erros de rate limit
- Adicione `sleep(1)` no loop (após `$progressBar->advance()`)
- Ou use `--limit` para processar em lotes menores

---

## 🤖 API de Sugestões com IA

### Endpoint

```
POST /api/ai/sugerir
```

### Request

```json
{
  "texto": "remoção de apêndice"
}
```

### Response

```json
{
  "texto_entrada": "remoção de apêndice",
  "total_comparacoes": 1500,
  "sugestoes": [
    {
      "codigo": "0DTJ4ZZ",
      "descricao": "Ressecção de Apêndice, Abordagem Endoscópica Percutânea",
      "relevancia": "Este é o código mais apropriado pois especifica a ressecção (remoção completa) do apêndice por via laparoscópica, que é o procedimento padrão moderno."
    },
    {
      "codigo": "0DTJ0ZZ",
      "descricao": "Ressecção de Apêndice, Abordagem Aberta",
      "relevancia": "Código para apendicectomia aberta (cirurgia tradicional), usado quando a abordagem laparoscópica não é viável ou em casos de emergência."
    },
    {
      "codigo": "0DTJ7ZZ",
      "descricao": "Ressecção de Apêndice, Via Natural ou Artificial",
      "relevancia": "Procedimento menos comum que utiliza orifícios naturais do corpo, representando técnicas minimamente invasivas mais avançadas."
    }
  ],
  "explicacao": "Os três códigos selecionados representam diferentes abordagens cirúrgicas para a remoção do apêndice (apendicectomia). A principal diferença está na via de acesso: endoscópica (laparoscópica - mais comum atualmente), aberta (tradicional), e via natural. Todos são procedimentos de ressecção completa do apêndice, adequados para casos de apendicite aguda ou outras condições que exigem a remoção do órgão. A escolha entre eles depende das condições clínicas do paciente, disponibilidade de equipamento e expertise da equipe cirúrgica."
}
```

### Exemplo de uso com cURL

```bash
curl -X POST http://localhost:8000/api/ai/sugerir \
  -H "Content-Type: application/json" \
  -d '{"texto": "cirurgia cardíaca"}'
```

### Exemplo de uso com JavaScript/Fetch

```javascript
const sugerirCodigos = async (texto) => {
  const response = await fetch('/api/ai/sugerir', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ texto }),
  });
  
  const data = await response.json();
  return data.sugestoes;
};

// Usar
const sugestoes = await sugerirCodigos('transplante renal');
console.log(sugestoes);
```

### Como funciona

1. **Entrada**: Recebe texto em linguagem natural (ex: "cirurgia no coração")
2. **Embedding**: Converte o texto em vetor numérico usando `text-embedding-3-small`
3. **Comparação**: Calcula similaridade cosseno com todos os embeddings salvos
4. **Ranking**: Ordena por score de similaridade (0 a 1)
5. **Top 5**: Seleciona os 5 códigos mais similares
6. **Validação com IA**: Envia os 5 resultados para `gpt-4o-mini` que:
   - Analisa a relevância de cada código
   - Reordena se necessário
   - Seleciona os 3 melhores
   - Explica por que cada um é relevante
   - Gera uma explicação geral contextualizada
7. **Resultado**: Retorna 3 códigos validados + explicações em linguagem natural

### Métricas de Score

O sistema utiliza uma **abordagem híbrida** combinando:

1. **Similaridade Semântica (Embeddings)**:
   - Encontra códigos semanticamente similares
   - Baseado em vetores matemáticos
   - Rápido e objetivo

2. **Validação Inteligente (GPT-4o-mini)**:
   - Analisa contexto clínico
   - Reordena por relevância real
   - Explica em linguagem clara
   - Filtra falsos positivos

Isso garante que os resultados sejam não apenas matematicamente similares, mas **clinicamente relevantes** e **fáceis de entender**.

### Benefícios da Abordagem Híbrida

✅ **Precisão**: Embeddings encontram candidatos + IA valida relevância  
✅ **Velocidade**: Embeddings pré-calculados = busca instantânea  
✅ **Explicabilidade**: GPT-4o-mini explica cada sugestão em português  
✅ **Confiabilidade**: IA filtra resultados irrelevantes que embeddings podem retornar  
✅ **Usabilidade**: Profissionais entendem POR QUÊ cada código foi sugerido

---

## 📁 Arquivos Criados

```
app/
  Console/
    Commands/
      GerarEmbeddings.php          # Comando para gerar embeddings
  Http/
    Controllers/
      AIController.php              # API de sugestões com IA

database/
  migrations/
    2025_11_24_000001_add_embedding_to_icd10pcs.php  # Migration

EMBEDDINGS_SETUP.md                # Esta documentação
```

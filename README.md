# WAREHOUSE — Caos no Estoque

Jogo de estratégia logística em tempo real para equipes em celulares. Feito com React + Vite + Supabase (Postgres e Realtime).

## O que está implementado

- Sala online com código de 5 caracteres.
- Painel do apresentador com iniciar, avançar operação, finalizar e reiniciar.
- Equipes independentes, cada uma com estoque e pontuação próprios.
- Ranking compartilhado e atualização por Supabase Realtime (com atualização de segurança a cada 5 segundos).
- Quatro etapas operacionais: WMS/recebimento e conferência; PEPS/UEPS; cross-docking; transit point.
- Ações validadas no banco de dados: entradas, localização, quantidades, separação, ordem de saída e roteamento.
- Interface responsiva para celulares Android e desktop.

> O projeto não contém um modo multiplayer falso. Sem configurar um projeto Supabase e suas chaves, o cliente não inicia; isso evita apresentar uma simulação local como se fosse uma partida online.

## Publicar para usar amanhã

### 1. Criar o backend gratuito

1. Acesse https://supabase.com/dashboard e crie um projeto (plano Free).
2. Abra **SQL Editor > New query**.
3. Copie todo o conteúdo de `supabase.sql`, cole e clique em **Run**.
4. Abra **Project Settings > API** e copie `Project URL` e `anon / public key`.
5. No Supabase, abra **Database > Replication** e habilite as tabelas `warehouse_rooms` e `warehouse_teams` na publicação `supabase_realtime`.

### 2. Testar localmente

Instale Node.js LTS (https://nodejs.org). Na pasta do projeto:

```bash
npm install
cp .env.example .env
```

Edite `.env` com os valores do Supabase:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Depois execute:

```bash
npm run dev -- --host 0.0.0.0
```

Abra o endereço local exibido pelo Vite. Para testar em celulares na mesma rede Wi-Fi, use o endereço de rede local mostrado no terminal. Para acesso pela internet, publique conforme a etapa seguinte.

### 3. Publicar gratuitamente no Vercel

1. Crie uma conta em https://vercel.com.
2. Envie esta pasta para um repositório GitHub (ou use a opção de importar projeto).
3. No Vercel, escolha **Add New > Project** e importe o repositório.
4. Em **Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Clique em **Deploy**. O Vercel fornecerá um endereço HTTPS público para compartilhar com a turma.

Configuração de build padrão: `npm run build`; diretório de saída: `dist`.

## Como conduzir a apresentação

1. Abra o endereço publicado no computador que será projetado.
2. Clique em **Criar sala do apresentador**. O código aparece no painel.
3. Projete o painel e compartilhe o endereço e o código com a turma.
4. Cada equipe abre o link no próprio celular, digita o código e escolhe um nome.
5. Quando todas estiverem conectadas, clique em **Iniciar partida**.
6. Ao terminar cada operação, clique em **Próxima operação**. Depois de Transit point, avance novamente para encerrar.
7. Use **Reiniciar partida** para zerar pontuação e estoque e jogar novamente na mesma sala.

## Como jogar

- **WMS / Recebimento:** registre 5 unidades de um produto e indique a localização (A1, A2, B1 ou B2). Use também “Separar e conferir” para retirar uma unidade somente se produto e localização corresponderem ao estoque registrado.
- **PEPS / UEPS:** selecione o método e o lote. PEPS exige o lote mais antigo daquele produto; UEPS exige o mais recente. O banco valida a ordem e atualiza quantidade/pontuação.
- **Cross-docking:** confira o destino da carga recebida e encaminhe diretamente para expedição.
- **Transit point:** identifique a região da carga e transfira para o veículo correspondente (Norte/VAN-01, Sul/VAN-02, Leste/VAN-03, Oeste/VAN-04).

## Pontuação

| Ação | Pontos |
|---|---:|
| Registrar entrada/localização no WMS | +5 XP |
| Separar e conferir uma unidade no local correto | +7 XP |
| Saída correta pelo PEPS ou UEPS | +10 XP |
| Cross-docking para o destino correto | +15 XP |
| Transferência para o veículo correspondente | +15 XP |
| Conferência/localização incorreta | -2 XP |
| Lote fora da ordem PEPS/UEPS | -3 XP |
| Destino ou veículo incorreto | -5 XP |

A pontuação nunca fica abaixo de zero.

## Correspondência com o PDF da apresentação

| Conteúdo do material | Mecânica no jogo |
|---|---|
| Página 2: objetivos, WMS, PEPS/UEPS, cross-docking e transit point | Estrutura das quatro operações |
| Página 4: entrada/saída, localização, estoque, separação e conferência WMS | Registro de recebimento, posição física, quantidade e retirada conferida |
| Página 5: ordem PEPS/UEPS, rotação e risco de materiais antigos parados | Validação da saída do lote mais antigo ou mais recente; explicação do impacto |
| Página 6: recebimento, separação por destino, expedição rápida, economia de espaço e rapidez | Operação de cross-docking com encaminhamento direto |
| Páginas 7–8: recebimento, organização por região/rota/destino, transferência e distribuição | Operação de transit point com veículo por região |
| Página 9: aplicação cotidiana integrada | Estoque, movimentação, separação e distribuição em uma partida |

**Observação didática importante:** o PDF registra que o UEPS tem restrições e não é aceito pelo CPC 16 para atribuição de custos nas demonstrações contábeis (página 5). O jogo o utiliza somente como regra de movimentação operacional ilustrativa “quando aplicável”, como descrito no material; não o apresenta como método contábil permitido.

## Limitações e transparência

- O link público só existe depois que você criar o projeto Supabase e publicar o frontend no Vercel. Não tenho acesso às suas contas para publicar por você.
- O banco usa permissões de leitura públicas para que a turma acompanhe a sala, e as ações são RPCs no banco. É apropriado para uma atividade de sala de aula; não é uma plataforma competitiva com identidade autenticada ou proteção antifraude empresarial.
- O painel do apresentador mantém o token de controle na sessão aberta. Evite fechar/recarregar a aba do apresentador durante a partida; se isso ocorrer, crie uma nova sala.
- Fontes externas de fonte (Google Fonts) podem ser substituídas pelo fallback do sistema se a rede estiver indisponível.

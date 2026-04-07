# Sistema de Audiometria Ocupacional - TODO

## Layout & Navegação
- [x] Configurar tema global (cores, fontes Inter, variáveis CSS)
- [x] Implementar sidebar com navegação (Dashboard, Empresas, Colaboradores, Exames, Comparativo Audiométrico, Relatórios, Configurações)
- [x] Implementar topbar com busca global e perfil do usuário
- [x] Configurar roteamento com wouter

## Schema do Banco de Dados
- [x] Tabela de empresas (nome, CNPJ, responsável, telefone, status)
- [x] Tabela de colaboradores (nome, CPF, cargo, empresa, status)
- [x] Tabela de exames audiométricos (colaborador, empresa, tipo, data, resultado, status)
- [x] Tabela de notificações/alertas

## Dashboard Principal
- [x] Cards de métricas (Total Empresas, Colaboradores, Exames Realizados, Exames Vencidos)
- [x] Seção de Alertas e Pendências
- [x] Tabela de Exames Recentes
- [x] Indicadores de crescimento (vs mês anterior)

## Módulo de Empresas
- [x] Cards de resumo (Total, com Pendências, Exames a Vencer, Audiometrias Pendentes)
- [x] Filtros avançados (busca por nome, CNPJ, responsável, status, setor)
- [x] Tabela de empresas com colunas: nome, CNPJ, responsável, telefone, funcionários, exames, pendências, status, última atualização, ações
- [x] Botões de ação: Importar Empresas, Nova Empresa
- [x] Modal de criação/edição de empresa
- [ ] Modal de detalhes da empresa (informações, funcionários, exames)
- [ ] Paginação da tabela

## Módulo de Colaboradores
- [x] Listagem de colaboradores com filtros
- [x] Modal de criação/edição de colaborador
- [ ] Perfil detalhado do colaborador
- [ ] Histórico de exames do colaborador
- [ ] Comparativo audiométrico individual

## Módulo de Exames
- [x] Listagem de exames com filtros
- [x] Registro de novo exame
- [x] Status: Normal, Alteração, Vencido, Pendente
- [ ] Upload de resultado/laudo
- [ ] Visualização detalhada do exame

## Comparativo Audiométrico
- [x] Seleção de empresa e colaborador
- [x] Visualização comparativa de exames anteriores
- [x] Tabela de frequências audiométricas (250Hz a 8000Hz)
- [x] Gráfico audiograma
- [x] Redesign completo do comparativo (layout Figma: cards, perfil, linha do tempo, tabela comparativa OD/OE com diff, análise evolutiva, observações)

## Módulo de Relatórios
- [x] Cards de resumo de relatórios
- [x] Filtros por empresa, período, tipo
- [x] Gráfico de barras (exames por período)
- [x] Gráfico de rosca (distribuição por resultado)
- [x] Tabela de relatórios por empresa
- [ ] Exportar relatório em PDF

## Configurações
- [x] Perfil do usuário (nome, especialidade, CRFa, e-mail, telefone)
- [x] Preferências gerais (idioma, fuso horário)
- [x] Alertas e notificações (toggle de configurações)
- [x] Assinatura e plano
- [x] Acesso de acompanhamento
- [x] Segurança e sessão
- [x] Configurações do laudo (dados da clínica e do profissional)
- [x] Assinatura dinâmica no formulário de exame (usa dados da configuração)

## Funcionalidades Avançadas
- [ ] Importação em lote via CSV/Excel
- [x] Geração de laudos em PDF
- [ ] Sistema de alertas para exames vencidos
- [ ] Notificações em tempo real

## Testes
- [x] Testes das rotas tRPC (15 testes passando)
- [ ] Testes dos componentes principais

## Lógica Funcional (ST Audiometria Pró Ocupacional v2.12)

- [ ] Expandir schema: tabelas exames_audiometricos, limiares_audiometricos, irf, pareceres_modelo
- [ ] Rotas tRPC para CRUD de exames completos
- [ ] Página de registro de exame com 6 seções (identificação, motivo, meatoscopia, audiometria, IRF, parecer)
- [ ] Campos de identificação: empresa, paciente, setor, função, CPF, data nascimento, idade, sexo, audiômetro, data calibração
- [ ] Motivo da avaliação: Admissional, Periódico, Retorno ao Trabalho, Demissional, Mudança de Riscos, Monitoração Pontual, Consulta Médica
- [ ] Repouso auditivo (≥14h ou <14h), Queixa (Sim/Não), EPI (Não/Sim/Plug/Concha)
- [ ] Meatoscopia OD/OE: Normal, Com Obstrução Parcial, Com Obstrução Total
- [ ] Tabela de entrada de limiares audiométricos (VA e VO, OD e OE, com mascaramento)
- [ ] Frequências VA: 250, 500, 1k, 2k, 3k, 4k, 6k, 8k Hz
- [ ] Frequências VO: 500, 1k, 2k, 3k, 4k Hz
- [ ] Colunas por orelha: AUS VA MASC, AUS VA NÃO MASC, MASC VA, AÉREA (principal) + equivalentes para VO
- [ ] Audiograma interativo com símbolos ASHA 1990 (O, X, △, □, ♦, ✕, <, >, [, ])
- [ ] Linhas conectando pontos no audiograma (OD vermelho, OE azul)
- [ ] Cálculo automático de média: Lloyd & Kaplan 1978 (tritonal/quadritonal)
- [ ] Cálculo automático de média: Northern & Downs 2002 (tritonal/quadritonal)
- [ ] Cálculo automático de média: OMS 2014 (tritonal/quadritonal)
- [ ] Cálculo automático de média: OMS 2020 (tritonal/quadritonal)
- [ ] Cálculo automático de média: OMS 2021 (tritonal/quadritonal)
- [ ] Classificação automática do grau de perda auditiva
- [ ] Campos LRF, LDV, MASC abaixo do audiograma
- [ ] Índice de Reconhecimento de Fala (IRF): intensidade, monossílabos, dissílabos, mascaramento, OD/OE
- [ ] Mascaramento em dB: VA e VO, Min e Max, OD e OE
- [ ] Parecer audiológico com modelos pré-cadastrados e seleção
- [x] Geração de laudo em PDF com cabeçalho da empresa, dados do exame, audiograma, parecer e assinatura
- [ ] Upload de assinatura do profissional (imagem JPG)
- [x] Configurações do profissional: nome, CRFa, dados para laudo
- [x] Integração do fluxo: colaborador → novo exame → laudo

## Reformulação do Layout (Referência ST Audiometria Pró Ocupacional v2.12)
- [x] Cabeçalho: logo da clínica (quadrado esquerdo) + dados da clínica (centro) + título "AVALIAÇÃO AUDIOLÓGICA" (direita)
- [x] Seção 1 - Identificação: layout de tabela com bordas, campos em linha (Empresa | CNPJ/CAEPF, Paciente | CPF, Setor | Data Nasc | Idade, Função | Sexo, Audiômetro | Data Calibração)
- [x] Seção 2 - Motivo: dropdown ADMISSIONAL com seta lateral + Repouso Auditivo com checkboxes + Meatoscopia OD/OE ao lado direito
- [x] Queixa e EPI em linha abaixo do motivo
- [x] Seção Audiometria Tonal: título centralizado em fundo escuro, audiogramas OD e OE lado a lado com legenda ASHA no centro
- [ ] Legenda ASHA com símbolos corretos (O, X, △, □, <, >, etc.) em tabela compacta entre os dois audiogramas
- [ ] Tabela de limiares compacta abaixo dos audiogramas (igual ao original)
- [x] Seleção de método de cálculo da média com visual de botão (Lloyd e Kaplan 1978 destacado)

## Redesign Completo do Formulário (baseado nos vídeos do ST Audiometria)

- [x] Audiograma: plotagem automática ao digitar valor na tabela de limiares
- [x] Audiogramas OD e OE separados com título colorido (vermelho/azul)
- [x] Tabela de limiares integrada ao audiograma (VA, VA MASC, VO, VO MASC por frequência)
- [x] Legenda ASHA com símbolos visuais corretos entre os dois audiogramas
- [x] Botões APAGAR CÁLCULO e APAGAR GRÁFICO por orelha
- [x] Média calculada automaticamente com classificação textual
- [x] Campos LRF, LDV, MASC abaixo de cada audiograma
- [x] Seleção de método de cálculo: Lloyd e Kaplan, Northern e Downs, OMS 2014/2020/2021
- [x] Seção de mascaramento OD/OE com Min/Max para VA e VO
- [x] Parecer audiológico com modelos pré-cadastrados
- [ ] Upload de assinatura digital (imagem JPG)
- [x] Remover seção duplicada de IRF/tabela de frequências
- [x] Conectar todas as colunas da tabela de limiares ao audiograma com símbolos ASHA corretos (VA, MASC VA, AUS N.M., AUS MASC, VO, MASC VO)

## Landing Page & Acesso Público
- [x] Criar Landing Page pública com apresentação do sistema e botão "Entrar com Google"
- [x] Rota / exibe Landing Page para não autenticados, redireciona para /dashboard se autenticado
- [x] Atualizar App.tsx com rota pública / e rotas protegidas dentro do AppLayout
- [x] Atualizar navItems do AppLayout para usar /dashboard como rota principal

## Sistema de Autenticação Completo
- [x] Página de Login com email/senha e botão "Entrar com Google"
- [x] Página de Cadastro com nome, email, senha e botão "Continuar com Google"
- [x] Backend: procedures tRPC loginWithEmail e signupWithEmail com bcrypt
- [x] Campo passwordHash adicionado na tabela users (migration aplicada)
- [x] Helpers getUserByEmail e createUserWithPassword no db.ts
- [x] Proteção de rotas: ProtectedRoute redireciona para /login se não autenticado
- [x] main.tsx redireciona para /login em vez do Manus OAuth quando não autenticado
- [x] AppLayout redireciona para /login em vez de mostrar tela de login inline

## Correções de Redirecionamento
- [x] Rota / deve redirecionar para /login (não autenticado) ou /dashboard (autenticado), removendo a Home antiga
- [x] Remover botões Google/Apple do Login e Signup, manter apenas email/senha

## Integração Supabase
- [x] Instalar @supabase/supabase-js e configurar cliente
- [x] Substituir autenticação mock por Supabase Auth (signup/login/session)
- [x] Criar tabela exames com RLS no Supabase
- [x] Adaptar backend para usar Supabase Auth (verificar JWT)
- [x] Adaptar frontend: alertas reais, dados isolados por usuário
- [x] Remover todos os mocks e dados hardcoded

## Migração de Dados
- [x] Verificar conta Supabase criada (contatowoodmarcenaria@gmail.com)
- [x] Migrar dados da conta antiga (user_id=1) para nova conta Supabase (userId=240184)
- [x] Atualizar user_id de todas as tabelas (empresas, colaboradores, exames, pareceres)
- [x] Corrigir conflito CSS shorthand background vs backgroundSize no Login.tsx

## Alertas Reais (Supabase)
- [ ] Remover todos os alertas mock/hardcoded
- [ ] Criar hook useSupabaseAlerts para buscar exames vencidos e próximos do vencimento
- [ ] Mostrar "Nenhuma pendência ainda" quando não há dados
- [ ] Garantir isolamento por user_id (RLS Supabase)

## Remoção Completa de Mocks e Multi-usuário Real
- [ ] Auditar todos os arquivos com dados mock
- [ ] Criar tabelas Supabase (empresas, colaboradores) com RLS
- [ ] Criar hooks Supabase para dados reais
- [ ] Substituir mocks em Empresas.tsx, Colaboradores.tsx, Exames.tsx, Dashboard.tsx
- [ ] Garantir user_id em todos os inserts
- [ ] Mostrar estado vazio quando não há dados

## Remoção de Mocks da Página de Relatórios
- [x] Criar funções DB: getExamesPorMes, getDistribuicaoResultados, getEmpresasParaRelatorio
- [x] Adicionar procedures tRPC: relatorios.examesPorMes, relatorios.distribuicaoResultados, relatorios.empresasRelatorio
- [x] Substituir barData, pieData e empresasRelatorio hardcoded por dados reais do banco
- [x] Adicionar estados de loading e empty state para os gráficos e tabela
- [x] Filtro de empresa e período funcionando com dados reais
- [x] Testes unitários para as novas funções (22 testes passando)

## Correção de Dados Falsos no Dashboard
- [ ] Remover porcentagens estáticas (+8%, +12%, +5%, -3%) dos cards do Dashboard

## Remoção de Todos os Valores Estáticos/Decorativos
- [x] Auditar Dashboard.tsx: remover todos os trends/porcentagens hardcoded
- [x] Auditar Relatorios.tsx: remover trend "+15%" do card Total de Exames
- [x] Criar função backend getComparativoMensal para calcular variação real mês atual vs anterior
- [x] Exibir tendência nos cards apenas quando houver dados históricos reais
- [x] Remover labels estáticos "vs mês anterior" quando não há base de comparação

## Correção de Redirecionamento no Dashboard
- [x] Corrigir link "Registrar primeiro exame" para apontar para /exames/novo (formulário completo)

## Correção de Redirecionamento em Exames.tsx
- [x] Corrigir link/botão "Registrar primeiro exame" em Exames.tsx para navegar para /exames/novo em vez de abrir modal antigo

## ID de Colaborador e Busca
- [x] Adicionar campo `codigo` (COL-XXXX) na tabela colaboradores no schema
- [x] Gerar e aplicar migração SQL para o novo campo
- [x] Gerar código automático ao criar colaborador (sequencial por usuário)
- [x] Exibir coluna ID (COL-XXXX) na tabela de colaboradores
- [x] Adicionar campo de busca por nome e ID na página de Colaboradores
- [x] Filtrar colaboradores por código no backend

## Busca Global Funcional
- [x] Conectar barra de pesquisa global do topo para buscar colaboradores por nome ou ID (COL-XXXX)
- [x] Ao pressionar Enter ou clicar, redirecionar para /colaboradores com filtro de busca pré-aplicado

## Busca por COL-XXXX em Todas as Lupas
- [x] Auditar e corrigir busca em Exames.tsx (campo de busca de colaborador no modal)
- [x] Auditar e corrigir busca em Comparativo Audiométrico
- [x] Auditar e corrigir busca no formulário de novo exame (ExameAudiometrico.tsx)
- [x] Exibir código COL-XXXX em azul ao lado do nome em todos os seletores

## Autocomplete na Barra de Pesquisa Global
- [x] Criar procedure de busca rápida de colaboradores (busca por nome ou COL-XXXX)
- [x] Atualizar AppLayout: dropdown em tempo real com COL-XXXX + nome ao digitar
- [x] Ao clicar em um resultado, navegar para o colaborador (página de colaboradores com filtro)

## Correções no Layout do Audiograma
- [x] Remover legenda ASHA (1990) duplicada — manter apenas uma
- [x] Centralizar e aumentar as frequências nos eixos X dos gráficos de OD e OE

## Redesenho do Audiograma SVG
- [x] Mover rótulos de frequência (250, 500, 1k...) para dentro da área do gráfico (acima das linhas de grade)
- [x] Mover texto "Nível de audição em decibel (dBNA)" para dentro da área do gráfico (lateral esquerda interna)
- [x] Ajustar margens do SVG para aproveitar todo o espaço disponível

## Layout Responsivo do Audiograma
- [x] Centralizar o audiograma horizontalmente no container com flexbox
- [x] Tornar o SVG responsivo (width 100%, viewBox preserveAspectRatio)
- [x] Reduzir espaços laterais excessivos no container
- [x] Remover maxWidth fixo do SVG para ocupar toda a largura disponível

## Correção do Nome no Dashboard
- [x] Corrigir "Bem-vindo, Jonas" para usar o nome do usuário autenticado (useAuth)

## Correção do Nome do Usuário no Dashboard
- [x] Investigar por que user.name vem vazio mesmo com nome cadastrado
- [x] Corrigir backend para retornar o nome real do usuário autenticado (supabaseAuth.ts + context.ts)

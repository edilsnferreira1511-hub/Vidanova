# Arquitetura — COOPMETRO BACKUP

```
TUDO NUMA PASTA SÓ (sem subpastas). Os prefixos dos nomes indicam o papel de cada arquivo:

Entrada e navegação
  index.js · App.tsx          Entrada do app e porta de acesso (login / sem acesso / app)
  navigation.tsx              Navegação em estado (pilha + abas), sem Expo Router
Telas (Tela*.tsx)
  TelaLogin · TelaInicio · TelaNova · TelaSolicitacoes · TelaDetalhes
  TelaAnalise · TelaPainel · TelaAvisos · TelaFiltros · TelaPerfil
Componentes
  GlassSurface · GlassTabBar · ui · QrCapture · RequestCard
Domínio e regras (puros, testados)
  types · status · qr · sheetRow · access
Serviços e contexto
  firebase · authService · profileService · backupService · sheetsService
  AuthContext · FiltersContext · useRequests
Configuração e tema
  env · xptSchema · theme · app.json · package.json · tsconfig.json · .env.example
Integração e segurança
  Code.gs (espelho Planilhas) · firestore.rules.proposed (NÃO aplicado)
Testes
  qr.test.ts · access.test.ts · sheets-sync.test.ts · register.mjs · resolve-ts.mjs
Documentos
  README · ARQUITETURA · DECISOES · PENDENCIAS · PLANILHAS
```

## Fluxo de autenticação e autorização

1. `signInWithEmailAndPassword` no Firebase **existente** (nenhuma conta nova, nenhuma senha guardada).
2. UID → leitura do perfil no cadastro do XPT → `mapXptUser` (cargo não mapeado = sem acesso).
3. `allowedRoutes(perfil)` define as abas (barra de vidro em `GlassTabBar`); `canDecide/canCancel/...` define as ações.
4. As mesmas regras precisam existir no Firestore (`firestore.rules.proposed`). **A UI não é barreira de segurança.**

## Modelo de dados — coleção `backup_requests`

`dataBackup, svc, base, rotaId, rotaNome, containerId, veiculo{qrId, carrierId, carrierName, placa, tipoVeiculo, tipoVeiculoId, trackingProviderIds}, motoristaNome, qtdPacotes, qtdParadas, motivo, execucao{}, solicitante{uid,nome}, status, decisao{resultado, justificativa, descontoCooperado, porUid, porNome, em}, criadoEm, criadoEmServidor, historico[{status, porUid, porNome, em, observacao}]`

Nomes em camelCase/português **provisórios**; alinhar ao padrão do XPT (pendência A3). Registros são separados das coleções logísticas do XPT.

## Status

`PENDENTE → EM_ANALISE → APROVADO | RECUSADO`; `PENDENTE → CANCELADO`. Estados finais não mudam. Cada mudança acrescenta uma entrada ao `historico` (nunca apaga).

# Pendências e informações que faltam

Nada abaixo foi inventado ou simulado. Enquanto estes itens não forem resolvidos, **a integração com o Firebase não está conectada nem testada**.

## A. Informações que preciso do COOPMETRO XPT

1. **Como o XPT faz login**: e-mail + senha, ou "usuário" convertido em e-mail? (`authService.ts → toAuthEmail`). Hoje só aceita e-mail.
2. **Estrutura dos usuários/perfis** (um documento real, com dados sensíveis removidos):
   - nome da coleção (`EXPO_PUBLIC_XPT_USERS_COLLECTION`);
   - campos de nome, cargo(s) e base(s) vinculada(s), e se existe "acesso a todas as bases";
   - os valores exatos de cargo para Despachante, Supervisor, Coordenador geral e Administrador (`xptSchema.ts`).
   Se cargo/base ficarem fora do documento do usuário (ex.: *custom claims* ou outra coleção), me avise: a estratégia muda.
3. **Regras atuais do Firestore** (arquivo `firestore.rules`) e **padrão de nomes de campos/coleções** do XPT, para alinhar `backup_requests` sem duplicações.
4. **Código-fonte do XPT (somente leitura)** ou ao menos tema/cores oficiais, se forem diferentes das cores amostradas da logo.
5. Lista das **bases (XPT)** existentes e dos **SVCs** válidos, se quiser validação além do QR.

## B. Decisões de negócio

- Supervisor pode **colocar em análise**? (hoje: sim, só PENDENTE → EM_ANALISE; não aprova/recusa)
- Administrador **vê solicitações**? (hoje: não; só gestão de acessos, ainda sem telas)
- Despachante pode **cancelar** enquanto pendente? (hoje: sim)
- Desconto de cooperado: é obrigatório registrar sim/não **também na recusa**? (hoje: sim)
- Alguma exceção em que um despachante possa aprovar a própria solicitação? (hoje: nunca)
- Prazos/SLA das pendências para o supervisor (a tela de prazos ainda não existe).

## C. Ações que exigem sua autorização (não executei)

- Publicar/mesclar as regras do Firestore (`firestore.rules.proposed`) em produção.
- Criar o **índice composto** (`base` + `criadoEm`) usado na listagem.
- Autorizar domínios no Firebase Auth (se o app web for usado).
- Planilhas: criar a conta de serviço, dar a ela leitura no Firestore e compartilhar a planilha (ver `PLANILHAS.md`).
- Qualquer deploy, build de loja ou mudança de plano de cobrança.

## D. Não verificado nesta etapa (limite do ambiente)

O ambiente teve o acesso ao registro npm **negado pela política de rede (403)**. Portanto:
- as dependências **não foram instaladas**; nenhuma versão foi fixada ou verificada;
- a compatibilidade do `expo-glass-effect` com a versão do Expo/React Native **não foi conferida** (use `npm run bootstrap` e leia a saída de `npx expo install --check`);
- o app **não foi compilado nem executado**, e o `tsc` completo do projeto **não rodou** (só os módulos puros).

## E. Fora do escopo desta etapa

PWA instalável (service worker/manifest completos) para a versão web, push notifications, telas de administração de acessos, tela de prazos, exportações.

# Pendências

Nada abaixo foi inventado ou simulado. Enquanto não for resolvido, **o login real não libera acesso**.

## A. Informações que faltam do COOPMETRO XPT
1. **Login do XPT**: e-mail + senha, ou "usuário" convertido em e-mail? (hoje só e-mail)
2. **Cadastro de usuários**: nome da coleção, campos de nome, cargo(s) e base(s), e se existe "acesso a todas as bases"; valores exatos de cargo para Despachante, Supervisor, Coordenador geral e Administrador. Se cargo/base não estiverem no documento do usuário, avise: a estratégia muda. → preencher `config.js`
3. **Regras atuais do Firestore** e padrão de nomes do XPT, para alinhar `backup_requests`.
4. Lista de **bases (XPT)** e **SVCs** válidos, se quiser validação.
5. Cores oficiais do XPT, se forem diferentes das amostradas da logo.

## B. Decisões de negócio
- Supervisor pode colocar em análise? (hoje: sim; não aprova nem recusa)
- Administrador vê solicitações? (hoje: não; sem telas de gestão de acessos ainda)
- Despachante cancela enquanto pendente? (hoje: sim)
- Desconto de cooperado obrigatório também na recusa? (hoje: sim)
- Prazos/SLA para o supervisor (a tela de prazos ainda não existe).

## C. Ações que dependem da sua autorização (não executei)
- Mesclar `firestore.rules.proposed` às regras de produção (**sem isso, a segurança real não existe**: a tela não é barreira).
- Criar o índice composto `base` + `criadoEm` (o console mostra o link no primeiro erro).
- Autorizar o domínio do GitHub Pages no Firebase Authentication.
- Planilhas: conta de serviço e permissões (ver `PLANILHAS.md`).

## D. Não verificado
- Firebase **real** (login, leitura, gravação): não testado.
- **Câmera/leitura de QR** em celular real: só o caminho "colar conteúdo" foi testado.
- Instalação como app e uso offline em celular real.
- iPhone/Safari.
- O efeito de vidro usa `backdrop-filter` do navegador (sem `expo-glass-effect`, que é do app nativo).

## E. Fora desta etapa
Push notifications, gestão de acessos, tela de prazos, exportações.

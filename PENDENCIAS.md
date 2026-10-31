# Pendências

## Resolvido
- Login por e-mail e senha (Authentication do XPT): confirmado por você.
- Estrutura de usuários: `env/producao/users/{uid}` com `role`, `xptIds`, `active`.

## A. Decisões de negócio
1. **`coord_base` (Coordenador de base)**: hoje fica **sem acesso**, porque não estava entre os 4 perfis pedidos. O que ele deve poder fazer?
2. `admin_sistema` está tratado como Administrador. Confirma?
3. Supervisor pode colocar em análise? (hoje: sim; não aprova nem recusa)
4. Administrador vê solicitações? (hoje: não; ainda sem telas de gestão de acessos)
5. Despachante cancela enquanto pendente? (hoje: sim)
6. Desconto de cooperado obrigatório também na recusa? (hoje: sim)
7. Prazos/SLA para o supervisor (tela ainda não existe).

## B. Ações que dependem da sua autorização (não executei)
- **Mesclar as regras** de `firestore.rules.proposed` às regras do XPT. **Sem isso, a coleção `env/producao/backup_requests` provavelmente fica bloqueada** (as regras atuais não a conhecem) e não há proteção real por base. Para mesclar sem risco, preciso do texto das regras atuais (Firestore → Regras).
- Confirmar que as regras atuais de `env/producao/xpts` deixam o usuário ler o nome das bases; se não deixarem, o app mostra só o id (ex.: `x1`).
- Autorizar `seu-usuario.github.io` no Firebase Authentication (se ainda não fez).
- Planilhas: conta de serviço e permissões (ver `PLANILHAS.md`).
- Já existem ações de "Backup" fixas nas regras e no código do XPT (você citou). Preciso ver as regras atuais para garantir que este sistema não conflita com elas.

## C. Não verificado
- Leitura do cadastro, criação, cancelamento e decisão contra o **Firebase real**.
- Regras do Firestore (nenhum emulador disponível aqui).
- Câmera para ler QR num celular de verdade (só "colar conteúdo" foi testado).
- Instalação como app e uso offline em celular real; iPhone/Safari.
- Envio para o Google Planilhas.

## D. Fora desta etapa
Push notifications, gestão de acessos, tela de prazos, exportações.

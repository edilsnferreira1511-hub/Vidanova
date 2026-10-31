# COOPMETRO BACKUP

Gestão de solicitações de pagamento de backup para motoristas da COOPMETRO. Mobile first (Expo / React Native), reutilizando login, usuários e permissões do Firebase do COOPMETRO XPT.

**Todos os arquivos estão nesta única pasta, sem subpastas.**

> **Estado: estrutura inicial (etapa 1).** Nada foi publicado, nenhuma regra de produção foi alterada e a integração real com o Firebase **ainda não foi testada**. Veja `PENDENCIAS.md`.

## Como rodar (na sua máquina)

```bash
cp .env.example .env        # preencha a coleção de usuários do XPT
npm run bootstrap           # instala deps com versões compatíveis do Expo
npx expo install --check    # confirme a compatibilidade (inclui expo-glass-effect)
npm run typecheck
npm test                    # testes de lógica pura (só precisa de Node 22+)
npm run start
```

## Mapa dos arquivos

`Tela*.tsx` são as telas · `App.tsx` e `navigation.tsx` cuidam do acesso e da navegação · `types/status/qr/access/sheetRow` são a lógica pura · `*Service.ts` falam com o Firebase · `Code.gs` espelha para o Google Planilhas · `firestore.rules.proposed` é só uma proposta.

Detalhes: `ARQUITETURA.md` · `DECISOES.md` · `PENDENCIAS.md` · `PLANILHAS.md`

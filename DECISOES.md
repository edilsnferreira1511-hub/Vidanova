# Decisões técnicas

1. **Expo + React Native + TypeScript, pasta única.** Um código para iPhone, Android e web. Como você pediu todos os arquivos numa pasta só, não uso Expo Router (que exige pasta `app/`): a navegação é uma pilha simples em estado (`navigation.tsx`), e a guarda de acesso fica em `App.tsx`.
2. **Versões não fixadas à mão.** `bootstrap.sh` usa `npx expo install`, que escolhe as versões compatíveis com o SDK. Não consegui consultar o npm neste ambiente (403), então não afirmo nenhuma versão.
3. **Vidro com degradação.** `GlassSurface` usa `expo-glass-effect` só quando `isLiquidGlassAvailable()` é verdadeiro (iOS com suporte). Em Android/web/iOS antigo usa translucidez + borda (e `backdrop-filter` no web), sem biblioteca extra. Toda a UI usa `GlassSurface`, então o efeito muda num só lugar.
4. **Firebase existente, sem Analytics.** Configuração por variáveis `EXPO_PUBLIC_*` (identificadores públicos de cliente; não são segredos). Nenhum projeto novo.
5. **Só login.** Nenhuma tela de cadastro, senha ou troca de cargo/base. O perfil vem do cadastro do XPT por UID.
6. **Adaptador do cadastro do XPT (`xptSchema.ts`).** Os nomes de campos/cargos não são conhecidos; ficam como `TODO` explícitos. Cargo desconhecido ⇒ sem acesso (falha fechada).
7. **Autorização em duas camadas.** `permissions/access.ts` (UX) + regras do Firestore propostas (segurança). Ninguém aprova o próprio pedido, mesmo sendo coordenador e despachante.
8. **QR com validação antes de preencher.** `parseQr` devolve erros/avisos; `QrCapture` mostra os dados e só confirma com a ação da pessoa. Ids numéricos são preservados como texto original (sem perda de precisão). O `id` do QR do veículo **não** é tratado como motorista; o nome do motorista é digitado.
9. **Histórico append-only.** Mudanças usam `arrayUnion` de entradas; as regras propostas exigem exatamente uma nova entrada e proíbem delete.
10. **Notificações derivadas.** Sem coleção nova: os avisos vêm do histórico das solicitações visíveis. Push fica para depois.
11. **Planilhas fora do app.** Firestore é a fonte; um Apps Script lê e espelha (ver `PLANILHAS.md`). Evita credenciais no app e cobrança extra.
12. **Lógica pura sem dependências** (`domain/`, `permissions/`) para ser testável apenas com Node.

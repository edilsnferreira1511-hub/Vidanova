# COOPMETRO BACKUP (PWA)

Sistema de solicitações de pagamento de backup. Roda direto no GitHub Pages, **sem instalar nada e sem build**. Todos os arquivos ficam soltos numa pasta só (sem subpastas), então dá para enviar pelo site do GitHub.

> **Estado:** o login real no Firebase do XPT já foi confirmado por você. A leitura do cadastro, a criação e a decisão de solicitações **ainda não foram testadas contra o Firebase real**: as telas só foram testadas com um Firebase simulado, e as regras de segurança ainda não estão aplicadas (veja `PENDENCIAS.md`). Nada foi publicado e nenhuma regra de produção foi alterada.

## Publicar no GitHub Pages (passo a passo)

1. No GitHub, abra o repositório (ou crie um) e clique em **Add file → Upload files**.
2. Arraste **todos os arquivos desta pasta** (selecione tudo, não a pasta). Clique em **Commit changes**.
3. Vá em **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)** e salve.
4. Espere cerca de 1 minuto. O endereço será `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
5. No **Firebase Console → Authentication → Settings → Authorized domains**, adicione `SEU-USUARIO.github.io`. Sem isso o login é recusado.
6. No celular, abra o endereço no Chrome e use **Instalar app / Adicionar à tela inicial**.

## Como o acesso funciona

O login é o do Firebase Authentication do XPT. Depois de entrar, o app lê **`env/producao/users/{uid}`** (só o documento da própria pessoa) e usa `role`, `xptIds` e `active`:

| `role` no XPT | Papel neste sistema |
|---|---|
| `despacho` | Despachante |
| `supervisor` | Supervisor |
| `coord_geral` | Coordenador geral |
| `administrador`, `admin_sistema` | Administrador |
| `coord_base`, `motorista` | **Sem acesso** (coord_base aguarda decisão) |

`active` diferente de `true` bloqueia. `coord_geral`, `administrador` e `admin_sistema` enxergam todas as bases; os demais só as de `xptIds`. Tudo isso fica no `config.js`, que normalmente não precisa mexer.

As solicitações ficam em **`env/producao/backup_requests`**, separadas da subcoleção `backups` que já existe no XPT.

## Atualizar depois

Ao subir arquivos alterados, abra o `sw.js` e aumente `VERSAO` (atual: `v2`), para os celulares pegarem a versão nova.

## Mapa dos arquivos

| Arquivo | Para quê |
|---|---|
| `index.html`, `estilo.css`, `manifest.webmanifest`, `sw.js`, `icone-*.png`, `apple-touch-icon.png` | Página, visual, instalação no celular e uso offline da "casca" |
| `app.js` | Entrada: login, perfil, rotas e barra de navegação |
| `telas.js` | Todas as telas |
| `ui.js`, `leitorqr.js` | Componentes e leitor de QR Code |
| `servicos.js` | Conversa com o Firebase (login, perfil, solicitações) |
| `acesso.js`, `status.js`, `qr.js`, `perfil.js`, `planilha.js` | Regras de permissão, status, leitura dos QR e linhas da planilha |
| `config.js` | Configuração (caminhos, campos e mapa de cargos) |
| `Code.gs`, `PLANILHAS.md` | Espelho para o Google Planilhas (fora do app, não testado) |
| `firestore.rules.proposed` | Regras do Firestore **propostas**, não aplicadas |
| `PENDENCIAS.md` | O que falta |

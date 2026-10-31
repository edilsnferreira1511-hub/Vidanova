# COOPMETRO BACKUP (PWA)

Sistema de solicitações de pagamento de backup. Roda direto no GitHub Pages, **sem instalar nada e sem build**. Todos os arquivos ficam soltos numa pasta só (sem subpastas), então dá para enviar pelo site do GitHub.

> **Estado:** a interface foi testada num navegador de teste com um Firebase **simulado**. A ligação com o Firebase **real** do XPT **ainda não foi testada** e depende de preencher o `config.js` (veja `PENDENCIAS.md`). Nada foi publicado e nenhuma regra de produção foi alterada.

## Publicar no GitHub Pages (passo a passo)

1. No GitHub, abra o repositório (ou crie um) e clique em **Add file → Upload files**.
2. Arraste **todos os arquivos desta pasta** (selecione tudo, não a pasta). Clique em **Commit changes**.
3. Vá em **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)** e salve.
4. Espere cerca de 1 minuto. O endereço será `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
5. No **Firebase Console → Authentication → Settings → Authorized domains**, adicione `SEU-USUARIO.github.io`. Sem isso o login é recusado.
6. No celular, abra o endereço no Chrome e use **Instalar app / Adicionar à tela inicial**.

## O que você precisa editar

Só o **`config.js`**: coleção de usuários do XPT, os campos de nome/cargo/bases e o mapa de cargos. Enquanto estiver vazio, o login mostra "Configuração pendente" e ninguém recebe acesso.

## Atualizar depois

Ao subir arquivos alterados, abra o `sw.js` e aumente `VERSAO` (`v1` → `v2`), para os celulares pegarem a versão nova.

## Mapa dos arquivos

| Arquivo | Para quê |
|---|---|
| `index.html`, `estilo.css`, `manifest.webmanifest`, `sw.js`, `icone-*.png`, `apple-touch-icon.png` | Página, visual, instalação no celular e uso offline da "casca" |
| `app.js` | Entrada: login, perfil, rotas e barra de navegação |
| `telas.js` | Todas as telas |
| `ui.js`, `leitorqr.js` | Componentes e leitor de QR Code |
| `servicos.js` | Conversa com o Firebase (login, perfil, solicitações) |
| `acesso.js`, `status.js`, `qr.js`, `planilha.js` | Regras de permissão, status, leitura dos QR e linhas da planilha |
| `config.js` | **Configuração** |
| `Code.gs`, `PLANILHAS.md` | Espelho para o Google Planilhas (fora do app, não testado) |
| `firestore.rules.proposed` | Regras do Firestore **propostas**, não aplicadas |
| `PENDENCIAS.md` | O que falta |

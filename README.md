# VIAL KIDS — loja com Firebase + Pix (Mercado Pago)

## O que tem aqui
Todos os arquivos ficam em **uma única pasta**, sem subpastas.

| Arquivo | Para quê |
|---|---|
| `index.html` | A loja (mesmo visual da prévia), sacola, login e checkout |
| `admin.html` | Painel para **você** cadastrar produtos, fotos, estoque e acompanhar pedidos |
| `firebase-config.js` | **Único arquivo que você precisa preencher** com os dados do Firebase |
| `index.js` | Servidor: confere preços, gera o Pix e confirma o pagamento |
| `firestore.rules` | Regras de segurança do banco |

Sem preencher nada, abrir `index.html` já mostra a loja em **modo demonstração**.

## Como funciona
1. Cliente cria conta (e-mail/senha ou Google) e monta a sacola.
2. No checkout, a Cloud Function `createOrder` **lê os preços do banco** (ninguém consegue alterar valor pelo navegador), cria o pedido e gera o Pix no Mercado Pago.
3. O cliente paga; o Mercado Pago avisa a função `mpWebhook`, que confirma o pagamento na API deles, baixa o estoque e marca o pedido como **Pago**. A tela do cliente atualiza sozinha.
4. Você vê o pedido no painel, muda o status (preparo, enviado…) e coloca o código de rastreio.

## Passo a passo

### 1) Criar o projeto Firebase
1. Acesse https://console.firebase.google.com › **Adicionar projeto**.
2. **Build › Authentication › Começar** › ative **E-mail/senha** e **Google**.
3. **Build › Firestore Database › Criar banco** (modo produção, região `southamerica-east1`).
4. **Configurações do projeto › Seus apps › Web `</>`** › registre o app e copie o `firebaseConfig` para `firebase-config.js`.
5. **Plano Blaze**: as Cloud Functions exigem o plano Blaze (pago conforme o uso, com cota gratuita mensal). Uma loja pequena costuma ficar dentro da cota, mas é necessário cadastrar um cartão.

### 2) Mercado Pago
1. https://www.mercadopago.com.br/developers › **Suas integrações › Criar aplicação** (Pagamentos online).
2. Copie o **Access Token de produção** (para testar antes, use o de teste).
3. Tenha uma **chave Pix** cadastrada na sua conta Mercado Pago.

### 3) Publicar
Precisa de Node.js 20+ instalado.
```bash
npm install -g firebase-tools
firebase login
firebase use --add                      # escolha o seu projeto
npm install
firebase functions:secrets:set MP_ACCESS_TOKEN   # cole o Access Token do Mercado Pago
firebase deploy                         # publica site, regras e funções
```
No fim, o terminal mostra o endereço do site (`https://SEU-PROJETO.web.app`).

### 4) Virar administradora (uma vez)
1. Abra o site e **crie sua conta** normalmente.
2. No Console: **Authentication › Usuários** › copie o seu **UID**.
3. **Firestore › Iniciar coleção** › ID da coleção `admins` › ID do documento = **seu UID** › adicione qualquer campo (ex.: `ok` = `true`).
4. Acesse `/admin.html`, entre e cadastre os produtos.

> Tamanhos e estoque no painel: escreva `RN:3, P:5, M:2` (tamanho:quantidade).
>
> **Fotos:** não é preciso Storage. Cada foto é reduzida no navegador e salva como texto (base64) dentro do próprio produto no Firestore. Limite: 4 fotos por produto (o Firestore aceita ~1 MB por documento).

### 5) Testar o pagamento
No Mercado Pago, com o token de **teste**, o Pix gera um QR de teste. Faça um pedido de ponta a ponta e confira se o status vira **Pago** antes de trocar para o token de produção.

## Ajustes rápidos
- **Frete**: `SHIPPING_CENTS` no topo de `index.js` (em centavos; `0` = sem frete). Depois, `firebase deploy --only functions`.
- **Expiração do Pix**: 30 minutos (campo `date_of_expiration` em `index.js`).
- **Domínio próprio**: Console › Hosting › Adicionar domínio personalizado.

## Observações de segurança
- O Access Token do Mercado Pago fica só no servidor (Secret Manager), nunca no site.
- Pedidos só são criados pela função; clientes não conseguem escrever pedidos nem alterar preços.
- A chave `apiKey` do `firebase-config.js` é pública por design; quem protege os dados são as regras.
- Estoque é baixado quando o pagamento é confirmado. Em caso raro de duas pessoas pagarem a última peça ao mesmo tempo, o estoque pode ficar negativo; você verá no painel e resolve com a cliente.

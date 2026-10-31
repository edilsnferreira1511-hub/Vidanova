# Integração com Google Planilhas

Planilha: `1BNPI9u4uN_xu88zoccJbgu5-SAnYatqhn_52gZlgxwI` (aba "Página1").
Na leitura pública que tentei, a aba não mostrou cabeçalhos; as colunas em `sheetRow.ts` são **propostas** e precisam da sua confirmação.

## Estado: **NÃO configurado e NÃO testado**

O link da planilha **não concede** permissão de escrita ao sistema; é preciso uma identidade autorizada.

## Desenho escolhido

```
App  ──grava──▶  Firestore (fonte oficial)  ◀──lê (REST, conta de serviço)──  Apps Script  ──upsert──▶  Planilha
```

- O **app nunca fala com a planilha** e não carrega credenciais.
- O script `Code.gs` roda no Google (gatilho de 5 min), lê `backup_requests` e faz *upsert* por ID: novas solicitações viram linhas; mudanças de status atualizam a mesma linha.
- Por que não Cloud Functions: exigem plano Blaze (cobrança), e você pediu para não alterar o plano.

## Permissões necessárias (todas dependem de você)

| Quem | Permissão |
|---|---|
| Conta de serviço (nova) | Papel **Cloud Datastore Viewer** no projeto `coopmetro-xpt` (leitura do Firestore) |
| Dono do Apps Script | **Editor** na planilha |
| Propriedades do script | `SA_CLIENT_EMAIL` e `SA_PRIVATE_KEY` (chave JSON da conta de serviço), guardadas só no Apps Script |

Alternativa mais simples (sem chave de serviço): exportar manualmente. Menos automática, sem credenciais.

## Passo a passo (quando autorizado)

1. Confirmar as colunas e ajustar `SHEET_COLUMNS` + `COLUMNS` (um teste confere que os dois são iguais).
2. Criar a conta de serviço e a chave; guardar nas propriedades do script.
3. Executar `syncAll` manualmente e **verificar na planilha** uma criação e uma mudança de status reais.
4. Só então executar `installTrigger`.

Limitação conhecida: lê a coleção inteira a cada ciclo (ok para volume pequeno; otimizar com campo `atualizadoEm` depois).

import { SHEET_COLUMNS } from './sheetRow';

// O APP NUNCA ESCREVE NA PLANILHA. O espelhamento é feito fora do app (Code.gs),
// lendo o Firestore (fonte oficial) com uma credencial guardada no servidor, nunca no aplicativo.
// Este módulo só informa o estado da integração para a interface.

export type SheetsMirrorState = 'NAO_CONFIGURADO';

export const SHEET_ID = '1BNPI9u4uN_xu88zoccJbgu5-SAnYatqhn_52gZlgxwI'; // identificador público, sem credencial
export const sheetsMirrorState = (): SheetsMirrorState => 'NAO_CONFIGURADO';
export const sheetColumns = SHEET_COLUMNS;

// Permite que `node --test` importe módulos .ts sem extensão (como o Metro/TypeScript fazem).
import { register } from 'node:module';
register('./resolve-ts.mjs', import.meta.url);

import { existsSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Las VM ejecutan JavaScript; las fuentes y las pruebas se conservan en TypeScript.
export function compilarFuente(codigo: string, archivo: string, commonjs = false) {
  return ts.transpileModule(codigo, {
    fileName: archivo,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: commonjs ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
}

export function resolverFuente(ruta: string) {
  const candidatas = [ruta, `${ruta}.ts`, `${ruta}.tsx`, path.join(ruta, 'index.ts')];
  const archivo = candidatas.find(candidata => /\.tsx?$/.test(candidata) && existsSync(candidata));
  if (!archivo) throw new Error(`No se encontró la fuente TypeScript: ${ruta}`);
  return archivo;
}

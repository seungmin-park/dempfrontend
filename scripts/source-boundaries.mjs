import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { parse } from 'vue/compiler-sfc';

function targetPath(source, specifier, root) {
  const path = specifier.startsWith('@/') ? resolve(root, 'src', specifier.slice(2))
    : specifier.startsWith('.') ? resolve(dirname(source), specifier) : null;
  return path ? relative(join(root, 'src'), path).replaceAll('\\', '/').replace(/\.(ts|js|vue)$/, '').replace(/\/index$/, '') : specifier;
}

function importsOnlyTypes(node) {
  if (node.isTypeOnly || node.importClause?.isTypeOnly) return true;
  const clause = node.importClause;
  if (clause?.name) return false;
  const bindings = clause?.namedBindings ?? node.exportClause;
  if (!bindings || !(ts.isNamedImports(bindings) || ts.isNamedExports(bindings))) return false;
  return bindings.elements.length > 0 && bindings.elements.every(element => element.isTypeOnly);
}

export function inspectSourceBoundaries(root) {
  const failures = [];
  function inspectImport(file, specifier, typeOnly = false) {
    const source = relative(join(root, 'src'), file).replaceAll('\\', '/');
    const target = targetPath(file, specifier, root);
    if (target === 'api/reactions' && !typeOnly && source !== 'composables/useContentReaction.ts') {
      failures.push(`${source}: reaction owner must be composables/useContentReaction.ts (${specifier})`);
    }
    if (/^(components|views)\//.test(source) && (target === 'api/client' || /^axios(?:\/|$)/.test(target))) {
      failures.push(`${source}: transport boundary requires an API wrapper (${specifier})`);
    }
    if ((source.startsWith('composables/') && /^(components|views)\//.test(target))
      || (source.startsWith('api/') && /^(components|views|composables)\//.test(target))) {
      failures.push(`${source}: reverse dependency (${specifier})`);
    }
  }
  function inspectScript(file, content, lang) {
    const tree = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, lang === 'ts' ? ts.ScriptKind.TS : ts.ScriptKind.JS);
    if (tree.parseDiagnostics.length) {
      failures.push(`${relative(root, file)}: script parse error`);
      return;
    }
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        inspectImport(file, node.moduleSpecifier.text, importsOnlyTypes(node));
      } else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
        || ts.isIdentifier(node.expression) && node.expression.text === 'require') && node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
        inspectImport(file, node.arguments[0].text);
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  function walk(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, item.name);
      if (item.isDirectory()) { walk(file); continue; }
      if (!/\.(vue|ts|js)$/.test(item.name)) continue;
      const content = readFileSync(file, 'utf8');
      if (!file.endsWith('.vue')) { inspectScript(file, content, file.endsWith('.ts') ? 'ts' : 'js'); continue; }
      const { descriptor, errors } = parse(content, { filename: file });
      if (errors.length) { failures.push(`${relative(root, file)}: SFC parse error`); continue; }
      for (const script of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) {
        if (script.src) inspectImport(file, script.src);
        inspectScript(file, script.content, script.lang);
      }
    }
  }
  walk(join(root, 'src'));
  return failures;
}

// Servidor estático mínimo para ver el informe en local: node src/servir.mjs [puerto]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs'), puerto = +(process.argv[2] || 4173);
const tipos = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  const camino = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const ruta = camino === '/' ? 'index.html' : camino.slice(1);
  const archivo = normalize(join(raiz, ruta));
  if (!archivo.startsWith(raiz)) { res.writeHead(403).end(); return; }
  try { const b = await readFile(archivo); res.writeHead(200, { 'Content-Type': tipos[extname(archivo)] || 'application/octet-stream' }).end(b); }
  catch { res.writeHead(404).end('No encontrado'); }
}).listen(puerto, () => console.log(`Informe en http://localhost:${puerto}`));

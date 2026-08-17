#!/usr/bin/env node
/* ===========================================================================
   Servidor da votação em directo do SGC.

   Sem dependências: só o Node. A leitura é feita por SSE (Server-Sent Events),
   que é o mecanismo nativo do navegador para receber actualizações em tempo
   real — reconecta-se sozinho quando a rede falha, atravessa qualquer proxy e
   não precisa de WebSockets. A escrita é feita por POST.

   O mesmo processo serve também a aplicação construída (`dist/`), para que a
   assembleia inteira funcione a partir de um único endereço.

       node servidor/index.mjs            → porta 5190
       PORT=8080 node servidor/index.mjs

   ========================================================================= */

import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ErroAccao, aplicar, chave, novaAssembleia, projectar } from './dominio.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const DIST = join(RAIZ, 'dist');
const FICHEIRO = process.env.SGC_DADOS || join(AQUI, 'dados', 'assembleias.json');
const PORTA = Number(process.env.PORT || 5190);
const VALIDADE_DIAS = 30;

/* ═══════════════════════════════ Estado vivo ═══════════════════════════════ */

/** codigo → assembleia */
const assembleias = new Map();
/** token → { codigo, papel, membroId } */
const sessoes = new Map();
/** codigo → Set<{ res, papel, membroId }> */
const ligacoes = new Map();

/* ════════════════════════════════ Persistência ═════════════════════════════ */

let porGravar = null;

function gravarEmBreve() {
  if (porGravar) return;
  porGravar = setTimeout(async () => {
    porGravar = null;
    try {
      await mkdir(dirname(FICHEIRO), { recursive: true });
      await writeFile(
        FICHEIRO,
        JSON.stringify({ assembleias: [...assembleias.values()], sessoes: [...sessoes.entries()] }),
        'utf8',
      );
    } catch (err) {
      console.error('[sgc] não foi possível gravar o estado:', err.message);
    }
  }, 400);
}

async function carregar() {
  try {
    if (!existsSync(FICHEIRO)) return;
    const raw = JSON.parse(await readFile(FICHEIRO, 'utf8'));
    const limite = Date.now() - VALIDADE_DIAS * 86400000;
    (raw.assembleias ?? []).forEach((a) => {
      if (new Date(a.criadaEm).getTime() < limite) return;
      // Ninguém está ligado no arranque.
      a.membros.forEach((m) => { m.presente = m.presente === true; });
      assembleias.set(a.codigo, a);
    });
    (raw.sessoes ?? []).forEach(([t, s]) => { if (assembleias.has(s.codigo)) sessoes.set(t, s); });
    console.log(`[sgc] ${assembleias.size} assembleia(s) recuperada(s) de ${FICHEIRO}`);
  } catch (err) {
    console.error('[sgc] estado anterior ilegível, a começar do zero:', err.message);
  }
}

/* ═════════════════════════════════ Difusão ═════════════════════════════════ */

function ligadosDe(codigo) {
  const contagem = new Map();
  (ligacoes.get(codigo) ?? new Set()).forEach((c) => {
    if (!c.membroId) return;
    contagem.set(c.membroId, (contagem.get(c.membroId) ?? 0) + 1);
  });
  return contagem;
}

const porDifundir = new Set();
let temporizadorDifusao = null;

/** Junta as alterações do mesmo tick numa só difusão. */
function difundir(codigo) {
  porDifundir.add(codigo);
  if (temporizadorDifusao) return;
  temporizadorDifusao = setTimeout(() => {
    temporizadorDifusao = null;
    const lista = [...porDifundir];
    porDifundir.clear();
    lista.forEach(difundirJa);
  }, 25);
}

function difundirJa(codigo) {
  try {
    const a = assembleias.get(codigo);
    const clientes = ligacoes.get(codigo);
    if (!a || !clientes || clientes.size === 0) return;
    const ligados = ligadosDe(codigo);
    const paraMesa = JSON.stringify(projectar(a, ligados, 'MESA'));
    const paraVotante = JSON.stringify(projectar(a, ligados, 'VOTANTE'));
    clientes.forEach((c) => {
      try {
        c.res.write(`event: estado\ndata: ${c.papel === 'MESA' ? paraMesa : paraVotante}\n\n`);
      } catch {
        /* ligação já morta — será limpa no evento de fecho */
      }
    });
  } catch (err) {
    // Isto corre num temporizador: sem esta rede, um erro aqui derrubaria o
    // processo inteiro e, com ele, a assembleia em curso.
    console.error(`[sgc] falha ao difundir ${codigo}:`, err);
  }
}

/* ═══════════════════════════════ Utilitários ═══════════════════════════════ */

function json(res, estatuto, corpo) {
  const texto = JSON.stringify(corpo);
  res.writeHead(estatuto, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(texto);
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    const pedacos = [];
    let tamanho = 0;
    req.on('data', (p) => {
      tamanho += p.length;
      if (tamanho > 262144) {
        reject(new ErroAccao('Pedido demasiado grande.', 413));
        req.destroy();
        return;
      }
      pedacos.push(p);
    });
    req.on('end', () => {
      if (!pedacos.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(pedacos).toString('utf8')));
      } catch {
        reject(new ErroAccao('Corpo do pedido não é JSON válido.'));
      }
    });
    req.on('error', reject);
  });
}

function acharAssembleia(codigo) {
  const a = assembleias.get(String(codigo || '').toUpperCase());
  if (!a) throw new ErroAccao('Assembleia não encontrada. Confirme o código.', 404);
  return a;
}

function acharSessao(token, codigo) {
  const s = sessoes.get(token);
  if (!s || s.codigo !== codigo) throw new ErroAccao('Sessão expirada. Volte a entrar.', 401);
  return s;
}

function abrirSessao(codigo, papel, membroId) {
  const t = chave();
  sessoes.set(t, { codigo, papel, membroId: membroId ?? null, em: new Date().toISOString() });
  gravarEmBreve();
  return t;
}

/* ══════════════════════════════════ API ════════════════════════════════════ */

async function api(req, res, url) {
  const partes = url.pathname.split('/').filter(Boolean); // ['api', 'salas', ...]
  const rota = partes.slice(1);

  // POST /api/salas — constituir a assembleia
  if (rota[0] === 'salas' && rota.length === 1 && req.method === 'POST') {
    if (assembleias.size >= 500) throw new ErroAccao('Servidor cheio. Reponha os dados.', 503);
    const corpo = await lerCorpo(req);
    const a = novaAssembleia(corpo);
    assembleias.set(a.codigo, a);
    const token = abrirSessao(a.codigo, 'MESA', null);
    gravarEmBreve();
    console.log(`[sgc] assembleia ${a.codigo} — ${a.nome} (${a.membros.length} membros)`);
    return json(res, 201, {
      codigo: a.codigo,
      chaveMesa: a.chaveMesa,
      token,
      membros: a.membros.map((m) => ({ id: m.id, nome: m.nome, pin: m.pin })),
    });
  }

  if (rota[0] !== 'salas' || !rota[1]) throw new ErroAccao('Rota desconhecida.', 404);
  const codigo = rota[1].toUpperCase();

  // GET /api/salas/:codigo — o que o ecrã de entrada precisa de saber
  if (rota.length === 2 && req.method === 'GET') {
    const a = acharAssembleia(codigo);
    return json(res, 200, {
      codigo: a.codigo,
      nome: a.nome,
      orgao: a.orgao,
      local: a.local,
      pinObrigatorio: a.pinObrigatorio,
      registoAberto: a.registoAberto,
      membros: a.membros.map((m) => ({ id: m.id, nome: m.nome, funcao: m.funcao, presente: m.presente })),
    });
  }

  // POST /api/salas/:codigo/entrar — o camarada entra pelo seu nome
  if (rota[2] === 'entrar' && req.method === 'POST') {
    const a = acharAssembleia(codigo);
    const { membroId, nome, pin } = await lerCorpo(req);
    let m = membroId ? a.membros.find((x) => x.id === membroId) : null;

    if (!m && nome) {
      const procurado = String(nome).trim().toLowerCase();
      m = a.membros.find((x) => x.nome.toLowerCase() === procurado);
      if (!m) {
        const r = aplicar(a, 'membro.auto-registo', { nome }, { papel: 'VOTANTE' });
        m = a.membros.find((x) => x.id === r.membroId);
      }
    }
    if (!m) throw new ErroAccao('Escolha o seu nome na lista do caderno eleitoral.', 404);
    if (a.pinObrigatorio && String(pin ?? '') !== m.pin) {
      throw new ErroAccao('Código pessoal incorrecto. A mesa tem a lista dos códigos.', 401);
    }

    m.presente = true;
    m.entrouEm = m.entrouEm || new Date().toISOString();
    const token = abrirSessao(a.codigo, 'VOTANTE', m.id);
    difundir(a.codigo);
    gravarEmBreve();
    return json(res, 200, { token, papel: 'VOTANTE', membroId: m.id, nome: m.nome });
  }

  // POST /api/salas/:codigo/mesa — segundo dispositivo da mesa
  if (rota[2] === 'mesa' && req.method === 'POST') {
    const a = acharAssembleia(codigo);
    const { chaveMesa } = await lerCorpo(req);
    if (String(chaveMesa ?? '') !== a.chaveMesa) throw new ErroAccao('Chave da mesa inválida.', 401);
    return json(res, 200, { token: abrirSessao(a.codigo, 'MESA', null), papel: 'MESA' });
  }

  // POST /api/salas/:codigo/accao — toda a escrita passa por aqui
  if (rota[2] === 'accao' && req.method === 'POST') {
    const a = acharAssembleia(codigo);
    const { token, accao, dados } = await lerCorpo(req);
    const s = acharSessao(token, codigo);
    const resultado = aplicar(a, String(accao), dados ?? {}, { papel: s.papel, membroId: s.membroId });
    difundir(codigo);
    gravarEmBreve();
    return json(res, 200, { ok: true, resultado });
  }

  /* GET /api/salas/:codigo/sessao — a pergunta «ainda valho alguma coisa?».
     O canal de eventos, quando falha, não deixa o navegador ler o motivo: o
     EventSource só sabe dizer «erro». É esta rota que distingue uma quebra de
     rede (que passa) de uma sessão que morreu (que não passa). */
  if (rota[2] === 'sessao' && req.method === 'GET') {
    const a = acharAssembleia(codigo);
    const s = acharSessao(url.searchParams.get('token'), codigo);
    const m = s.membroId ? a.membros.find((x) => x.id === s.membroId) : null;
    return json(res, 200, { valida: true, papel: s.papel, membroId: s.membroId, nome: m?.nome ?? null });
  }

  // GET /api/salas/:codigo/eventos — o canal em tempo real
  if (rota[2] === 'eventos' && req.method === 'GET') {
    const a = acharAssembleia(codigo);
    const s = acharSessao(url.searchParams.get('token'), codigo);

    // Só este socket vive indefinidamente: é o canal que fica aberto durante
    // toda a assembleia. Os restantes seguem os tempos normais do servidor.
    req.socket.setTimeout(0);
    req.socket.setNoDelay(true);
    req.socket.setKeepAlive(true, 30000);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      // Impede que proxies (nginx, Vite) segurem o fluxo em memória.
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 3000\n\n');

    const cliente = { res, papel: s.papel, membroId: s.membroId };
    if (!ligacoes.has(codigo)) ligacoes.set(codigo, new Set());
    ligacoes.get(codigo).add(cliente);

    res.write(
      `event: estado\ndata: ${JSON.stringify(projectar(a, ligadosDe(codigo), s.papel))}\n\n`,
    );
    difundir(codigo); // os outros passam a ver este camarada ligado

    const pulsar = setInterval(() => {
      try { res.write(': .\n\n'); } catch { /* ignorar */ }
    }, 20000);

    const fechar = () => {
      clearInterval(pulsar);
      ligacoes.get(codigo)?.delete(cliente);
      difundir(codigo);
    };
    req.on('close', fechar);
    req.on('error', fechar);
    return undefined;
  }

  throw new ErroAccao('Rota desconhecida.', 404);
}

/* ═══════════════════════════ Ficheiros da aplicação ════════════════════════ */

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

async function estatico(req, res, url) {
  if (!existsSync(DIST)) {
    return json(res, 404, {
      erro: 'A aplicação ainda não foi construída. Corra `npm run build`, ou use `npm run dev` para trabalhar com o Vite.',
    });
  }
  const pedido = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let ficheiro = join(DIST, pedido);
  if (!ficheiro.startsWith(DIST)) return json(res, 403, { erro: 'Caminho inválido.' });

  let info = await stat(ficheiro).catch(() => null);
  if (info?.isDirectory()) {
    ficheiro = join(ficheiro, 'index.html');
    info = await stat(ficheiro).catch(() => null);
  }
  // Aplicação de página única: qualquer caminho desconhecido devolve o index.
  if (!info) {
    ficheiro = join(DIST, 'index.html');
    info = await stat(ficheiro).catch(() => null);
    if (!info) return json(res, 404, { erro: 'index.html não encontrado em dist/.' });
  }

  const ext = extname(ficheiro).toLowerCase();
  const imutavel = pedido.startsWith('/assets/');
  res.writeHead(200, {
    'Content-Type': TIPOS[ext] ?? 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': imutavel ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  res.end(await readFile(ficheiro));
  return undefined;
}

/* ═════════════════════════════════ Servidor ════════════════════════════════ */

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  try {
    if (url.pathname === '/api/saude') {
      return json(res, 200, {
        ok: true,
        assembleias: assembleias.size,
        ligacoes: [...ligacoes.values()].reduce((a, s) => a + s.size, 0),
        // Sem isto não se sabe que versão está no ar — e a dúvida custa tempo
        // precisamente quando não há tempo a perder.
        commit: (process.env.RENDER_GIT_COMMIT ?? 'local').slice(0, 7),
        desdeSegundos: Math.round(process.uptime()),
      });
    }
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    return await estatico(req, res, url);
  } catch (err) {
    if (err instanceof ErroAccao) return json(res, err.estatuto ?? 400, { erro: err.message });
    console.error('[sgc] erro inesperado:', err);
    return json(res, 500, { erro: 'Erro interno do servidor.' });
  }
});

/* Os valores por omissão do Node ficam como estão, de propósito.
   `requestTimeout` e `headersTimeout` contam o tempo de *receber o pedido* — um
   GET sem corpo termina de imediato, por isso nunca cortam uma resposta longa.
   E `keepAliveTimeout = 0` desligaria a reciclagem de ligações inactivas: atrás
   de um proxy, que abre ligações a toda a hora, isso é uma fuga de sockets que
   acaba por asfixiar a instância. O que a ligação de eventos precisa é de não
   ter tempo limite *no seu próprio socket*, e isso faz-se caso a caso. */

function enderecos() {
  const out = [];
  Object.values(networkInterfaces()).forEach((lista) => {
    (lista ?? []).forEach((i) => {
      if (i.family === 'IPv4' && !i.internal) out.push(i.address);
    });
  });
  return out;
}

/* Uma assembleia a decorrer não pode cair por causa de um erro isolado. O
   estado vive em memória e no disco; o que aqui se protege é o processo. Os
   navegadores religam-se sozinhos, mas só se houver a quem religar. */
process.on('uncaughtException', (err) => {
  console.error('[sgc] excepção não tratada — o servidor continua de pé:', err);
});
process.on('unhandledRejection', (motivo) => {
  console.error('[sgc] promessa rejeitada sem tratamento:', motivo);
});

await carregar();

servidor.listen(PORTA, '0.0.0.0', () => {
  const construida = existsSync(DIST);
  console.log('');
  console.log('  SGC — servidor da votação em directo');
  console.log('  ─────────────────────────────────────────────');
  console.log(`  local:      http://localhost:${PORTA}`);
  enderecos().forEach((ip) => console.log(`  na rede:    http://${ip}:${PORTA}`));
  console.log(`  aplicação:  ${construida ? 'dist/ (construída)' : 'por construir — use `npm run dev` ou `npm run build`'}`);
  console.log(`  dados:      ${FICHEIRO}`);
  console.log('');
});

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    console.log('\n[sgc] a encerrar…');
    ligacoes.forEach((set) => set.forEach((c) => { try { c.res.end(); } catch { /* ignorar */ } }));
    servidor.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500);
  });
}

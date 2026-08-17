/* ===========================================================================
   Ensaio de ponta a ponta de uma assembleia: constituição, entrada dos
   camaradas, consulta prévia, escrutínio sem maioria, segunda volta,
   proclamação e acta — verificando pelo caminho o canal em tempo real, o
   controlo de acessos e o segredo do voto.

   Com o servidor a correr:   npm run ensaio
   Noutro endereço:           SGC_BASE=http://192.168.1.10:5190 npm run ensaio
   ========================================================================= */

const BASE = process.env.SGC_BASE || 'http://127.0.0.1:5190';
let falhas = 0;

function ok(condicao, texto) {
  console.log(`${condicao ? '  OK ' : '  XX '} ${texto}`);
  if (!condicao) falhas++;
}

/* Contra um servidor publicado, um reinício do alojamento devolve durante
   alguns segundos um 404 da borda. O navegador aguenta isso — o EventSource
   religa-se sozinho —, por isso o ensaio também tem de aguentar, ou acusaria
   como falha do sistema o que é uma intermitência do alojamento. */
async function pedir(caminho, opcoes, tentativas = 4) {
  let ultimoErro;
  for (let n = 1; n <= tentativas; n++) {
    try {
      const r = await fetch(BASE + caminho, opcoes);
      const texto = await r.text();
      // 404/502/503 com corpo que não é JSON: é a borda, não a aplicação.
      const daBorda = [404, 502, 503].includes(r.status) && !texto.trimStart().startsWith('{');
      if (daBorda && n < tentativas) {
        console.log(`  ·· alojamento indisponível (${r.status}), a tentar de novo…`);
        await new Promise((res) => setTimeout(res, 3000 * n));
        continue;
      }
      if (daBorda) {
        throw new Error(
          `o alojamento devolveu ${r.status} em ${caminho} após ${tentativas} tentativas — a instância não está a servir`,
        );
      }
      return { estatuto: r.status, corpo: texto ? JSON.parse(texto) : {} };
    } catch (e) {
      ultimoErro = e;
      if (n === tentativas) break;
      await new Promise((res) => setTimeout(res, 3000 * n));
    }
  }
  throw ultimoErro ?? new Error(`sem resposta de ${caminho}`);
}

const post = (caminho, corpo) =>
  pedir(caminho, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });

const get = (caminho) => pedir(caminho, {});

/* Canal SSE, com religação automática — como faz o EventSource do navegador. */
function escutar(codigo, token) {
  const controlo = new AbortController();
  const recebidos = [];
  let religacoes = 0;

  const correr = async () => {
    while (!controlo.signal.aborted) {
      try {
        const r = await fetch(`${BASE}/api/salas/${codigo}/eventos?token=${token}`, { signal: controlo.signal });
        if (!r.ok) throw new Error(`estatuto ${r.status}`);
        const leitor = r.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await leitor.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const trama = buf.slice(0, i);
            buf = buf.slice(i + 2);
            const linha = trama.split('\n').find((l) => l.startsWith('data: '));
            if (linha) recebidos.push(JSON.parse(linha.slice(6)));
          }
        }
      } catch (e) {
        if (e.name === 'AbortError' || controlo.signal.aborted) return;
      }
      if (controlo.signal.aborted) return;
      religacoes++;
      console.log(`  ·· canal interrompido, a religar (${religacoes})…`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  };

  const pronto = correr();
  return { recebidos, fechar: () => controlo.abort(), pronto, religacoes: () => religacoes };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Espera que uma condição se verifique no último estado recebido, em vez de
 * esperar um tempo fixo. É o que torna o ensaio utilizável contra um servidor
 * publicado na Internet, onde a latência não é a de `localhost`.
 */
async function ate(condicao, descricao, limiteMs = 20000) {
  const fim = Date.now() + limiteMs;
  while (Date.now() < fim) {
    try {
      if (condicao()) return true;
    } catch { /* o estado ainda não tem a forma esperada */ }
    await espera(100);
  }
  ok(false, `esgotou o tempo à espera de: ${descricao}`);
  return false;
}

/** Último estado recebido num canal. */
const ultimo = (canal) => canal.recebidos.at(-1);

console.log('\n1. Constituir a assembleia');
const criacao = await post('/api/salas', {
  nome: 'Comité do Círculo n.º 12 — ensaio',
  escopo: 'CIRCULO',
  local: 'Sede do Círculo',
  membros: [
    { nome: 'Teresa Manuel Ubisse', funcao: 'Secretária da Célula n.º 1' },
    { nome: 'Anastácio Bernardo Nhaca', funcao: 'Primeiro Secretário' },
    { nome: 'Celeste Amosse Tivane' },
    { nome: 'Silvano Jorge Mahumane' },
    { nome: 'Bento Alfredo Chiziane' },
  ],
});
ok(criacao.estatuto === 201, `criada com estatuto 201 (${criacao.estatuto})`);
const { codigo, token: mesa, membros } = criacao.corpo;
ok(/^[A-Z0-9]{5}$/.test(codigo), `código legível: ${codigo}`);
ok(membros.every((m) => /^\d{4}$/.test(m.pin)), 'cada camarada recebeu um código de 4 dígitos');

console.log('\n2. Canal em tempo real da mesa');
const canalMesa = escutar(codigo, mesa);
await ate(() => canalMesa.recebidos.length >= 1, 'o estado inicial da mesa');
ok(canalMesa.recebidos.length >= 1, `estado inicial recebido (${canalMesa.recebidos.length} tramas)`);
ok(canalMesa.recebidos[0]?.membros?.[0]?.pin !== undefined, 'a mesa vê os códigos pessoais');

console.log('\n3. Entrada dos camaradas');
const sessoes = [];
for (const m of membros) {
  const r = await post(`/api/salas/${codigo}/entrar`, { membroId: m.id, pin: m.pin });
  ok(r.estatuto === 200, `${m.nome} entrou`);
  sessoes.push({ ...m, token: r.corpo.token });
}
const pinErrado = await post(`/api/salas/${codigo}/entrar`, { membroId: membros[0].id, pin: '0000' });
ok(pinErrado.estatuto === 401, 'código pessoal errado é recusado');

const canalVotante = escutar(codigo, sessoes[0].token);
await ate(() => canalVotante.recebidos.length >= 1, 'o estado inicial do votante');
ok(canalVotante.recebidos[0]?.membros?.[0]?.pin === undefined, 'o votante não vê códigos pessoais alheios');
ok(canalVotante.recebidos[0]?.chaveMesa === undefined, 'o votante não vê a chave da mesa');

const accao = (token, nome, dados = {}) => post(`/api/salas/${codigo}/accao`, { token, accao: nome, dados });

console.log('\n4. Convocar a votação e propor candidatos');
const nova = await accao(mesa, 'votacao.criar', {
  titulo: 'Primeiro Secretário do Comité do Círculo',
  cargo: 'PRIMEIRO_SECRETARIO_CIRCULO',
  vagas: 1,
  quorumRegra: 'DOIS_TERCOS',
  efectividade: 5,
});
const vt = nova.corpo.resultado.votacaoId;
ok(!!vt, 'votação convocada');

for (const i of [0, 1, 2]) {
  const r = await accao(mesa, 'votacao.candidato.add', { votacaoId: vt, membroId: membros[i].id, propostoPor: 'a mesa' });
  ok(r.estatuto === 200, `${membros[i].nome} proposto`);
}

console.log('\n5. Abrir sem aceitações e sem quórum');
const semAceite = await accao(mesa, 'votacao.abrir', { votacaoId: vt });
ok(semAceite.estatuto === 400 && /aceit/i.test(semAceite.corpo.erro), 'urna recusada sem candidaturas aceites (Art. 22)');

const votanteMandaMesa = await accao(sessoes[3].token, 'votacao.abrir', { votacaoId: vt });
ok(votanteMandaMesa.estatuto === 403, 'um votante não abre a urna');

console.log('\n6. Consulta prévia');
await ate(() => ultimo(canalMesa).votacoes[0]?.candidatos.length === 3, 'as três candidaturas na mesa');
ok(ultimo(canalMesa).votacoes[0]?.candidatos.length === 3, 'as três candidaturas chegaram à mesa em directo');
for (const i of [0, 1, 2]) {
  const estado = ultimo(canalMesa);
  const cand = estado.votacoes[0].candidatos.find((c) => c.membroId === membros[i].id);
  const r = await accao(sessoes[i].token, 'candidatura.responder', { votacaoId: vt, candidatoId: cand.id, aceitou: true });
  ok(r.estatuto === 200, `${membros[i].nome} aceitou`);
}
const candAlheio = ultimo(canalMesa).votacoes[0].candidatos[0];
const alheio = await accao(sessoes[4].token, 'candidatura.responder', { votacaoId: vt, candidatoId: candAlheio.id, aceitou: false });
ok(alheio.estatuto === 403, 'ninguém aceita a candidatura de outro');

console.log('\n7. Abrir a urna');
const abrir = await accao(mesa, 'votacao.abrir', { votacaoId: vt });
ok(abrir.estatuto === 200, 'urna aberta com quórum de dois terços (5 presentes de 5, exigidos 4)');

console.log('\n8. Votação — sem maioria absoluta à primeira volta');
await ate(() => ultimo(canalVotante).votacoes[0]?.voltas.length === 1, 'a urna aberta no ecrã do votante');
const emCurso = ultimo(canalVotante).votacoes[0];
const cands = emCurso.voltas[0].candidatos;
ok(emCurso.voltas[0].apuramento === null, 'com a urna aberta, os votos não são revelados');

// 2 votos no primeiro, 2 no segundo, 1 branco → maioria exigida = 3
const boletins = [
  { i: 0, dados: { tipo: 'VALIDO', escolhas: [cands[0]] } },
  { i: 1, dados: { tipo: 'VALIDO', escolhas: [cands[0]] } },
  { i: 2, dados: { tipo: 'VALIDO', escolhas: [cands[1]] } },
  { i: 3, dados: { tipo: 'VALIDO', escolhas: [cands[1]] } },
  { i: 4, dados: { tipo: 'BRANCO' } },
];
for (const b of boletins) {
  const r = await accao(sessoes[b.i].token, 'voto.registar', { votacaoId: vt, ...b.dados });
  ok(r.estatuto === 200, `voto de ${sessoes[b.i].nome} registado`);
}
const repetido = await accao(sessoes[0].token, 'voto.registar', { votacaoId: vt, tipo: 'BRANCO' });
ok(repetido.estatuto === 400 && /já/i.test(repetido.corpo.erro), 'voto duplo é recusado');

const demais = await accao(sessoes[1].token, 'voto.registar', { votacaoId: vt, tipo: 'VALIDO', escolhas: cands });
ok(demais.estatuto === 400, 'não se vota em mais candidatos do que as vagas');

await ate(() => ultimo(canalVotante).votacoes[0]?.voltas[0].totalVotos === 5, 'os cinco boletins na afluência');
const durante = ultimo(canalVotante).votacoes[0];
ok(durante.voltas[0].totalVotos === 5, `afluência em directo: ${durante.voltas[0].totalVotos} de 5`);
ok(durante.voltas[0].apuramento === null, 'continua sem revelar votos antes do fecho');

console.log('\n9. Encerrar e apurar');
await accao(mesa, 'votacao.encerrar', { votacaoId: vt });
await ate(() => ultimo(canalMesa).votacoes[0]?.voltas[0].apuramento, 'o apuramento da 1.ª volta');
const apurada = ultimo(canalMesa).votacoes[0];
const ap1 = apurada.voltas[0].apuramento;
ok(!!ap1, 'apuramento revelado depois do fecho');
ok(ap1.maioriaExigida === 3, `maioria absoluta = 3 (${ap1.maioriaExigida})`);
ok(ap1.brancos === 1 && ap1.validos === 4, `1 branco, 4 válidos (${ap1.brancos}/${ap1.validos})`);
ok(ap1.precisaSegundaVolta === true, 'ninguém atingiu a maioria: segunda volta');
ok(ap1.candidatosSegundaVolta.length === 2, 'concorrem os dois mais votados');

const proclamarCedo = await accao(mesa, 'votacao.proclamar', { votacaoId: vt });
ok(proclamarCedo.estatuto === 400, 'não se proclama sem resolver a segunda volta');

console.log('\n10. Segunda volta');
await accao(mesa, 'votacao.segunda-volta', { votacaoId: vt });
await ate(() => ultimo(canalVotante).votacoes[0]?.voltas.length === 2, 'a segunda volta aberta');
const v2 = ultimo(canalVotante).votacoes[0].voltas[1];
ok(v2.numero === 2 && v2.candidatos.length === 2, 'segunda volta aberta com dois candidatos');

for (const i of [0, 1, 2]) await accao(sessoes[i].token, 'voto.registar', { votacaoId: vt, tipo: 'VALIDO', escolhas: [v2.candidatos[0]] });
for (const i of [3, 4]) await accao(sessoes[i].token, 'voto.registar', { votacaoId: vt, tipo: 'VALIDO', escolhas: [v2.candidatos[1]] });
await accao(mesa, 'votacao.encerrar', { votacaoId: vt });
await ate(() => ultimo(canalMesa).votacoes[0]?.voltas[1]?.apuramento, 'o apuramento da 2.ª volta');
const ap2 = ultimo(canalMesa).votacoes[0].voltas[1].apuramento;
ok(ap2.linhas[0].votos === 3 && ap2.linhas[0].eleito, 'eleito à segunda volta por maioria de votos expressos');
ok(ap2.precisaSegundaVolta === false, 'não há terceira volta');

console.log('\n11. Proclamação e acta');
await accao(mesa, 'votacao.proclamar', { votacaoId: vt });
await ate(() => ultimo(canalVotante).votacoes[0]?.estado === 'PROCLAMADA', 'a proclamação no ecrã do votante');
const final = ultimo(canalVotante).votacoes[0];
ok(final.estado === 'PROCLAMADA', 'resultado proclamado');
ok(final.eleitos.filter((x) => !x.suplente).length === 1, 'um eleito');
ok(final.eleitos.filter((x) => x.suplente).length === 1, 'um suplente pela ordem de eleição');
ok(!!final.prazoImpugnacao, 'prazo de impugnação fixado');
ok(final.acta?.includes('ACTA DE ELEIÇÃO'), 'acta redigida');
ok(final.acta?.includes('2.ª VOLTA') || final.acta?.includes('2ª VOLTA') || final.acta?.includes('VOLTA'), 'acta com as duas voltas');

console.log('\n12. Segredo do voto');
const ultimaTrama = ultimo(canalMesa);
ok(
  ultimaTrama.votacoes.every((v) => v.voltas.every((x) => x.boletins === undefined)),
  'a projecção nunca transporta os boletins — nem para a mesa',
);
ok(
  ultimaTrama.votacoes[0].voltas[0].votantes.length === 5,
  'o caderno de descarga regista quem votou (5), sem o sentido do voto',
);
const guardado = await get(`/api/saude`);
ok(guardado.corpo.ok === true, 'servidor saudável');

/* ───────────────────────────────────────────────────────────────────────────
   Um segundo acto na mesma assembleia, agora com várias vagas: é o caso dos
   Assistentes do Secretariado, em que cada eleitor assinala mais do que um
   nome no mesmo boletim. O apuramento conta por candidato e a maioria absoluta
   aplica-se a cada um deles.
   ────────────────────────────────────────────────────────────────────────── */

console.log('\n13. Segundo acto: duas vagas no mesmo boletim');
const vt2 = (await accao(mesa, 'votacao.criar', {
  titulo: 'Assistentes do Secretariado',
  cargo: 'ASSISTENTES_CELULA',
  vagas: 2,
  quorumRegra: 'METADE',
  efectividade: 5,
})).corpo.resultado.votacaoId;
ok(!!vt2, 'segunda votação convocada sem sair da assembleia');

const doActo = (estado) => estado.votacoes.find((v) => v.id === vt2);
for (const i of [1, 2, 3]) await accao(mesa, 'votacao.candidato.add', { votacaoId: vt2, membroId: membros[i].id });
await ate(() => doActo(ultimo(canalMesa))?.candidatos.length === 3, 'as três candidaturas do segundo acto');
const cands2 = doActo(ultimo(canalMesa)).candidatos;
for (const c of cands2) {
  const i = membros.findIndex((m) => m.id === c.membroId);
  await accao(sessoes[i].token, 'candidatura.responder', { votacaoId: vt2, candidatoId: c.id, aceitou: true });
}
await ate(() => doActo(ultimo(canalMesa)).candidatos.every((c) => c.aceitou === true), 'as aceitações');
await accao(mesa, 'votacao.abrir', { votacaoId: vt2 });
await ate(() => doActo(ultimo(canalVotante))?.voltas.length === 1, 'a urna do segundo acto');

const b2 = doActo(ultimo(canalVotante)).voltas[0].candidatos;
// Maioria absoluta de 5 membros em efectividade = 3 votos.
// Dois nomes por boletim: o primeiro leva 4, o segundo 3, o terceiro 3.
const cruzes = [[b2[0], b2[1]], [b2[0], b2[1]], [b2[0], b2[2]], [b2[0], b2[2]], [b2[1], b2[2]]];
for (let i = 0; i < 5; i++) {
  const r = await accao(sessoes[i].token, 'voto.registar', { votacaoId: vt2, tipo: 'VALIDO', escolhas: cruzes[i] });
  ok(r.estatuto === 200, `boletim ${i + 1} com dois nomes aceite`);
}
const aMais = await accao(sessoes[0].token, 'voto.registar', { votacaoId: vt2, tipo: 'VALIDO', escolhas: b2 });
ok(aMais.estatuto === 400, 'três nomes num boletim de duas vagas é recusado');

await accao(mesa, 'votacao.encerrar', { votacaoId: vt2 });
await ate(() => doActo(ultimo(canalMesa)).voltas[0].apuramento, 'o apuramento do segundo acto');
const ap3 = doActo(ultimo(canalMesa)).voltas[0].apuramento;
ok(ap3.maioriaExigida === 3, `maioria absoluta = 3 (${ap3.maioriaExigida})`);
ok(ap3.linhas[0].votos === 4, `o mais votado tem 4 cruzes (${ap3.linhas[0].votos})`);
ok(ap3.eleitosAgora.length === 2, `as duas vagas preenchidas à primeira volta (${ap3.eleitosAgora.length})`);
ok(ap3.precisaSegundaVolta === false, 'sem segunda volta: ambos com maioria absoluta');

await accao(mesa, 'votacao.proclamar', { votacaoId: vt2 });
await ate(() => doActo(ultimo(canalVotante))?.estado === 'PROCLAMADA', 'a proclamação do segundo acto');
const f2 = doActo(ultimo(canalVotante));
ok(f2.eleitos.filter((x) => !x.suplente).length === 2, 'dois Assistentes proclamados');
ok(f2.eleitos.filter((x) => x.suplente).length === 1, 'o restante fica suplente pela ordem de eleição');

canalMesa.fechar();
canalVotante.fechar();
await espera(200);

console.log(`\n${falhas === 0 ? 'Todos os ensaios passaram.' : `${falhas} ensaio(s) falharam.`}\n`);
process.exit(falhas === 0 ? 0 : 1);

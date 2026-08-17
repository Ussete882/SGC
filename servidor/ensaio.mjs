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

async function post(caminho, corpo) {
  const r = await fetch(BASE + caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  return { estatuto: r.status, corpo: await r.json() };
}

async function get(caminho) {
  const r = await fetch(BASE + caminho);
  return { estatuto: r.status, corpo: await r.json() };
}

/* Canal SSE: guarda os estados que forem chegando. */
function escutar(codigo, token) {
  const controlo = new AbortController();
  const recebidos = [];
  const pronto = fetch(`${BASE}/api/salas/${codigo}/eventos?token=${token}`, { signal: controlo.signal })
    .then(async (r) => {
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
    })
    .catch((e) => { if (e.name !== 'AbortError') console.log('  !! canal caiu:', e.message); });
  return { recebidos, fechar: () => controlo.abort(), pronto };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

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
await espera(300);
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
await espera(300);
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
await espera(150); // a difusão agrupa as alterações do mesmo instante
ok(canalMesa.recebidos.at(-1).votacoes[0]?.candidatos.length === 3, 'as três candidaturas chegaram à mesa em directo');
for (const i of [0, 1, 2]) {
  const estado = canalMesa.recebidos.at(-1);
  const cand = estado.votacoes[0].candidatos.find((c) => c.membroId === membros[i].id);
  const r = await accao(sessoes[i].token, 'candidatura.responder', { votacaoId: vt, candidatoId: cand.id, aceitou: true });
  ok(r.estatuto === 200, `${membros[i].nome} aceitou`);
}
const estadoOutro = canalMesa.recebidos.at(-1);
const candAlheio = estadoOutro.votacoes[0].candidatos[0];
const alheio = await accao(sessoes[4].token, 'candidatura.responder', { votacaoId: vt, candidatoId: candAlheio.id, aceitou: false });
ok(alheio.estatuto === 403, 'ninguém aceita a candidatura de outro');

console.log('\n7. Abrir a urna');
const abrir = await accao(mesa, 'votacao.abrir', { votacaoId: vt });
ok(abrir.estatuto === 200, 'urna aberta com quórum de dois terços (5 presentes de 5, exigidos 4)');

console.log('\n8. Votação — sem maioria absoluta à primeira volta');
await espera(150);
const emCurso = canalVotante.recebidos.at(-1).votacoes[0];
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

await espera(150);
const durante = canalVotante.recebidos.at(-1).votacoes[0];
ok(durante.voltas[0].totalVotos === 5, `afluência em directo: ${durante.voltas[0].totalVotos} de 5`);
ok(durante.voltas[0].apuramento === null, 'continua sem revelar votos antes do fecho');

console.log('\n9. Encerrar e apurar');
await accao(mesa, 'votacao.encerrar', { votacaoId: vt });
await espera(150);
const apurada = canalMesa.recebidos.at(-1).votacoes[0];
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
await espera(150);
const v2 = canalVotante.recebidos.at(-1).votacoes[0].voltas[1];
ok(v2.numero === 2 && v2.candidatos.length === 2, 'segunda volta aberta com dois candidatos');

for (const i of [0, 1, 2]) await accao(sessoes[i].token, 'voto.registar', { votacaoId: vt, tipo: 'VALIDO', escolhas: [v2.candidatos[0]] });
for (const i of [3, 4]) await accao(sessoes[i].token, 'voto.registar', { votacaoId: vt, tipo: 'VALIDO', escolhas: [v2.candidatos[1]] });
await accao(mesa, 'votacao.encerrar', { votacaoId: vt });
await espera(150);
const ap2 = canalMesa.recebidos.at(-1).votacoes[0].voltas[1].apuramento;
ok(ap2.linhas[0].votos === 3 && ap2.linhas[0].eleito, 'eleito à segunda volta por maioria de votos expressos');
ok(ap2.precisaSegundaVolta === false, 'não há terceira volta');

console.log('\n11. Proclamação e acta');
await accao(mesa, 'votacao.proclamar', { votacaoId: vt });
await espera(150);
const final = canalVotante.recebidos.at(-1).votacoes[0];
ok(final.estado === 'PROCLAMADA', 'resultado proclamado');
ok(final.eleitos.filter((x) => !x.suplente).length === 1, 'um eleito');
ok(final.eleitos.filter((x) => x.suplente).length === 1, 'um suplente pela ordem de eleição');
ok(!!final.prazoImpugnacao, 'prazo de impugnação fixado');
ok(final.acta?.includes('ACTA DE ELEIÇÃO'), 'acta redigida');
ok(final.acta?.includes('2.ª VOLTA') || final.acta?.includes('2ª VOLTA') || final.acta?.includes('VOLTA'), 'acta com as duas voltas');

console.log('\n12. Segredo do voto');
const ultima = canalMesa.recebidos.at(-1);
ok(
  ultima.votacoes.every((v) => v.voltas.every((x) => x.boletins === undefined)),
  'a projecção nunca transporta os boletins — nem para a mesa',
);
ok(
  ultima.votacoes[0].voltas[0].votantes.length === 5,
  'o caderno de descarga regista quem votou (5), sem o sentido do voto',
);
const guardado = await get(`/api/saude`);
ok(guardado.corpo.ok === true, 'servidor saudável');

canalMesa.fechar();
canalVotante.fechar();
await espera(200);

console.log(`\n${falhas === 0 ? 'Todos os ensaios passaram.' : `${falhas} ensaio(s) falharam.`}\n`);
process.exit(falhas === 0 ? 0 : 1);

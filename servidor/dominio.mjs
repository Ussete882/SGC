/* ===========================================================================
   Assembleia de voto — modelo e regras.

   Este ficheiro não sabe nada de HTTP: recebe uma assembleia e uma acção,
   valida-a e devolve a assembleia alterada. O `index.mjs` trata do transporte
   (SSE para leitura em tempo real, POST para escrita).

   Segredo do voto (Art. 21 n.º 1 a): o boletim e o votante são guardados em
   estruturas separadas — `boletins` regista o sentido de voto sem qualquer
   referência a quem votou; `votantes` regista quem descarregou o voto, sem o
   sentido. Não existe, em parte alguma, a ligação entre os dois.
   ========================================================================= */

import { randomBytes, randomInt } from 'node:crypto';

/* Alfabeto sem caracteres ambíguos (0/O, 1/I) — os códigos são ditados em voz
   alta numa sala. */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function codigo(n = 5) {
  let s = '';
  for (let i = 0; i < n; i++) s += ALFABETO[randomInt(0, ALFABETO.length)];
  return s;
}

export function pin() {
  return String(randomInt(1000, 10000));
}

export function chave() {
  return randomBytes(18).toString('hex');
}

export function uid(prefixo) {
  return `${prefixo}_${randomBytes(5).toString('hex')}`;
}

export function agora() {
  return new Date().toISOString();
}

function maisDias(isoInstante, dias) {
  const d = new Date(isoInstante);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

class ErroAccao extends Error {
  constructor(mensagem, estatuto = 400) {
    super(mensagem);
    this.estatuto = estatuto;
  }
}

const erro = (m, e) => { throw new ErroAccao(m, e); };

/* ══════════════════════════════ Construção ═════════════════════════════════ */

const ORGAOS = {
  CELULA: { rotulo: 'Reunião Geral da Célula', quorum: 'METADE' },
  CIRCULO: { rotulo: 'Comité do Círculo', quorum: 'DOIS_TERCOS' },
  CONFERENCIA: { rotulo: 'Conferência do Círculo', quorum: 'DOIS_TERCOS' },
};

function nomeLimpo(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 70);
}

export function novoMembro(nome, extra = {}) {
  return {
    id: uid('mv'),
    nome: nomeLimpo(nome),
    funcao: nomeLimpo(extra.funcao || ''),
    pin: pin(),
    /** Capacidade eleitoral activa — pode votar (Art. 28). */
    podeVotar: extra.podeVotar !== false,
    /** Capacidade eleitoral passiva — pode ser eleito (Art. 28). */
    podeSerEleito: extra.podeSerEleito !== false,
    presente: false,
    entrouEm: null,
  };
}

export function novaAssembleia(dados = {}) {
  const escopo = ORGAOS[dados.escopo] ? dados.escopo : 'CELULA';
  const nomes = Array.isArray(dados.membros) ? dados.membros : [];
  const membros = nomes
    .map((m) => (typeof m === 'string' ? { nome: m } : m))
    .filter((m) => nomeLimpo(m.nome).length >= 2)
    .slice(0, 200)
    .map((m) => novoMembro(m.nome, m));

  if (membros.length < 2) erro('Uma assembleia precisa de pelo menos dois membros no caderno eleitoral.');

  const a = {
    codigo: codigo(),
    chaveMesa: chave(),
    nome: nomeLimpo(dados.nome) || 'Assembleia de voto',
    escopo,
    orgao: ORGAOS[escopo].rotulo,
    local: nomeLimpo(dados.local) || '',
    mesa: nomeLimpo(dados.mesa) || '',
    criadaEm: agora(),
    pinObrigatorio: dados.pinObrigatorio !== false,
    registoAberto: dados.registoAberto === true,
    membros,
    votacoes: [],
    eventos: [],
  };
  registar(a, 'ABERTURA', `Assembleia constituída com ${membros.length} membros no caderno eleitoral.`);
  return a;
}

function registar(a, tipo, texto) {
  a.eventos.unshift({ id: uid('ev'), em: agora(), tipo, texto });
  if (a.eventos.length > 300) a.eventos.length = 300;
}

/* ══════════════════════════════ Apuramento ═════════════════════════════════ */

/** Quórum: mais de metade, ou dois terços para Comités e Conferências. */
export function quorumDe(presentes, universo, regra) {
  const exigido = regra === 'DOIS_TERCOS' ? Math.ceil((universo * 2) / 3) : Math.floor(universo / 2) + 1;
  return { exigido, atingido: presentes >= exigido, presentes, universo, regra };
}

/**
 * Apuramento de uma volta, nos termos do Art. 25 n.º 4: à primeira volta é
 * eleito quem obtiver a maioria absoluta dos membros em efectividade de
 * funções; à segunda, quem obtiver o maior número de votos expressos.
 */
export function apurar(votacao, numeroVolta) {
  const v = votacao.voltas.find((x) => x.numero === numeroVolta);
  if (!v) return null;

  const contagem = {};
  v.candidatos.forEach((id) => { contagem[id] = 0; });
  let brancos = 0;
  let nulos = 0;
  v.boletins.forEach((b) => {
    if (b.tipo === 'BRANCO') { brancos++; return; }
    if (b.tipo === 'NULO') { nulos++; return; }
    b.escolhas.forEach((id) => { if (id in contagem) contagem[id] += 1; });
  });

  const boletinsValidos = v.boletins.length - brancos - nulos;
  const expressos = v.boletins.length;
  const efectividade = votacao.efectividade;
  const maioriaExigida = Math.floor(efectividade / 2) + 1;

  const linhas = v.candidatos
    .map((id) => {
      const c = votacao.candidatos.find((x) => x.id === id);
      const votos = contagem[id] ?? 0;
      return {
        candidatoId: id,
        membroId: c?.membroId ?? null,
        nome: c?.nome ?? '—',
        votos,
        pctExpressos: expressos ? (votos / expressos) * 100 : 0,
        pctEfectividade: efectividade ? (votos / efectividade) * 100 : 0,
        eleito: false,
      };
    })
    .sort((a, b) => b.votos - a.votos || a.nome.localeCompare(b.nome, 'pt'));

  let eleitosAgora;
  if (numeroVolta === 1) {
    eleitosAgora = linhas.filter((l) => l.votos >= maioriaExigida).slice(0, votacao.vagas).map((l) => l.candidatoId);
  } else {
    eleitosAgora = linhas.filter((l) => l.votos > 0).slice(0, votacao.vagas).map((l) => l.candidatoId);
  }
  linhas.forEach((l) => { l.eleito = eleitosAgora.includes(l.candidatoId); });

  const precisaSegundaVolta = numeroVolta === 1 && eleitosAgora.length < votacao.vagas && linhas.length > eleitosAgora.length;
  const vagasRestantes = votacao.vagas - eleitosAgora.length;
  const candidatosSegundaVolta = precisaSegundaVolta
    ? linhas.filter((l) => !l.eleito).slice(0, Math.max(2, vagasRestantes + 1)).map((l) => l.candidatoId)
    : [];

  return {
    volta: numeroVolta,
    expressos,
    validos: boletinsValidos,
    brancos,
    nulos,
    efectividade,
    maioriaExigida,
    quorum: quorumDe(v.presentesNaAbertura ?? 0, efectividade, votacao.quorumRegra),
    linhas,
    eleitosAgora,
    precisaSegundaVolta,
    candidatosSegundaVolta,
    vagasRestantes,
  };
}

/* ═══════════════════════════════ Projecção ═════════════════════════════════ */

/**
 * O que sai para os clientes. Nunca inclui boletins, nem os PINs (excepto para
 * a mesa, que os tem de distribuir), nem qualquer ligação entre votante e voto.
 * Enquanto a volta está aberta os votos não são revelados — só a afluência —
 * para que o escrutínio em curso não influencie quem ainda não votou.
 */
export function projectar(a, ligados, papel) {
  const mesa = papel === 'MESA';
  return {
    codigo: a.codigo,
    nome: a.nome,
    escopo: a.escopo,
    orgao: a.orgao,
    local: a.local,
    mesa: a.mesa,
    criadaEm: a.criadaEm,
    pinObrigatorio: a.pinObrigatorio,
    registoAberto: a.registoAberto,
    chaveMesa: mesa ? a.chaveMesa : undefined,
    membros: a.membros.map((m) => ({
      id: m.id,
      nome: m.nome,
      funcao: m.funcao,
      podeVotar: m.podeVotar,
      podeSerEleito: m.podeSerEleito,
      presente: m.presente,
      ligado: (ligados.get(m.id) ?? 0) > 0,
      pin: mesa ? m.pin : undefined,
    })),
    votacoes: a.votacoes.map((vt) => projectarVotacao(vt)),
    eventos: a.eventos.slice(0, 60),
    agora: agora(),
  };
}

function projectarVotacao(vt) {
  const revelar = (v) => vt.resultadosEmDirecto || !!v.fechadaEm;
  return {
    id: vt.id,
    titulo: vt.titulo,
    cargo: vt.cargo,
    vagas: vt.vagas,
    metodo: vt.metodo,
    base: vt.base,
    estado: vt.estado,
    criadaEm: vt.criadaEm,
    quorumRegra: vt.quorumRegra,
    efectividade: vt.efectividade,
    resultadosEmDirecto: vt.resultadosEmDirecto,
    exigeAceitacao: vt.exigeAceitacao,
    motivoAnulacao: vt.motivoAnulacao,
    candidatos: vt.candidatos,
    voltas: vt.voltas.map((v) => ({
      numero: v.numero,
      candidatos: v.candidatos,
      abertaEm: v.abertaEm,
      fechadaEm: v.fechadaEm,
      presentesNaAbertura: v.presentesNaAbertura,
      votantes: v.votantes,
      totalVotos: v.boletins.length,
      apuramento: revelar(v) ? apurar(vt, v.numero) : null,
    })),
    eleitos: vt.eleitos,
    proclamadaEm: vt.proclamadaEm,
    prazoImpugnacao: vt.prazoImpugnacao,
    acta: vt.acta,
  };
}

/* ════════════════════════════════ Acções ═══════════════════════════════════ */

const ehMesa = (actor) => actor.papel === 'MESA';
const exigirMesa = (actor) => { if (!ehMesa(actor)) erro('Acção reservada à mesa da assembleia.', 403); };

function acharVotacao(a, id) {
  const vt = a.votacoes.find((x) => x.id === id);
  if (!vt) erro('Votação não encontrada.', 404);
  return vt;
}

function voltaActual(vt) {
  return vt.voltas[vt.voltas.length - 1] ?? null;
}

function eleitoresAptos(a) {
  return a.membros.filter((m) => m.podeVotar);
}

const ACCOES = {
  /* ─────────────────────────── caderno eleitoral ─────────────────────────── */

  'membro.add'(a, d, actor) {
    exigirMesa(actor);
    const nome = nomeLimpo(d.nome);
    if (nome.length < 2) erro('Indique o nome do camarada.');
    if (a.membros.length >= 200) erro('Limite de 200 membros por assembleia.');
    const m = novoMembro(nome, { funcao: d.funcao });
    a.membros.push(m);
    registar(a, 'CADERNO', `${m.nome} inscrito no caderno eleitoral.`);
    return { membroId: m.id, pin: m.pin };
  },

  'membro.auto-registo'(a, d) {
    if (!a.registoAberto) erro('O registo por auto-inscrição está fechado. Peça à mesa para o inscrever.', 403);
    const nome = nomeLimpo(d.nome);
    if (nome.length < 3) erro('Escreva o seu nome completo.');
    const jaExiste = a.membros.find((m) => m.nome.toLowerCase() === nome.toLowerCase());
    if (jaExiste) erro('Já existe um camarada com esse nome no caderno. Escolha-o na lista.');
    const m = novoMembro(nome);
    a.membros.push(m);
    registar(a, 'CADERNO', `${m.nome} inscreveu-se no caderno eleitoral.`);
    return { membroId: m.id, pin: m.pin };
  },

  'membro.remover'(a, d, actor) {
    exigirMesa(actor);
    if (a.votacoes.some((vt) => vt.estado === 'ABERTA')) erro('Não se altera o caderno com uma votação aberta.');
    const m = a.membros.find((x) => x.id === d.membroId);
    if (!m) erro('Membro não encontrado.', 404);
    a.membros = a.membros.filter((x) => x.id !== d.membroId);
    registar(a, 'CADERNO', `${m.nome} retirado do caderno eleitoral.`);
  },

  'membro.capacidade'(a, d, actor) {
    exigirMesa(actor);
    const m = a.membros.find((x) => x.id === d.membroId);
    if (!m) erro('Membro não encontrado.', 404);
    if (d.campo !== 'podeVotar' && d.campo !== 'podeSerEleito') erro('Campo inválido.');
    m[d.campo] = !m[d.campo];
    registar(
      a,
      'CADERNO',
      `${m.nome} — capacidade eleitoral ${d.campo === 'podeVotar' ? 'activa' : 'passiva'} ${m[d.campo] ? 'reposta' : 'retirada'}.`,
    );
  },

  'membro.presenca'(a, d, actor) {
    const m = a.membros.find((x) => x.id === d.membroId);
    if (!m) erro('Membro não encontrado.', 404);
    if (!ehMesa(actor) && actor.membroId !== m.id) erro('Só a mesa marca a presença de outros camaradas.', 403);
    m.presente = d.presente === undefined ? !m.presente : !!d.presente;
    if (m.presente && !m.entrouEm) m.entrouEm = agora();
  },

  'assembleia.config'(a, d, actor) {
    exigirMesa(actor);
    if (d.nome !== undefined) a.nome = nomeLimpo(d.nome) || a.nome;
    if (d.local !== undefined) a.local = nomeLimpo(d.local);
    if (d.mesa !== undefined) a.mesa = nomeLimpo(d.mesa);
    if (d.pinObrigatorio !== undefined) a.pinObrigatorio = !!d.pinObrigatorio;
    if (d.registoAberto !== undefined) a.registoAberto = !!d.registoAberto;
  },

  /* ───────────────────────────── votação ─────────────────────────────────── */

  'votacao.criar'(a, d, actor) {
    exigirMesa(actor);
    const titulo = nomeLimpo(d.titulo);
    if (titulo.length < 3) erro('Dê um título à votação.');
    const vagas = Math.max(1, Math.min(30, Number(d.vagas) || 1));
    const aptos = eleitoresAptos(a).length;
    const vt = {
      id: uid('vt'),
      titulo,
      cargo: d.cargo || 'OUTRO',
      vagas,
      metodo: d.metodo || 'SECRETO',
      base: Array.isArray(d.base) ? d.base.slice(0, 6) : [],
      quorumRegra: d.quorumRegra === 'DOIS_TERCOS' ? 'DOIS_TERCOS' : ORGAOS[a.escopo].quorum,
      efectividade: Math.max(1, Number(d.efectividade) || aptos),
      resultadosEmDirecto: d.resultadosEmDirecto === true,
      exigeAceitacao: d.exigeAceitacao !== false,
      estado: 'PREPARACAO',
      criadaEm: agora(),
      candidatos: [],
      voltas: [],
      eleitos: [],
      proclamadaEm: null,
      prazoImpugnacao: null,
      acta: null,
      motivoAnulacao: null,
    };
    a.votacoes.unshift(vt);
    registar(a, 'VOTACAO', `Votação convocada: ${vt.titulo} — ${vt.vagas} vaga(s).`);
    return { votacaoId: vt.id };
  },

  'votacao.candidato.add'(a, d, actor) {
    exigirMesa(actor);
    const vt = acharVotacao(a, d.votacaoId);
    if (vt.estado !== 'PREPARACAO') erro('As candidaturas fecham quando a votação abre.');
    const m = a.membros.find((x) => x.id === d.membroId);
    if (!m) erro('Membro não encontrado.', 404);
    if (!m.podeSerEleito) erro(`${m.nome} não tem capacidade eleitoral passiva para este acto (Art. 28).`);
    if (vt.candidatos.some((c) => c.membroId === m.id)) erro('Este camarada já é candidato.');
    const c = {
      id: uid('cd'),
      membroId: m.id,
      nome: m.nome,
      /* Voluntariedade e consulta prévia (Art. 22): a candidatura só é
         admitida depois de o próprio a aceitar no seu telemóvel. */
      aceitou: vt.exigeAceitacao ? null : true,
      propostoPor: nomeLimpo(d.propostoPor || ''),
      incumbente: d.incumbente === true,
    };
    vt.candidatos.push(c);
    registar(a, 'CANDIDATURA', `${m.nome} proposto para ${vt.titulo}${c.propostoPor ? ` por ${c.propostoPor}` : ''}.`);
  },

  'votacao.candidato.remover'(a, d, actor) {
    exigirMesa(actor);
    const vt = acharVotacao(a, d.votacaoId);
    if (vt.estado !== 'PREPARACAO') erro('Já não é possível alterar as candidaturas.');
    const c = vt.candidatos.find((x) => x.id === d.candidatoId);
    if (!c) erro('Candidatura não encontrada.', 404);
    vt.candidatos = vt.candidatos.filter((x) => x.id !== d.candidatoId);
    registar(a, 'CANDIDATURA', `Candidatura de ${c.nome} retirada.`);
  },

  'candidatura.responder'(a, d, actor) {
    const vt = acharVotacao(a, d.votacaoId);
    const c = vt.candidatos.find((x) => x.id === d.candidatoId);
    if (!c) erro('Candidatura não encontrada.', 404);
    if (!ehMesa(actor) && actor.membroId !== c.membroId) erro('Só o próprio camarada aceita a sua candidatura.', 403);
    if (vt.estado !== 'PREPARACAO') erro('A votação já não está na fase de candidaturas.');
    c.aceitou = d.aceitou === true;
    registar(a, 'CANDIDATURA', `${c.nome} ${c.aceitou ? 'aceitou' : 'recusou'} a candidatura a ${vt.titulo}.`);
  },

  'votacao.abrir'(a, d, actor) {
    exigirMesa(actor);
    const vt = acharVotacao(a, d.votacaoId);
    if (vt.estado !== 'PREPARACAO') erro('Esta votação já foi aberta.');
    const admitidos = vt.candidatos.filter((c) => c.aceitou === true);
    if (admitidos.length < 1) erro('Não há candidaturas aceites. Nenhum camarada vai a votos sem aceitar (Art. 22).');
    const presentes = a.membros.filter((m) => m.podeVotar && m.presente).length;
    const q = quorumDe(presentes, vt.efectividade, vt.quorumRegra);
    if (!q.atingido && d.forcar !== true) {
      erro(
        `Quórum não verificado: ${presentes} presentes de ${vt.efectividade} membros em efectividade de funções; exigidos ${q.exigido}.`,
      );
    }
    vt.estado = 'ABERTA';
    vt.voltas.push({
      numero: 1,
      candidatos: admitidos.map((c) => c.id),
      abertaEm: agora(),
      fechadaEm: null,
      presentesNaAbertura: presentes,
      boletins: [],
      votantes: [],
    });
    registar(a, 'ESCRUTINIO', `Escrutínio aberto — ${vt.titulo}. Presentes: ${presentes}; quórum exigido: ${q.exigido}.`);
  },

  'voto.registar'(a, d, actor) {
    const vt = acharVotacao(a, d.votacaoId);
    if (vt.estado !== 'ABERTA') erro('A votação não está aberta.');
    const v = voltaActual(vt);
    if (!v || v.fechadaEm) erro('A volta já foi encerrada.');

    const m = a.membros.find((x) => x.id === actor.membroId);
    if (!m) erro('Só os camaradas inscritos no caderno votam.', 403);
    if (!m.podeVotar) erro('Sem capacidade eleitoral activa neste acto (Art. 28).', 403);
    if (v.votantes.includes(m.id)) erro('O seu voto já foi registado nesta volta.');

    let boletim;
    if (d.tipo === 'BRANCO') boletim = { tipo: 'BRANCO', escolhas: [] };
    else if (d.tipo === 'NULO') boletim = { tipo: 'NULO', escolhas: [] };
    else {
      const escolhas = [...new Set(Array.isArray(d.escolhas) ? d.escolhas : [])];
      if (escolhas.length === 0) erro('Escolha pelo menos um candidato, ou vote em branco.');
      if (escolhas.length > vt.vagas) erro(`Só pode escolher ${vt.vagas} candidato(s).`);
      if (escolhas.some((id) => !v.candidatos.includes(id))) erro('Candidato inválido neste boletim.');
      boletim = { tipo: 'VALIDO', escolhas };
    }

    /* As duas escritas seguintes são deliberadamente independentes: o boletim
       vai para o fim da urna e o descarregamento do voto para o caderno. */
    v.boletins.push(boletim);
    v.votantes.push(m.id);
    m.presente = true;
    return { registado: true };
  },

  'votacao.encerrar'(a, d, actor) {
    exigirMesa(actor);
    const vt = acharVotacao(a, d.votacaoId);
    if (vt.estado !== 'ABERTA') erro('A votação não está aberta.');
    const v = voltaActual(vt);
    if (!v) erro('Não há volta em curso.');
    v.fechadaEm = agora();
    vt.estado = 'ENCERRADA';
    const ap = apurar(vt, v.numero);
    registar(
      a,
      'ESCRUTINIO',
      `Urna encerrada — ${vt.titulo}, ${v.numero}.ª volta: ${ap.expressos} boletins (${ap.brancos} brancos, ${ap.nulos} nulos).`,
    );
  },

  'votacao.segunda-volta'(a, d, actor) {
    exigirMesa(actor);
    const vt = acharVotacao(a, d.votacaoId);
    if (vt.estado !== 'ENCERRADA') erro('A volta anterior ainda não foi encerrada.');
    if (vt.voltas.length >= 2) erro('Os Estatutos prevêem duas voltas.');
    const ap = apurar(vt, 1);
    if (!ap.precisaSegundaVolta) erro('Não há segunda volta: as vagas foram preenchidas à primeira.');
    const presentes = a.membros.filter((m) => m.podeVotar && m.presente).length;
    vt.estado = 'ABERTA';
    vt.voltas.push({
      numero: 2,
      candidatos: ap.candidatosSegundaVolta,
      abertaEm: agora(),
      fechadaEm: null,
      presentesNaAbertura: presentes,
      boletins: [],
      votantes: [],
    });
    const nomes = ap.candidatosSegundaVolta
      .map((id) => vt.candidatos.find((c) => c.id === id)?.nome)
      .filter(Boolean)
      .join(', ');
    registar(a, 'ESCRUTINIO', `Segunda volta aberta — ${vt.titulo}. Concorrem: ${nomes}.`);
  },

  'votacao.proclamar'(a, d, actor) {
    exigirMesa(actor);
    const vt = acharVotacao(a, d.votacaoId);
    if (vt.estado !== 'ENCERRADA') erro('Encerre a urna antes de proclamar.');
    const v = voltaActual(vt);
    const ap = apurar(vt, v.numero);
    if (ap.precisaSegundaVolta && d.forcar !== true) {
      erro('Nenhum candidato alcançou a maioria absoluta. Abra a segunda volta (Art. 25 n.º 4).');
    }

    vt.eleitos = ap.linhas.map((l, i) => ({
      membroId: l.membroId,
      nome: l.nome,
      votos: l.votos,
      ordem: i + 1,
      /* A ordem de eleição fixa a lista de suplentes (Art. 32 n.º 1). */
      suplente: !l.eleito,
    }));
    vt.estado = 'PROCLAMADA';
    vt.proclamadaEm = agora();
    vt.prazoImpugnacao = maisDias(vt.proclamadaEm, 30);
    vt.acta = redigirActa(a, vt);

    const nomes = vt.eleitos.filter((x) => !x.suplente).map((x) => x.nome).join(', ');
    registar(a, 'PROCLAMACAO', `Proclamado o resultado de ${vt.titulo}: ${nomes || 'sem eleitos'}.`);
  },

  'votacao.anular'(a, d, actor) {
    exigirMesa(actor);
    const vt = acharVotacao(a, d.votacaoId);
    if (vt.estado === 'PROCLAMADA') erro('Um resultado proclamado impugna-se junto do Comité de Verificação (Art. 33).');
    vt.estado = 'ANULADA';
    vt.motivoAnulacao = nomeLimpo(d.motivo) || 'Sem fundamento indicado.';
    registar(a, 'VOTACAO', `Votação anulada — ${vt.titulo}. ${vt.motivoAnulacao}`);
  },

  'votacao.resultados-directo'(a, d, actor) {
    exigirMesa(actor);
    const vt = acharVotacao(a, d.votacaoId);
    vt.resultadosEmDirecto = !vt.resultadosEmDirecto;
    registar(
      a,
      'VOTACAO',
      vt.resultadosEmDirecto
        ? `Apuramento em directo ligado em ${vt.titulo}.`
        : `Apuramento em directo desligado em ${vt.titulo}.`,
    );
  },

  'votacao.efectividade'(a, d, actor) {
    exigirMesa(actor);
    const vt = acharVotacao(a, d.votacaoId);
    if (vt.estado !== 'PREPARACAO') erro('A efectividade de funções fixa-se antes da abertura da urna.');
    vt.efectividade = Math.max(1, Math.min(500, Number(d.efectividade) || 1));
  },
};

/* Meses com inicial maiúscula, como no resto do protótipo. */
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Acta de eleição, montada a partir do que ficou registado. */
function redigirActa(a, vt) {
  const linhas = [];
  const dt = new Date(vt.proclamadaEm);
  const data = `${dt.getDate()} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`;
  const hora = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;

  linhas.push(`ACTA DE ELEIÇÃO — ${vt.titulo.toUpperCase()}`);
  linhas.push('');
  linhas.push(
    `Aos ${data}, pelas ${hora}${a.local ? `, em ${a.local}` : ''}, reuniu ${a.nome}, enquanto ${a.orgao}, para proceder à eleição de ${vt.vagas} ${vt.vagas === 1 ? 'titular' : 'titulares'} para ${vt.titulo}.`,
  );
  linhas.push('');
  linhas.push(
    `Caderno eleitoral: ${a.membros.filter((m) => m.podeVotar).length} membros com capacidade eleitoral activa. Membros em efectividade de funções considerados para o cálculo da maioria: ${vt.efectividade}. Maioria absoluta exigida à primeira volta: ${Math.floor(vt.efectividade / 2) + 1} votos.`,
  );
  linhas.push('');

  vt.voltas.forEach((v) => {
    const ap = apurar(vt, v.numero);
    linhas.push(`${v.numero}.ª VOLTA`);
    linhas.push(
      `Presentes à abertura da urna: ${v.presentesNaAbertura}. Boletins depositados: ${ap.expressos}, dos quais ${ap.brancos} em branco e ${ap.nulos} nulos.`,
    );
    ap.linhas.forEach((l) => {
      linhas.push(`  · ${l.nome} — ${l.votos} voto(s) (${l.pctExpressos.toFixed(1).replace('.', ',')}% dos expressos)`);
    });
    linhas.push('');
  });

  const eleitos = vt.eleitos.filter((x) => !x.suplente);
  const suplentes = vt.eleitos.filter((x) => x.suplente);
  linhas.push('PROCLAMAÇÃO');
  linhas.push(
    eleitos.length
      ? `Foram proclamados eleitos: ${eleitos.map((x) => `${x.nome} (${x.votos} votos)`).join('; ')}.`
      : 'Não foi proclamado nenhum eleito.',
  );
  if (suplentes.length) {
    linhas.push(
      `Suplentes, pela ordem de eleição (Art. 32 n.º 1): ${suplentes.map((x, i) => `${i + 1}.º ${x.nome}`).join('; ')}.`,
    );
  }
  linhas.push('');
  linhas.push(
    'O acto pode ser impugnado junto do Comité de Verificação competente no prazo de trinta dias (Art. 33 n.º 1).',
  );
  linhas.push('');
  linhas.push(`${a.mesa ? `A mesa: ${a.mesa}` : 'A mesa da assembleia'}`);
  linhas.push('Frente de Libertação de Moçambique — A Luta Continua');
  return linhas.join('\n');
}

/**
 * Ponto de entrada único das escritas. Lança `ErroAccao` quando a acção é
 * inválida — o transporte converte-o em resposta HTTP.
 */
export function aplicar(assembleia, nome, dados = {}, actor) {
  const fn = ACCOES[nome];
  if (!fn) erro(`Acção desconhecida: ${nome}`, 404);
  return fn(assembleia, dados, actor) ?? {};
}

export { ErroAccao, ORGAOS };

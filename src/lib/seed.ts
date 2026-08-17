/* ===========================================================================
   Cenário de demonstração.

   Tudo o que se segue é gerado em memória, de forma determinística, no
   arranque da aplicação. Não existe base de dados, servidor ou ficheiro:
   o estado vive no navegador e pode ser reposto a qualquer momento.
   ========================================================================= */

import {
  AGENDA_SECRETARIADO,
  AGENDA_TIPO,
  REGRAS,
} from './estatutos';
import { addDays, addYears, iso, mesDe, prng, ultimosMeses } from './format';
import type {
  Celula,
  CelulaResumo,
  Circulo,
  Documento,
  Eleicao,
  Estado,
  Mandato,
  Membro,
  Mensagem,
  Movimento,
  ProvinciaResumo,
  Quota,
  Reuniao,
} from './types';

export const HOJE = '2026-08-12';

const CELULA_ID = 'cel_07';
const CIRCULO_ID = 'cir_12';

// ─────────────────────────── Estrutura territorial ──────────────────────────

const celula: Celula = {
  id: CELULA_ID,
  numero: 7,
  nome: 'Célula n.º 7 — Josina Machel',
  circuloId: CIRCULO_ID,
  bairro: 'Polana Caniço A',
  localidade: 'Polana Caniço',
  distrito: 'KaMaxakeni',
  provincia: 'Cidade de Maputo',
  criadaEm: '1998-06-25',
};

const circulo: Circulo = {
  id: CIRCULO_ID,
  nome: 'Círculo n.º 12 — Polana Caniço A',
  distrito: 'KaMaxakeni',
  provincia: 'Cidade de Maputo',
  totalCelulas: 11,
};

// ───────────────────────────────── Membros ──────────────────────────────────

interface Perfil0 {
  nome: string;
  sexo: 'F' | 'M';
  nasc: string;
  admissao: string;
  cargo: Membro['cargo'];
  estado: Membro['estado'];
  profissao: string;
  rendimento: number;
  /** 0..1 — regularidade nas quotas e nas presenças */
  disciplina: number;
  canal: Membro['canal'];
  recenseado: boolean;
  quarteirao: string;
  notas?: string;
}

const PERFIS: Perfil0[] = [
  { nome: 'Amélia Joaquina Nhantumbo', sexo: 'F', nasc: '1971-03-14', admissao: '1996-09-25', cargo: 'SECRETARIO', estado: 'EFECTIVO', profissao: 'Professora do ensino primário', rendimento: 28500, disciplina: 0.98, canal: 'WHATSAPP', recenseado: true, quarteirao: 'Q. 14', notas: 'Secretária da Célula desde Novembro de 2022. Formadora do Círculo.' },
  { nome: 'Carlos Fernando Macuácua', sexo: 'M', nasc: '1978-11-02', admissao: '2001-02-11', cargo: 'ASSISTENTE', estado: 'EFECTIVO', profissao: 'Técnico de electricidade', rendimento: 34000, disciplina: 0.9, canal: 'WHATSAPP', recenseado: true, quarteirao: 'Q. 14' },
  { nome: 'Zacarias Alberto Cossa', sexo: 'M', nasc: '1984-06-19', admissao: '2010-07-03', cargo: 'ASSISTENTE', estado: 'EFECTIVO', profissao: 'Motorista de transporte semi-colectivo', rendimento: 19000, disciplina: 0.24, canal: 'SMS', recenseado: true, quarteirao: 'Q. 17', notas: 'Assiduidade em queda desde Janeiro. Deslocações profissionais frequentes.' },
  { nome: 'Rosalina Estêvão Chissano', sexo: 'F', nasc: '1965-01-28', admissao: '1989-06-25', cargo: 'MEMBRO', estado: 'EFECTIVO', profissao: 'Comerciante do mercado do Museu', rendimento: 22000, disciplina: 0.95, canal: 'WHATSAPP', recenseado: true, quarteirao: 'Q. 15', notas: 'Veterana da Célula. Elemento de Ligação em mandatos anteriores.' },
  { nome: 'Hélder Vasco Mabjaia', sexo: 'M', nasc: '1991-04-07', admissao: '2016-10-15', cargo: 'MEMBRO', estado: 'EFECTIVO', profissao: 'Enfermeiro', rendimento: 41000, disciplina: 0.88, canal: 'WHATSAPP', recenseado: true, quarteirao: 'Q. 16' },
  { nome: 'Inês Domingos Sitoe', sexo: 'F', nasc: '1988-09-23', admissao: '2013-03-09', cargo: 'MEMBRO', estado: 'EFECTIVO', profissao: 'Costureira', rendimento: 16500, disciplina: 0.82, canal: 'WHATSAPP', recenseado: true, quarteirao: 'Q. 14' },
  { nome: 'Fernando Elias Cuna', sexo: 'M', nasc: '1959-12-05', admissao: '1983-05-01', cargo: 'MEMBRO', estado: 'EFECTIVO', profissao: 'Reformado — antigo combatente', rendimento: 12000, disciplina: 0.93, canal: 'SMS', recenseado: true, quarteirao: 'Q. 13' },
  { nome: 'Beatriz Salomão Manjate', sexo: 'F', nasc: '1996-07-31', admissao: '2021-11-20', cargo: 'MEMBRO', estado: 'EFECTIVO', profissao: 'Estudante universitária / bolseira', rendimento: 9000, disciplina: 0.79, canal: 'WHATSAPP', recenseado: true, quarteirao: 'Q. 17', notas: 'Dinamizadora das actividades culturais e da OJM no bairro.' },
  { nome: 'Judite Armando Mucavele', sexo: 'F', nasc: '1974-02-16', admissao: '2003-08-12', cargo: 'MEMBRO', estado: 'EFECTIVO', profissao: 'Auxiliar administrativa', rendimento: 24000, disciplina: 0.86, canal: 'EMAIL', recenseado: true, quarteirao: 'Q. 15' },
  { nome: 'Armando Paulino Bila', sexo: 'M', nasc: '1982-10-11', admissao: '2008-04-27', cargo: 'MEMBRO', estado: 'EFECTIVO', profissao: 'Mecânico', rendimento: 26500, disciplina: 0.71, canal: 'SMS', recenseado: false, quarteirao: 'Q. 16' },
  { nome: 'Lúcia Manuel Guambe', sexo: 'F', nasc: '1993-05-04', admissao: '2019-09-14', cargo: 'MEMBRO', estado: 'EFECTIVO', profissao: 'Vendedora ambulante', rendimento: 11000, disciplina: 0.08, canal: 'SMS', recenseado: false, quarteirao: 'Q. 18', notas: 'Sem pagamento de quota desde Julho de 2025. Contactada duas vezes pelo Secretariado.' },
  { nome: 'Isaías Bernardo Matola', sexo: 'M', nasc: '1986-08-08', admissao: '2012-06-30', cargo: 'MEMBRO', estado: 'SUSPENSO', profissao: 'Serralheiro', rendimento: 21000, disciplina: 0.1, canal: 'SMS', recenseado: true, quarteirao: 'Q. 13', notas: 'Direitos suspensos por um ano, até à regularização das quotas.' },
  { nome: 'Gracinda Tomás Chauque', sexo: 'F', nasc: '2001-01-19', admissao: '2026-05-09', cargo: 'MEMBRO', estado: 'CANDIDATO', profissao: 'Cabeleireira', rendimento: 8500, disciplina: 0.9, canal: 'WHATSAPP', recenseado: true, quarteirao: 'Q. 15', notas: 'Candidatura apresentada na Reunião Geral de Maio. Aguarda deliberação.' },
  { nome: 'Domingos Rafael Muianga', sexo: 'M', nasc: '2004-11-26', admissao: '2026-07-18', cargo: 'MEMBRO', estado: 'CANDIDATO', profissao: 'Aprendiz de carpintaria', rendimento: 6000, disciplina: 0.8, canal: 'WHATSAPP', recenseado: false, quarteirao: 'Q. 17', notas: 'Proposto pelo camarada Fernando Cuna. Ainda não recenseado.' },
  { nome: 'Marta Simião Xerinda', sexo: 'F', nasc: '1969-06-02', admissao: '1994-11-08', cargo: 'MEMBRO', estado: 'CESSADO', profissao: 'Doméstica', rendimento: 0, disciplina: 0.6, canal: 'SMS', recenseado: false, quarteirao: 'Q. 12', notas: 'Cessou a filiação por transferência de residência para Marracuene (Art. 9).' },
];

const rnd = prng(20260812);

function telefoneAleatorio(i: number): string {
  const prefixos = ['84', '82', '86', '87', '85'];
  const p = prefixos[i % prefixos.length];
  const n = String(Math.floor(rnd() * 9000000) + 1000000);
  return `+258 ${p} ${n.slice(0, 3)} ${n.slice(3)}`;
}

function construirMembros(): Membro[] {
  return PERFIS.map((p, i) => {
    const id = `m${String(i + 1).padStart(2, '0')}`;
    const email = p.canal === 'EMAIL' || rnd() > 0.55
      ? `${p.nome.split(' ')[0].toLowerCase()}.${p.nome.split(' ').slice(-1)[0].toLowerCase()}@gmail.com`
      : undefined;
    return {
      id,
      cartao: `MZ-${String(1180000 + i * 137).slice(0, 7)}`,
      nome: p.nome,
      telefone: telefoneAleatorio(i),
      temWhatsapp: p.canal === 'WHATSAPP' || rnd() > 0.4,
      canal: p.canal,
      dataAdmissao: p.admissao,
      estado: p.estado,
      cargo: p.cargo,
      celulaId: CELULA_ID,
      dataNascimento: p.nasc,
      sexo: p.sexo,
      bi: `${String(Math.floor(rnd() * 900000000) + 100000000)}${'ABCJQ'[i % 5]}`,
      nuit: String(Math.floor(rnd() * 400000000) + 100000000),
      cartaoEleitor: p.recenseado ? `${String(Math.floor(rnd() * 9000000) + 1000000)}` : undefined,
      validadeCartaoEleitor: p.recenseado ? (i % 4 === 0 ? '2027-01-31' : '2029-06-30') : undefined,
      email,
      bairro: celula.bairro,
      quarteirao: p.quarteirao,
      profissao: p.profissao,
      rendimento: p.rendimento,
      recenseado: p.recenseado,
      notas: p.notas,
      suspensoDesde: p.estado === 'SUSPENSO' ? '2026-02-21' : undefined,
      motivoSuspensao: p.estado === 'SUSPENSO' ? 'Falta de pagamento de quotas por doze meses consecutivos' : undefined,
      cessadoEm: p.estado === 'CESSADO' ? '2025-10-18' : undefined,
      motivoCessacao: p.estado === 'CESSADO' ? 'Mudança de residência — transferência para célula de Marracuene' : undefined,
    } satisfies Membro;
  });
}

const membros = construirMembros();
const disciplinaDe: Record<string, number> = {};
membros.forEach((m, i) => { disciplinaDe[m.id] = PERFIS[i].disciplina; });

const SEC = membros[0].id;

// ──────────────────────────────── Reuniões ──────────────────────────────────

/** N-ésimo sábado do mês (n começa em 1). */
function sabadoDoMes(ano: number, mes: number, n: number): string {
  const primeiro = new Date(ano, mes - 1, 1);
  const desloc = (6 - primeiro.getDay() + 7) % 7;
  return iso(new Date(ano, mes - 1, 1 + desloc + (n - 1) * 7));
}

function agenda(pontos: { titulo: string; fixo: boolean }[], especifico?: string) {
  return pontos.map((p, i) => ({
    id: `p${i}`,
    ordem: i + 1,
    titulo: p.titulo === 'Ponto específico do momento' && especifico ? `Ponto específico: ${especifico}` : p.titulo,
    fixo: p.fixo,
  }));
}

const PONTOS_ESPECIFICOS = [
  'Cobrança de quotas e regularização de atrasos',
  'Recenseamento eleitoral — mobilização porta a porta',
  'Campanha de limpeza do bairro e cidadania',
  'Orientações do Comité de Círculo sobre o Estudo Político',
  'Preparação da Conferência do Círculo',
  'Campanha agrícola e hortas familiares',
  'Saúde comunitária — prevenção da cólera',
  'Admissão de novos membros e análise de candidaturas',
];

const LOCAIS = [
  'Sede da Célula — Q. 14, casa n.º 132',
  'Pátio da camarada Rosalina Chissano — Q. 15',
  'Escola Primária de Polana Caniço A',
];

function membroActivoEm(m: Membro, data: string): boolean {
  if (m.dataAdmissao > data) return false;
  if (m.cessadoEm && m.cessadoEm <= data) return false;
  if (m.estado === 'CANDIDATO') return false;
  return true;
}

function construirReunioes(): Reuniao[] {
  const out: Reuniao[] = [];
  const meses = ultimosMeses(HOJE, 15); // 2025-06 .. 2026-08

  meses.forEach((mes, idx) => {
    const [ano, m] = mes.split('-').map(Number);
    const data = sabadoDoMes(ano, m, 3);
    const passada = data < HOJE;
    const especifico = PONTOS_ESPECIFICOS[idx % PONTOS_ESPECIFICOS.length];

    const presencas: Record<string, 'PRESENTE' | 'JUSTIFICADO' | 'INJUSTIFICADO'> = {};
    const justificacoes: Record<string, string> = {};
    if (passada) {
      membros.filter((mb) => membroActivoEm(mb, data)).forEach((mb) => {
        const disc = disciplinaDe[mb.id];
        const r = rnd();
        if (r < 0.58 + 0.38 * disc) presencas[mb.id] = 'PRESENTE';
        else if (rnd() < 0.45 + 0.3 * disc) {
          presencas[mb.id] = 'JUSTIFICADO';
          justificacoes[mb.id] = ['Doença', 'Viagem de trabalho', 'Óbito na família', 'Escala de serviço'][Math.floor(rnd() * 4)];
        } else presencas[mb.id] = 'INJUSTIFICADO';
      });
      // A Secretária esteve sempre presente.
      presencas[SEC] = 'PRESENTE';
    }

    const numeroActa = idx + 41;
    out.push({
      id: `rg_${mes}`,
      celulaId: CELULA_ID,
      tipo: 'REUNIAO_GERAL',
      titulo: `Reunião Geral Ordinária — ${mes}`,
      data,
      hora: '15:00',
      local: LOCAIS[idx % LOCAIS.length],
      estado: passada ? 'REALIZADA' : 'AGENDADA',
      agenda: agenda(AGENDA_TIPO, especifico),
      // A convocatória da próxima Reunião Geral está deliberadamente em falta:
      // serve para demonstrar o alerta de antecedência mínima de dois dias.
      convocatoriaEnviadaEm: passada ? addDays(data, -4) : undefined,
      canaisConvocatoria: passada ? ['WHATSAPP', 'SMS'] : undefined,
      presencas,
      justificacoes,
      duracaoMin: passada ? [72, 85, 90, 96, 78, 88][idx % 6] : undefined,
      dirigidaPor: passada ? SEC : undefined,
      resumo: passada
        ? `Sessão dirigida pela Secretária da Célula. Debateu-se ${especifico.toLowerCase()}. Aprovada a Acta da sessão anterior sem alterações.`
        : undefined,
      decisoes: passada
        ? [
            {
              id: `d_${mes}_1`,
              texto: `Realizar visita domiciliária aos membros em atraso com as quotas`,
              responsavelId: membros[1].id,
              prazo: addDays(data, 20),
              cumprida: idx < meses.length - 2,
            },
            {
              id: `d_${mes}_2`,
              texto: `Actualizar as fichas dos membros na base de dados da Célula`,
              responsavelId: membros[2].id,
              prazo: addDays(data, 25),
              cumprida: idx < meses.length - 3,
            },
          ]
        : [],
      acta: passada
        ? {
            ficheiro: `Acta_${numeroActa}_RG_${mes}.pdf`,
            anexadaEm: addDays(data, 2),
            // A Acta é lida e aprovada na reunião seguinte (Manual da Célula).
            aprovadaEm: idx < meses.length - 2 ? sabadoSeguinte(mes) : undefined,
            aprovadaNaReuniaoId: idx < meses.length - 2 ? `rg_${mesSeguinte(mes)}` : undefined,
          }
        : undefined,
    });
  });

  // Secretariado — de quinze em quinze dias (Art. 35 n.º 9)
  let cursor = '2026-01-10';
  let k = 0;
  while (cursor <= addDays(HOJE, 20)) {
    const passada = cursor < HOJE;
    const presencas: Record<string, 'PRESENTE' | 'JUSTIFICADO' | 'INJUSTIFICADO'> = {};
    const secretariado = membros.filter((m) => m.cargo === 'SECRETARIO' || m.cargo === 'ASSISTENTE' || m.cargo === 'ELEMENTO_LIGACAO');
    if (passada) {
      secretariado.forEach((mb) => {
        const disc = disciplinaDe[mb.id];
        presencas[mb.id] = rnd() < 0.55 + 0.42 * disc ? 'PRESENTE' : rnd() < 0.5 ? 'JUSTIFICADO' : 'INJUSTIFICADO';
      });
      presencas[SEC] = 'PRESENTE';
    }
    out.push({
      id: `sec_${cursor}`,
      celulaId: CELULA_ID,
      tipo: 'SECRETARIADO',
      titulo: `Sessão do Secretariado`,
      data: cursor,
      hora: '17:30',
      local: 'Sede da Célula — Q. 14',
      estado: passada ? 'REALIZADA' : 'AGENDADA',
      agenda: agenda(AGENDA_SECRETARIADO),
      convocatoriaEnviadaEm: passada ? addDays(cursor, -3) : addDays(cursor, -3),
      canaisConvocatoria: ['WHATSAPP'],
      presencas,
      duracaoMin: passada ? 45 + Math.floor(rnd() * 25) : undefined,
      dirigidaPor: passada ? SEC : undefined,
      decisoes: [],
      resumo: passada ? 'Balanço da cobrança de quotas e preparação da Reunião Geral.' : undefined,
    });
    cursor = addDays(cursor, REGRAS.CADENCIA_SECRETARIADO_DIAS);
    k++;
    if (k > 30) break;
  }

  // Actividades da Célula (Art. 36 n.º 3)
  const extras: { tipo: Reuniao['tipo']; titulo: string; data: string; local: string; hora: string }[] = [
    { tipo: 'ESTUDO_POLITICO', titulo: 'Estudo Político — Capítulo II dos Estatutos: Membros do Partido', data: '2026-08-22', hora: '16:00', local: 'Escola Primária de Polana Caniço A' },
    { tipo: 'AUSCULTACAO', titulo: 'Auscultação com simpatizantes e líderes comunitários', data: '2026-08-29', hora: '09:00', local: 'Pátio do Q. 16' },
    { tipo: 'SOLIDARIEDADE', titulo: 'Visita de solidariedade ao camarada Fernando Cuna', data: '2026-07-25', hora: '10:00', local: 'Q. 13, casa n.º 41' },
    { tipo: 'CULTURAL', titulo: 'Actividade cultural — grupo de dança do bairro', data: '2026-06-27', hora: '14:00', local: 'Campo do Q. 15' },
    { tipo: 'REUNIAO_GERAL_EXTRA', titulo: 'Sessão Extraordinária — vacatura do Elemento de Ligação', data: '2026-07-04', hora: '15:30', local: 'Sede da Célula — Q. 14' },
  ];
  extras.forEach((e, i) => {
    const passada = e.data < HOJE;
    const presencas: Record<string, 'PRESENTE' | 'JUSTIFICADO' | 'INJUSTIFICADO'> = {};
    if (passada) {
      membros.filter((mb) => membroActivoEm(mb, e.data)).forEach((mb) => {
        presencas[mb.id] = rnd() < 0.5 + 0.4 * disciplinaDe[mb.id] ? 'PRESENTE' : 'JUSTIFICADO';
      });
    }
    out.push({
      id: `act_${i}`,
      celulaId: CELULA_ID,
      tipo: e.tipo,
      titulo: e.titulo,
      data: e.data,
      hora: e.hora,
      local: e.local,
      estado: passada ? 'REALIZADA' : 'AGENDADA',
      agenda: e.tipo === 'REUNIAO_GERAL_EXTRA'
        ? agenda([
            { titulo: 'Verificação do quórum', fixo: true },
            { titulo: 'Informação sobre a renúncia do Elemento de Ligação', fixo: true },
            { titulo: 'Convocação de eleição para preenchimento da vaga', fixo: true },
          ])
        : agenda([{ titulo: e.titulo, fixo: false }]),
      convocatoriaEnviadaEm: addDays(e.data, -5),
      canaisConvocatoria: ['WHATSAPP', 'SMS'],
      presencas,
      duracaoMin: passada ? 60 + Math.floor(rnd() * 40) : undefined,
      dirigidaPor: passada ? SEC : undefined,
      decisoes: [],
      resumo: passada ? 'Actividade realizada com participação de membros e simpatizantes.' : undefined,
    });
  });

  return out.sort((a, b) => (a.data < b.data ? 1 : -1));
}

function mesSeguinte(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  const dt = new Date(y, m, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}
/** 3.º sábado do mês seguinte — data em que a Acta é lida e aprovada. */
function sabadoSeguinte(mes: string): string {
  const [y, m] = mesSeguinte(mes).split('-').map(Number);
  return sabadoDoMes(y, m, 3);
}

const reunioes = construirReunioes();

// ───────────────────────────────── Quotas ───────────────────────────────────

const ESPECIE = [
  '2 latas de milho (equivalente a 350 MT)',
  'Trabalho de pintura da sede da Célula',
  '1 saco de carvão (equivalente a 400 MT)',
  '5 kg de feijão nhemba',
];

function construirQuotas(): Quota[] {
  const out: Quota[] = [];
  const meses = ultimosMeses(HOJE, 14);
  meses.forEach((mes) => {
    membros.forEach((m) => {
      if (m.estado === 'CANDIDATO' || m.estado === 'CESSADO') return;
      if (mesDe(m.dataAdmissao) > mes) return;
      const disc = disciplinaDe[m.id];
      // O membro suspenso e a camarada em incumprimento prolongado deixam de
      // pagar por completo — é o que faz disparar o Art. 16 n.º 4.
      const limiar = m.estado === 'SUSPENSO' || disc < 0.15 ? 0 : 0.5 + 0.47 * disc;
      if (rnd() > limiar) return;
      const base = Math.max(50, Math.round(((m.rendimento || 10000) * REGRAS.TAXA_QUOTA) / 5) * 5);
      const emEspecie = rnd() < 0.09;
      const dia = 3 + Math.floor(rnd() * 22);
      out.push({
        id: `q_${mes}_${m.id}`,
        celulaId: CELULA_ID,
        membroId: m.id,
        mes,
        valor: base,
        modalidade: emEspecie ? 'ESPECIE' : 'NUMERARIO',
        descricaoEspecie: emEspecie ? ESPECIE[Math.floor(rnd() * ESPECIE.length)] : undefined,
        dataRegisto: `${mes}-${String(dia).padStart(2, '0')}`,
        registadoPor: rnd() < 0.7 ? SEC : membros[1].id,
      });
    });
  });
  return out.sort((a, b) => (a.dataRegisto < b.dataRegisto ? 1 : -1));
}

const quotas = construirQuotas();

const movimentos: Movimento[] = [
  { id: 'mv1', celulaId: CELULA_ID, tipo: 'DESPESA', categoria: 'Funcionamento', descricao: 'Cadernos de acta e material de escritório', valor: 850, data: '2026-08-04', comprovativo: 'recibo_papelaria_ago.jpg' },
  { id: 'mv2', celulaId: CELULA_ID, tipo: 'DESPESA', categoria: 'Comunicação', descricao: 'Carregamento de saldo para convocatórias (SMS)', valor: 300, data: '2026-08-02', comprovativo: 'talao_recarga.jpg' },
  { id: 'mv3', celulaId: CELULA_ID, tipo: 'RECEITA', categoria: 'Contribuição adicional', descricao: 'Contribuição voluntária para a actividade cultural', valor: 1500, data: '2026-07-20', comprovativo: 'recibo_004.jpg' },
  { id: 'mv4', celulaId: CELULA_ID, tipo: 'DESPESA', categoria: 'Solidariedade', descricao: 'Apoio ao camarada Fernando Cuna (medicamentos)', valor: 1200, data: '2026-07-25', comprovativo: 'factura_farmacia.jpg' },
  { id: 'mv5', celulaId: CELULA_ID, tipo: 'DESPESA', categoria: 'Funcionamento', descricao: 'Transporte da delegação ao Comité de Círculo', valor: 600, data: '2026-06-15' },
  { id: 'mv6', celulaId: CELULA_ID, tipo: 'RECEITA', categoria: 'Actividade', descricao: 'Venda de bebidas na actividade cultural de Junho', valor: 2100, data: '2026-06-27', comprovativo: 'folha_caixa_jun.jpg' },
];

// ──────────────────────────────── Eleições ──────────────────────────────────

function caderno(elegiveis: Membro[], todosMembros: Membro[]) {
  return todosMembros
    .filter((m) => m.estado !== 'CESSADO')
    .map((m) => {
      const impedimentos: { motivo: string; base: string }[] = [];
      if (m.estado === 'CANDIDATO') impedimentos.push({ motivo: 'Candidato a membro — admissão ainda não deliberada', base: 'art8' });
      if (m.estado === 'SUSPENSO') impedimentos.push({ motivo: 'Direitos suspensos por falta de pagamento de quotas', base: 'art16n4' });
      const activa = impedimentos.length === 0;
      const passiva = activa && elegiveis.some((e) => e.id === m.id);
      if (activa && !passiva) impedimentos.push({ motivo: 'Fora do universo de capacidade eleitoral passiva para este cargo', base: 'art28' });
      return { membroId: m.id, activa, passiva, impedimentos };
    });
}

const efectivos = membros.filter((m) => m.estado === 'EFECTIVO');

const eleicoes: Eleicao[] = [
  // 1. Eleição concluída e homologada — a que produziu o Secretariado em funções
  {
    id: 'el_2022_sec',
    escopo: 'CELULA',
    celulaId: CELULA_ID,
    cargo: 'SECRETARIO_CELULA',
    titulo: 'Eleição do Secretário da Célula — mandato 2022/2027',
    vagas: 1,
    metodo: 'SECRETO',
    fase: 'HOMOLOGADA',
    convocadaEm: '2022-10-22',
    dataEscrutinio: '2022-11-19',
    caderno: [],
    candidaturas: [
      { id: 'c1', membroId: membros[0].id, propostoPorId: membros[3].id, aceitou: true, incumbente: false, nota: 'Proposta apoiada por seis membros.' },
      { id: 'c2', membroId: membros[6].id, propostoPorId: membros[1].id, aceitou: true, incumbente: true },
    ],
    voltas: [
      { numero: 1, votos: { c1: 8, c2: 3 }, brancos: 1, nulos: 0, presentes: 12, efectividade: 13, fechadaEm: '2022-11-19' },
    ],
    eleitos: [{ membroId: membros[0].id, votos: 8, ordem: 1, suplente: false }],
    proclamadaEm: '2022-11-19',
    prazoImpugnacao: '2022-12-19',
    mandato: { inicio: '2022-11-20', fim: '2027-11-20' },
    acta: 'Acta de Eleição n.º 03/2022 — Reunião Geral da Célula n.º 7.',
    observacoes: 'Eleita à primeira volta com maioria absoluta dos membros em efectividade de funções.',
  },
  // 2. Eleição em curso — Elemento de Ligação, vaga aberta por renúncia
  {
    id: 'el_lig_2026',
    escopo: 'CELULA',
    celulaId: CELULA_ID,
    cargo: 'ELEMENTO_LIGACAO',
    titulo: 'Eleição do Elemento de Ligação — preenchimento de vaga',
    vagas: 1,
    metodo: 'SECRETO',
    fase: 'CANDIDATURAS',
    convocadaEm: '2026-07-04',
    dataEscrutinio: '2026-08-15',
    caderno: caderno(efectivos, membros),
    candidaturas: [
      { id: 'cl1', membroId: membros[3].id, propostoPorId: membros[0].id, aceitou: true, incumbente: false, nota: 'Já exerceu a função no mandato 2017/2022.' },
      { id: 'cl2', membroId: membros[4].id, propostoPorId: membros[5].id, aceitou: true, incumbente: false },
      { id: 'cl3', membroId: membros[8].id, propostoPorId: membros[6].id, aceitou: false, incumbente: false, nota: 'Consulta prévia em curso — aguarda aceitação da camarada.' },
    ],
    voltas: [],
    eleitos: [],
    mandato: { inicio: '2026-08-16', fim: '2027-11-20' },
    observacoes: 'Vaga aberta pela renúncia do camarada eleito em 2022. Mandato até ao termo do mandato do órgão.',
  },
  // 3. Eleição de delegados — caderno em preparação
  {
    id: 'el_deleg_2026',
    escopo: 'CELULA',
    celulaId: CELULA_ID,
    cargo: 'DELEGADOS_CONFERENCIA_CIRCULO',
    titulo: 'Eleição de Delegados à Conferência do Círculo n.º 12',
    vagas: 3,
    metodo: 'SECRETO',
    fase: 'CADERNO',
    convocadaEm: '2026-08-01',
    dataEscrutinio: '2026-09-19',
    caderno: caderno(efectivos, membros),
    candidaturas: [],
    voltas: [],
    eleitos: [],
    observacoes: 'A Conferência do Círculo está marcada para Outubro de 2026. Cada Célula elege três delegados.',
  },
  // 4. Escalão do Círculo — proclamada, dentro do prazo de impugnação
  {
    id: 'el_1sec_circ',
    escopo: 'CIRCULO',
    circuloId: CIRCULO_ID,
    cargo: 'PRIMEIRO_SECRETARIO_CIRCULO',
    titulo: 'Eleição do Primeiro Secretário do Comité do Círculo n.º 12',
    vagas: 1,
    metodo: 'SECRETO',
    fase: 'PROCLAMADA',
    convocadaEm: '2026-07-10',
    dataEscrutinio: '2026-08-04',
    caderno: [],
    candidaturas: [
      { id: 'p1', membroId: 'ext_01', propostoPorId: 'ext_04', aceitou: true, incumbente: true },
      { id: 'p2', membroId: 'ext_02', propostoPorId: 'ext_05', aceitou: true, incumbente: false },
      { id: 'p3', membroId: 'ext_03', propostoPorId: 'ext_06', aceitou: true, incumbente: false },
    ],
    voltas: [
      { numero: 1, votos: { p1: 7, p2: 6, p3: 4 }, brancos: 0, nulos: 1, presentes: 18, efectividade: 21, fechadaEm: '2026-08-04' },
      { numero: 2, votos: { p1: 10, p2: 8 }, brancos: 0, nulos: 0, presentes: 18, efectividade: 21, fechadaEm: '2026-08-04' },
    ],
    eleitos: [{ membroId: 'ext_01', votos: 10, ordem: 1, suplente: false }],
    proclamadaEm: '2026-08-04',
    prazoImpugnacao: '2026-09-03',
    mandato: { inicio: '2026-08-05', fim: '2031-08-05' },
    acta: 'Acta de Eleição n.º 01/2026 — Comité do Círculo n.º 12.',
    observacoes:
      'Nenhum candidato obteve maioria absoluta dos 21 membros em efectividade à primeira volta (era necessário 11). Realizada segunda volta entre os dois mais votados.',
  },
];

/** Camaradas do Comité do Círculo que não militam na Célula n.º 7. */
export const MEMBROS_EXTERNOS: Record<string, { nome: string; cargo: string; celula: string }> = {
  ext_01: { nome: 'Anastácio Bernardo Nhaca', cargo: 'Primeiro Secretário do Círculo', celula: 'Célula n.º 3' },
  ext_02: { nome: 'Celeste Amosse Tivane', cargo: 'Membro do Comité do Círculo', celula: 'Célula n.º 9' },
  ext_03: { nome: 'Silvano Jorge Mahumane', cargo: 'Membro do Comité do Círculo', celula: 'Célula n.º 5' },
  ext_04: { nome: 'Teresa Manuel Ubisse', cargo: 'Membro do Comité do Círculo', celula: 'Célula n.º 1' },
  ext_05: { nome: 'Bento Alfredo Chiziane', cargo: 'Membro do Comité do Círculo', celula: 'Célula n.º 4' },
  ext_06: { nome: 'Filomena Rosa Massingue', cargo: 'Membro do Comité do Círculo', celula: 'Célula n.º 8' },
};

const mandatos: Mandato[] = [
  { id: 'md1', membroId: membros[0].id, cargo: 'SECRETARIO_CELULA', orgao: 'Secretariado da Célula n.º 7', inicio: '2022-11-20', fim: '2027-11-20', eleicaoId: 'el_2022_sec', estado: 'ACTIVO' },
  { id: 'md2', membroId: membros[1].id, cargo: 'ASSISTENTES_CELULA', orgao: 'Secretariado da Célula n.º 7', inicio: '2022-11-20', fim: '2027-11-20', eleicaoId: 'el_2022_sec', estado: 'ACTIVO' },
  { id: 'md3', membroId: membros[2].id, cargo: 'ASSISTENTES_CELULA', orgao: 'Secretariado da Célula n.º 7', inicio: '2022-11-20', fim: '2027-11-20', eleicaoId: 'el_2022_sec', estado: 'ACTIVO' },
  { id: 'md4', membroId: '', cargo: 'ELEMENTO_LIGACAO', orgao: 'Célula n.º 7', inicio: '2022-11-20', fim: '2027-11-20', estado: 'VAGO', notaCessacao: 'Renúncia apresentada por escrito ao Secretário da Célula em 28 de Junho de 2026 (Art. 10 n.º 1).' },
  { id: 'md5', membroId: 'ext_01', cargo: 'PRIMEIRO_SECRETARIO_CIRCULO', orgao: 'Comité do Círculo n.º 12', inicio: '2026-08-05', fim: '2031-08-05', eleicaoId: 'el_1sec_circ', estado: 'ACTIVO' },
];

// ───────────────────────────── Comunicação ──────────────────────────────────

const mensagens: Mensagem[] = [
  { id: 'ms1', celulaId: CELULA_ID, canais: ['WHATSAPP', 'SMS'], segmento: 'TODOS', destinatarios: membros.filter((m) => m.estado !== 'CESSADO').map((m) => m.id), assunto: 'Convocatória — Reunião Geral de Julho', corpo: 'Camaradas, convoca-se a Reunião Geral Ordinária da Célula n.º 7 para sábado, 18 de Julho, às 15:00, na Sede da Célula (Q. 14). Agenda em anexo.', enviadaEm: '2026-07-14', custoEstimado: 21, tipo: 'CONVOCATORIA' },
  { id: 'ms2', celulaId: CELULA_ID, canais: ['SMS'], segmento: 'EM_ATRASO', destinatarios: [membros[10].id, membros[9].id], assunto: 'Regularização de quotas', corpo: 'Camarada, o Secretariado informa que a sua quota se encontra em atraso. A regularização pode ser feita junto do Secretariado. Contamos consigo.', enviadaEm: '2026-07-22', custoEstimado: 4, tipo: 'AVISO_QUOTA' },
  { id: 'ms3', celulaId: CELULA_ID, canais: ['WHATSAPP'], segmento: 'ANIVERSARIANTES', destinatarios: [membros[9].id], assunto: 'Parabéns, camarada!', corpo: 'A Célula n.º 7 deseja-lhe um feliz aniversário e muita saúde para continuar a servir o Partido e a comunidade.', enviadaEm: '2026-08-08', custoEstimado: 1, tipo: 'ANIVERSARIO' },
  { id: 'ms4', celulaId: CELULA_ID, canais: ['WHATSAPP', 'SMS'], segmento: 'TODOS', destinatarios: membros.filter((m) => m.estado === 'EFECTIVO').map((m) => m.id), assunto: 'Eleição do Elemento de Ligação — candidaturas', corpo: 'Camaradas, estão abertas candidaturas ao cargo de Elemento de Ligação até 12 de Agosto. As propostas devem ser entregues ao Secretariado.', enviadaEm: '2026-07-06', custoEstimado: 18, tipo: 'ELEITORAL' },
  { id: 'ms5', celulaId: CELULA_ID, canais: ['SMS'], segmento: 'NAO_RECENSEADOS', destinatarios: [membros[9].id, membros[13].id], assunto: 'Recenseamento eleitoral', corpo: 'Camarada, o recenseamento eleitoral está aberto no posto da Escola Primária. Ser portador de cartão de eleitor actualizado é dever de militância.', enviadaEm: '2026-06-30', custoEstimado: 4, tipo: 'LIVRE' },
  { id: 'ms6', celulaId: CELULA_ID, canais: ['WHATSAPP'], segmento: 'SECRETARIADO', destinatarios: [membros[0].id, membros[1].id, membros[2].id], assunto: 'Sessão do Secretariado — 8 de Agosto', corpo: 'Sessão ordinária do Secretariado sábado às 17:30. Ponto principal: fecho do relatório de contas de Julho.', enviadaEm: '2026-08-05', custoEstimado: 1, tipo: 'CONVOCATORIA' },
];

// ───────────────────────────── Documentos ───────────────────────────────────

function construirDocumentos(): Documento[] {
  const docs: Documento[] = [
    { id: 'dc_est', titulo: 'Estatutos da FRELIMO', categoria: 'NORMATIVO', escopo: 'CENTRAL', versao: '06.02.2023', data: '2023-02-06', paginas: 62, tamanhoKb: 1120, bloqueado: true },
    { id: 'dc_man', titulo: 'Manual da Célula', categoria: 'NORMATIVO', escopo: 'CENTRAL', versao: '14.ª Sessão da Comissão Política', data: '2023-08-23', paginas: 48, tamanhoKb: 860, bloqueado: true },
    { id: 'dc_prog', titulo: 'Programa do Partido — XII Congresso', categoria: 'NORMATIVO', escopo: 'CENTRAL', versao: '2022', data: '2022-09-28', paginas: 74, tamanhoKb: 1340, bloqueado: true },
    { id: 'dc_dir', titulo: 'Directiva Eleitoral — capacidade eleitoral e escrutínio', categoria: 'ELEITORAL', escopo: 'CENTRAL', versao: '2026', data: '2026-03-12', paginas: 18, tamanhoKb: 420, bloqueado: true },
    { id: 'dc_guia', titulo: 'Guia rápido do SGC para Secretários de Célula', categoria: 'OUTRO', escopo: 'CENTRAL', versao: '1.0', data: '2026-06-01', paginas: 12, tamanhoKb: 280, bloqueado: true },
  ];
  reunioes
    .filter((r) => r.acta)
    .slice(0, 8)
    .forEach((r) => {
      docs.push({
        id: `dc_${r.id}`,
        titulo: r.acta!.ficheiro.replace('.pdf', '').replace(/_/g, ' '),
        categoria: 'ACTA',
        escopo: 'CELULA',
        data: r.acta!.anexadaEm,
        paginas: 3,
        tamanhoKb: 180 + Math.floor(rnd() * 120),
      });
    });
  // O relatório do mês anterior fica deliberadamente em falta, para que o
  // sistema demonstre o alerta do ponto 1.9 do Manual da Célula.
  ultimosMeses(HOJE, 7).slice(0, 5).forEach((mes) => {
    docs.push({
      id: `dc_rel_${mes}`,
      titulo: `Relatório Mensal ao Círculo — ${mes}`,
      categoria: 'RELATORIO',
      escopo: 'CELULA',
      data: `${mesSeguinte(mes)}-04`,
      paginas: 4,
      tamanhoKb: 240 + Math.floor(rnd() * 90),
    });
    docs.push({
      id: `dc_cnt_${mes}`,
      titulo: `Relatório de Contas — ${mes}`,
      categoria: 'CONTAS',
      escopo: 'CELULA',
      data: `${mesSeguinte(mes)}-03`,
      paginas: 2,
      tamanhoKb: 120 + Math.floor(rnd() * 60),
    });
  });
  return docs.sort((a, b) => (a.data < b.data ? 1 : -1));
}

// ─────────────────── Consolidação: Círculo e Nacional ───────────────────────

const NOMES_CELULAS = [
  'Eduardo Mondlane', 'Josina Machel', '25 de Setembro', 'Samora Machel', 'Unidade Nacional',
  '7 de Abril', 'Heróis Moçambicanos', '3 de Fevereiro', 'Paz e Democracia', 'Filipe Samuel Magaia',
  '1.º de Maio',
];

/** Secretários das onze Células do Círculo — o Comité do Círculo n.º 12. */
export const SECRETARIOS_CIRCULO = [
  'Teresa Manuel Ubisse', 'Amélia Joaquina Nhantumbo', 'Jorge Alberto Sitoe', 'Bento Alfredo Chiziane',
  'Aurélio Nhamahango', 'Vitória Cumbe Mazive', 'Silvano Jorge Mahumane', 'Filomena Rosa Massingue',
  'Constantino Banze', 'Celeste Amosse Tivane', 'Óscar Damião Nhampossa',
];

function construirCelulasCirculo(): CelulaResumo[] {
  const r = prng(771202);
  return Array.from({ length: 11 }, (_, i) => {
    const numero = i + 1;
    const propria = numero === 7;
    const membrosN = propria ? 14 : 6 + Math.floor(r() * 9);
    const assid = propria ? 78 : Math.round(48 + r() * 48);
    const cot = propria ? 71 : Math.round(38 + r() * 56);
    const reunioesAno = propria ? 8 : 4 + Math.floor(r() * 5);
    const ivo = Math.round((assid * 0.3 + cot * 0.35 + (reunioesAno / 8) * 100 * 0.2 + (60 + r() * 40) * 0.15));
    const alertas: string[] = [];
    if (membrosN < REGRAS.MIN_MEMBROS_CELULA) alertas.push('Abaixo do mínimo de 5 membros (Art. 35 n.º 3)');
    if (membrosN > REGRAS.MAX_MEMBROS_CELULA) alertas.push('Acima do máximo de 15 membros (Art. 35 n.º 3)');
    if (reunioesAno < 6) alertas.push('Cadência mensal das Reuniões Gerais não cumprida');
    if (cot < 50) alertas.push('Cotização abaixo de 50%');
    return {
      id: `cr_${numero}`,
      nome: `Célula n.º ${numero} — ${NOMES_CELULAS[i]}`,
      numero,
      bairro: ['Polana Caniço A', 'Polana Caniço B', 'Maxaquene A', 'Maxaquene D'][i % 4],
      membros: membrosN,
      reunioesAno,
      reunioesMes: r() < 0.75 ? 1 : 0,
      assiduidade: assid,
      cotizacao: cot,
      valorMes: Math.round(membrosN * (140 + r() * 210)),
      ivo: Math.min(99, Math.max(24, ivo)),
      secretario: SECRETARIOS_CIRCULO[i],
      ultimaReuniao: propria ? '2026-07-18' : `2026-0${5 + Math.floor(r() * 3)}-${10 + Math.floor(r() * 18)}`,
      mandatoFim: propria ? '2027-11-20' : `${2027 + Math.floor(r() * 2)}-0${1 + Math.floor(r() * 8)}-15`,
      alertas,
    };
  });
}

const PROVINCIAS: { codigo: string; nome: string; celulasTotais: number; peso: number }[] = [
  { codigo: 'P01', nome: 'Niassa', celulasTotais: 3120, peso: 0.72 },
  { codigo: 'P02', nome: 'Cabo Delgado', celulasTotais: 4180, peso: 0.58 },
  { codigo: 'P03', nome: 'Nampula', celulasTotais: 7640, peso: 0.66 },
  { codigo: 'P04', nome: 'Zambézia', celulasTotais: 6980, peso: 0.63 },
  { codigo: 'P05', nome: 'Tete', celulasTotais: 4310, peso: 0.7 },
  { codigo: 'P06', nome: 'Manica', celulasTotais: 3040, peso: 0.75 },
  { codigo: 'P07', nome: 'Sofala', celulasTotais: 4520, peso: 0.74 },
  { codigo: 'P08', nome: 'Inhambane', celulasTotais: 3860, peso: 0.81 },
  { codigo: 'P09', nome: 'Gaza', celulasTotais: 3410, peso: 0.84 },
  { codigo: 'P10', nome: 'Província de Maputo', celulasTotais: 2980, peso: 0.86 },
  { codigo: 'P11', nome: 'Cidade de Maputo', celulasTotais: 2240, peso: 0.89 },
  { codigo: 'P12', nome: 'Diáspora', celulasTotais: 310, peso: 0.52 },
];

function construirProvincias(): ProvinciaResumo[] {
  const r = prng(9091);
  return PROVINCIAS.map((p) => {
    // Adopção faseada do sistema (Fase 3 — expansão): 3% a 18% das Células.
    const adopcao = 0.03 + p.peso * 0.16 + r() * 0.02;
    const aderentes = Math.max(12, Math.round(p.celulasTotais * adopcao));
    const membros = Math.round(aderentes * (9 + r() * 4));
    const taxa = Math.min(0.98, 0.52 + p.peso * 0.4 + (r() - 0.5) * 0.08);
    const reunioesMes = Math.round(aderentes * taxa);
    const serie12m = Array.from({ length: 12 }, (_, i) => {
      const cresc = 0.62 + (i / 11) * 0.38;
      return Math.round(aderentes * cresc * taxa * (0.9 + r() * 0.2));
    });
    return {
      codigo: p.codigo,
      nome: p.nome,
      celulasAderentes: aderentes,
      celulasTotais: p.celulasTotais,
      membros,
      reunioesMes,
      reunioesEsperadas: aderentes,
      reunioesAno: serie12m.reduce((a, b) => a + b, 0),
      cotizacao: Math.round((0.44 + p.peso * 0.46 + (r() - 0.5) * 0.06) * 100),
      assiduidade: Math.round((0.5 + p.peso * 0.42 + (r() - 0.5) * 0.06) * 100),
      valorMes: Math.round(membros * (150 + r() * 220)),
      eleicoesAbertas: Math.round(aderentes * (0.04 + r() * 0.06)),
      serie12m,
    };
  });
}

// ───────────────────────────────── Estado ───────────────────────────────────

export const VERSAO_SEED = 9;

export function criarEstadoInicial(): Estado {
  return {
    membros,
    celula,
    circulo,
    reunioes,
    quotas,
    movimentos,
    eleicoes,
    mandatos,
    mensagens,
    documentos: construirDocumentos(),
    celulasCirculo: construirCelulasCirculo(),
    provincias: construirProvincias(),
    hoje: HOJE,
    versaoSeed: VERSAO_SEED,
  };
}

export const MANDATO_FIM_ORGAO = addYears('2022-11-20', REGRAS.MANDATO_ANOS);

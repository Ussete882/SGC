/* ===========================================================================
   Camada de cálculo.

   Traduz as regras dos Estatutos e do Manual da Célula em números: quórum,
   maiorias, atrasos de cotização, prazos, assiduidade e o Índice de
   Vitalidade Orgânica. Nenhuma destas funções guarda estado.
   ========================================================================= */

import { CARGOS_ELEITORAIS, REGRAS } from './estatutos';
import { addDays, addMonths, clamp, diffDays, mesDe, ultimosMeses } from './format';
import type {
  Eleicao,
  Estado,
  EstadoPresenca,
  Membro,
  Quota,
  Reuniao,
} from './types';

// ─────────────────────────────── Membros ────────────────────────────────────

export function membrosDaCelula(e: Estado): Membro[] {
  return e.membros.filter((m) => m.estado !== 'CESSADO');
}

export function efectivos(e: Estado): Membro[] {
  return e.membros.filter((m) => m.estado === 'EFECTIVO');
}

export function contagemPorEstado(e: Estado) {
  const c = { CANDIDATO: 0, EFECTIVO: 0, SUSPENSO: 0, CESSADO: 0 };
  e.membros.forEach((m) => { c[m.estado]++; });
  return c;
}

export function membroPorId(e: Estado, id: string): Membro | undefined {
  return e.membros.find((m) => m.id === id);
}

export function nomeDe(e: Estado, id: string): string {
  return membroPorId(e, id)?.nome ?? '—';
}

/** Dias restantes do prazo de 120 dias para deliberar sobre uma candidatura. */
export function prazoCandidatura(m: Membro, hoje: string): { dias: number; limite: string; expirado: boolean } | null {
  if (m.estado !== 'CANDIDATO') return null;
  const limite = addDays(m.dataAdmissao, REGRAS.PRAZO_CANDIDATURA_DIAS);
  const dias = diffDays(limite, hoje);
  return { dias, limite, expirado: dias < 0 };
}

/** Percentagem de campos adicionais da ficha preenchidos (Anexo A.2). */
export function completudeFicha(m: Membro): number {
  const campos = [
    m.dataNascimento, m.sexo, m.bi, m.nuit, m.cartaoEleitor, m.email,
    m.bairro, m.quarteirao, m.profissao, m.rendimento, m.recenseado !== undefined ? 'x' : undefined,
  ];
  const preenchidos = campos.filter((c) => c !== undefined && c !== null && c !== '').length;
  return Math.round((preenchidos / campos.length) * 100);
}

// ────────────────────────────── Assiduidade ─────────────────────────────────

export function reunioesGerais(e: Estado, apenasRealizadas = true): Reuniao[] {
  return e.reunioes
    .filter((r) => (r.tipo === 'REUNIAO_GERAL' || r.tipo === 'REUNIAO_GERAL_EXTRA') && (!apenasRealizadas || r.estado === 'REALIZADA'))
    .sort((a, b) => (a.data < b.data ? 1 : -1));
}

export function reunioesSecretariado(e: Estado): Reuniao[] {
  return e.reunioes.filter((r) => r.tipo === 'SECRETARIADO').sort((a, b) => (a.data < b.data ? 1 : -1));
}

export function actividades(e: Estado): Reuniao[] {
  return e.reunioes
    .filter((r) => ['ESTUDO_POLITICO', 'AUSCULTACAO', 'CULTURAL', 'SOLIDARIEDADE'].includes(r.tipo))
    .sort((a, b) => (a.data < b.data ? 1 : -1));
}

export interface Assiduidade {
  convocado: number;
  presente: number;
  justificado: number;
  injustificado: number;
  taxa: number;
  /** % de faltas injustificadas — base do Art. 27 n.º 6 */
  taxaInjustificada: number;
  risco: 'OK' | 'AVISO' | 'CESSACAO';
}

export function assiduidadeDe(e: Estado, membroId: string, ultimasN = 12): Assiduidade {
  const rs = reunioesGerais(e).slice(0, ultimasN);
  let presente = 0, justificado = 0, injustificado = 0, convocado = 0;
  rs.forEach((r) => {
    const p = r.presencas[membroId] as EstadoPresenca | undefined;
    if (!p) return;
    convocado++;
    if (p === 'PRESENTE') presente++;
    else if (p === 'JUSTIFICADO') justificado++;
    else injustificado++;
  });
  const taxa = convocado ? (presente / convocado) * 100 : 0;
  const taxaInjustificada = convocado ? (injustificado / convocado) * 100 : 0;
  const risco: Assiduidade['risco'] =
    taxaInjustificada >= REGRAS.FALTAS_CESSACAO_PCT * 100
      ? 'CESSACAO'
      : taxaInjustificada >= REGRAS.FALTAS_AVISO_PCT * 100
        ? 'AVISO'
        : 'OK';
  return { convocado, presente, justificado, injustificado, taxa, taxaInjustificada, risco };
}

export function assiduidadeMedia(e: Estado, ultimasN = 6): number {
  const rs = reunioesGerais(e).slice(0, ultimasN);
  if (!rs.length) return 0;
  const taxas = rs.map((r) => {
    const vals = Object.values(r.presencas);
    if (!vals.length) return 0;
    return (vals.filter((v) => v === 'PRESENTE').length / vals.length) * 100;
  });
  return taxas.reduce((a, b) => a + b, 0) / taxas.length;
}

/** Quórum: mais de metade dos membros do órgão (Art. 30 n.º 2). */
export function quorum(presentes: number, universo: number, regra: 'METADE' | 'DOIS_TERCOS' = 'METADE') {
  const exigido = regra === 'DOIS_TERCOS' ? Math.ceil((universo * 2) / 3) : Math.floor(universo / 2) + 1;
  return { exigido, atingido: presentes >= exigido, presentes, universo };
}

// ──────────────────────────────── Cotas ─────────────────────────────────────

export function quotaReferencia(m: Membro): number {
  return Math.max(50, Math.round(((m.rendimento || 10000) * REGRAS.TAXA_QUOTA) / 5) * 5);
}

export function quotasDoMes(e: Estado, mes: string): Quota[] {
  return e.quotas.filter((q) => q.mes === mes);
}

export interface EstadoCotizacao {
  mes: string;
  obrigados: Membro[];
  pagos: Quota[];
  pagouIds: Set<string>;
  emFalta: Membro[];
  total: number;
  retidoCelula: number;
  paraEscalao: number;
  taxa: number;
  esperado: number;
}

export function cotizacaoDoMes(e: Estado, mes: string): EstadoCotizacao {
  const obrigados = e.membros.filter(
    (m) => (m.estado === 'EFECTIVO' || m.estado === 'SUSPENSO') && mesDe(m.dataAdmissao) <= mes,
  );
  const pagos = quotasDoMes(e, mes);
  const pagouIds = new Set(pagos.map((q) => q.membroId));
  const emFalta = obrigados.filter((m) => !pagouIds.has(m.id));
  const total = pagos.reduce((a, q) => a + q.valor, 0);
  const esperado = obrigados.reduce((a, m) => a + quotaReferencia(m), 0);
  return {
    mes,
    obrigados,
    pagos,
    pagouIds,
    emFalta,
    total,
    retidoCelula: total * REGRAS.PERCENT_CELULA,
    paraEscalao: total * REGRAS.PERCENT_ESCALAO,
    taxa: obrigados.length ? ((obrigados.length - emFalta.length) / obrigados.length) * 100 : 0,
    esperado,
  };
}

/**
 * Meses consecutivos sem pagamento, a contar do mês corrente para trás.
 * A contagem nunca recua para antes da entrada em funcionamento do sistema na
 * Célula (primeiro mês com registo de cotização) nem para antes da admissão.
 */
export function mesesEmAtraso(e: Estado, membroId: string, hoje: string): number {
  const m = membroPorId(e, membroId);
  if (!m) return 0;
  const inicioSistema = e.quotas.reduce<string>((min, q) => (q.mes < min ? q.mes : min), mesDe(hoje));
  const meses = ultimosMeses(hoje, 24).reverse();
  let n = 0;
  for (const mes of meses) {
    if (mesDe(m.dataAdmissao) > mes) break;
    if (mes < inicioSistema) break;
    const pagou = e.quotas.some((q) => q.membroId === membroId && q.mes === mes);
    if (pagou) break;
    n++;
  }
  return n;
}

export interface AlertaQuota {
  membro: Membro;
  meses: number;
  divida: number;
  /** Se atingiu os 12 meses do Art. 16 n.º 4 */
  suspensivel: boolean;
  desdeMes: string;
}

export function alertasCotizacao(e: Estado): AlertaQuota[] {
  return e.membros
    .filter((m) => m.estado === 'EFECTIVO' || m.estado === 'SUSPENSO')
    .map((m) => {
      const meses = mesesEmAtraso(e, m.id, e.hoje);
      return {
        membro: m,
        meses,
        divida: meses * quotaReferencia(m),
        suspensivel: meses >= REGRAS.MESES_ATE_SUSPENSAO && m.estado !== 'SUSPENSO',
        desdeMes: addMonths(`${mesDe(e.hoje)}-01`, -(meses - 1)).slice(0, 7),
      };
    })
    .filter((a) => a.meses > 0)
    .sort((a, b) => b.meses - a.meses);
}

export function serieCotizacao(e: Estado, n = 12) {
  return ultimosMeses(e.hoje, n).map((mes) => {
    const c = cotizacaoDoMes(e, mes);
    return {
      mes,
      valor: Math.round(c.total),
      celula: Math.round(c.retidoCelula),
      escalao: Math.round(c.paraEscalao),
      taxa: Math.round(c.taxa),
      esperado: c.esperado,
    };
  });
}

export function saldoCelula(e: Estado): { receitas: number; despesas: number; saldo: number } {
  const quotasRetidas = e.quotas.reduce((a, q) => a + q.valor * REGRAS.PERCENT_CELULA, 0);
  const outrasReceitas = e.movimentos.filter((m) => m.tipo === 'RECEITA').reduce((a, m) => a + m.valor, 0);
  const despesas = e.movimentos.filter((m) => m.tipo === 'DESPESA').reduce((a, m) => a + m.valor, 0);
  const receitas = quotasRetidas + outrasReceitas;
  return { receitas, despesas, saldo: receitas - despesas };
}

// ─────────────────────────────── Reuniões ───────────────────────────────────

export function proximaReuniao(e: Estado, tipo?: Reuniao['tipo']): Reuniao | undefined {
  return e.reunioes
    .filter((r) => r.estado === 'AGENDADA' && r.data >= e.hoje && (!tipo || r.tipo === tipo))
    .sort((a, b) => (a.data > b.data ? 1 : -1))[0];
}

export interface EstadoConvocatoria {
  enviada: boolean;
  diasAteReuniao: number;
  prazoLimite: string;
  conforme: boolean;
  urgente: boolean;
  expirado: boolean;
}

/** Verifica a antecedência mínima de dois dias da convocatória (Manual da Célula). */
export function estadoConvocatoria(r: Reuniao, hoje: string): EstadoConvocatoria {
  const diasAteReuniao = diffDays(r.data, hoje);
  const prazoLimite = addDays(r.data, -REGRAS.ANTECEDENCIA_CONVOCATORIA_DIAS);
  const enviada = !!r.convocatoriaEnviadaEm;
  const conforme = enviada && diffDays(r.data, r.convocatoriaEnviadaEm!) >= REGRAS.ANTECEDENCIA_CONVOCATORIA_DIAS;
  return {
    enviada,
    diasAteReuniao,
    prazoLimite,
    conforme,
    urgente: !enviada && diasAteReuniao >= 0 && diffDays(prazoLimite, hoje) <= 1,
    expirado: !enviada && hoje > prazoLimite,
  };
}

export function reunioesRealizadasNoAno(e: Estado, ano: number): number {
  return e.reunioes.filter((r) => r.estado === 'REALIZADA' && r.data.startsWith(String(ano))).length;
}

/** Cadência: quantas das últimas 12 Reuniões Gerais mensais foram efectivamente realizadas. */
export function cadenciaReuniaoGeral(e: Estado): { realizadas: number; esperadas: number; taxa: number } {
  const meses = ultimosMeses(e.hoje, 12);
  const realizadas = meses.filter((mes) =>
    e.reunioes.some((r) => r.tipo === 'REUNIAO_GERAL' && r.estado === 'REALIZADA' && mesDe(r.data) === mes),
  ).length;
  return { realizadas, esperadas: 12, taxa: (realizadas / 12) * 100 };
}

export function actasPendentes(e: Estado): Reuniao[] {
  return reunioesGerais(e).filter((r) => !r.acta || !r.acta.aprovadaEm);
}

// ──────────────── Índice de Vitalidade Orgânica (IVO) ───────────────────────

export interface Pilar {
  chave: string;
  nome: string;
  valor: number;
  peso: number;
  detalhe: string;
  base: string;
}

export interface IVO {
  total: number;
  pilares: Pilar[];
  classe: 'EXEMPLAR' | 'SOLIDA' | 'ATENCAO' | 'CRITICA';
}

export function calcularIVO(e: Estado): IVO {
  const assid = assiduidadeMedia(e, 6);
  const cot = ultimosMeses(e.hoje, 3).map((m) => cotizacaoDoMes(e, m).taxa);
  const cotMedia = cot.reduce((a, b) => a + b, 0) / (cot.length || 1);
  const cad = cadenciaReuniaoGeral(e);
  const fichas = membrosDaCelula(e).map(completudeFicha);
  const fichaMedia = fichas.reduce((a, b) => a + b, 0) / (fichas.length || 1);
  const actsRecentes = actividades(e).filter(
    (r) => r.estado === 'REALIZADA' && diffDays(e.hoje, r.data) <= 183,
  ).length;
  const vidaOrganica = clamp((actsRecentes / 6) * 100, 0, 100);

  const pilares: Pilar[] = [
    { chave: 'assiduidade', nome: 'Assiduidade', valor: Math.round(assid), peso: 25, detalhe: 'Presenças médias nas últimas 6 Reuniões Gerais', base: 'art12' },
    { chave: 'cotizacao', nome: 'Cotização', valor: Math.round(cotMedia), peso: 30, detalhe: 'Membros em dia nos últimos 3 meses', base: 'manual_quota' },
    { chave: 'cadencia', nome: 'Cadência', valor: Math.round(cad.taxa), peso: 20, detalhe: `${cad.realizadas} de 12 Reuniões Gerais mensais realizadas`, base: 'art35n6' },
    { chave: 'fichas', nome: 'Base de dados', valor: Math.round(fichaMedia), peso: 15, detalhe: 'Completude média das fichas de membro', base: 'manual_bd' },
    { chave: 'vida', nome: 'Vida orgânica', valor: Math.round(vidaOrganica), peso: 10, detalhe: `${actsRecentes} actividades nos últimos 6 meses`, base: 'art36' },
  ];

  const total = Math.round(pilares.reduce((a, p) => a + (p.valor * p.peso) / 100, 0));
  const classe: IVO['classe'] = total >= 85 ? 'EXEMPLAR' : total >= 70 ? 'SOLIDA' : total >= 50 ? 'ATENCAO' : 'CRITICA';
  return { total, pilares, classe };
}

// ───────────────────── Conformidade estatutária ─────────────────────────────

export interface Verificacao {
  chave: string;
  titulo: string;
  estado: 'CONFORME' | 'ATENCAO' | 'DESCONFORME';
  detalhe: string;
  base: string;
  accao?: { rotulo: string; vista: string };
}

export function conformidade(e: Estado): Verificacao[] {
  const out: Verificacao[] = [];
  const activos = membrosDaCelula(e).filter((m) => m.estado !== 'CANDIDATO');

  out.push({
    chave: 'dimensao',
    titulo: 'Dimensão da Célula',
    estado:
      activos.length < REGRAS.MIN_MEMBROS_CELULA || activos.length > REGRAS.MAX_MEMBROS_CELULA
        ? 'DESCONFORME'
        : activos.length === REGRAS.MAX_MEMBROS_CELULA
          ? 'ATENCAO'
          : 'CONFORME',
    detalhe: `${activos.length} membros (mínimo 5, máximo 15)`,
    base: 'art35',
    accao: { rotulo: 'Ver membros', vista: 'membros' },
  });

  const cad = cadenciaReuniaoGeral(e);
  out.push({
    chave: 'cadencia',
    titulo: 'Reunião Geral mensal',
    estado: cad.realizadas >= 11 ? 'CONFORME' : cad.realizadas >= 8 ? 'ATENCAO' : 'DESCONFORME',
    detalhe: `${cad.realizadas} de 12 sessões nos últimos 12 meses`,
    base: 'art35n6',
    accao: { rotulo: 'Ver calendário', vista: 'reunioes' },
  });

  const prox = proximaReuniao(e, 'REUNIAO_GERAL');
  if (prox) {
    const conv = estadoConvocatoria(prox, e.hoje);
    out.push({
      chave: 'convocatoria',
      titulo: 'Convocatória da próxima Reunião Geral',
      estado: conv.enviada ? 'CONFORME' : conv.expirado ? 'DESCONFORME' : 'ATENCAO',
      detalhe: conv.enviada
        ? 'Difundida com a antecedência mínima de dois dias'
        : conv.expirado
          ? 'Prazo de dois dias de antecedência ultrapassado'
          : `Deve ser difundida até ${conv.prazoLimite}`,
      base: 'manual_convocatoria',
      accao: { rotulo: 'Enviar convocatória', vista: 'reunioes' },
    });
  }

  const pend = actasPendentes(e);
  out.push({
    chave: 'actas',
    titulo: 'Actas lidas e aprovadas',
    estado: pend.length === 0 ? 'CONFORME' : pend.length <= 2 ? 'ATENCAO' : 'DESCONFORME',
    detalhe: pend.length === 0 ? 'Todas as Actas aprovadas' : `${pend.length} Acta(s) por aprovar na reunião seguinte`,
    base: 'manual_acta',
    accao: { rotulo: 'Ver actas', vista: 'reunioes' },
  });

  const mesAnterior = ultimosMeses(e.hoje, 2)[0];
  const relatorioEnviado = e.documentos.some((dc) => dc.categoria === 'RELATORIO' && dc.titulo.includes(mesAnterior));
  out.push({
    chave: 'relatorio',
    titulo: 'Relatório mensal ao Círculo',
    estado: relatorioEnviado ? 'CONFORME' : 'DESCONFORME',
    detalhe: relatorioEnviado ? `Relatório de ${mesAnterior} entregue` : `Relatório de ${mesAnterior} por entregar`,
    base: 'manual_relatorio',
    accao: { rotulo: 'Gerar relatório', vista: 'relatorio' },
  });

  const cotAct = cotizacaoDoMes(e, mesDe(e.hoje));
  out.push({
    chave: 'cotizacao',
    titulo: 'Cotização do mês corrente',
    estado: cotAct.taxa >= 80 ? 'CONFORME' : cotAct.taxa >= 50 ? 'ATENCAO' : 'DESCONFORME',
    detalhe: `${Math.round(cotAct.taxa)}% dos membros em dia`,
    base: 'manual_quota',
    accao: { rotulo: 'Registar quota', vista: 'cotas' },
  });

  const vagos = e.mandatos.filter((m) => m.estado === 'VAGO');
  out.push({
    chave: 'orgaos',
    titulo: 'Órgãos da Célula constituídos',
    estado: vagos.length === 0 ? 'CONFORME' : 'ATENCAO',
    detalhe: vagos.length === 0 ? 'Secretariado e Elemento de Ligação em funções' : `${vagos.length} vaga(s) por preencher`,
    base: 'art35n4',
    accao: { rotulo: 'Ver mandatos', vista: 'eleicoes' },
  });

  const naoRecenseados = activos.filter((m) => !m.recenseado).length;
  out.push({
    chave: 'recenseamento',
    titulo: 'Recenseamento eleitoral dos membros',
    estado: naoRecenseados === 0 ? 'CONFORME' : naoRecenseados <= 2 ? 'ATENCAO' : 'DESCONFORME',
    detalhe: naoRecenseados === 0 ? 'Todos os membros com cartão de eleitor' : `${naoRecenseados} membro(s) sem cartão de eleitor`,
    base: 'art12',
    accao: { rotulo: 'Ver membros', vista: 'membros' },
  });

  return out;
}

// ──────────────────────────────── Avisos ────────────────────────────────────

export interface Aviso {
  id: string;
  nivel: 'CRITICO' | 'ALTO' | 'MEDIO' | 'INFO';
  titulo: string;
  texto: string;
  base?: string;
  vista?: string;
}

export function avisos(e: Estado): Aviso[] {
  const out: Aviso[] = [];

  const prox = proximaReuniao(e, 'REUNIAO_GERAL');
  if (prox) {
    const conv = estadoConvocatoria(prox, e.hoje);
    if (!conv.enviada) {
      out.push({
        id: 'av_conv',
        nivel: conv.expirado ? 'CRITICO' : 'ALTO',
        titulo: 'Convocatória por difundir',
        texto: conv.expirado
          ? `A Reunião Geral de ${prox.data} já não cumpre a antecedência mínima de dois dias.`
          : `A convocatória da Reunião Geral de ${prox.data} tem de sair até ${conv.prazoLimite}.`,
        base: 'manual_convocatoria',
        vista: 'reunioes',
      });
    }
  }

  alertasCotizacao(e)
    .filter((a) => a.suspensivel)
    .forEach((a) => {
      out.push({
        id: `av_susp_${a.membro.id}`,
        nivel: 'CRITICO',
        titulo: `Suspensão de direitos: ${a.membro.nome}`,
        texto: `${a.meses} meses sem pagamento de quota, sem motivo justificado. A suspensão por um ano é automática nos termos estatutários, até à regularização.`,
        base: 'art16n4',
        vista: 'cotas',
      });
    });

  e.membros.filter((m) => m.estado === 'CANDIDATO').forEach((m) => {
    const p = prazoCandidatura(m, e.hoje)!;
    if (p.dias <= 45) {
      out.push({
        id: `av_cand_${m.id}`,
        nivel: p.expirado ? 'CRITICO' : p.dias <= 20 ? 'ALTO' : 'MEDIO',
        titulo: p.expirado ? `Prazo esgotado: ${m.nome}` : `Candidatura de ${m.nome}`,
        texto: p.expirado
          ? `O prazo de 120 dias para deliberar sobre a candidatura expirou em ${p.limite}.`
          : `Restam ${p.dias} dias para a Reunião Geral deliberar sobre a candidatura (limite ${p.limite}).`,
        base: 'art8',
        vista: 'membros',
      });
    }
  });

  membrosDaCelula(e).forEach((m) => {
    const a = assiduidadeDe(e, m.id);
    if (a.risco !== 'OK' && a.convocado >= 6) {
      const temMandato = e.mandatos.some((md) => md.membroId === m.id && md.estado === 'ACTIVO');
      out.push({
        id: `av_falta_${m.id}`,
        nivel: a.risco === 'CESSACAO' ? 'CRITICO' : 'MEDIO',
        titulo: `${a.risco === 'CESSACAO' ? 'Cessação de mandato' : 'Faltas injustificadas'}: ${m.nome}`,
        texto: `${a.injustificado} faltas injustificadas em ${a.convocado} sessões (${Math.round(a.taxaInjustificada)}%).${temMandato ? ' Titular de cargo eleito — o mandato pode cessar.' : ''}`,
        base: 'art27n6',
        vista: 'membros',
      });
    }
  });

  const mesAnterior = ultimosMeses(e.hoje, 2)[0];
  if (!e.documentos.some((dc) => dc.categoria === 'RELATORIO' && dc.titulo.includes(mesAnterior))) {
    out.push({
      id: 'av_rel',
      nivel: 'ALTO',
      titulo: 'Relatório mensal por enviar',
      texto: `O relatório de ${mesAnterior} ao Comité de Círculo ainda não foi gerado nem enviado.`,
      base: 'manual_relatorio',
      vista: 'relatorio',
    });
  }

  e.eleicoes.forEach((el) => {
    if (el.fase === 'PROCLAMADA' && el.prazoImpugnacao) {
      const dias = diffDays(el.prazoImpugnacao, e.hoje);
      if (dias >= 0) {
        out.push({
          id: `av_imp_${el.id}`,
          nivel: 'INFO',
          titulo: 'Prazo de impugnação em curso',
          texto: `${el.titulo}: faltam ${dias} dias para o termo do prazo de trinta dias de impugnação.`,
          base: 'art33',
          vista: 'eleicoes',
        });
      }
    }
    if (el.fase === 'CANDIDATURAS') {
      const pendentes = el.candidaturas.filter((c) => !c.aceitou && !c.retirada).length;
      if (pendentes) {
        out.push({
          id: `av_cons_${el.id}`,
          nivel: 'MEDIO',
          titulo: 'Consulta prévia pendente',
          texto: `${pendentes} candidatura(s) aguardam aceitação do camarada proposto.`,
          base: 'art22',
          vista: 'eleicoes',
        });
      }
    }
  });

  e.mandatos.filter((m) => m.estado === 'VAGO').forEach((m) => {
    out.push({
      id: `av_vago_${m.id}`,
      nivel: 'ALTO',
      titulo: 'Vaga em órgão da Célula',
      texto: `${m.orgao} — ${CARGOS_ELEITORAIS[m.cargo]?.titulo ?? m.cargo} vago. ${m.notaCessacao ?? ''}`,
      base: 'art32',
      vista: 'eleicoes',
    });
  });

  const ordem = { CRITICO: 0, ALTO: 1, MEDIO: 2, INFO: 3 };
  return out.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

// ─────────────────────────────── Eleições ───────────────────────────────────

export interface Apuramento {
  volta: 1 | 2;
  validos: number;
  brancos: number;
  nulos: number;
  expressos: number;
  presentes: number;
  efectividade: number;
  /** Maioria absoluta dos membros em efectividade (Art. 25 n.º 4) */
  maioriaExigida: number;
  quorum: { exigido: number; atingido: boolean; presentes: number; universo: number };
  linhas: { candidaturaId: string; membroId: string; votos: number; pctExpressos: number; pctEfectividade: number; eleito: boolean }[];
  eleitosAgora: string[];
  precisaSegundaVolta: boolean;
  candidatosSegundaVolta: string[];
}

export function apurar(el: Eleicao, volta: 1 | 2): Apuramento | null {
  const v = el.voltas.find((x) => x.numero === volta);
  if (!v) return null;
  const regra = CARGOS_ELEITORAIS[el.cargo]?.quorum ?? 'METADE';
  const validos = Object.values(v.votos).reduce((a, b) => a + b, 0);
  const expressos = validos + v.brancos + v.nulos;
  const maioriaExigida = Math.floor(v.efectividade / 2) + 1;

  const linhas = el.candidaturas
    // Na segunda volta concorrem apenas os candidatos admitidos a essa volta.
    .filter((c) => !c.retirada && (volta === 1 || Object.prototype.hasOwnProperty.call(v.votos, c.id)))
    .map((c) => {
      const votos = v.votos[c.id] ?? 0;
      return {
        candidaturaId: c.id,
        membroId: c.membroId,
        votos,
        pctExpressos: expressos ? (votos / expressos) * 100 : 0,
        pctEfectividade: v.efectividade ? (votos / v.efectividade) * 100 : 0,
        eleito: false,
      };
    })
    .sort((a, b) => b.votos - a.votos);

  let eleitosAgora: string[] = [];
  if (volta === 1) {
    // 1.ª volta: maioria absoluta dos membros em efectividade de funções.
    eleitosAgora = linhas.filter((l) => l.votos >= maioriaExigida).slice(0, el.vagas).map((l) => l.candidaturaId);
  } else {
    // 2.ª volta: maior número de votos expressos.
    eleitosAgora = linhas.slice(0, el.vagas).map((l) => l.candidaturaId);
  }
  linhas.forEach((l) => { l.eleito = eleitosAgora.includes(l.candidaturaId); });

  const precisaSegundaVolta = volta === 1 && eleitosAgora.length < el.vagas;
  const restantes = linhas.filter((l) => !eleitosAgora.includes(l.candidaturaId));
  const vagasRestantes = el.vagas - eleitosAgora.length;
  const candidatosSegundaVolta = precisaSegundaVolta
    ? restantes.slice(0, Math.max(2, vagasRestantes + 1)).map((l) => l.candidaturaId)
    : [];

  return {
    volta,
    validos,
    brancos: v.brancos,
    nulos: v.nulos,
    expressos,
    presentes: v.presentes,
    efectividade: v.efectividade,
    maioriaExigida,
    quorum: quorum(v.presentes, v.efectividade, regra),
    linhas,
    eleitosAgora,
    precisaSegundaVolta,
    candidatosSegundaVolta,
  };
}

export function eleicoesAbertas(e: Estado): Eleicao[] {
  return e.eleicoes.filter((el) => !['HOMOLOGADA', 'ANULADA'].includes(el.fase));
}

export function progressoMandato(inicio: string, fim: string, hoje: string): number {
  const total = diffDays(fim, inicio);
  const feito = diffDays(hoje, inicio);
  return clamp((feito / total) * 100, 0, 100);
}

// ──────────────────────── Consolidação nacional ─────────────────────────────

export function totaisNacionais(e: Estado) {
  const p = e.provincias;
  const celulasAderentes = p.reduce((a, x) => a + x.celulasAderentes, 0);
  const celulasTotais = p.reduce((a, x) => a + x.celulasTotais, 0);
  const membros = p.reduce((a, x) => a + x.membros, 0);
  const reunioesMes = p.reduce((a, x) => a + x.reunioesMes, 0);
  const reunioesEsperadas = p.reduce((a, x) => a + x.reunioesEsperadas, 0);
  const reunioesAno = p.reduce((a, x) => a + x.reunioesAno, 0);
  const valorMes = p.reduce((a, x) => a + x.valorMes, 0);
  const eleicoesAbertas = p.reduce((a, x) => a + x.eleicoesAbertas, 0);
  const cotizacao = p.reduce((a, x) => a + x.cotizacao * x.celulasAderentes, 0) / (celulasAderentes || 1);
  const assiduidade = p.reduce((a, x) => a + x.assiduidade * x.celulasAderentes, 0) / (celulasAderentes || 1);
  return {
    celulasAderentes,
    celulasTotais,
    adopcao: (celulasAderentes / celulasTotais) * 100,
    membros,
    reunioesMes,
    reunioesEsperadas,
    reunioesAno,
    taxaRealizacao: (reunioesMes / (reunioesEsperadas || 1)) * 100,
    valorMes,
    retidoCelulas: valorMes * REGRAS.PERCENT_CELULA,
    paraEscaloes: valorMes * REGRAS.PERCENT_ESCALAO,
    eleicoesAbertas,
    cotizacao,
    assiduidade,
  };
}

export function serieNacional(e: Estado) {
  const meses = ultimosMeses(e.hoje, 12);
  return meses.map((mes, i) => ({
    mes,
    reunioes: e.provincias.reduce((a, p) => a + (p.serie12m[i] ?? 0), 0),
    celulas: Math.round(e.provincias.reduce((a, p) => a + p.celulasAderentes, 0) * (0.62 + (i / 11) * 0.38)),
  }));
}

export function totaisCirculo(e: Estado) {
  const cs = e.celulasCirculo;
  const membros = cs.reduce((a, c) => a + c.membros, 0);
  return {
    celulas: cs.length,
    membros,
    reunioesMes: cs.reduce((a, c) => a + c.reunioesMes, 0),
    reunioesAno: cs.reduce((a, c) => a + c.reunioesAno, 0),
    valorMes: cs.reduce((a, c) => a + c.valorMes, 0),
    cotizacao: cs.reduce((a, c) => a + c.cotizacao * c.membros, 0) / (membros || 1),
    assiduidade: cs.reduce((a, c) => a + c.assiduidade * c.membros, 0) / (membros || 1),
    ivo: cs.reduce((a, c) => a + c.ivo, 0) / (cs.length || 1),
    comAlertas: cs.filter((c) => c.alertas.length > 0).length,
  };
}

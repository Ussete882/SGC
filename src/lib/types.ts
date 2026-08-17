/* ===========================================================================
   Modelo de domínio do SGC — desenhado a partir dos Estatutos da FRELIMO
   (6 de Fevereiro de 2023) e do Manual da Célula (23 de Agosto de 2023).
   Protótipo: nenhum destes tipos toca em base de dados — vivem em memória.
   ========================================================================= */

export type EstadoFiliacao = 'CANDIDATO' | 'EFECTIVO' | 'SUSPENSO' | 'CESSADO';

export type CargoCelula = 'SECRETARIO' | 'ASSISTENTE' | 'ELEMENTO_LIGACAO' | 'MEMBRO';

export type Canal = 'WHATSAPP' | 'SMS' | 'EMAIL';

export type Sexo = 'F' | 'M';

export interface Membro {
  id: string;
  /** Nº do cartão de membro (Art. 14 n.º 1 a) */
  cartao: string;
  nome: string;
  telefone: string;
  temWhatsapp: boolean;
  canal: Canal;
  /** Data de admissão ou, para candidatos, data de apresentação da candidatura */
  dataAdmissao: string; // ISO yyyy-mm-dd
  estado: EstadoFiliacao;
  cargo: CargoCelula;
  celulaId: string;

  // ── campos de preenchimento gradual (Anexo A.2) ──
  dataNascimento?: string;
  sexo?: Sexo;
  bi?: string;
  nuit?: string;
  cartaoEleitor?: string;
  validadeCartaoEleitor?: string;
  email?: string;
  bairro?: string;
  quarteirao?: string;
  profissao?: string;
  /** Rendimento mensal declarado — base do cálculo de referência da quota (1%) */
  rendimento?: number;
  recenseado?: boolean;
  notas?: string;

  /** Data em que a filiação foi suspensa (Art. 16 n.º 4) */
  suspensoDesde?: string;
  motivoSuspensao?: string;
  /** Data de cessação (Art. 9) */
  cessadoEm?: string;
  motivoCessacao?: string;
}

// ─────────────────────────────── Estrutura ──────────────────────────────────

export interface Celula {
  id: string;
  numero: number;
  nome: string;
  circuloId: string;
  bairro: string;
  localidade: string;
  distrito: string;
  provincia: string;
  criadaEm: string;
}

export interface Circulo {
  id: string;
  nome: string;
  distrito: string;
  provincia: string;
  /** Nº de células agrupadas no Círculo (Art. 37) */
  totalCelulas: number;
}

// ─────────────────────────────── Reuniões ───────────────────────────────────

export type TipoReuniao =
  | 'REUNIAO_GERAL'
  | 'REUNIAO_GERAL_EXTRA'
  | 'SECRETARIADO'
  | 'ESTUDO_POLITICO'
  | 'AUSCULTACAO'
  | 'CULTURAL'
  | 'SOLIDARIEDADE';

export type EstadoReuniao = 'AGENDADA' | 'REALIZADA' | 'CANCELADA';

export type EstadoPresenca = 'PRESENTE' | 'JUSTIFICADO' | 'INJUSTIFICADO';

export interface PontoAgenda {
  id: string;
  ordem: number;
  titulo: string;
  /** Pontos fixos do Manual da Célula não são removíveis */
  fixo: boolean;
  nota?: string;
}

export interface Decisao {
  id: string;
  texto: string;
  responsavelId: string;
  prazo: string;
  cumprida: boolean;
}

export interface Reuniao {
  id: string;
  celulaId: string;
  tipo: TipoReuniao;
  titulo: string;
  data: string; // ISO yyyy-mm-dd
  hora: string; // HH:mm
  local: string;
  estado: EstadoReuniao;
  agenda: PontoAgenda[];
  /** Quando a convocatória foi difundida — o Manual exige ≥ 2 dias de antecedência */
  convocatoriaEnviadaEm?: string;
  canaisConvocatoria?: Canal[];
  presencas: Record<string, EstadoPresenca>;
  justificacoes?: Record<string, string>;
  /** Duração efectiva; a Reunião Geral não deve exceder 90 minutos */
  duracaoMin?: number;
  dirigidaPor?: string;
  resumo?: string;
  decisoes: Decisao[];
  acta?: {
    ficheiro: string;
    anexadaEm: string;
    aprovadaEm?: string;
    aprovadaNaReuniaoId?: string;
  };
}

// ──────────────────────────── Cotas e finanças ──────────────────────────────

export type Modalidade = 'NUMERARIO' | 'ESPECIE';

export interface Quota {
  id: string;
  celulaId: string;
  membroId: string;
  /** Mês de referência yyyy-mm */
  mes: string;
  valor: number;
  modalidade: Modalidade;
  descricaoEspecie?: string;
  dataRegisto: string;
  registadoPor: string;
}

export interface Movimento {
  id: string;
  celulaId: string;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  comprovativo?: string;
}

// ─────────────────────────────── Eleições ───────────────────────────────────

/** Órgão para o qual se elege — cada um com a sua base legal. */
export type CargoEleitoral =
  | 'SECRETARIO_CELULA'
  | 'ASSISTENTES_CELULA'
  | 'ELEMENTO_LIGACAO'
  | 'DELEGADOS_CONFERENCIA_CIRCULO'
  | 'PRIMEIRO_SECRETARIO_CIRCULO'
  | 'SECRETARIADO_CIRCULO'
  | 'COMITE_CIRCULO'
  | 'PRESIDIUM_CONFERENCIA'
  | 'COMITE_VERIFICACAO';

export type MetodoVotacao =
  | 'SECRETO'
  | 'ABERTO_CARTAO_MEMBRO'
  | 'ABERTO_CARTAO_VOTO'
  | 'ABERTO_BRACO_LEVANTADO';

export type FaseEleicao =
  | 'CONVOCADA'
  | 'CADERNO'
  | 'CANDIDATURAS'
  | 'ESCRUTINIO'
  | 'SEGUNDA_VOLTA'
  | 'PROCLAMADA'
  | 'HOMOLOGADA'
  | 'ANULADA';

export interface LinhaCaderno {
  membroId: string;
  /** Capacidade eleitoral activa — pode votar (Art. 28) */
  activa: boolean;
  /** Capacidade eleitoral passiva — pode ser eleito (Art. 28) */
  passiva: boolean;
  impedimentos: { motivo: string; base: string }[];
}

export interface Candidatura {
  id: string;
  membroId: string;
  propostoPorId: string;
  /** Voluntariedade e consulta prévia (Art. 22) */
  aceitou: boolean;
  /** Já exerce o cargo — serve o princípio de continuidade/renovação (Art. 29) */
  incumbente: boolean;
  nota?: string;
  retirada?: boolean;
}

export interface Volta {
  numero: 1 | 2;
  /** votos por candidatura */
  votos: Record<string, number>;
  brancos: number;
  nulos: number;
  /** presentes ao acto eleitoral */
  presentes: number;
  /** membros em efectividade de funções do órgão competente (Art. 25 n.º 4) */
  efectividade: number;
  fechadaEm?: string;
}

export interface Eleito {
  membroId: string;
  votos: number;
  /** Ordem de eleição — determina a chamada de suplentes (Art. 32 n.º 1) */
  ordem: number;
  suplente: boolean;
}

export interface Eleicao {
  id: string;
  escopo: 'CELULA' | 'CIRCULO' | 'CONFERENCIA';
  celulaId?: string;
  circuloId?: string;
  cargo: CargoEleitoral;
  titulo: string;
  vagas: number;
  metodo: MetodoVotacao;
  fase: FaseEleicao;
  convocadaEm: string;
  dataEscrutinio: string;
  caderno: LinhaCaderno[];
  candidaturas: Candidatura[];
  voltas: Volta[];
  eleitos: Eleito[];
  proclamadaEm?: string;
  /** Prazo de trinta dias para impugnação (Art. 33 n.º 1) */
  prazoImpugnacao?: string;
  mandato?: { inicio: string; fim: string };
  acta?: string;
  observacoes?: string;
}

export interface Mandato {
  id: string;
  membroId: string;
  cargo: CargoEleitoral;
  orgao: string;
  inicio: string;
  fim: string;
  eleicaoId?: string;
  estado: 'ACTIVO' | 'CESSADO' | 'RENUNCIA' | 'SUSPENSO' | 'VAGO';
  notaCessacao?: string;
}

// ────────────────────────────── Comunicação ─────────────────────────────────

export type Segmento =
  | 'TODOS'
  | 'EM_ATRASO'
  | 'AUSENTES_ULTIMA'
  | 'CANDIDATOS'
  | 'ANIVERSARIANTES'
  | 'SECRETARIADO'
  | 'NAO_RECENSEADOS'
  | 'INDIVIDUAL';

export interface Mensagem {
  id: string;
  celulaId: string;
  canais: Canal[];
  segmento: Segmento;
  destinatarios: string[];
  assunto: string;
  corpo: string;
  enviadaEm: string;
  custoEstimado: number;
  tipo: 'CONVOCATORIA' | 'AVISO_QUOTA' | 'ANIVERSARIO' | 'ELEITORAL' | 'LIVRE';
}

// ────────────────────────────── Documentos ──────────────────────────────────

export interface Documento {
  id: string;
  titulo: string;
  categoria: 'ACTA' | 'RELATORIO' | 'CONTAS' | 'NORMATIVO' | 'ELEITORAL' | 'OUTRO';
  escopo: 'CELULA' | 'CIRCULO' | 'CENTRAL';
  versao?: string;
  data: string;
  paginas: number;
  tamanhoKb: number;
  bloqueado?: boolean;
}

// ────────────────────── Consolidação de escalão superior ────────────────────

export interface CelulaResumo {
  id: string;
  nome: string;
  numero: number;
  bairro: string;
  membros: number;
  reunioesAno: number;
  reunioesMes: number;
  assiduidade: number;
  cotizacao: number; // % de membros em dia
  valorMes: number;
  ivo: number;
  secretario: string;
  ultimaReuniao: string;
  mandatoFim: string;
  alertas: string[];
}

export interface ProvinciaResumo {
  codigo: string;
  nome: string;
  celulasAderentes: number;
  celulasTotais: number;
  membros: number;
  reunioesMes: number;
  reunioesEsperadas: number;
  reunioesAno: number;
  cotizacao: number;
  assiduidade: number;
  valorMes: number;
  eleicoesAbertas: number;
  serie12m: number[];
}

// ─────────────────────────────── Aplicação ──────────────────────────────────

export type Lente = 'CELULA' | 'CIRCULO' | 'NACIONAL' | 'MEMBRO';

export interface Perfil {
  lente: Lente;
  nome: string;
  cargo: string;
  orgao: string;
  membroId?: string;
}

export interface Estado {
  membros: Membro[];
  celula: Celula;
  circulo: Circulo;
  reunioes: Reuniao[];
  quotas: Quota[];
  movimentos: Movimento[];
  eleicoes: Eleicao[];
  mandatos: Mandato[];
  mensagens: Mensagem[];
  documentos: Documento[];
  celulasCirculo: CelulaResumo[];
  provincias: ProvinciaResumo[];
  /** Data de referência do protótipo (congelada para o cenário fazer sentido) */
  hoje: string;
  versaoSeed: number;
}

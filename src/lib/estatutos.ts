/* ===========================================================================
   Base normativa do sistema.

   Cada regra que o SGC aplica está aqui declarada com a respectiva fonte.
   O objectivo é que a aplicação se explique a si mesma: sempre que o sistema
   bloqueia, avisa ou calcula algo, mostra o artigo em que se apoia.
   ========================================================================= */

export interface Norma {
  id: string;
  ref: string;
  fonte: 'ESTATUTOS' | 'MANUAL';
  epigrafe: string;
  texto: string;
}

export const NORMAS: Record<string, Norma> = {
  art7: {
    id: 'art7',
    ref: 'Art. 7',
    fonte: 'ESTATUTOS',
    epigrafe: 'Filiação',
    texto:
      'Pode ser membro da FRELIMO todo o moçambicano, maior de 18 anos de idade que, no pleno gozo de direitos civis e políticos, aceite os Estatutos e o Programa do Partido.',
  },
  art8: {
    id: 'art8',
    ref: 'Art. 8 n.º 3',
    fonte: 'ESTATUTOS',
    epigrafe: 'Procedimentos de Admissão',
    texto:
      'A admissão de membro é decidida no prazo máximo de cento e vinte dias, a contar da data de apresentação do pedido de candidatura na Reunião Geral da Célula.',
  },
  art8n4: {
    id: 'art8n4',
    ref: 'Art. 8 n.º 4',
    fonte: 'ESTATUTOS',
    epigrafe: 'Data de ingresso',
    texto:
      'A data de ingresso no Partido é a data da admissão pela Reunião Geral da Célula onde o militante apresentou a sua candidatura.',
  },
  art9: {
    id: 'art9',
    ref: 'Art. 9',
    fonte: 'ESTATUTOS',
    epigrafe: 'Cessação da Qualidade de Membro',
    texto:
      'O membro cessa a sua filiação por morte, renúncia, expulsão, filiação em outro partido político, candidatura por outro partido, ou outras causas impeditivas decorrentes dos Estatutos.',
  },
  art12: {
    id: 'art12',
    ref: 'Art. 12 n.º 2',
    fonte: 'ESTATUTOS',
    epigrafe: 'Deveres de militância',
    texto:
      'São deveres de militância, entre outros: militar numa célula; pagar regularmente as quotas; ser portador de cartão de eleitor actualizado; participar nas reuniões da Célula em que milita.',
  },
  art14: {
    id: 'art14',
    ref: 'Art. 14 n.º 1 b)',
    fonte: 'ESTATUTOS',
    epigrafe: 'Direitos',
    texto:
      'É direito do membro eleger e ser eleito para os órgãos do Partido, ou outros em que o Partido deva estar representado, nos termos dos regulamentos e directivas.',
  },
  art14d: {
    id: 'art14d',
    ref: 'Art. 14 n.º 1 d)',
    fonte: 'ESTATUTOS',
    epigrafe: 'Propositura de candidatos',
    texto:
      'É direito do membro apresentar propostas de candidatos para os órgãos do Partido ou outros em que o Partido concorra, nos termos da respectiva Directiva.',
  },
  art16n4: {
    id: 'art16n4',
    ref: 'Art. 16 n.º 4',
    fonte: 'ESTATUTOS',
    epigrafe: 'Suspensão por falta de pagamento',
    texto:
      'Os membros que deixem de pagar as quotas, sem motivo justificado, têm os seus direitos suspensos por um ano, até à regularização.',
  },
  art21: {
    id: 'art21',
    ref: 'Art. 21 n.º 1 a)',
    fonte: 'ESTATUTOS',
    epigrafe: 'Métodos de Trabalho',
    texto:
      'Todos os órgãos do Partido e os seus dirigentes são eleitos democraticamente por voto secreto, periódico e pessoal.',
  },
  art21b: {
    id: 'art21b',
    ref: 'Art. 21 n.º 1 b)',
    fonte: 'ESTATUTOS',
    epigrafe: 'Prestação de contas',
    texto:
      'Os órgãos e os dirigentes do Partido prestam periodicamente contas do seu trabalho às instâncias que os elegeram.',
  },
  art22: {
    id: 'art22',
    ref: 'Art. 22',
    fonte: 'ESTATUTOS',
    epigrafe: 'Voluntariedade e Consulta Prévia',
    texto:
      'A voluntariedade e a consulta prévia constituem aspectos essenciais a observar na eleição e designação de membros do Partido para missões ou funções.',
  },
  art24: {
    id: 'art24',
    ref: 'Art. 24',
    fonte: 'ESTATUTOS',
    epigrafe: 'Formas de Decisões',
    texto:
      'As decisões do Partido são tomadas por consenso ou por voto. O voto pode ser secreto ou aberto; o voto aberto é expresso por cartão de membro, cartão de voto ou braço levantado.',
  },
  art25: {
    id: 'art25',
    ref: 'Art. 25 n.º 3',
    fonte: 'ESTATUTOS',
    epigrafe: 'Sistema Eleitoral',
    texto:
      'A eleição para os órgãos partidários obedece ao sistema maioritário, nos termos da directiva sobre eleições.',
  },
  art25n4: {
    id: 'art25n4',
    ref: 'Art. 25 n.º 4',
    fonte: 'ESTATUTOS',
    epigrafe: 'Maioria exigida',
    texto:
      'São eleitos, à primeira volta, os candidatos que obtiverem a maioria absoluta dos votos dos membros em efectividade de funções do órgão competente para a eleição e, à segunda volta, o que obtiver maior número de votos expressos.',
  },
  art25n2: {
    id: 'art25n2',
    ref: 'Art. 25 n.º 2',
    fonte: 'ESTATUTOS',
    epigrafe: 'Garantias do processo',
    texto:
      'As eleições são organizadas na base de directiva que estabelece as condições de liberdade de campanha, de imparcialidade no tratamento dos candidatos, de transparência do escrutínio e de justiça nos resultados.',
  },
  art26: {
    id: 'art26',
    ref: 'Art. 26 n.º 1',
    fonte: 'ESTATUTOS',
    epigrafe: 'Mandato dos Órgãos',
    texto: 'Os órgãos do Partido são eleitos por um mandato de cinco anos.',
  },
  art27n6: {
    id: 'art27n6',
    ref: 'Art. 27 n.º 6',
    fonte: 'ESTATUTOS',
    epigrafe: 'Cessação do mandato por faltas',
    texto:
      'Cessa, nos termos do regulamento, o mandato dos membros de órgãos que faltem, sem justificação, consecutiva ou interpoladamente, a vinte e cinco por cento, ou cinquenta por cento das reuniões do órgão, respectivamente.',
  },
  art28: {
    id: 'art28',
    ref: 'Art. 28',
    fonte: 'ESTATUTOS',
    epigrafe: 'Capacidade Eleitoral',
    texto:
      'A capacidade eleitoral passiva e activa para os diversos órgãos são estabelecidas em directiva eleitoral aprovada pelo Comité Central.',
  },
  art29: {
    id: 'art29',
    ref: 'Art. 29 n.º 1',
    fonte: 'ESTATUTOS',
    epigrafe: 'Continuidade e Renovação',
    texto:
      'A constituição dos órgãos do Partido rege-se pelos princípios de continuidade e de renovação qualitativa e quantitativa, nos termos a definir em directiva eleitoral.',
  },
  art30: {
    id: 'art30',
    ref: 'Art. 30 n.º 2',
    fonte: 'ESTATUTOS',
    epigrafe: 'Quórum',
    texto:
      'Os demais órgãos do Partido apenas podem deliberar estando presentes mais de metade dos seus membros.',
  },
  art30n1: {
    id: 'art30n1',
    ref: 'Art. 30 n.º 1',
    fonte: 'ESTATUTOS',
    epigrafe: 'Quórum dos Comités',
    texto:
      'O Congresso, o Comité Central, as Conferências e os Comités só podem reunir e deliberar validamente achando-se presentes, pelo menos, dois terços dos seus membros.',
  },
  art31: {
    id: 'art31',
    ref: 'Art. 31',
    fonte: 'ESTATUTOS',
    epigrafe: 'Participação de Convidados',
    texto:
      'Sempre que tal se afigure conveniente, podem ser convidados membros do Partido a participar nas reuniões dos órgãos, sem direito a voto.',
  },
  art32: {
    id: 'art32',
    ref: 'Art. 32 n.º 1',
    fonte: 'ESTATUTOS',
    epigrafe: 'Preenchimento de Vagas',
    texto:
      'Em caso de vacatura nos Comités, por morte, impedimento, ausência prolongada, suspensão ou renúncia, será designado, pela ordem de eleição, um suplente para preencher a vaga.',
  },
  art32n3: {
    id: 'art32n3',
    ref: 'Art. 32 n.º 3',
    fonte: 'ESTATUTOS',
    epigrafe: 'Designações acima de 50%',
    texto:
      'No caso de as designações respeitarem a um número de vagas igual ou superior a cinquenta por cento, serão realizadas eleições na sessão seguinte.',
  },
  art33: {
    id: 'art33',
    ref: 'Art. 33 n.º 1',
    fonte: 'ESTATUTOS',
    epigrafe: 'Impugnações',
    texto:
      'A impugnação de actos praticados por órgãos do Partido deve ser efectuada junto do Comité de Verificação competente, no prazo de trinta dias a contar da notificação ou da prática do acto impugnado.',
  },
  art35: {
    id: 'art35',
    ref: 'Art. 35 n.º 3',
    fonte: 'ESTATUTOS',
    epigrafe: 'Dimensão da Célula',
    texto: 'A Célula é constituída por um mínimo de cinco e um máximo de quinze membros.',
  },
  art35n4: {
    id: 'art35n4',
    ref: 'Art. 35 n.º 4',
    fonte: 'ESTATUTOS',
    epigrafe: 'Órgãos da Célula',
    texto: 'São órgãos da Célula: a Reunião Geral da Célula; o Secretariado; Elementos de Ligação.',
  },
  art35n6: {
    id: 'art35n6',
    ref: 'Art. 35 n.º 6',
    fonte: 'ESTATUTOS',
    epigrafe: 'Periodicidade',
    texto: 'A Reunião Geral da Célula, sem prejuízo de sessões extraordinárias, é mensal.',
  },
  art35n7: {
    id: 'art35n7',
    ref: 'Art. 35 n.º 7',
    fonte: 'ESTATUTOS',
    epigrafe: 'Competências da Reunião Geral',
    texto:
      'Compete à Reunião Geral da Célula: eleger o Secretário da Célula e seus assistentes; aprovar o Programa Anual e o Relatório de Actividades; eleger delegados à Conferência do Círculo; analisar e deliberar sobre as candidaturas a membros do Partido.',
  },
  art35n9: {
    id: 'art35n9',
    ref: 'Art. 35 n.º 9',
    fonte: 'ESTATUTOS',
    epigrafe: 'Reuniões do Secretariado',
    texto:
      'O Secretariado da Célula reúne-se ordinariamente de quinze em quinze dias e extraordinariamente sempre que for necessário.',
  },
  art36: {
    id: 'art36',
    ref: 'Art. 36 n.º 3',
    fonte: 'ESTATUTOS',
    epigrafe: 'Atribuições da Célula',
    texto:
      'As Células visam, em especial: admitir novos membros; promover a educação política e cívica; organizar debates; dinamizar actividades culturais; garantir a participação dos seus membros em processos eleitorais; efectuar estudo político; cobrar quotas aos seus membros.',
  },
  art36n1: {
    id: 'art36n1',
    ref: 'Art. 36 n.º 1',
    fonte: 'ESTATUTOS',
    epigrafe: 'Auscultação',
    texto:
      'As células devem realizar reuniões com simpatizantes e outros membros da comunidade para auscultação sobre questões de interesse local e nacional.',
  },
  art37: {
    id: 'art37',
    ref: 'Art. 37',
    fonte: 'ESTATUTOS',
    epigrafe: 'Círculos do Partido',
    texto:
      'As Células do Partido são agrupadas em Círculos. Os Círculos dependem directamente dos órgãos do Partido de Localidade.',
  },
  art38: {
    id: 'art38',
    ref: 'Art. 38',
    fonte: 'ESTATUTOS',
    epigrafe: 'Órgãos do Círculo',
    texto:
      'A nível do Círculo funcionam: a Conferência do Círculo; o Comité do Círculo; o Secretariado do Comité do Círculo; Elementos de Ligação.',
  },
  art39: {
    id: 'art39',
    ref: 'Art. 39 a)',
    fonte: 'ESTATUTOS',
    epigrafe: 'Atribuições do Círculo',
    texto:
      'Compete ao Comité do Círculo eleger, de entre os seus membros, o Primeiro Secretário e os membros do respectivo Secretariado.',
  },
  art39f: {
    id: 'art39f',
    ref: 'Art. 39 f) g)',
    fonte: 'ESTATUTOS',
    epigrafe: 'Velar pelas Células',
    texto:
      'Compete ao Comité do Círculo velar pelo funcionamento das Células que lhe são subordinadas e apoiar e dinamizar a sua acção.',
  },
  art47: {
    id: 'art47',
    ref: 'Art. 47 n.º 2 d) e)',
    fonte: 'ESTATUTOS',
    epigrafe: 'Competências das Conferências',
    texto:
      'Compete às Conferências eleger, dentre os delegados, o Presidium da Conferência, constituído por três a nove membros, sendo um presidente e dois secretários, e eleger o Comité do Partido do respectivo escalão.',
  },
  art50: {
    id: 'art50',
    ref: 'Art. 50 n.º 1',
    fonte: 'ESTATUTOS',
    epigrafe: 'Periodicidade das Conferências',
    texto:
      'As Conferências reúnem, ordinariamente, de cinco em cinco anos, antecedendo os congressos do Partido.',
  },
  art51: {
    id: 'art51',
    ref: 'Art. 51 a) b)',
    fonte: 'ESTATUTOS',
    epigrafe: 'Competências dos Comités',
    texto:
      'Compete aos Comités eleger o Primeiro Secretário e os membros do Secretariado, e eleger o Secretário e os demais membros do Comité de Verificação.',
  },

  // ───────────────────────── Manual da Célula ─────────────────────────
  manual_convocatoria: {
    id: 'manual_convocatoria',
    ref: 'Manual da Célula',
    fonte: 'MANUAL',
    epigrafe: 'Convocatória',
    texto:
      'A agenda deve ser comunicada aos membros com, no mínimo, dois dias de antecedência, indicando data, hora e local.',
  },
  manual_duracao: {
    id: 'manual_duracao',
    ref: 'Manual da Célula',
    fonte: 'MANUAL',
    epigrafe: 'Duração da Reunião Geral',
    texto: 'A Reunião Geral da Célula não deve exceder 1 hora e 30 minutos.',
  },
  manual_acta: {
    id: 'manual_acta',
    ref: 'Manual da Célula',
    fonte: 'MANUAL',
    epigrafe: 'Acta',
    texto:
      'Cada reunião é registada em Acta, lida e aprovada na reunião seguinte, com registo de presenças, ausências justificadas e não justificadas.',
  },
  manual_6040: {
    id: 'manual_6040',
    ref: 'Manual da Célula, 1.8.3',
    fonte: 'MANUAL',
    epigrafe: 'Repartição da cotização',
    texto:
      '60% do valor cobrado fica retido na Célula para despesas de funcionamento, sendo o remanescente encaminhado ao escalão superior.',
  },
  manual_quota: {
    id: 'manual_quota',
    ref: 'Manual da Célula',
    fonte: 'MANUAL',
    epigrafe: 'Valor da quota',
    texto:
      'As quotas constituem a principal fonte de receita do Partido, fixadas em 1% do rendimento do membro, podendo ser pagas em espécie.',
  },
  manual_relatorio: {
    id: 'manual_relatorio',
    ref: 'Manual da Célula, 1.9',
    fonte: 'MANUAL',
    epigrafe: 'Relatório mensal',
    texto:
      'O Secretariado envia mensalmente ao Comité de Círculo um relatório, com o máximo de cinco páginas, contendo a situação política, as actividades realizadas, o estado da cotização e o relatório de contas.',
  },
  manual_bd: {
    id: 'manual_bd',
    ref: 'Manual da Célula, 1.6',
    fonte: 'MANUAL',
    epigrafe: 'Base de dados de membros',
    texto:
      'Compete ao Secretariado proceder à actualização regular da Base de Dados dos membros da FRELIMO na Célula, preenchendo cuidadosamente as respectivas fichas.',
  },
  manual_agenda: {
    id: 'manual_agenda',
    ref: 'Manual da Célula, Anexo B',
    fonte: 'MANUAL',
    epigrafe: 'Agenda-tipo',
    texto:
      'Agenda-tipo da Reunião Geral: saúde dos quadros e aniversariantes do mês; apresentação e aprovação da Acta anterior; verificação do cumprimento das decisões; ponto específico do momento; diversos.',
  },
};

/** Pontos fixos da agenda-tipo da Reunião Geral (Manual da Célula, Anexo B). */
export const AGENDA_TIPO: { titulo: string; fixo: boolean }[] = [
  { titulo: 'Saúde dos quadros e celebração dos aniversariantes do mês', fixo: true },
  { titulo: 'Apresentação da Acta da reunião anterior, debate e aprovação', fixo: true },
  { titulo: 'Verificação do grau de cumprimento das decisões da reunião anterior', fixo: true },
  { titulo: 'Ponto específico do momento', fixo: true },
  { titulo: 'Diversos', fixo: true },
];

export const AGENDA_SECRETARIADO: { titulo: string; fixo: boolean }[] = [
  { titulo: 'Balanço da cobrança de quotas do período', fixo: true },
  { titulo: 'Preparação da próxima Reunião Geral da Célula', fixo: true },
  { titulo: 'Actualização da Base de Dados dos membros', fixo: true },
  { titulo: 'Diversos', fixo: false },
];

/** Regras numéricas que o sistema aplica, com a norma de origem. */
export const REGRAS = {
  MIN_MEMBROS_CELULA: 5,
  MAX_MEMBROS_CELULA: 15,
  PRAZO_CANDIDATURA_DIAS: 120,
  ANTECEDENCIA_CONVOCATORIA_DIAS: 2,
  DURACAO_MAX_REUNIAO_GERAL_MIN: 90,
  CADENCIA_SECRETARIADO_DIAS: 15,
  PERCENT_CELULA: 0.6,
  PERCENT_ESCALAO: 0.4,
  TAXA_QUOTA: 0.01,
  MESES_ATE_SUSPENSAO: 12,
  MANDATO_ANOS: 5,
  PRAZO_IMPUGNACAO_DIAS: 30,
  IDADE_MINIMA: 18,
  FALTAS_AVISO_PCT: 0.25,
  FALTAS_CESSACAO_PCT: 0.5,
  PRESIDIUM_MIN: 3,
  PRESIDIUM_MAX: 9,
} as const;

/** Metadados por cargo eleitoral: quem elege, base legal e mandato. */
export const CARGOS_ELEITORAIS: Record<
  string,
  {
    titulo: string;
    orgaoEleitor: string;
    escopo: 'CELULA' | 'CIRCULO' | 'CONFERENCIA';
    base: string[];
    vagasSugeridas: number;
    quorum: 'METADE' | 'DOIS_TERCOS';
    /** Se a capacidade passiva se restringe aos membros do próprio órgão eleitor */
    deEntreOsSeusMembros: boolean;
    descricao: string;
  }
> = {
  SECRETARIO_CELULA: {
    titulo: 'Secretário da Célula',
    orgaoEleitor: 'Reunião Geral da Célula',
    escopo: 'CELULA',
    base: ['art35n7', 'art21', 'art25n4'],
    vagasSugeridas: 1,
    quorum: 'METADE',
    deEntreOsSeusMembros: true,
    descricao:
      'Dirige a Célula e o Secretariado. Eleito por voto secreto, periódico e pessoal pela Reunião Geral.',
  },
  ASSISTENTES_CELULA: {
    titulo: 'Assistentes do Secretariado',
    orgaoEleitor: 'Reunião Geral da Célula',
    escopo: 'CELULA',
    base: ['art35n7', 'art35n4'],
    vagasSugeridas: 2,
    quorum: 'METADE',
    deEntreOsSeusMembros: true,
    descricao:
      'Apoiam o Secretário. O número de assistentes acompanha a dimensão e importância do local da Célula.',
  },
  ELEMENTO_LIGACAO: {
    titulo: 'Elemento de Ligação',
    orgaoEleitor: 'Reunião Geral da Célula',
    escopo: 'CELULA',
    base: ['art35n4', 'art21'],
    vagasSugeridas: 1,
    quorum: 'METADE',
    deEntreOsSeusMembros: true,
    descricao:
      'Órgão da Célula com funções de ligação e fiscalização, definidas por Regulamento dos Estatutos.',
  },
  DELEGADOS_CONFERENCIA_CIRCULO: {
    titulo: 'Delegados à Conferência do Círculo',
    orgaoEleitor: 'Reunião Geral da Célula',
    escopo: 'CELULA',
    base: ['art35n7', 'art47', 'art50'],
    vagasSugeridas: 3,
    quorum: 'METADE',
    deEntreOsSeusMembros: true,
    descricao:
      'Representam a Célula na Conferência do Círculo, que reúne ordinariamente de cinco em cinco anos.',
  },
  PRIMEIRO_SECRETARIO_CIRCULO: {
    titulo: 'Primeiro Secretário do Comité do Círculo',
    orgaoEleitor: 'Comité do Círculo',
    escopo: 'CIRCULO',
    base: ['art39', 'art51', 'art30n1'],
    vagasSugeridas: 1,
    quorum: 'DOIS_TERCOS',
    deEntreOsSeusMembros: true,
    descricao:
      'Eleito pelo Comité do Círculo de entre os seus membros. Integra por inerência o Presidium da Conferência.',
  },
  SECRETARIADO_CIRCULO: {
    titulo: 'Secretariado do Comité do Círculo',
    orgaoEleitor: 'Comité do Círculo',
    escopo: 'CIRCULO',
    base: ['art39', 'art51'],
    vagasSugeridas: 4,
    quorum: 'DOIS_TERCOS',
    deEntreOsSeusMembros: true,
    descricao: 'Órgão executivo do Círculo, eleito de entre os membros do Comité.',
  },
  COMITE_CIRCULO: {
    titulo: 'Comité do Círculo',
    orgaoEleitor: 'Conferência do Círculo',
    escopo: 'CONFERENCIA',
    base: ['art47', 'art30n1', 'art29'],
    vagasSugeridas: 15,
    quorum: 'DOIS_TERCOS',
    deEntreOsSeusMembros: false,
    descricao:
      'Eleito pela Conferência do Círculo. A ordem de eleição fixa a lista de suplentes para vacaturas.',
  },
  PRESIDIUM_CONFERENCIA: {
    titulo: 'Presidium da Conferência',
    orgaoEleitor: 'Conferência do Círculo',
    escopo: 'CONFERENCIA',
    base: ['art47'],
    vagasSugeridas: 5,
    quorum: 'DOIS_TERCOS',
    deEntreOsSeusMembros: false,
    descricao:
      'Três a nove membros eleitos dentre os delegados, sendo um presidente e dois secretários. Dirige a Conferência.',
  },
  COMITE_VERIFICACAO: {
    titulo: 'Comité de Verificação',
    orgaoEleitor: 'Comité do Círculo',
    escopo: 'CIRCULO',
    base: ['art51', 'art33'],
    vagasSugeridas: 3,
    quorum: 'DOIS_TERCOS',
    deEntreOsSeusMembros: false,
    descricao:
      'Fiscaliza a conformidade estatutária dos actos do escalão e aprecia as impugnações apresentadas no prazo de 30 dias.',
  },
};

export const METODOS_VOTACAO: Record<string, { titulo: string; nota: string; secreto: boolean }> = {
  SECRETO: {
    titulo: 'Escrutínio secreto',
    nota: 'Regra geral para a eleição de órgãos e dirigentes (Art. 21 n.º 1 a).',
    secreto: true,
  },
  ABERTO_CARTAO_MEMBRO: {
    titulo: 'Voto aberto — cartão de membro',
    nota: 'Admitido pelo Art. 24 n.º 3 para decisões que não exijam escrutínio secreto.',
    secreto: false,
  },
  ABERTO_CARTAO_VOTO: {
    titulo: 'Voto aberto — cartão de voto',
    nota: 'Admitido pelo Art. 24 n.º 3.',
    secreto: false,
  },
  ABERTO_BRACO_LEVANTADO: {
    titulo: 'Voto aberto — braço levantado',
    nota: 'Admitido pelo Art. 24 n.º 3; adequado a deliberações simples.',
    secreto: false,
  },
};

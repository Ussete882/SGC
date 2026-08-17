import React, { useMemo } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useStore } from '../lib/store';
import {
  alertasCotizacao, assiduidadeDe, assiduidadeMedia, avisos as calcAvisos, cadenciaReuniaoGeral,
  calcularIVO, conformidade, contagemPorEstado, cotizacaoDoMes, estadoConvocatoria, membrosDaCelula,
  prazoCandidatura, proximaReuniao, quotaReferencia, reunioesGerais, saldoCelula, serieCotizacao,
} from '../lib/selectors';
import { compacto, dataCurta, dataLonga, mesDe, mt, nomeMes, nomeMesCurto, nomeCurto, num, primeiroNome, relativo } from '../lib/format';
import { Alerta, Anel, Avatar, Barra, Btn, Card, Contador, Emblema, FaixaBandeira, Lei, Pill, Stat } from '../ui/primitives';
import {
  IcAviso, IcCalendario, IcCheck, IcEscudo, IcLocal, IcMegafone, IcMembros, IcMoeda, IcRelogio,
  IcRelatorio, IcSeta, IcUrna,
} from '../ui/icons';

const CORES_IVO = ['#E61923', '#00A34F', '#F5D400', '#3B82F6', '#8B5CF6'];

const CaixaTooltip: React.FC<any> = ({ active, payload, label, formatar }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink text-white px-3 py-2 shadow-rail border border-white/10">
      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-[12.5px] font-bold tnum flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: {formatar ? formatar(p.value) : num(p.value)}
        </p>
      ))}
    </div>
  );
};

export const PainelCelula: React.FC = () => {
  const { e, irPara, enviarConvocatoria } = useStore();

  const ivo = useMemo(() => calcularIVO(e), [e]);
  const av = useMemo(() => calcAvisos(e), [e]);
  const conf = useMemo(() => conformidade(e), [e]);
  const contagens = useMemo(() => contagemPorEstado(e), [e]);
  const mesActual = mesDe(e.hoje);
  const cot = useMemo(() => cotizacaoDoMes(e, mesActual), [e, mesActual]);
  const serie = useMemo(() => serieCotizacao(e, 12), [e]);
  const prox = useMemo(() => proximaReuniao(e, 'REUNIAO_GERAL'), [e]);
  const proxSec = useMemo(() => proximaReuniao(e, 'SECRETARIADO'), [e]);
  const atrasos = useMemo(() => alertasCotizacao(e), [e]);
  const rgs = useMemo(() => reunioesGerais(e).slice(0, 6).reverse(), [e]);
  const cadencia = useMemo(() => cadenciaReuniaoGeral(e), [e]);
  const saldo = useMemo(() => saldoCelula(e), [e]);
  const assidMedia = useMemo(() => assiduidadeMedia(e, 6), [e]);
  const conv = prox ? estadoConvocatoria(prox, e.hoje) : null;

  // Enquanto o cargo estiver vago, o painel apresenta-se ao Secretariado.
  const secretaria = e.membros.find((m) => m.cargo === 'SECRETARIO')
    ?? e.membros.find((m) => m.cargo === 'ASSISTENTE')
    ?? e.membros[0];
  const hora = 14;
  const saudacao = hora < 12 ? 'Bom dia' : hora < 19 ? 'Boa tarde' : 'Boa noite';

  const dadosRadar = ivo.pilares.map((p) => ({ pilar: p.nome, valor: p.valor }));
  const dadosPresencas = rgs.map((r) => {
    const vals = Object.values(r.presencas);
    const tot = vals.length || 1;
    return {
      mes: nomeMesCurto(mesDe(r.data)),
      Presentes: vals.filter((v) => v === 'PRESENTE').length,
      Justificadas: vals.filter((v) => v === 'JUSTIFICADO').length,
      Injustificadas: vals.filter((v) => v === 'INJUSTIFICADO').length,
      taxa: Math.round((vals.filter((v) => v === 'PRESENTE').length / tot) * 100),
    };
  });

  const candidatos = e.membros.filter((m) => m.estado === 'CANDIDATO');
  const proximas = e.reunioes
    .filter((r) => r.estado === 'AGENDADA' && r.data >= e.hoje)
    .sort((a, b) => (a.data > b.data ? 1 : -1))
    .slice(0, 5);

  const atalhos = [
    { rotulo: 'Registar quota', icone: <IcMoeda className="w-5 h-5" />, vista: 'cotas', params: { acao: 'registar' } },
    { rotulo: 'Enviar mensagem', icone: <IcMegafone className="w-5 h-5" />, vista: 'comunicacao', params: { acao: 'nova' } },
    { rotulo: 'Marcar reunião', icone: <IcCalendario className="w-5 h-5" />, vista: 'reunioes', params: { acao: 'marcar' } },
    { rotulo: 'Registar membro', icone: <IcMembros className="w-5 h-5" />, vista: 'membros', params: { acao: 'novo' } },
    { rotulo: 'Convocar eleição', icone: <IcUrna className="w-5 h-5" />, vista: 'eleicoes', params: { acao: 'convocar' } },
  ];

  const desconformes = conf.filter((c) => c.estado !== 'CONFORME').length;

  return (
    <div className="space-y-6">
      {/* ══════════════════════════ Hero ══════════════════════════ */}
      <section className="relative rounded-3xl hero-bg text-white overflow-hidden shadow-rail">
        <div className="absolute inset-0 grid-paper opacity-[0.07]" />
        <div className="faixa-diagonal absolute -top-16 -right-24 w-64 h-40 opacity-[0.16] rotate-12" />
        <FaixaBandeira altura={4} className="absolute top-0 left-0" />
        <div className="relative p-6 sm:p-7 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <Emblema tamanho={44} />
                <div className="leading-none">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-brand-300">FRELIMO</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40 mt-1.5">
                    Sistema de Gestão da Célula
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Pill tom="gold" className="!bg-gold-500/15 !text-gold-300 !border-gold-500/30">
                  {e.celula.nome}
                </Pill>
                <Pill className="!bg-white/10 !text-white/70 !border-white/15">
                  {e.circulo.nome}
                </Pill>
                <Pill className="!bg-white/10 !text-white/70 !border-white/15">
                  {e.celula.distrito} · {e.celula.provincia}
                </Pill>
              </div>
              <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-tight leading-tight">
                {saudacao}, camarada {primeiroNome(secretaria.nome)}.
              </h2>
              <p className="text-white/55 mt-2 text-[14.5px] leading-relaxed max-w-2xl">
                {dataLonga(e.hoje)}. A Célula tem{' '}
                <strong className="text-white">{contagens.EFECTIVO} membros efectivos</strong>,{' '}
                {cot.emFalta.length === 0 ? 'a cotização do mês está completa' : (
                  <>
                    <strong className="text-white">{cot.emFalta.length}</strong> por cotizar este mês
                  </>
                )}{' '}
                e {av.filter((a) => a.nivel === 'CRITICO').length > 0 ? (
                  <>
                    <strong className="text-brand-300">
                      {av.filter((a) => a.nivel === 'CRITICO').length}{' '}
                      {av.filter((a) => a.nivel === 'CRITICO').length === 1 ? 'aviso crítico' : 'avisos críticos'}
                    </strong>{' '}
                    à espera de decisão
                  </>
                ) : 'nenhum aviso crítico'}.
              </p>

              <div className="flex flex-wrap gap-2 mt-5">
                {atalhos.map((a) => (
                  <button
                    key={a.rotulo}
                    onClick={() => irPara(a.vista, a.params)}
                    className="group inline-flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-2xl bg-white/[0.07] border border-white/12 hover:bg-white hover:text-ink transition-all duration-300 ease-swift"
                  >
                    <span className="text-gold-400 group-hover:text-brand-600 transition-colors">{a.icone}</span>
                    <span className="text-[13px] font-bold">{a.rotulo}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* IVO */}
            <div className="flex-none">
              <div className="rounded-2xl bg-white/[0.06] border border-white/12 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-5">
                  <Anel
                    valor={ivo.total}
                    tamanho={112}
                    espessura={10}
                    cor={ivo.total >= 70 ? '#0FB85E' : ivo.total >= 50 ? '#F5D400' : '#F0303A'}
                    trilho="rgba(255,255,255,.12)"
                    centro={
                      <>
                        <span className="text-[30px] font-extrabold tnum leading-none">
                          <Contador valor={ivo.total} />
                        </span>
                        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-white/40 mt-1">de 100</span>
                      </>
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">Índice de Vitalidade</p>
                    <p className="text-[17px] font-extrabold mt-0.5">
                      {ivo.classe === 'EXEMPLAR' ? 'Célula exemplar' : ivo.classe === 'SOLIDA' ? 'Célula sólida' : ivo.classe === 'ATENCAO' ? 'Requer atenção' : 'Situação crítica'}
                    </p>
                    <p className="text-[12px] text-white/45 mt-1.5 leading-snug max-w-[190px]">
                      Composto por cinco pilares estatutários: assiduidade, cotização, cadência, base de dados e vida orgânica.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ivo.pilares.map((p, i) => (
                        <span
                          key={p.chave}
                          title={`${p.nome}: ${p.valor}/100 — ${p.detalhe}`}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
                          style={{ borderColor: `${CORES_IVO[i]}55`, color: CORES_IVO[i], background: `${CORES_IVO[i]}18` }}
                        >
                          {p.nome} {p.valor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ KPIs ══════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Stat
          rotulo="Membros da Célula"
          valor={<Contador valor={contagens.EFECTIVO + contagens.SUSPENSO} />}
          icone={<IcMembros className="w-5 h-5" />}
          nota={
            <span className="flex flex-wrap gap-x-2 gap-y-1">
              <span className="text-verde-700 font-bold">{contagens.EFECTIVO} efectivos</span>
              <span>· {contagens.CANDIDATO} {contagens.CANDIDATO === 1 ? 'candidato' : 'candidatos'}</span>
              <span>· {contagens.SUSPENSO} {contagens.SUSPENSO === 1 ? 'suspenso' : 'suspensos'}</span>
            </span>
          }
          onClick={() => irPara('membros')}
        />
        <Stat
          rotulo={`Cotização de ${nomeMes(mesActual)}`}
          valor={<><Contador valor={cot.taxa} dec={0} sufixo="%" /></>}
          tom={cot.taxa >= 80 ? 'verde' : cot.taxa >= 50 ? 'gold' : 'brand'}
          icone={<IcMoeda className="w-5 h-5" />}
          nota={
            <span>
              {mt(cot.total)} cobrados · <strong className="text-ink-500">{mt(cot.retidoCelula)}</strong> retidos na Célula
            </span>
          }
          onClick={() => irPara('cotas')}
        />
        <Stat
          rotulo="Próxima Reunião Geral"
          valor={prox ? dataCurta(prox.data) : '—'}
          icone={<IcCalendario className="w-5 h-5" />}
          tom={conv && !conv.enviada ? 'brand' : 'neutro'}
          nota={
            prox ? (
              <span>
                {relativo(prox.data, e.hoje)} · {prox.hora} ·{' '}
                {conv?.enviada ? <span className="text-verde-700 font-bold">convocatória enviada</span> : <span className="text-brand-600 font-bold">convocatória em falta</span>}
              </span>
            ) : 'sem sessão agendada'
          }
          onClick={() => irPara('reunioes')}
        />
        <Stat
          rotulo="Assiduidade média"
          valor={<Contador valor={assidMedia} sufixo="%" />}
          tom={assidMedia >= 75 ? 'verde' : 'gold'}
          icone={<IcEscudo className="w-5 h-5" />}
          nota={`${cadencia.realizadas} de 12 Reuniões Gerais realizadas no último ano`}
          onClick={() => irPara('conformidade')}
        />
      </div>

      {/* ═════════════════ Avisos + Próxima reunião ═════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card
          className="xl:col-span-2"
          titulo="Avisos que exigem decisão do Secretariado"
          sub="Gerados a partir das regras dos Estatutos e do Manual da Célula"
          accao={<Pill tom={av.some((a) => a.nivel === 'CRITICO') ? 'brand' : 'verde'}>{av.length} activos</Pill>}
          pad={false}
        >
          <div className="divide-y divide-ink-100">
            {av.slice(0, 5).map((a) => {
              const tons: Record<string, { cor: string; fundo: string }> = {
                CRITICO: { cor: 'text-brand-600', fundo: 'bg-brand-50' },
                ALTO: { cor: 'text-gold-600', fundo: 'bg-gold-100' },
                MEDIO: { cor: 'text-sky-600', fundo: 'bg-sky-50' },
                INFO: { cor: 'text-ink-400', fundo: 'bg-ink-50' },
              };
              const t = tons[a.nivel];
              return (
                <div key={a.id} className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-ink-50/40 transition-colors">
                  <span className={`w-8 h-8 rounded-xl grid place-items-center flex-none ${t.fundo} ${t.cor}`}>
                    <IcAviso className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13.5px] font-bold text-ink leading-snug">{a.titulo}</p>
                      <Pill tom={a.nivel === 'CRITICO' ? 'brand' : a.nivel === 'ALTO' ? 'gold' : 'neutro'}>{a.nivel.toLowerCase()}</Pill>
                    </div>
                    <p className="text-[12.5px] text-ink-400 mt-1 leading-relaxed">{a.texto}</p>
                    {a.base && <div className="mt-1.5"><Lei id={a.base} /></div>}
                  </div>
                  {a.vista && (
                    <Btn tamanho="sm" variante="suave" iconeFim={<IcSeta className="w-3.5 h-3.5" />} onClick={() => irPara(a.vista!)}>
                      Tratar
                    </Btn>
                  )}
                </div>
              );
            })}
            {av.length === 0 && (
              <div className="px-5 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-verde-100 text-verde-700 grid place-items-center mx-auto mb-3">
                  <IcCheck className="w-6 h-6" />
                </div>
                <p className="font-bold text-ink">Nada pendente</p>
                <p className="text-sm text-ink-400 mt-1">A Célula está em conformidade com todas as regras verificadas.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Próxima reunião */}
        <Card
          titulo={prox ? 'Próxima Reunião Geral' : 'Sem reunião agendada'}
          sub={prox ? `${dataLonga(prox.data)} · ${prox.hora}` : undefined}
          destaque={!!conv && !conv.enviada}
          accao={<Lei id="art35n6" />}
        >
          {prox ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 text-[13px] text-ink-500">
                <IcLocal className="w-4 h-4 mt-0.5 flex-none text-ink-300" />
                <span>{prox.local}</span>
              </div>
              <div className="flex items-start gap-2.5 text-[13px] text-ink-500">
                <IcRelogio className="w-4 h-4 mt-0.5 flex-none text-ink-300" />
                <span>Duração máxima de 90 minutos <Lei id="manual_duracao" discreto className="ml-1" /></span>
              </div>

              {conv && !conv.enviada && (
                <Alerta
                  tom={conv.expirado ? 'brand' : 'gold'}
                  titulo={conv.expirado ? 'Antecedência mínima ultrapassada' : `A convocatória deve sair até ${conv.prazoLimite}`}
                  base="manual_convocatoria"
                  accao={
                    <Btn tamanho="sm" variante="primaria" onClick={() => enviarConvocatoria(prox.id, ['WHATSAPP', 'SMS'])}>
                      Difundir
                    </Btn>
                  }
                >
                  A agenda, a data, a hora e o local devem chegar aos membros com, no mínimo, dois dias de antecedência.
                </Alerta>
              )}

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-400 mb-2">
                  Agenda-tipo <Lei id="manual_agenda" discreto className="ml-1" />
                </p>
                <ol className="space-y-1.5">
                  {prox.agenda.map((p) => (
                    <li key={p.id} className="flex items-start gap-2.5 text-[12.5px] text-ink-600 leading-snug">
                      <span className="w-4 h-4 rounded-md bg-ink-50 text-ink-400 text-[9.5px] font-extrabold grid place-items-center flex-none mt-0.5">
                        {p.ordem}
                      </span>
                      {p.titulo}
                    </li>
                  ))}
                </ol>
              </div>

              <Btn largo variante="escura" iconeFim={<IcSeta className="w-4 h-4" />} onClick={() => irPara('reunioes', { reuniao: prox.id })}>
                Abrir sessão
              </Btn>

              {proxSec && (
                <div className="pt-3 border-t border-ink-100">
                  <p className="text-[11px] text-ink-400">
                    Secretariado reúne {relativo(proxSec.data, e.hoje)} — {dataCurta(proxSec.data)}, {proxSec.hora}.
                    <Lei id="art35n9" discreto className="ml-1.5" />
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Btn largo variante="primaria" onClick={() => irPara('reunioes', { acao: 'marcar' })}>Marcar Reunião Geral</Btn>
          )}
        </Card>
      </div>

      {/* ═════════════════ Cotização + IVO radar ═════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card
          className="xl:col-span-2"
          titulo="Cotização dos últimos doze meses"
          sub="Repartição automática 60% Célula / 40% escalão superior"
          accao={<Lei id="manual_6040" />}
        >
          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-400">Cobrado no ano</p>
              <p className="text-[22px] font-extrabold tnum text-ink">{mt(serie.reduce((a, s) => a + s.valor, 0))}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-400">Retido na Célula</p>
              <p className="text-[22px] font-extrabold tnum text-verde-700">{mt(serie.reduce((a, s) => a + s.celula, 0))}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-400">Para o escalão</p>
              <p className="text-[22px] font-extrabold tnum text-brand-600">{mt(serie.reduce((a, s) => a + s.escalao, 0))}</p>
            </div>
            <div className="ml-auto">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-400">Saldo em caixa</p>
              <p className="text-[22px] font-extrabold tnum text-ink">{mt(saldo.saldo)}</p>
            </div>
          </div>
          <div className="h-[210px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gCelula" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A34F" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#00A34F" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gEscalao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E61923" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#E61923" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EDED" vertical={false} />
                <XAxis dataKey="mes" tickFormatter={nomeMesCurto} tick={{ fontSize: 11, fill: '#9E9797', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => compacto(v)} tick={{ fontSize: 11, fill: '#9E9797' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CaixaTooltip formatar={(v: number) => mt(v)} />} labelFormatter={(l) => nomeMes(String(l))} />
                <Area type="monotone" dataKey="celula" name="Célula (60%)" stackId="1" stroke="#00A34F" strokeWidth={2} fill="url(#gCelula)" />
                <Area type="monotone" dataKey="escalao" name="Escalão (40%)" stackId="1" stroke="#E61923" strokeWidth={2} fill="url(#gEscalao)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card titulo="Decomposição do índice" sub="Cada pilar tem uma base normativa própria">
          <div className="h-[186px] -mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={dadosRadar} outerRadius="72%">
                <PolarGrid stroke="#EDE9E9" />
                <PolarAngleAxis dataKey="pilar" tick={{ fontSize: 10.5, fill: '#726B6B', fontWeight: 700 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="valor" stroke="#E61923" fill="#E61923" fillOpacity={0.16} strokeWidth={2} />
                <Tooltip content={<CaixaTooltip formatar={(v: number) => `${v}/100`} />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5 mt-3 pt-3 border-t border-ink-100">
            {ivo.pilares.map((p, i) => (
              <div key={p.chave}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[12px] font-bold text-ink-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: CORES_IVO[i] }} />
                    {p.nome}
                    <Lei id={p.base} discreto />
                  </span>
                  <span className="text-[12px] font-extrabold tnum text-ink">{p.valor}<span className="text-ink-300 font-semibold"> · peso {p.peso}%</span></span>
                </div>
                <div className="w-full h-1.5 bg-ink-100 rounded-full overflow-hidden">
                  <div className="h-1.5 rounded-full transition-all duration-700 ease-swift" style={{ width: `${p.valor}%`, background: CORES_IVO[i] }} />
                </div>
                <p className="text-[11px] text-ink-300 mt-1">{p.detalhe}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ═════════════════ Presenças + em atraso ═════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card
          className="xl:col-span-2"
          titulo="Presenças nas últimas seis Reuniões Gerais"
          sub="Presente · ausência justificada · ausência não justificada"
          accao={<Lei id="manual_acta" />}
        >
          <div className="h-[220px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosPresencas} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EDED" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9E9797', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9E9797' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip content={<CaixaTooltip />} cursor={{ fill: '#F8F6F6' }} />
                <Bar dataKey="Presentes" stackId="a" fill="#00A34F" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Justificadas" stackId="a" fill="#F5D400" />
                <Bar dataKey="Injustificadas" stackId="a" fill="#E61923" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-ink-100">
            {[
              { c: '#00A34F', r: 'Presente' },
              { c: '#F5D400', r: 'Ausência justificada' },
              { c: '#E61923', r: 'Ausência não justificada' },
            ].map((l) => (
              <span key={l.r} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-400">
                <span className="w-2.5 h-2.5 rounded" style={{ background: l.c }} />
                {l.r}
              </span>
            ))}
            <span className="ml-auto text-[11.5px] text-ink-400">
              Faltas não justificadas acima de 25% põem em risco o mandato dos titulares de cargos
              <Lei id="art27n6" discreto className="ml-1.5" />
            </span>
          </div>
        </Card>

        <Card
          titulo="Membros em atraso"
          sub={`${atrasos.length} com quota pendente`}
          accao={<Btn tamanho="sm" variante="suave" onClick={() => irPara('cotas')}>Ver todos</Btn>}
          pad={false}
        >
          <div className="divide-y divide-ink-100 max-h-[330px] overflow-y-auto">
            {atrasos.slice(0, 7).map((a) => (
              <button
                key={a.membro.id}
                onClick={() => irPara('membros', { membro: a.membro.id })}
                className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-ink-50/50"
              >
                <Avatar nome={a.membro.nome} tamanho={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink truncate">{nomeCurto(a.membro.nome)}</p>
                  <p className="text-[11.5px] text-ink-400">
                    {a.meses} {a.meses === 1 ? 'mês' : 'meses'} · dívida estimada {mt(a.divida)}
                  </p>
                </div>
                {a.suspensivel ? (
                  <Pill tom="brand">suspensível</Pill>
                ) : a.meses >= 6 ? (
                  <Pill tom="gold">{a.meses}m</Pill>
                ) : (
                  <Pill tom="neutro">{a.meses}m</Pill>
                )}
              </button>
            ))}
            {atrasos.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="font-bold text-ink">Cotização em dia</p>
                <p className="text-sm text-ink-400 mt-1">Todos os membros regularizaram as quotas.</p>
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-ink-100 bg-ink-50/50">
            <p className="text-[11.5px] text-ink-400 leading-relaxed">
              Doze meses sem pagamento, sem motivo justificado, implicam suspensão de direitos por um ano.
              <Lei id="art16n4" discreto className="ml-1.5" />
            </p>
          </div>
        </Card>
      </div>

      {/* ═════════════════ Candidaturas + agenda + conformidade ═════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card titulo="Candidaturas em apreciação" sub="Prazo estatutário de 120 dias" accao={<Lei id="art8" />}>
          <div className="space-y-3">
            {candidatos.map((m) => {
              const p = prazoCandidatura(m, e.hoje)!;
              const pctPrazo = Math.max(0, Math.min(100, (p.dias / 120) * 100));
              return (
                <button key={m.id} onClick={() => irPara('membros', { membro: m.id })} className="w-full text-left group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Avatar nome={m.nome} tamanho={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-ink truncate group-hover:text-brand-700">{nomeCurto(m.nome)}</p>
                      <p className="text-[11px] text-ink-400">candidatura de {dataCurta(m.dataAdmissao)}</p>
                    </div>
                    <Pill tom={p.dias <= 20 ? 'brand' : p.dias <= 45 ? 'gold' : 'neutro'}>
                      {p.expirado ? 'expirado' : `${p.dias} dias`}
                    </Pill>
                  </div>
                  <Barra valor={100 - pctPrazo} tom={p.dias <= 20 ? 'bg-brand-600' : p.dias <= 45 ? 'bg-gold-500' : 'bg-ink-300'} alt="h-1.5" />
                </button>
              );
            })}
            {candidatos.length === 0 && <p className="text-sm text-ink-300 text-center py-6">Sem candidaturas pendentes.</p>}
          </div>
        </Card>

        <Card titulo="Próximas actividades" sub="Reuniões, estudo político e auscultação" accao={<Lei id="art36" />} pad={false}>
          <ul className="divide-y divide-ink-100">
            {proximas.map((r) => {
              const cores: Record<string, string> = {
                REUNIAO_GERAL: 'bg-brand-600',
                REUNIAO_GERAL_EXTRA: 'bg-brand-400',
                SECRETARIADO: 'bg-ink-600',
                ESTUDO_POLITICO: 'bg-violet-600',
                AUSCULTACAO: 'bg-sky-600',
                CULTURAL: 'bg-gold-500',
                SOLIDARIEDADE: 'bg-verde-600',
              };
              return (
                <li key={r.id}>
                  <button onClick={() => irPara('reunioes', { reuniao: r.id })} className="w-full text-left px-5 py-3 flex items-start gap-3 hover:bg-ink-50/50">
                    <span className="flex flex-col items-center flex-none">
                      <span className={`w-1.5 h-1.5 rounded-full ${cores[r.tipo] ?? 'bg-ink-300'}`} />
                      <span className="w-px flex-1 bg-ink-100 mt-1" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-bold text-ink leading-snug">{r.titulo}</span>
                      <span className="block text-[11.5px] text-ink-400 mt-0.5">
                        {dataCurta(r.data)} · {r.hora} · {r.local}
                      </span>
                    </span>
                    <Pill tom="neutro">{relativo(r.data, e.hoje)}</Pill>
                  </button>
                </li>
              );
            })}
            {proximas.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-300">Nada agendado.</li>}
          </ul>
        </Card>

        <Card
          titulo="Conformidade estatutária"
          sub={desconformes === 0 ? 'Tudo conforme' : `${desconformes} pontos a corrigir`}
          accao={<Btn tamanho="sm" variante="suave" onClick={() => irPara('conformidade')}>Detalhe</Btn>}
          pad={false}
        >
          <ul className="divide-y divide-ink-100">
            {conf.slice(0, 8).map((c) => {
              const cor = c.estado === 'CONFORME' ? 'text-verde-600' : c.estado === 'ATENCAO' ? 'text-gold-500' : 'text-brand-600';
              return (
                <li key={c.chave} className="px-5 py-2.5 flex items-center gap-3">
                  <span className={`flex-none ${cor}`}>
                    {c.estado === 'CONFORME' ? <IcCheck className="w-4 h-4" /> : <IcAviso className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold text-ink truncate">{c.titulo}</span>
                    <span className="block text-[11px] text-ink-400 truncate">{c.detalhe}</span>
                  </span>
                  <Lei id={c.base} discreto />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Nota de rodapé sobre a natureza do protótipo */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-ink text-gold-400 grid place-items-center flex-none">
            <IcRelatorio className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[13.5px] font-bold text-ink">Relatório mensal ao Comité de Círculo</p>
            <p className="text-[12.5px] text-ink-400 mt-0.5 leading-relaxed">
              O sistema monta o relatório de {nomeMes(mesDe(e.hoje))} a partir das presenças, da cotização e do movimento de fundos já registados — no máximo cinco páginas, como manda o Manual.
            </p>
          </div>
          <Btn variante="escura" iconeFim={<IcSeta className="w-4 h-4" />} onClick={() => irPara('relatorio')}>
            Gerar relatório
          </Btn>
        </div>
      </Card>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import {
  actasPendentes, cadenciaReuniaoGeral, efectivos, estadoConvocatoria, membrosDaCelula, quorum,
  reunioesGerais,
} from '../lib/selectors';
import { REGRAS } from '../lib/estatutos';
import { addDays, dataCurta, dataLonga, dataMedia, mesDe, nomeMesCurto, num, relativo } from '../lib/format';
import {
  Alerta, Avatar, Barra, Btn, Campo, Card, Escolha, Gaveta, Input, Lei, Linha, Modal, Pill,
  Segmentado, Select, Stat, Vazio,
} from '../ui/primitives';
import {
  IcAnexo, IcAviso, IcCalendario, IcCheck, IcLocal, IcMais, IcMegafone, IcRelogio, IcSeta, IcCartao,
} from '../ui/icons';
import type { EstadoPresenca, Reuniao, TipoReuniao } from '../lib/types';

const TIPO_META: Record<TipoReuniao, { rotulo: string; cor: string; tom: 'brand' | 'ink' | 'roxo' | 'azul' | 'gold' | 'verde' }> = {
  REUNIAO_GERAL: { rotulo: 'Reunião Geral', cor: 'bg-brand-600', tom: 'brand' },
  REUNIAO_GERAL_EXTRA: { rotulo: 'Reunião Geral extraordinária', cor: 'bg-brand-400', tom: 'brand' },
  SECRETARIADO: { rotulo: 'Secretariado', cor: 'bg-ink-600', tom: 'ink' },
  ESTUDO_POLITICO: { rotulo: 'Estudo Político', cor: 'bg-violet-600', tom: 'roxo' },
  AUSCULTACAO: { rotulo: 'Auscultação', cor: 'bg-sky-600', tom: 'azul' },
  CULTURAL: { rotulo: 'Actividade cultural', cor: 'bg-gold-500', tom: 'gold' },
  SOLIDARIEDADE: { rotulo: 'Solidariedade', cor: 'bg-verde-600', tom: 'verde' },
};

const PRESENCA_META: Record<EstadoPresenca, { rotulo: string; cor: string; curto: string }> = {
  PRESENTE: { rotulo: 'Presente', cor: 'bg-verde-600 border-verde-600 text-white', curto: 'P' },
  JUSTIFICADO: { rotulo: 'Ausência justificada', cor: 'bg-gold-500 border-gold-500 text-white', curto: 'J' },
  INJUSTIFICADO: { rotulo: 'Ausência não justificada', cor: 'bg-brand-600 border-brand-600 text-white', curto: 'N' },
};

/* ═══════════════════════════════ Marcar reunião ════════════════════════════ */

const MarcarReuniao: React.FC<{ aberto: boolean; onFechar: () => void }> = ({ aberto, onFechar }) => {
  const { e, agendarReuniao, irPara } = useStore();
  const [tipo, setTipo] = useState<TipoReuniao>('REUNIAO_GERAL');
  const [data, setData] = useState(addDays(e.hoje, 14));
  const [hora, setHora] = useState('15:00');
  const [local, setLocal] = useState('Sede da Célula — Q. 14, casa n.º 132');
  const [titulo, setTitulo] = useState('');
  const [especifico, setEspecifico] = useState('Cobrança de quotas e regularização de atrasos');

  const limite = addDays(data, -REGRAS.ANTECEDENCIA_CONVOCATORIA_DIAS);
  const tarde = limite < e.hoje;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      largura="max-w-2xl"
      titulo="Marcar reunião ou actividade"
      sub="A agenda-tipo é aplicada automaticamente conforme o Manual da Célula"
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn
            variante="primaria"
            onClick={() => {
              const r = agendarReuniao({
                tipo,
                titulo: titulo || TIPO_META[tipo].rotulo,
                data, hora, local,
                especifico: tipo === 'REUNIAO_GERAL' ? especifico : undefined,
              });
              onFechar();
              irPara('reunioes', { reuniao: r.id });
            }}
          >
            Marcar reunião
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Tipo de sessão" obrigatorio>
          <Escolha
            colunas={2}
            valor={tipo}
            onMudar={(v) => setTipo(v as TipoReuniao)}
            itens={[
              { id: 'REUNIAO_GERAL', rotulo: 'Reunião Geral ordinária', nota: 'Mensal — Art. 35 n.º 6' },
              { id: 'REUNIAO_GERAL_EXTRA', rotulo: 'Reunião Geral extraordinária', nota: 'Quando necessário' },
              { id: 'SECRETARIADO', rotulo: 'Sessão do Secretariado', nota: 'De quinze em quinze dias' },
              { id: 'ESTUDO_POLITICO', rotulo: 'Estudo Político', nota: 'Art. 36 n.º 3 k)' },
              { id: 'AUSCULTACAO', rotulo: 'Auscultação da comunidade', nota: 'Com simpatizantes — Art. 36 n.º 1' },
              { id: 'CULTURAL', rotulo: 'Actividade cultural', nota: 'Art. 36 n.º 3 g)' },
            ]}
          />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Campo rotulo="Data" obrigatorio>
            <Input type="date" value={data} min={e.hoje} onChange={(ev) => setData(ev.target.value)} />
          </Campo>
          <Campo rotulo="Hora" obrigatorio>
            <Input type="time" value={hora} onChange={(ev) => setHora(ev.target.value)} />
          </Campo>
          <Campo rotulo="Título (opcional)">
            <Input value={titulo} onChange={(ev) => setTitulo(ev.target.value)} placeholder={TIPO_META[tipo].rotulo} />
          </Campo>
        </div>

        <Campo rotulo="Local" obrigatorio>
          <Input value={local} onChange={(ev) => setLocal(ev.target.value)} />
        </Campo>

        {tipo === 'REUNIAO_GERAL' && (
          <Campo rotulo="Ponto específico do momento" nota="Substitui o quarto ponto da agenda-tipo.">
            <Select value={especifico} onChange={(ev) => setEspecifico(ev.target.value)}>
              {[
                'Cobrança de quotas e regularização de atrasos',
                'Recenseamento eleitoral — mobilização porta a porta',
                'Análise de candidaturas a membros do Partido',
                'Preparação da Conferência do Círculo',
                'Orientações dos órgãos superiores',
                'Campanha agrícola e hortas familiares',
                'Campanha de limpeza do bairro e cidadania',
                'Balanço do processo eleitoral',
              ].map((x) => (<option key={x} value={x}>{x}</option>))}
            </Select>
          </Campo>
        )}

        <Alerta tom={tarde ? 'brand' : 'azul'} titulo={tarde ? 'Data demasiado próxima' : `Convocatória a difundir até ${dataMedia(limite)}`} base="manual_convocatoria">
          {tarde
            ? 'Não é possível cumprir a antecedência mínima de dois dias com esta data. Escolha uma data posterior.'
            : 'O sistema recorda o Secretariado e envia a agenda, data, hora e local pelo canal preferido de cada membro.'}
        </Alerta>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════ Ficha da reunião ══════════════════════════ */

const FichaReuniao: React.FC<{ r: Reuniao; onFechar: () => void }> = ({ r, onFechar }) => {
  const {
    e, enviarConvocatoria, marcarPresenca, concluirReuniao, anexarActa, aprovarActa, addDecisao,
    toggleDecisao, cancelarReuniao,
  } = useStore();
  const [duracao, setDuracao] = useState(75);
  const [resumo, setResumo] = useState('');
  const [novaDecisao, setNovaDecisao] = useState('');
  const [responsavel, setResponsavel] = useState(e.membros[1].id);

  const universo = r.tipo === 'SECRETARIADO'
    ? membrosDaCelula(e).filter((m) => m.cargo !== 'MEMBRO')
    : efectivos(e);
  const presentes = Object.entries(r.presencas).filter(([, v]) => v === 'PRESENTE').length;
  const q = quorum(presentes, universo.length, 'METADE');
  const conv = estadoConvocatoria(r, e.hoje);
  const meta = TIPO_META[r.tipo];
  const excedeu = (r.duracaoMin ?? 0) > REGRAS.DURACAO_MAX_REUNIAO_GERAL_MIN;

  const ciclos: EstadoPresenca[] = ['PRESENTE', 'JUSTIFICADO', 'INJUSTIFICADO'];

  return (
    <Gaveta
      aberto
      onFechar={onFechar}
      largura="max-w-2xl"
      titulo={r.titulo}
      sub={`${dataLonga(r.data)} · ${r.hora} · ${r.local}`}
      rodape={
        <div className="flex items-center gap-2 w-full">
          {r.estado === 'AGENDADA' && !conv.enviada && (
            <Btn variante="primaria" icone={<IcMegafone className="w-4 h-4" />} onClick={() => enviarConvocatoria(r.id, ['WHATSAPP', 'SMS'])}>
              Difundir convocatória
            </Btn>
          )}
          {r.estado === 'AGENDADA' && conv.enviada && (
            <Btn variante="sucesso" icone={<IcCheck className="w-4 h-4" />} onClick={() => concluirReuniao(r.id, { duracaoMin: duracao, resumo: resumo || 'Sessão realizada.' })}>
              Encerrar e registar sessão
            </Btn>
          )}
          {r.estado === 'REALIZADA' && !r.acta && (
            <Btn variante="escura" icone={<IcAnexo className="w-4 h-4" />} onClick={() => anexarActa(r.id, `Acta_${r.data}_${r.tipo}.pdf`)}>
              Anexar Acta
            </Btn>
          )}
          {r.estado === 'REALIZADA' && r.acta && !r.acta.aprovadaEm && (
            <Btn variante="sucesso" icone={<IcCheck className="w-4 h-4" />} onClick={() => aprovarActa(r.id, r.id)}>
              Marcar Acta como aprovada
            </Btn>
          )}
          <span className="ml-auto" />
          {r.estado === 'AGENDADA' && <Btn variante="fantasma" onClick={() => { cancelarReuniao(r.id); onFechar(); }}>Cancelar sessão</Btn>}
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tom={meta.tom} ponto>{meta.rotulo}</Pill>
          <Pill tom={r.estado === 'REALIZADA' ? 'verde' : r.estado === 'CANCELADA' ? 'neutro' : 'gold'}>
            {r.estado === 'REALIZADA' ? 'realizada' : r.estado === 'CANCELADA' ? 'cancelada' : `agendada · ${relativo(r.data, e.hoje)}`}
          </Pill>
          {r.duracaoMin && <Pill tom={excedeu ? 'brand' : 'neutro'}>{r.duracaoMin} min</Pill>}
          {r.acta?.aprovadaEm && <Pill tom="verde">Acta aprovada</Pill>}
        </div>

        {/* convocatória */}
        {r.estado === 'AGENDADA' && (
          <Alerta
            tom={conv.enviada ? 'verde' : conv.expirado ? 'brand' : 'gold'}
            titulo={
              conv.enviada
                ? `Convocatória difundida em ${dataMedia(r.convocatoriaEnviadaEm!)} por ${(r.canaisConvocatoria ?? []).join(', ')}`
                : conv.expirado
                  ? 'Antecedência mínima de dois dias ultrapassada'
                  : `A convocatória deve sair até ${dataMedia(conv.prazoLimite)}`
            }
            base="manual_convocatoria"
            icone={conv.enviada ? <IcCheck className="w-4 h-4" /> : <IcAviso className="w-4 h-4" />}
          >
            {conv.enviada
              ? 'Os membros receberam a agenda, a data, a hora e o local pelo canal que indicaram como preferido.'
              : 'A agenda deve ser comunicada aos membros com, no mínimo, dois dias de antecedência.'}
          </Alerta>
        )}

        {/* agenda */}
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">
            Agenda da sessão <Lei id="manual_agenda" discreto className="ml-1" />
          </p>
          <ol className="space-y-1.5">
            {r.agenda.map((p) => (
              <li key={p.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-ink-50/70 border border-ink-100">
                <span className="w-5 h-5 rounded-lg bg-white border border-ink-200 text-[10px] font-extrabold text-ink-500 grid place-items-center flex-none">
                  {p.ordem}
                </span>
                <span className="text-[13px] text-ink-600 leading-snug flex-1">{p.titulo}</span>
                {p.fixo && <Pill tom="neutro" className="!text-[9px]">ponto fixo</Pill>}
              </li>
            ))}
          </ol>
        </div>

        {/* presenças */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400">
              Registo de presenças <Lei id="manual_acta" discreto className="ml-1" />
            </p>
            <span className={`text-[12px] font-bold ${q.atingido ? 'text-verde-700' : 'text-brand-600'}`}>
              {presentes} de {universo.length} · quórum {q.exigido}
            </span>
          </div>

          <div className={`mb-3 p-3 rounded-xl border ${q.atingido ? 'bg-verde-100/60 border-verde-200' : 'bg-brand-50 border-brand-100'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[12.5px] font-bold ${q.atingido ? 'text-verde-800' : 'text-brand-700'}`}>
                {q.atingido ? 'Quórum verificado — o órgão pode deliberar' : 'Sem quórum para deliberar'}
              </span>
              <Lei id="art30" />
            </div>
            <Barra valor={(presentes / Math.max(1, universo.length)) * 100} tom={q.atingido ? 'bg-verde-600' : 'bg-brand-600'} alt="h-1.5" />
            <p className="text-[11.5px] mt-1.5 opacity-80">
              Os órgãos que não sejam Comités ou Conferências deliberam estando presentes mais de metade dos seus membros.
            </p>
          </div>

          <ul className="space-y-1.5">
            {universo.map((m) => {
              const estado = r.presencas[m.id];
              return (
                <li key={m.id} className="flex items-center gap-3 p-2 rounded-xl border border-ink-100">
                  <Avatar nome={m.nome} tamanho={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink truncate">{m.nome}</p>
                    {r.justificacoes?.[m.id] && <p className="text-[11px] text-ink-400">motivo: {r.justificacoes[m.id]}</p>}
                  </div>
                  <div className="flex gap-1 flex-none">
                    {ciclos.map((c) => {
                      const on = estado === c;
                      return (
                        <button
                          key={c}
                          title={PRESENCA_META[c].rotulo}
                          onClick={() => marcarPresenca(r.id, m.id, c, c === 'JUSTIFICADO' ? 'Justificação apresentada ao Secretariado' : undefined)}
                          className={`w-8 h-8 rounded-lg border text-[12px] font-extrabold transition-all ${
                            on ? PRESENCA_META[c].cor : 'bg-white border-ink-200 text-ink-300 hover:border-ink-300'
                          }`}
                        >
                          {PRESENCA_META[c].curto}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-3 mt-2">
            {(['PRESENTE', 'JUSTIFICADO', 'INJUSTIFICADO'] as EstadoPresenca[]).map((c) => (
              <span key={c} className="text-[10.5px] text-ink-400 flex items-center gap-1">
                <span className={`w-4 h-4 rounded grid place-items-center text-[9px] font-extrabold ${PRESENCA_META[c].cor}`}>{PRESENCA_META[c].curto}</span>
                {PRESENCA_META[c].rotulo}
              </span>
            ))}
          </div>
        </div>

        {/* encerramento */}
        {r.estado === 'AGENDADA' && (
          <div className="rounded-xl border border-ink-100 p-4 space-y-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400">
              Encerramento da sessão <Lei id="manual_duracao" discreto className="ml-1" />
            </p>
            <Campo rotulo={`Duração efectiva: ${duracao} minutos`} nota={duracao > 90 ? 'Acima do limite de 90 minutos fixado no Manual da Célula.' : 'Dentro do limite de 90 minutos.'}>
              <input type="range" className="sgc w-full" min={20} max={150} step={5} value={duracao} onChange={(ev) => setDuracao(Number(ev.target.value))} />
            </Campo>
            <Campo rotulo="Síntese dos assuntos debatidos">
              <Input value={resumo} onChange={(ev) => setResumo(ev.target.value)} placeholder="Principais assuntos e deliberações…" />
            </Campo>
          </div>
        )}

        {/* decisões */}
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">
            Decisões, responsáveis e prazos
          </p>
          <ul className="space-y-1.5 mb-3">
            {r.decisoes.map((d) => {
              const resp = e.membros.find((m) => m.id === d.responsavelId);
              return (
                <li key={d.id} className="flex items-start gap-3 p-2.5 rounded-xl border border-ink-100">
                  <input type="checkbox" className="sgc mt-0.5" checked={d.cumprida} onChange={() => toggleDecisao(r.id, d.id)} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] leading-snug ${d.cumprida ? 'text-ink-300 line-through' : 'text-ink-600'}`}>{d.texto}</p>
                    <p className="text-[11px] text-ink-400 mt-0.5">
                      {resp?.nome ?? '—'} · prazo {dataMedia(d.prazo)}
                    </p>
                  </div>
                  {d.cumprida ? <Pill tom="verde">cumprida</Pill> : d.prazo < e.hoje ? <Pill tom="brand">em atraso</Pill> : <Pill tom="neutro">em curso</Pill>}
                </li>
              );
            })}
            {r.decisoes.length === 0 && <li className="text-[13px] text-ink-300 py-2">Sem decisões registadas.</li>}
          </ul>
          <div className="flex gap-2">
            <Input value={novaDecisao} onChange={(ev) => setNovaDecisao(ev.target.value)} placeholder="Nova decisão…" />
            <Select value={responsavel} onChange={(ev) => setResponsavel(ev.target.value)} className="!w-40">
              {membrosDaCelula(e).map((m) => (<option key={m.id} value={m.id}>{m.nome.split(' ')[0]}</option>))}
            </Select>
            <Btn
              variante="escura"
              disabled={!novaDecisao.trim()}
              onClick={() => { addDecisao(r.id, novaDecisao, responsavel, addDays(e.hoje, 21)); setNovaDecisao(''); }}
            >
              Juntar
            </Btn>
          </div>
        </div>

        {/* acta */}
        <div className="rounded-xl border border-ink-100 p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">
            Acta da sessão <Lei id="manual_acta" discreto className="ml-1" />
          </p>
          {r.acta ? (
            <>
              <Linha rotulo="Ficheiro"><span className="font-mono text-[12.5px]">{r.acta.ficheiro}</span></Linha>
              <Linha rotulo="Anexada em">{dataMedia(r.acta.anexadaEm)}</Linha>
              <Linha rotulo="Aprovação">
                {r.acta.aprovadaEm ? <span className="text-verde-700">lida e aprovada em {dataMedia(r.acta.aprovadaEm)}</span> : <span className="text-gold-600">pendente de leitura na reunião seguinte</span>}
              </Linha>
            </>
          ) : (
            <p className="text-[13px] text-ink-400 leading-relaxed">
              Sem Acta anexada. A estrutura-tipo inclui identificação da Célula, data, hora e local, quem dirigiu, presentes,
              ausentes justificados e não justificados, pontos da agenda, assuntos debatidos e decisões com responsáveis e prazos.
            </p>
          )}
        </div>
      </div>
    </Gaveta>
  );
};

/* ════════════════════════════════ Vista ════════════════════════════════════ */

export const Reunioes: React.FC = () => {
  const { e, params, irPara } = useStore();
  const [aba, setAba] = useState<'proximas' | 'historico' | 'actas'>('proximas');
  const [marcar, setMarcar] = useState(false);
  const [aberta, setAberta] = useState<string | null>(null);

  useEffect(() => {
    if (params.acao === 'marcar') setMarcar(true);
    if (params.reuniao) setAberta(params.reuniao);
  }, [params]);

  const proximas = useMemo(
    () => e.reunioes.filter((r) => r.estado === 'AGENDADA' && r.data >= e.hoje).sort((a, b) => (a.data > b.data ? 1 : -1)),
    [e],
  );
  const historico = useMemo(
    () => e.reunioes.filter((r) => r.estado !== 'AGENDADA' || r.data < e.hoje).sort((a, b) => (a.data < b.data ? 1 : -1)),
    [e],
  );
  const pendentes = useMemo(() => actasPendentes(e), [e]);
  const cadencia = useMemo(() => cadenciaReuniaoGeral(e), [e]);
  const reuniao = aberta ? e.reunioes.find((r) => r.id === aberta) : undefined;

  const rgAno = e.reunioes.filter((r) => r.tipo === 'REUNIAO_GERAL' && r.estado === 'REALIZADA' && r.data >= `${e.hoje.slice(0, 4)}-01-01`).length;
  const secAno = e.reunioes.filter((r) => r.tipo === 'SECRETARIADO' && r.estado === 'REALIZADA' && r.data >= `${e.hoje.slice(0, 4)}-01-01`).length;
  const actAno = e.reunioes.filter((r) => ['ESTUDO_POLITICO', 'AUSCULTACAO', 'CULTURAL', 'SOLIDARIEDADE'].includes(r.tipo) && r.estado === 'REALIZADA').length;

  const Cartao: React.FC<{ r: Reuniao }> = ({ r }) => {
    const meta = TIPO_META[r.tipo];
    const conv = estadoConvocatoria(r, e.hoje);
    const vals = Object.values(r.presencas);
    const presentes = vals.filter((v) => v === 'PRESENTE').length;
    return (
      <button onClick={() => setAberta(r.id)} className="text-left w-full">
        <Card className="lift hover:shadow-lift h-full" pad={false}>
          <div className="flex">
            <div className={`w-1.5 rounded-l-2xl flex-none ${meta.cor}`} />
            <div className="flex-1 p-4 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Pill tom={meta.tom}>{meta.rotulo}</Pill>
                  <p className="text-[14px] font-bold text-ink mt-2 leading-snug">{r.titulo}</p>
                </div>
                <div className="text-right flex-none">
                  <p className="text-[22px] font-extrabold tnum text-ink leading-none">{r.data.slice(8)}</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mt-1">{nomeMesCurto(mesDe(r.data))}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="flex items-center gap-2 text-[12px] text-ink-400"><IcRelogio className="w-3.5 h-3.5 text-ink-300" />{r.hora}{r.duracaoMin ? ` · ${r.duracaoMin} min` : ''}</p>
                <p className="flex items-center gap-2 text-[12px] text-ink-400 truncate"><IcLocal className="w-3.5 h-3.5 text-ink-300 flex-none" />{r.local}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-2 flex-wrap">
                {r.estado === 'AGENDADA' ? (
                  conv.enviada ? <Pill tom="verde"><IcCheck className="w-3 h-3" />convocada</Pill> : <Pill tom={conv.expirado ? 'brand' : 'gold'}>convocatória em falta</Pill>
                ) : (
                  <>
                    <Pill tom="neutro">{presentes}/{vals.length} presentes</Pill>
                    {r.acta ? (
                      r.acta.aprovadaEm ? <Pill tom="verde">Acta aprovada</Pill> : <Pill tom="gold">Acta por aprovar</Pill>
                    ) : (
                      <Pill tom="brand">sem Acta</Pill>
                    )}
                  </>
                )}
                {r.estado === 'AGENDADA' && <span className="ml-auto text-[11.5px] font-bold text-ink-400">{relativo(r.data, e.hoje)}</span>}
              </div>
            </div>
          </div>
        </Card>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Stat
          rotulo="Reuniões Gerais este ano"
          valor={num(rgAno)}
          icone={<IcCalendario className="w-5 h-5" />}
          nota={`${cadencia.realizadas} de 12 nos últimos doze meses`}
          tom={cadencia.realizadas >= 11 ? 'verde' : 'gold'}
        />
        <Stat rotulo="Sessões do Secretariado" valor={num(secAno)} nota="Cadência de quinze em quinze dias" />
        <Stat rotulo="Actividades da Célula" valor={num(actAno)} nota="Estudo político, auscultação, cultura, solidariedade" />
        <Stat
          rotulo="Actas por aprovar"
          valor={num(pendentes.length)}
          tom={pendentes.length === 0 ? 'verde' : 'brand'}
          nota="Cada Acta é lida e aprovada na reunião seguinte"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Segmentado
          itens={[
            { id: 'proximas', rotulo: `Agendadas (${proximas.length})` },
            { id: 'historico', rotulo: `Histórico (${historico.length})` },
            { id: 'actas', rotulo: `Actas (${e.reunioes.filter((r) => r.acta).length})` },
          ]}
          activo={aba}
          onMudar={(v) => setAba(v as any)}
        />
        <span className="flex-1" />
        <Btn variante="primaria" icone={<IcMais className="w-4 h-4" />} onClick={() => setMarcar(true)}>Marcar reunião</Btn>
      </div>

      {aba === 'proximas' && (
        proximas.length === 0 ? (
          <Card><Vazio titulo="Nada agendado" texto="A Reunião Geral da Célula é mensal." accao={<Btn variante="primaria" onClick={() => setMarcar(true)}>Marcar reunião</Btn>} /></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {proximas.map((r) => (<Cartao key={r.id} r={r} />))}
          </div>
        )
      )}

      {aba === 'historico' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {historico.slice(0, 24).map((r) => (<Cartao key={r.id} r={r} />))}
        </div>
      )}

      {aba === 'actas' && (
        <Card pad={false} titulo="Arquivo de Actas" sub="Cada Acta é lida e aprovada na reunião seguinte">
          <ul className="divide-y divide-ink-100">
            {e.reunioes.filter((r) => r.acta).map((r) => (
              <li key={r.id} className="px-5 py-3.5 flex items-center gap-4">
                <span className="w-9 h-9 rounded-xl bg-ink-50 text-ink-400 grid place-items-center flex-none">
                  <IcCartao className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-ink truncate">{r.acta!.ficheiro}</p>
                  <p className="text-[11.5px] text-ink-400">
                    {r.titulo} · sessão de {dataMedia(r.data)} · anexada em {dataMedia(r.acta!.anexadaEm)}
                  </p>
                </div>
                {r.acta!.aprovadaEm ? (
                  <Pill tom="verde">aprovada {dataCurta(r.acta!.aprovadaEm)}</Pill>
                ) : (
                  <Pill tom="gold">por aprovar</Pill>
                )}
                <Btn tamanho="sm" variante="suave" iconeFim={<IcSeta className="w-3.5 h-3.5" />} onClick={() => setAberta(r.id)}>Abrir</Btn>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <MarcarReuniao aberto={marcar} onFechar={() => { setMarcar(false); irPara('reunioes'); }} />
      {reuniao && <FichaReuniao r={reuniao} onFechar={() => { setAberta(null); irPara('reunioes'); }} />}
    </div>
  );
};

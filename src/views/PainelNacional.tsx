import React, { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useStore } from '../lib/store';
import { serieNacional, totaisNacionais } from '../lib/selectors';
import { REGRAS } from '../lib/estatutos';
import { compacto, mt, nomeMes, nomeMesCurto, num, pct, ultimosMeses } from '../lib/format';
import {
  Alerta, Barra, Card, Contador, Emblema, FaixaBandeira, Lei, Linha, Micrografico, Pill, Segmentado,
  Stat, Tabela,
} from '../ui/primitives';
import { IcCalendario, IcEscudo, IcMapa, IcMembros, IcMoeda, IcRede, IcUrna } from '../ui/icons';
import type { ProvinciaResumo } from '../lib/types';

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

export const PainelNacional: React.FC = () => {
  const { e, params } = useStore();
  const [aba, setAba] = useState<'sintese' | 'reunioes' | 'provincias' | 'adopcao'>('sintese');
  const [ordem, setOrdem] = useState<keyof ProvinciaResumo>('reunioesMes');

  useEffect(() => {
    if (params.tab === 'reunioes') setAba('reunioes');
    else if (params.tab === 'provincias') setAba('provincias');
    else if (params.tab === 'adopcao') setAba('adopcao');
    else setAba('sintese');
  }, [params]);

  const t = useMemo(() => totaisNacionais(e), [e]);
  const serie = useMemo(() => serieNacional(e), [e]);
  const provincias = useMemo(
    () => [...e.provincias].sort((a, b) => (b[ordem] as number) - (a[ordem] as number)),
    [e.provincias, ordem],
  );
  const meses = ultimosMeses(e.hoje, 12);

  /** Sessões esperadas por mês em todo o País: 1 Reunião Geral + 2 sessões do Secretariado por Célula. */
  const secretariadoMes = Math.round(t.celulasAderentes * 1.85);
  const totalSessoesMes = t.reunioesMes + secretariadoMes;

  const dadosProvincia = provincias.map((p) => ({
    nome: p.nome.replace('Província de ', '').replace('Cidade de ', ''),
    reunioes: p.reunioesMes,
    esperadas: p.reunioesEsperadas,
    taxa: Math.round((p.reunioesMes / Math.max(1, p.reunioesEsperadas)) * 100),
  }));

  return (
    <div className="space-y-5">
      {/* faixa nacional */}
      <section className="rounded-3xl hero-bg text-white overflow-hidden shadow-rail relative">
        <FaixaBandeira altura={4} />
        <div className="absolute inset-0 grid-paper opacity-[0.06]" />
        <div className="faixa-diagonal absolute -top-16 -right-24 w-72 h-44 opacity-[0.15] rotate-12" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-end">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Emblema tamanho={44} />
                <div className="leading-none">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-brand-300">FRELIMO</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40 mt-1.5">
                    Administração Central do Sistema
                  </p>
                </div>
              </div>
              <Pill tom="gold" className="!bg-gold-500/15 !text-gold-300 !border-gold-500/30">Do Rovuma ao Maputo</Pill>
              <h2 className="text-[27px] sm:text-[34px] font-extrabold tracking-tight mt-3 leading-tight">
                A estrutura celular do Partido, vista de cima.
              </h2>
              <p className="text-white/55 mt-2.5 text-[14.5px] leading-relaxed max-w-2xl">
                Onze províncias e a Diáspora. Cada Reunião Geral registada numa Célula soma-se aqui, no mesmo instante,
                sem circulares, sem folhas de cálculo e sem pedir nada ao Secretariado.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-none">
              {[
                { r: 'Células no sistema', v: t.celulasAderentes, s: '' },
                { r: 'Membros registados', v: t.membros, s: '' },
                { r: 'Reuniões este mês', v: t.reunioesMes, s: '' },
                { r: 'Reuniões no ano', v: t.reunioesAno, s: '' },
              ].map((x) => (
                <div key={x.r}>
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-white/35">{x.r}</p>
                  <p className="text-[27px] font-extrabold tnum leading-none mt-1.5">
                    <Contador valor={x.v} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="marquee-wrap relative border-t border-white/10 overflow-hidden">
          <div className="marquee-track py-2.5">
            {[0, 1].map((k) => (
              <div key={k} className="flex items-center gap-8 pr-8">
                {e.provincias.map((p) => (
                  <span key={p.codigo} className="flex items-center gap-2 text-[11.5px] whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                    <span className="font-bold text-white/80">{p.nome}</span>
                    <span className="text-white/35 tnum">{num(p.reunioesMes)} reuniões · {num(p.celulasAderentes)} células · {p.cotizacao}% cotização</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Segmentado
        itens={[
          { id: 'sintese', rotulo: 'Síntese' },
          { id: 'reunioes', rotulo: 'Reuniões no País' },
          { id: 'provincias', rotulo: 'Províncias' },
          { id: 'adopcao', rotulo: 'Adopção' },
        ]}
        activo={aba}
        onMudar={(v) => setAba(v as any)}
      />

      {/* ═══════════════════════════ Síntese ═══════════════════════════ */}
      {aba === 'sintese' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger">
            <Stat rotulo="Células aderentes" valor={compacto(t.celulasAderentes)} icone={<IcRede className="w-5 h-5" />} nota={`${pct(t.adopcao, 1)} das ${compacto(t.celulasTotais)} Células do País`} />
            <Stat rotulo="Membros" valor={compacto(t.membros)} icone={<IcMembros className="w-5 h-5" />} nota="Fichas activas na plataforma" />
            <Stat rotulo="Reuniões este mês" valor={compacto(t.reunioesMes)} tom="brand" icone={<IcCalendario className="w-5 h-5" />} nota={`${pct(t.taxaRealizacao)} da cadência mensal`} />
            <Stat rotulo="Cotização consolidada" valor={mt(t.valorMes)} tom="verde" icone={<IcMoeda className="w-5 h-5" />} nota={`${mt(t.paraEscaloes)} para os escalões`} />
            <Stat rotulo="Eleições em curso" valor={compacto(t.eleicoesAbertas)} icone={<IcUrna className="w-5 h-5" />} nota="Processos abertos nas Células" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Card
              className="xl:col-span-2"
              titulo="Reuniões de Célula realizadas em todo o País"
              sub="Últimos doze meses — a curva acompanha a expansão do sistema"
              accao={<Lei id="art35n6" />}
            >
              <div className="h-[250px] -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gNac" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E61923" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#E61923" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1EDED" vertical={false} />
                    <XAxis dataKey="mes" tickFormatter={nomeMesCurto} tick={{ fontSize: 11, fill: '#9E9797', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => compacto(v)} tick={{ fontSize: 11, fill: '#9E9797' }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip content={<CaixaTooltip />} labelFormatter={(l) => nomeMes(String(l))} />
                    <Area type="monotone" dataKey="reunioes" name="Reuniões Gerais" stroke="#E61923" strokeWidth={2.4} fill="url(#gNac)" />
                    <Area type="monotone" dataKey="celulas" name="Células no sistema" stroke="#00A34F" strokeWidth={1.6} strokeDasharray="4 3" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card titulo="Conformidade nacional" sub="Média ponderada das Células no sistema" accao={<Lei id="art21b" />}>
              <div className="space-y-4">
                {[
                  { r: 'Cadência das Reuniões Gerais', v: t.taxaRealizacao, n: `${compacto(t.reunioesMes)} de ${compacto(t.reunioesEsperadas)} esperadas` },
                  { r: 'Cotização', v: t.cotizacao, n: 'Membros em dia' },
                  { r: 'Assiduidade', v: t.assiduidade, n: 'Presenças nas Reuniões Gerais' },
                  { r: 'Adopção do sistema', v: t.adopcao, n: `${compacto(t.celulasAderentes)} de ${compacto(t.celulasTotais)} Células` },
                ].map((x) => (
                  <div key={x.r}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12.5px] font-bold text-ink-600">{x.r}</span>
                      <span className="text-[14px] font-extrabold tnum text-ink">{pct(x.v, x.v < 20 ? 1 : 0)}</span>
                    </div>
                    <Barra valor={x.v} tom={x.v >= 75 ? 'bg-verde-600' : x.v >= 50 ? 'bg-gold-500' : 'bg-brand-600'} />
                    <p className="text-[11px] text-ink-300 mt-1">{x.n}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-ink-100">
                <Linha rotulo="Retido nas Células (60%)"><span className="text-verde-700">{mt(t.retidoCelulas)}</span></Linha>
                <Linha rotulo="Para os escalões (40%)"><span className="text-brand-700">{mt(t.paraEscaloes)}</span></Linha>
              </div>
            </Card>
          </div>

          <Card titulo="Reuniões deste mês por província" sub="Barra cheia = cadência mensal cumprida por todas as Células aderentes">
            <div className="h-[280px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosProvincia} margin={{ top: 4, right: 4, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1EDED" vertical={false} />
                  <XAxis dataKey="nome" tick={{ fontSize: 10.5, fill: '#9E9797', fontWeight: 700 }} axisLine={false} tickLine={false} angle={-38} textAnchor="end" interval={0} />
                  <YAxis tickFormatter={(v: number) => compacto(v)} tick={{ fontSize: 11, fill: '#9E9797' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<CaixaTooltip />} cursor={{ fill: '#F8F6F6' }} />
                  <Bar dataKey="esperadas" name="Esperadas" fill="#EDE9E9" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="reunioes" name="Realizadas" radius={[5, 5, 0, 0]}>
                    {dadosProvincia.map((d, i) => (
                      <Cell key={i} fill={d.taxa >= 85 ? '#00A34F' : d.taxa >= 65 ? '#F5D400' : '#E61923'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {/* ═══════════════════════ Reuniões no País ═══════════════════════ */}
      {aba === 'reunioes' && (
        <>
          <Card>
            <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
              <div className="flex-1">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-400">Contagem consolidada</p>
                <h2 className="text-[21px] font-extrabold text-ink tracking-tight mt-1">
                  Quantas reuniões de Célula se realizaram em todo o País
                </h2>
                <p className="text-[13.5px] text-ink-400 mt-2 leading-relaxed max-w-2xl">
                  A Reunião Geral da Célula é mensal e o Secretariado reúne de quinze em quinze dias. Com estas duas regras,
                  o número de sessões esperadas em todo o País é conhecido de antemão — e o sistema mostra, a qualquer
                  momento, quantas foram efectivamente realizadas.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Lei id="art35n6" />
                  <Lei id="art35n9" />
                  <Lei id="art21b" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-none">
                <div className="rounded-2xl bg-ink text-white p-5 min-w-[170px]">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-white/40">Reuniões Gerais este mês</p>
                  <p className="text-[34px] font-extrabold tnum leading-none mt-2"><Contador valor={t.reunioesMes} /></p>
                  <p className="text-[11.5px] text-white/45 mt-1.5">de {compacto(t.reunioesEsperadas)} esperadas</p>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2.5">
                    <div className="h-1.5 rounded-full bg-gold-500" style={{ width: `${t.taxaRealizacao}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl bg-verde-100 border border-verde-200 p-5 min-w-[170px]">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-verde-700">Total de sessões este mês</p>
                  <p className="text-[34px] font-extrabold tnum leading-none mt-2 text-verde-900"><Contador valor={totalSessoesMes} /></p>
                  <p className="text-[11.5px] text-verde-800/70 mt-1.5">
                    inclui {compacto(secretariadoMes)} sessões do Secretariado
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <Stat rotulo="Reuniões Gerais no ano" valor={compacto(t.reunioesAno)} icone={<IcCalendario className="w-5 h-5" />} nota="Acumulado dos últimos doze meses" />
            <Stat rotulo="Taxa de realização" valor={pct(t.taxaRealizacao)} tom={t.taxaRealizacao >= 80 ? 'verde' : 'gold'} nota="Sessões realizadas sobre esperadas" />
            <Stat rotulo="Média por Célula/ano" valor={(t.reunioesAno / Math.max(1, t.celulasAderentes)).toFixed(1).replace('.', ',')} nota="Referência estatutária: 12 sessões" />
            <Stat rotulo="Células sem sessão no mês" valor={compacto(t.reunioesEsperadas - t.reunioesMes)} tom="brand" nota="Merecem apoio do Círculo" />
          </div>

          <Card titulo="Série mensal de reuniões em todo o País" sub="Cada barra é o total nacional do mês">
            <div className="h-[260px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1EDED" vertical={false} />
                  <XAxis dataKey="mes" tickFormatter={nomeMesCurto} tick={{ fontSize: 11, fill: '#9E9797', fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => compacto(v)} tick={{ fontSize: 11, fill: '#9E9797' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<CaixaTooltip />} cursor={{ fill: '#F8F6F6' }} labelFormatter={(l) => nomeMes(String(l))} />
                  <Bar dataKey="reunioes" name="Reuniões Gerais" fill="#E61923" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card pad={false} titulo="Reuniões por província" sub="Realizadas neste mês, acumulado do ano e evolução de doze meses">
            <Tabela>
              <thead>
                <tr>
                  <th>Província</th><th>Células</th><th>Reuniões no mês</th><th>Cadência</th>
                  <th>Reuniões no ano</th><th>Média/Célula</th><th>Evolução 12 meses</th>
                </tr>
              </thead>
              <tbody>
                {[...e.provincias].sort((a, b) => b.reunioesMes - a.reunioesMes).map((p) => {
                  const taxa = (p.reunioesMes / Math.max(1, p.reunioesEsperadas)) * 100;
                  return (
                    <tr key={p.codigo}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-ink-50 text-ink-400 grid place-items-center flex-none text-[10px] font-extrabold font-mono">
                            {p.codigo.replace('P', '')}
                          </span>
                          <span className="font-bold text-ink">{p.nome}</span>
                        </div>
                      </td>
                      <td className="tnum">{num(p.celulasAderentes)}</td>
                      <td className="tnum font-extrabold text-[14px]">{num(p.reunioesMes)}</td>
                      <td>
                        <div className="flex items-center gap-2 w-28">
                          <span className={`tnum font-bold text-[12px] w-9 ${taxa >= 85 ? 'text-verde-700' : taxa >= 65 ? 'text-gold-600' : 'text-brand-600'}`}>
                            {Math.round(taxa)}%
                          </span>
                          <Barra valor={taxa} alt="h-1.5" tom={taxa >= 85 ? 'bg-verde-600' : taxa >= 65 ? 'bg-gold-500' : 'bg-brand-600'} />
                        </div>
                      </td>
                      <td className="tnum">{num(p.reunioesAno)}</td>
                      <td className="tnum">{(p.reunioesAno / Math.max(1, p.celulasAderentes)).toFixed(1).replace('.', ',')}</td>
                      <td>
                        <div className="w-28">
                          <Micrografico dados={p.serie12m} cor="#E61923" altura={26} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-ink-50">
                  <td className="font-extrabold text-ink">Total nacional</td>
                  <td className="tnum font-extrabold">{num(t.celulasAderentes)}</td>
                  <td className="tnum font-extrabold text-[15px] text-brand-700">{num(t.reunioesMes)}</td>
                  <td className="tnum font-extrabold">{pct(t.taxaRealizacao)}</td>
                  <td className="tnum font-extrabold">{num(t.reunioesAno)}</td>
                  <td className="tnum font-extrabold">{(t.reunioesAno / Math.max(1, t.celulasAderentes)).toFixed(1).replace('.', ',')}</td>
                  <td>
                    <div className="w-28"><Micrografico dados={serie.map((s) => s.reunioes)} cor="#00A34F" altura={26} /></div>
                  </td>
                </tr>
              </tbody>
            </Tabela>
          </Card>

          <Alerta tom="azul" titulo="Como o número é apurado" base="art35n6">
            Cada Célula registada no sistema tem uma Reunião Geral esperada por mês. O total esperado é, portanto, igual ao
            número de Células aderentes. As sessões do Secretariado, de quinze em quinze dias, acrescentam cerca de 1,85
            sessões por Célula e por mês. Não há qualquer estimativa manual: o número sobe quando um Secretariado encerra
            uma sessão no seu telemóvel.
          </Alerta>
        </>
      )}

      {/* ═══════════════════════════ Províncias ═══════════════════════════ */}
      {aba === 'provincias' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold text-ink-400">Ordenar por</span>
            <Segmentado
              itens={[
                { id: 'reunioesMes', rotulo: 'Reuniões' },
                { id: 'celulasAderentes', rotulo: 'Células' },
                { id: 'membros', rotulo: 'Membros' },
                { id: 'cotizacao', rotulo: 'Cotização' },
              ]}
              activo={ordem as string}
              onMudar={(v) => setOrdem(v as keyof ProvinciaResumo)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {provincias.map((p, i) => {
              const taxa = (p.reunioesMes / Math.max(1, p.reunioesEsperadas)) * 100;
              return (
                <Card key={p.codigo} className="lift hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg grid place-items-center text-[10px] font-extrabold flex-none ${i === 0 ? 'bg-gold-500 text-white' : 'bg-ink-50 text-ink-400'}`}>
                          {i + 1}
                        </span>
                        <p className="text-[14.5px] font-bold text-ink truncate">{p.nome}</p>
                      </div>
                      <p className="text-[11.5px] text-ink-400 mt-1">
                        {num(p.celulasAderentes)} de {num(p.celulasTotais)} Células no sistema
                      </p>
                    </div>
                    <Pill tom={taxa >= 85 ? 'verde' : taxa >= 65 ? 'gold' : 'brand'}>{Math.round(taxa)}%</Pill>
                  </div>

                  <div className="mt-3.5">
                    <Micrografico dados={p.serie12m} cor={taxa >= 85 ? '#00A34F' : '#E61923'} altura={40} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-ink-100">
                    <div>
                      <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Reuniões no mês</p>
                      <p className="text-[17px] font-extrabold tnum text-ink">{num(p.reunioesMes)}</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Membros</p>
                      <p className="text-[17px] font-extrabold tnum text-ink">{compacto(p.membros)}</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Cotização</p>
                      <p className="text-[17px] font-extrabold tnum text-verde-700">{p.cotizacao}%</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Cobrado no mês</p>
                      <p className="text-[17px] font-extrabold tnum text-ink">{compacto(p.valorMes)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-2">
                    <Pill tom="neutro">{num(p.eleicoesAbertas)} eleições em curso</Pill>
                    <Pill tom="neutro">{p.assiduidade}% assiduidade</Pill>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════ Adopção ═══════════════════════════ */}
      {aba === 'adopcao' && (
        <>
          <Card titulo="Implementação faseada" sub="A expansão faz-se por demonstração de utilidade, não por imposição">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { f: 'Fase 1', t: 'Piloto', d: 'Configuração e teste num número reduzido de Células, num único Círculo.', on: true },
                { f: 'Fase 2', t: 'Ajustes', d: 'Recolha da experiência do piloto e ajuste de formulários e modelos.', on: true },
                { f: 'Fase 3', t: 'Expansão faseada', d: 'Alargamento progressivo a mais Círculos e Distritos, com formação e pontos focais locais.', on: true },
                { f: 'Fase 4', t: 'Enriquecimento', d: 'Activação gradual das funcionalidades adiadas, começando pelas mais pedidas pelas Células.', on: false },
              ].map((x) => (
                <div key={x.f} className={`rounded-2xl border p-4 ${x.on ? 'border-verde-200 bg-verde-100/40' : 'border-ink-100 bg-ink-50/40'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg grid place-items-center text-[10px] font-extrabold ${x.on ? 'bg-verde-600 text-white' : 'bg-ink-200 text-ink-500'}`}>
                      {x.f.replace('Fase ', '')}
                    </span>
                    <p className="text-[13.5px] font-bold text-ink">{x.t}</p>
                  </div>
                  <p className="text-[12px] text-ink-500 mt-2 leading-relaxed">{x.d}</p>
                  <Pill tom={x.on ? 'verde' : 'neutro'} className="mt-3">{x.on ? 'em curso' : 'planeada'}</Pill>
                </div>
              ))}
            </div>
          </Card>

          <Card pad={false} titulo="Adopção por província" sub={`${pct(t.adopcao, 1)} das Células do País já usam o sistema`}>
            <Tabela>
              <thead>
                <tr><th>Província</th><th>Células no sistema</th><th>Células no total</th><th>Adopção</th><th>Membros</th><th>Média de membros/Célula</th></tr>
              </thead>
              <tbody>
                {[...e.provincias]
                  .sort((a, b) => b.celulasAderentes / b.celulasTotais - a.celulasAderentes / a.celulasTotais)
                  .map((p) => {
                    const ad = (p.celulasAderentes / p.celulasTotais) * 100;
                    const media = p.membros / Math.max(1, p.celulasAderentes);
                    return (
                      <tr key={p.codigo}>
                        <td className="font-bold text-ink">{p.nome}</td>
                        <td className="tnum">{num(p.celulasAderentes)}</td>
                        <td className="tnum text-ink-400">{num(p.celulasTotais)}</td>
                        <td>
                          <div className="flex items-center gap-2 w-32">
                            <span className="tnum font-bold text-[12px] w-10">{pct(ad, 1)}</span>
                            <Barra valor={ad * 5} alt="h-1.5" tom="bg-ink" />
                          </div>
                        </td>
                        <td className="tnum">{compacto(p.membros)}</td>
                        <td>
                          <span className={`tnum font-bold ${media > REGRAS.MAX_MEMBROS_CELULA ? 'text-brand-600' : media < REGRAS.MIN_MEMBROS_CELULA ? 'text-brand-600' : 'text-ink'}`}>
                            {media.toFixed(1).replace('.', ',')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </Tabela>
            <div className="px-5 py-3.5 border-t border-ink-100 bg-ink-50/60 flex items-start gap-2.5">
              <IcEscudo className="w-4 h-4 text-ink-300 flex-none mt-0.5" />
              <p className="text-[11.5px] text-ink-400 leading-relaxed">
                A média de membros por Célula é um indicador de saúde orgânica: a Célula é constituída por um mínimo de cinco
                e um máximo de quinze membros. Médias fora deste intervalo sinalizam Células a dividir ou a reforçar.
                <Lei id="art35" discreto className="ml-1.5" />
              </p>
            </div>
          </Card>

          <Card titulo="O que falta activar" sub="Funcionalidades expressamente adiadas na Versão 1" pad={false}>
            <ul className="divide-y divide-ink-100">
              {[
                { t: 'Plano de Actividades anual estruturado', d: 'Aprovado pela Reunião Geral, com verificação do grau de cumprimento.' },
                { t: 'Processos disciplinares e módulo do Elemento de Ligação', d: 'Sanções, audição prévia e recursos até ao Comité Central.' },
                { t: 'Apoio ao recenseamento e mobilização eleitoral', d: 'Cruzamento entre membros, cartão de eleitor e mesas de voto.' },
                { t: 'Elaboração estruturada de actas dentro do sistema', d: 'Hoje a Acta é anexada como ficheiro à reunião.' },
                { t: 'Aplicação móvel com modo offline', d: 'Para zonas com conectividade limitada.' },
              ].map((x) => (
                <li key={x.t} className="px-5 py-3.5 flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-lg border border-dashed border-ink-200 grid place-items-center flex-none text-ink-300">
                    <IcMapa className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink">{x.t}</p>
                    <p className="text-[12px] text-ink-400 mt-0.5">{x.d}</p>
                  </div>
                  <Pill tom="neutro">fase 4</Pill>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
};

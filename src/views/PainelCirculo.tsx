import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../lib/store';
import { totaisCirculo } from '../lib/selectors';
import { MEMBROS_EXTERNOS } from '../lib/seed';
import { compacto, dataMedia, mt, num, pct, relativo } from '../lib/format';
import {
  Alerta, Avatar, Barra, Btn, Card, Contador, Emblema, FaixaBandeira, Lei, Linha, Pill, Segmentado,
  Stat, Tabela, Vazio,
} from '../ui/primitives';
import { IcAviso, IcCheck, IcEscudo, IcMembros, IcMoeda, IcRede, IcSeta, IcUrna } from '../ui/icons';
import type { CelulaResumo } from '../lib/types';

export const PainelCirculo: React.FC = () => {
  const { e, params, irPara } = useStore();
  const [aba, setAba] = useState<'sintese' | 'celulas'>('sintese');
  const [ordem, setOrdem] = useState<'ivo' | 'cotizacao' | 'assiduidade' | 'membros'>('ivo');

  useEffect(() => { if (params.tab === 'celulas') setAba('celulas'); }, [params]);

  const t = useMemo(() => totaisCirculo(e), [e]);
  const celulas = useMemo(
    () => [...e.celulasCirculo].sort((a, b) => (b[ordem] as number) - (a[ordem] as number)),
    [e.celulasCirculo, ordem],
  );
  const comAlertas = e.celulasCirculo.filter((c) => c.alertas.length > 0);
  const primeiroSec = MEMBROS_EXTERNOS.ext_01;
  const eleicoesCirculo = e.eleicoes.filter((el) => el.escopo !== 'CELULA');

  const dados = [...e.celulasCirculo]
    .sort((a, b) => a.numero - b.numero)
    .map((c) => ({ nome: `n.º ${c.numero}`, ivo: c.ivo, cot: c.cotizacao, propria: c.numero === 7 }));

  const Tooltip1: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const c = e.celulasCirculo.find((x) => `n.º ${x.numero}` === payload[0].payload.nome);
    if (!c) return null;
    return (
      <div className="rounded-xl bg-ink text-white px-3 py-2.5 shadow-rail">
        <p className="text-[12.5px] font-bold">{c.nome}</p>
        <p className="text-[11.5px] text-white/60 mt-0.5">Secretário: {c.secretario}</p>
        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[11.5px] space-y-0.5">
          <p>Vitalidade <strong className="tnum">{c.ivo}</strong></p>
          <p>Cotização <strong className="tnum">{c.cotizacao}%</strong></p>
          <p>Assiduidade <strong className="tnum">{c.assiduidade}%</strong></p>
          <p>{c.membros} membros · {c.reunioesAno} sessões no ano</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* cabeçalho do círculo */}
      <section className="rounded-3xl hero-bg text-white overflow-hidden shadow-rail relative">
        <FaixaBandeira altura={4} />
        <div className="absolute inset-0 grid-paper opacity-[0.06]" />
        <div className="faixa-diagonal absolute -top-14 -right-20 w-56 h-36 opacity-[0.14] rotate-12" />
        <div className="relative p-6 sm:p-7 flex flex-col lg:flex-row gap-7 lg:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Emblema tamanho={40} />
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-brand-300">FRELIMO</p>
            </div>
            <Pill tom="gold" className="!bg-gold-500/15 !text-gold-300 !border-gold-500/30">{e.circulo.nome}</Pill>
            <h2 className="text-[26px] font-extrabold tracking-tight mt-3">Onze Células subordinadas, uma responsabilidade</h2>
            <p className="text-white/55 mt-2 text-[14px] leading-relaxed max-w-2xl">
              Compete ao Comité do Círculo velar pelo funcionamento das Células que lhe são subordinadas e apoiar e dinamizar
              a sua acção. Este painel mostra, sem pedir nada às Células, como está cada uma.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="[&>button]:!bg-white/10 [&>button]:!text-white/70 [&>button]:!border-white/15"><Lei id="art39f" /></span>
              <span className="[&>button]:!bg-white/10 [&>button]:!text-white/70 [&>button]:!border-white/15"><Lei id="art37" /></span>
              <span className="[&>button]:!bg-white/10 [&>button]:!text-white/70 [&>button]:!border-white/15"><Lei id="art38" /></span>
            </div>
          </div>
          <div className="flex-none rounded-2xl bg-white/[0.06] border border-white/12 p-5 min-w-[240px]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">Primeiro Secretário</p>
            <div className="flex items-center gap-3 mt-2">
              <Avatar nome={primeiroSec.nome} tamanho={40} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold truncate">{primeiroSec.nome}</p>
                <p className="text-[11.5px] text-white/45">eleito a 4 de Agosto de 2026</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 text-[11.5px] text-white/50 leading-relaxed">
              Eleito pelo Comité do Círculo de entre os seus membros, em segunda volta.
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger">
        <Stat rotulo="Células" valor={<Contador valor={t.celulas} />} icone={<IcRede className="w-5 h-5" />} nota={`${comAlertas.length} com alertas activos`} />
        <Stat rotulo="Membros no Círculo" valor={<Contador valor={t.membros} />} icone={<IcMembros className="w-5 h-5" />} nota="Soma das Células subordinadas" />
        <Stat rotulo="Reuniões este mês" valor={`${t.reunioesMes}/${t.celulas}`} tom={t.reunioesMes >= t.celulas * 0.8 ? 'verde' : 'gold'} nota="Reunião Geral é mensal" />
        <Stat rotulo="Cotização média" valor={pct(t.cotizacao)} tom={t.cotizacao >= 70 ? 'verde' : 'gold'} nota={`${mt(t.valorMes)} cobrados no mês`} />
        <Stat rotulo="Vitalidade média" valor={<Contador valor={t.ivo} />} icone={<IcEscudo className="w-5 h-5" />} nota="Índice composto de cinco pilares" />
      </div>

      <Segmentado
        itens={[{ id: 'sintese', rotulo: 'Síntese' }, { id: 'celulas', rotulo: `Células (${t.celulas})` }]}
        activo={aba}
        onMudar={(v) => setAba(v as any)}
      />

      {aba === 'sintese' && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Card className="xl:col-span-2" titulo="Vitalidade orgânica por Célula" sub="A Célula n.º 7 está destacada" accao={<Lei id="art39f" />}>
              <div className="h-[250px] -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1EDED" vertical={false} />
                    <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#9E9797', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9E9797' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<Tooltip1 />} cursor={{ fill: '#F8F6F6' }} />
                    <Bar dataKey="ivo" radius={[6, 6, 0, 0]} barSize={26}>
                      {dados.map((d, i) => (
                        <Cell key={i} fill={d.propria ? '#E61923' : d.ivo >= 70 ? '#00A34F' : d.ivo >= 50 ? '#F5D400' : '#D0CACA'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card titulo="Células que exigem apoio" sub="Alertas gerados pelas regras estatutárias" pad={false}>
              <ul className="divide-y divide-ink-100 max-h-[290px] overflow-y-auto">
                {comAlertas.map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 grid place-items-center flex-none">
                        <IcAviso className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-ink truncate">{c.nome}</p>
                        <ul className="mt-1 space-y-0.5">
                          {c.alertas.map((a) => (
                            <li key={a} className="text-[11.5px] text-ink-400 leading-snug">· {a}</li>
                          ))}
                        </ul>
                      </div>
                      <Pill tom="brand">{c.ivo}</Pill>
                    </div>
                  </li>
                ))}
                {comAlertas.length === 0 && <li><Vazio titulo="Nenhum alerta" texto="Todas as Células cumprem as regras verificadas." icone={<IcCheck className="w-6 h-6" />} /></li>}
              </ul>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Card titulo="Consolidação financeira" sub="Repartição 60/40 no conjunto do Círculo" accao={<Lei id="manual_6040" />}>
              <Linha rotulo="Cobrado no mês">{mt(t.valorMes)}</Linha>
              <Linha rotulo="Retido nas Células (60%)"><span className="text-verde-700">{mt(t.valorMes * 0.6)}</span></Linha>
              <Linha rotulo="Recebido pelo Círculo (40%)"><span className="text-brand-700">{mt(t.valorMes * 0.4)}</span></Linha>
              <Linha rotulo="Média por membro">{mt(t.valorMes / Math.max(1, t.membros))}</Linha>
              <div className="mt-4">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-verde-600" style={{ width: '60%' }} />
                  <div className="bg-brand-600" style={{ width: '40%' }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10.5px] font-bold text-verde-700">Células 60%</span>
                  <span className="text-[10.5px] font-bold text-brand-600">Escalão 40%</span>
                </div>
              </div>
            </Card>

            <Card titulo="Sessões realizadas" sub="No conjunto das Células subordinadas">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12.5px] font-bold text-ink-600">Reuniões Gerais este mês</span>
                    <span className="text-[15px] font-extrabold tnum text-ink">{t.reunioesMes} de {t.celulas}</span>
                  </div>
                  <Barra valor={(t.reunioesMes / Math.max(1, t.celulas)) * 100} tom="bg-brand-600" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12.5px] font-bold text-ink-600">Sessões acumuladas no ano</span>
                    <span className="text-[15px] font-extrabold tnum text-ink">{t.reunioesAno}</span>
                  </div>
                  <Barra valor={(t.reunioesAno / (t.celulas * 12)) * 100} tom="bg-ink" />
                  <p className="text-[11px] text-ink-400 mt-1.5">
                    Esperadas {t.celulas * 12} sessões por ano (uma Reunião Geral mensal por Célula).
                    <Lei id="art35n6" discreto className="ml-1" />
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12.5px] font-bold text-ink-600">Assiduidade média</span>
                    <span className="text-[15px] font-extrabold tnum text-ink">{pct(t.assiduidade)}</span>
                  </div>
                  <Barra valor={t.assiduidade} tom="bg-verde-600" />
                </div>
              </div>
            </Card>

            <Card titulo="Eleições do escalão" sub="Órgãos do Círculo" accao={<Lei id="art39" />} pad={false}>
              <ul className="divide-y divide-ink-100">
                {eleicoesCirculo.map((el) => (
                  <li key={el.id}>
                    <button onClick={() => irPara('eleicoes', { eleicao: el.id })} className="w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-ink-50/50">
                      <span className="w-8 h-8 rounded-xl bg-ink-50 text-ink-400 grid place-items-center flex-none"><IcUrna className="w-4 h-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-ink leading-snug">{el.titulo}</p>
                        <p className="text-[11.5px] text-ink-400 mt-0.5">
                          {el.fase.toLowerCase().replace('_', ' ')} · escrutínio {dataMedia(el.dataEscrutinio)}
                        </p>
                      </div>
                      <IcSeta className="w-4 h-4 text-ink-300 flex-none mt-1" />
                    </button>
                  </li>
                ))}
                {eleicoesCirculo.length === 0 && <li><Vazio titulo="Sem processos" /></li>}
              </ul>
            </Card>
          </div>
        </>
      )}

      {aba === 'celulas' && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-ink-400">Ordenar por</span>
            <Segmentado
              itens={[
                { id: 'ivo', rotulo: 'Vitalidade' },
                { id: 'cotizacao', rotulo: 'Cotização' },
                { id: 'assiduidade', rotulo: 'Assiduidade' },
                { id: 'membros', rotulo: 'Membros' },
              ]}
              activo={ordem}
              onMudar={(v) => setOrdem(v as any)}
            />
          </div>

          <Card pad={false} titulo="Células subordinadas ao Círculo n.º 12" sub="Dados consolidados automaticamente a partir de cada Célula">
            <Tabela>
              <thead>
                <tr>
                  <th>Célula</th><th>Secretário</th><th>Membros</th><th>Vitalidade</th><th>Cotização</th>
                  <th>Assiduidade</th><th>Sessões/ano</th><th>Última sessão</th><th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                {celulas.map((c: CelulaResumo, i) => (
                  <tr key={c.id} className={c.numero === 7 ? 'bg-brand-50/40' : ''}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-lg grid place-items-center text-[10px] font-extrabold flex-none ${i === 0 ? 'bg-gold-500 text-white' : 'bg-ink-50 text-ink-400'}`}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">{c.nome}</p>
                          <p className="text-[11px] text-ink-400">{c.bairro}</p>
                        </div>
                        {c.numero === 7 && <Pill tom="brand">a minha</Pill>}
                      </div>
                    </td>
                    <td className="text-ink-500">{c.secretario}</td>
                    <td>
                      <span className={`tnum font-bold ${c.membros < 5 || c.membros > 15 ? 'text-brand-600' : 'text-ink'}`}>{c.membros}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 w-24">
                        <span className="tnum font-extrabold text-[13px]">{c.ivo}</span>
                        <Barra valor={c.ivo} alt="h-1.5" tom={c.ivo >= 70 ? 'bg-verde-600' : c.ivo >= 50 ? 'bg-gold-500' : 'bg-brand-600'} />
                      </div>
                    </td>
                    <td className="tnum">{c.cotizacao}%</td>
                    <td className="tnum">{c.assiduidade}%</td>
                    <td className="tnum">{c.reunioesAno}</td>
                    <td className="text-ink-400 text-[12px]">{relativo(c.ultimaReuniao, e.hoje)}</td>
                    <td>
                      {c.alertas.length === 0 ? (
                        <Pill tom="verde"><IcCheck className="w-3 h-3" />ok</Pill>
                      ) : (
                        <Pill tom="brand" ponto>{c.alertas.length}</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          </Card>

          <Alerta tom="azul" titulo="Consolidação sem trabalho adicional para a Célula" base="art21b">
            Os números acima resultam do que cada Secretariado já registou no dia-a-dia. Nenhuma Célula preenche formulários
            para o Círculo: o relatório mensal e a consolidação nascem dos mesmos dados.
          </Alerta>
        </>
      )}
    </div>
  );
};

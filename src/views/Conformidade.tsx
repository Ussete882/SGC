import React, { useMemo } from 'react';
import { useStore } from '../lib/store';
import { calcularIVO, conformidade } from '../lib/selectors';
import { NORMAS } from '../lib/estatutos';
import { pct } from '../lib/format';
import { Anel, Barra, Btn, Card, Lei, Pill, Stat } from '../ui/primitives';
import { IcAviso, IcCheck, IcEscudo, IcLei, IcSeta } from '../ui/icons';

const ESTADO_META = {
  CONFORME: { rotulo: 'conforme', tom: 'verde' as const, cor: 'text-verde-700', fundo: 'bg-verde-100/60 border-verde-200', icone: <IcCheck className="w-4 h-4" /> },
  ATENCAO: { rotulo: 'a corrigir', tom: 'gold' as const, cor: 'text-gold-600', fundo: 'bg-gold-100/60 border-gold-300/60', icone: <IcAviso className="w-4 h-4" /> },
  DESCONFORME: { rotulo: 'desconforme', tom: 'brand' as const, cor: 'text-brand-600', fundo: 'bg-brand-50 border-brand-100', icone: <IcAviso className="w-4 h-4" /> },
};

export const Conformidade: React.FC = () => {
  const { e, irPara } = useStore();
  const conf = useMemo(() => conformidade(e), [e]);
  const ivo = useMemo(() => calcularIVO(e), [e]);

  const conformes = conf.filter((c) => c.estado === 'CONFORME').length;
  const grau = (conformes / conf.length) * 100;

  const normasAplicadas = Array.from(new Set(conf.map((c) => c.base)));

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-7">
          <Anel
            valor={grau}
            tamanho={124}
            espessura={11}
            cor={grau >= 85 ? '#00A34F' : grau >= 60 ? '#F5D400' : '#E61923'}
            centro={
              <>
                <span className="text-[30px] font-extrabold tnum text-ink leading-none">{Math.round(grau)}%</span>
                <span className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-ink-400 mt-1">conforme</span>
              </>
            }
          />
          <div className="flex-1">
            <h2 className="text-[19px] font-extrabold text-ink tracking-tight">Grau de conformidade estatutária</h2>
            <p className="text-[13.5px] text-ink-400 mt-1.5 leading-relaxed max-w-3xl">
              O sistema verifica continuamente {conf.length} obrigações que resultam directamente dos Estatutos da FRELIMO e
              do Manual da Célula. Cada verificação indica a norma em que se apoia e leva ao ecrã onde a situação se corrige.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-verde-700">
                <span className="w-2.5 h-2.5 rounded-full bg-verde-600" />{conformes} conformes
              </span>
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-gold-600">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />{conf.filter((c) => c.estado === 'ATENCAO').length} a corrigir
              </span>
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />{conf.filter((c) => c.estado === 'DESCONFORME').length} desconformes
              </span>
            </div>
          </div>
          <div className="flex-none">
            <div className="rounded-2xl bg-ink text-white p-4 w-[210px]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/40">Vitalidade orgânica</p>
              <p className="text-[30px] font-extrabold tnum leading-none mt-1">{ivo.total}</p>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2.5">
                <div className="h-1.5 rounded-full bg-gold-500" style={{ width: `${ivo.total}%` }} />
              </div>
              <p className="text-[11px] text-white/45 mt-2 leading-snug">
                Composto por cinco pilares, cada um com base normativa própria.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-3">
          {conf.map((c) => {
            const meta = ESTADO_META[c.estado];
            const n = NORMAS[c.base];
            return (
              <div key={c.chave} className={`rounded-2xl border p-4 ${meta.fundo}`}>
                <div className="flex items-start gap-3.5">
                  <span className={`w-9 h-9 rounded-xl bg-white/70 grid place-items-center flex-none ${meta.cor}`}>
                    {meta.icone}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-bold text-ink">{c.titulo}</p>
                      <Pill tom={meta.tom}>{meta.rotulo}</Pill>
                    </div>
                    <p className="text-[13px] text-ink-500 mt-1">{c.detalhe}</p>
                    {n && (
                      <p className="text-[12px] text-ink-400 mt-2 leading-relaxed border-l-2 border-ink-200 pl-3 italic">
                        “{n.texto}”
                        <span className="not-italic font-bold text-ink-400"> — {n.ref}</span>
                      </p>
                    )}
                  </div>
                  {c.accao && (
                    <Btn tamanho="sm" variante={c.estado === 'CONFORME' ? 'fantasma' : 'escura'} iconeFim={<IcSeta className="w-3.5 h-3.5" />} onClick={() => irPara(c.accao!.vista)}>
                      {c.accao.rotulo}
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card titulo="Pilares do índice" sub="Peso de cada dimensão no cálculo">
            <div className="space-y-3.5">
              {ivo.pilares.map((p) => (
                <div key={p.chave}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12.5px] font-bold text-ink-600">{p.nome}</span>
                    <span className="text-[12.5px] font-extrabold tnum text-ink">{p.valor}<span className="text-ink-300 font-semibold">/100</span></span>
                  </div>
                  <Barra valor={p.valor} tom={p.valor >= 75 ? 'bg-verde-600' : p.valor >= 50 ? 'bg-gold-500' : 'bg-brand-600'} alt="h-1.5" />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-ink-300">{p.detalhe}</span>
                    <span className="text-[10.5px] font-bold text-ink-300">peso {p.peso}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card titulo="Base normativa aplicada" sub={`${normasAplicadas.length} normas verificadas automaticamente`} pad={false}>
            <ul className="divide-y divide-ink-100">
              {normasAplicadas.map((b) => {
                const n = NORMAS[b];
                if (!n) return null;
                return (
                  <li key={b} className="px-5 py-3 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-ink-50 text-ink-400 grid place-items-center flex-none">
                      <IcLei className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold text-ink">{n.epigrafe}</p>
                      <p className="text-[11px] text-ink-400">{n.ref} · {n.fonte === 'ESTATUTOS' ? 'Estatutos' : 'Manual da Célula'}</p>
                    </div>
                    <Lei id={b} texto="ver" />
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <IcEscudo className="w-5 h-5 text-ink-300 flex-none mt-0.5" />
              <p className="text-[12.5px] text-ink-500 leading-relaxed">
                A conformidade é medida sobre os dados reais da Célula. Nenhuma verificação bloqueia o trabalho do
                Secretariado: o sistema informa, fundamenta e propõe a correcção — a decisão continua a ser dos órgãos.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

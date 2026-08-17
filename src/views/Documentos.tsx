import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { dataMedia, normalizar, num } from '../lib/format';
import { Btn, Card, Lei, Pill, Segmentado, Stat, Vazio } from '../ui/primitives';
import { IcBusca, IcDescarregar, IcEscudo, IcLei, IcPasta, IcRelatorio, IcUrna } from '../ui/icons';
import type { Documento } from '../lib/types';

const CATEGORIA_META: Record<Documento['categoria'], { rotulo: string; tom: 'brand' | 'verde' | 'gold' | 'azul' | 'roxo' | 'neutro'; icone: React.ReactNode }> = {
  ACTA: { rotulo: 'Acta', tom: 'brand', icone: <IcRelatorio className="w-4 h-4" /> },
  RELATORIO: { rotulo: 'Relatório', tom: 'azul', icone: <IcRelatorio className="w-4 h-4" /> },
  CONTAS: { rotulo: 'Contas', tom: 'verde', icone: <IcRelatorio className="w-4 h-4" /> },
  NORMATIVO: { rotulo: 'Normativo', tom: 'gold', icone: <IcLei className="w-4 h-4" /> },
  ELEITORAL: { rotulo: 'Eleitoral', tom: 'roxo', icone: <IcUrna className="w-4 h-4" /> },
  OUTRO: { rotulo: 'Outro', tom: 'neutro', icone: <IcPasta className="w-4 h-4" /> },
};

export const Documentos: React.FC = () => {
  const { e, lente } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'TODOS' | Documento['categoria']>(lente === 'NACIONAL' ? 'NORMATIVO' : 'TODOS');

  const lista = useMemo(() => {
    const nq = normalizar(q);
    return e.documentos.filter((d) => {
      if (cat !== 'TODOS' && d.categoria !== cat) return false;
      if (nq && !normalizar(d.titulo).includes(nq)) return false;
      return true;
    });
  }, [e.documentos, q, cat]);

  const normativos = e.documentos.filter((d) => d.escopo === 'CENTRAL');
  const daCelula = e.documentos.filter((d) => d.escopo === 'CELULA');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Stat rotulo="Documentos arquivados" valor={num(e.documentos.length)} icone={<IcPasta className="w-5 h-5" />} nota="Repositório único da Célula" />
        <Stat rotulo="Actas" valor={num(e.documentos.filter((d) => d.categoria === 'ACTA').length)} nota="Uma por sessão realizada" />
        <Stat rotulo="Relatórios ao Círculo" valor={num(e.documentos.filter((d) => d.categoria === 'RELATORIO').length)} nota="Máximo de cinco páginas cada" />
        <Stat rotulo="Normativos centrais" valor={num(normativos.length)} tom="gold" nota="Sempre na versão em vigor" />
      </div>

      <Card
        titulo="Documentos normativos do Partido"
        sub="Mantidos centralmente para que todas as Células usem a mesma versão"
        accao={<Pill tom="gold">só leitura</Pill>}
        pad={false}
      >
        <ul className="divide-y divide-ink-100">
          {normativos.map((d) => (
            <li key={d.id} className="px-5 py-4 flex items-center gap-4 hover:bg-ink-50/40 transition-colors">
              <span className="w-10 h-10 rounded-xl bg-ink text-gold-400 grid place-items-center flex-none">
                {CATEGORIA_META[d.categoria].icone}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-ink">{d.titulo}</p>
                <p className="text-[11.5px] text-ink-400 mt-0.5">
                  versão {d.versao} · {d.paginas} páginas · {d.tamanhoKb} KB
                </p>
              </div>
              <Pill tom={CATEGORIA_META[d.categoria].tom}>{CATEGORIA_META[d.categoria].rotulo}</Pill>
              <Btn tamanho="sm" variante="suave" icone={<IcDescarregar className="w-3.5 h-3.5" />}>Abrir</Btn>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3 border-t border-ink-100 bg-ink-50/60 flex items-center gap-2">
          <IcEscudo className="w-4 h-4 text-ink-300" />
          <p className="text-[11.5px] text-ink-400">
            Actualizados centralmente. Sempre que os Estatutos ou o Manual da Célula forem revistos, todas as Células passam
            a ver a nova versão sem qualquer acção local.
          </p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <IcBusca className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            placeholder="Procurar documento…"
            className="w-full bg-white border border-ink-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <Segmentado
          itens={[
            { id: 'TODOS', rotulo: 'Todos' },
            { id: 'ACTA', rotulo: 'Actas' },
            { id: 'RELATORIO', rotulo: 'Relatórios' },
            { id: 'CONTAS', rotulo: 'Contas' },
            { id: 'ELEITORAL', rotulo: 'Eleitoral' },
          ]}
          activo={cat}
          onMudar={(v) => setCat(v as any)}
        />
      </div>

      {lista.length === 0 ? (
        <Card><Vazio titulo="Sem documentos" texto="Ajuste a procura ou o filtro." icone={<IcPasta className="w-6 h-6" />} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((d) => {
            const meta = CATEGORIA_META[d.categoria];
            return (
              <Card key={d.id} className="lift hover:shadow-lift">
                <div className="flex items-start gap-3">
                  <span className={`w-9 h-9 rounded-xl grid place-items-center flex-none ${d.escopo === 'CENTRAL' ? 'bg-ink text-gold-400' : 'bg-ink-50 text-ink-400'}`}>
                    {meta.icone}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-ink leading-snug">{d.titulo}</p>
                    <p className="text-[11.5px] text-ink-400 mt-1">{dataMedia(d.data)} · {d.paginas} pág · {d.tamanhoKb} KB</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-2">
                  <Pill tom={meta.tom}>{meta.rotulo}</Pill>
                  <Pill tom="neutro">{d.escopo === 'CENTRAL' ? 'central' : d.escopo === 'CIRCULO' ? 'círculo' : 'célula'}</Pill>
                  <Btn tamanho="sm" variante="fantasma" className="ml-auto" icone={<IcDescarregar className="w-3.5 h-3.5" />}>Abrir</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[11.5px] text-ink-300 text-center">
        {daCelula.length} documentos da Célula · o repositório funciona como uma pasta partilhada, com cópias de segurança automáticas
        <Lei id="manual_relatorio" discreto className="ml-1.5" />
      </p>
    </div>
  );
};

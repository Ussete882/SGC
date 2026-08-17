import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { normalizar, telefone } from '../lib/format';
import { Avatar, Pill } from '../ui/primitives';
import { IcBusca, IcMembros, IcRaio, IcSeta } from '../ui/icons';
import { LENTES, navPara } from './Shell';
import type { Lente } from '../lib/types';

interface Resultado {
  id: string;
  grupo: 'Ir para' | 'Membros' | 'Acções rápidas' | 'Perfil de acesso';
  titulo: string;
  sub?: string;
  icone?: React.ReactNode;
  executar: () => void;
}

export const CommandPalette: React.FC<{ aberto: boolean; onFechar: () => void }> = ({ aberto, onFechar }) => {
  const { e, irPara, setLente, repor, sair } = useStore();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) {
      setQ('');
      setSel(0);
      window.setTimeout(() => input.current?.focus(), 40);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [aberto]);

  const todos = useMemo<Resultado[]>(() => {
    const out: Resultado[] = [];

    (['CELULA', 'CIRCULO', 'NACIONAL', 'MEMBRO'] as Lente[]).forEach((l) => {
      navPara(l, {}).forEach((i) => {
        out.push({
          id: `nav_${l}_${i.id}`,
          grupo: 'Ir para',
          titulo: i.rotulo,
          sub: LENTES.find((x) => x.id === l)!.curto,
          icone: i.icone,
          executar: () => { setLente(l); irPara(i.id, i.params); },
        });
      });
    });

    e.membros.forEach((m) => {
      out.push({
        id: `m_${m.id}`,
        grupo: 'Membros',
        titulo: m.nome,
        sub: `${m.cartao} · ${telefone(m.telefone)} · ${m.estado.toLowerCase()}`,
        icone: <Avatar nome={m.nome} tamanho={22} />,
        executar: () => { setLente('CELULA'); irPara('membros', { membro: m.id }); },
      });
    });

    const acoes: { t: string; s: string; f: () => void }[] = [
      { t: 'Registar pagamento de quota', s: 'Três passos: membro, valor, modalidade', f: () => { setLente('CELULA'); irPara('cotas', { acao: 'registar' }); } },
      { t: 'Marcar nova reunião', s: 'Reunião Geral, Secretariado ou actividade', f: () => { setLente('CELULA'); irPara('reunioes', { acao: 'marcar' }); } },
      { t: 'Enviar mensagem aos membros', s: 'WhatsApp, SMS ou email', f: () => { setLente('CELULA'); irPara('comunicacao', { acao: 'nova' }); } },
      { t: 'Registar novo membro ou candidatura', s: 'Ficha de Membro da Célula', f: () => { setLente('CELULA'); irPara('membros', { acao: 'novo' }); } },
      { t: 'Convocar eleição', s: 'Assistente eleitoral em cinco passos', f: () => { setLente('CELULA'); irPara('eleicoes', { acao: 'convocar' }); } },
      { t: 'Gerar relatório mensal ao Círculo', s: 'Modelo do Manual da Célula', f: () => { setLente('CELULA'); irPara('relatorio'); } },
      { t: 'Ver reuniões realizadas em todo o País', s: 'Consolidação nacional', f: () => { setLente('NACIONAL'); irPara('nacional-reunioes', { tab: 'reunioes' }); } },
      { t: 'Repor o cenário de demonstração', s: 'Devolve todos os dados ao estado inicial', f: repor },
      { t: 'Terminar sessão', s: 'Voltar ao ecrã de entrada e escolher outro perfil', f: sair },
    ];
    acoes.forEach((a, i) => {
      out.push({ id: `ac_${i}`, grupo: 'Acções rápidas', titulo: a.t, sub: a.s, icone: <IcRaio className="w-4 h-4" />, executar: a.f });
    });

    LENTES.forEach((l) => {
      out.push({
        id: `lente_${l.id}`,
        grupo: 'Perfil de acesso',
        titulo: l.rotulo,
        sub: l.nota,
        icone: <IcMembros className="w-4 h-4" />,
        executar: () => { setLente(l.id); irPara(navPara(l.id, {})[0].id, navPara(l.id, {})[0].params); },
      });
    });

    return out;
  }, [e.membros, irPara, setLente, repor, sair]);

  const filtrados = useMemo(() => {
    const nq = normalizar(q);
    if (!nq) {
      return todos.filter((r) => r.grupo === 'Acções rápidas' || r.grupo === 'Ir para').slice(0, 12);
    }
    return todos
      .map((r) => {
        const alvo = normalizar(`${r.titulo} ${r.sub ?? ''} ${r.grupo}`);
        const idx = alvo.indexOf(nq);
        return { r, score: idx < 0 ? Infinity : idx };
      })
      .filter((x) => x.score !== Infinity)
      .sort((a, b) => a.score - b.score)
      .slice(0, 14)
      .map((x) => x.r);
  }, [q, todos]);

  useEffect(() => { setSel(0); }, [q]);

  useEffect(() => {
    if (!aberto) return;
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { onFechar(); return; }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); setSel((s) => Math.min(s + 1, filtrados.length - 1)); }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const r = filtrados[sel];
        if (r) { r.executar(); onFechar(); }
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aberto, filtrados, sel, onFechar]);

  if (!aberto) return null;

  let grupoActual = '';

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[8vh] px-4">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm a-fade" onClick={onFechar} />
      <div className="relative w-full max-w-[620px] bg-white rounded-2xl shadow-lift overflow-hidden a-scale">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-100">
          <IcBusca className="w-5 h-5 text-ink-300" />
          <input
            ref={input}
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            placeholder="Procurar membros, ecrãs e acções…"
            className="flex-1 text-[15px] text-ink placeholder:text-ink-300 outline-none bg-transparent"
          />
          <kbd className="text-[10px] font-mono font-bold bg-ink-50 border border-ink-200 rounded px-1.5 py-0.5 text-ink-400">esc</kbd>
        </div>

        <div className="max-h-[54vh] overflow-y-auto py-2">
          {filtrados.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-ink-300">Sem resultados para “{q}”.</p>
          )}
          {filtrados.map((r, i) => {
            const novoGrupo = r.grupo !== grupoActual;
            grupoActual = r.grupo;
            const on = i === sel;
            return (
              <React.Fragment key={r.id}>
                {novoGrupo && (
                  <p className="px-4 pt-3 pb-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-ink-400">{r.grupo}</p>
                )}
                <button
                  onMouseEnter={() => setSel(i)}
                  onClick={() => { r.executar(); onFechar(); }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 ${on ? 'bg-brand-50' : 'hover:bg-ink-50/70'}`}
                >
                  <span className={`flex-none ${on ? 'text-brand-600' : 'text-ink-300'}`}>{r.icone}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13.5px] font-bold truncate ${on ? 'text-brand-800' : 'text-ink'}`}>{r.titulo}</span>
                    {r.sub && <span className="block text-[11.5px] text-ink-400 truncate">{r.sub}</span>}
                  </span>
                  {on && <IcSeta className="w-4 h-4 text-brand-500 flex-none" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="px-4 py-2.5 border-t border-ink-100 bg-ink-50/60 flex items-center gap-3 text-[11px] text-ink-400">
          <Pill tom="neutro">↑ ↓ navegar</Pill>
          <Pill tom="neutro">↵ abrir</Pill>
          <span className="ml-auto">{filtrados.length} resultado(s)</span>
        </div>
      </div>
    </div>
  );
};

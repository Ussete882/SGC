/* ===========================================================================
   Ecrã de projecção da sala.

   Feito para ser visto de longe: pouca coisa, muito grande, sempre a par do
   que se passa. Serve também de porta de entrada — quem chega atrasado aponta
   a câmara ao código QR.
   ========================================================================= */

import React from 'react';
import { horas, voltaEmCurso, type Assembleia, type EstadoLigacao, type VotacaoVivo } from '../lib/vivo';
import { Emblema, FaixaBandeira } from '../ui/primitives';
import { IcCheck, IcSetaEsq } from '../ui/icons';
import { QR, SinalLigacao } from './comuns';

/* ══════════════════════════════════ Peças ══════════════════════════════════ */

const Etiqueta: React.FC<{ children: React.ReactNode; tom?: string }> = ({ children, tom = 'text-brand-300' }) => (
  <p className={`text-[11px] sm:text-[13px] font-extrabold uppercase tracking-[0.22em] ${tom}`}>{children}</p>
);

const AnelGrande: React.FC<{ votaram: number; aptos: number }> = ({ votaram, aptos }) => {
  const pct = aptos ? Math.min((votaram / aptos) * 100, 100) : 0;
  const lado = 260;
  const r = (lado - 26) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: lado, height: lado }}>
      <svg width={lado} height={lado} className="-rotate-90">
        <circle cx={lado / 2} cy={lado / 2} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={26} />
        <circle
          cx={lado / 2}
          cy={lado / 2}
          r={r}
          fill="none"
          stroke={pct >= 100 ? '#0FB85E' : '#F0303A'}
          strokeWidth={26}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.22,1,.36,1), stroke .4s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[76px] font-extrabold tnum text-white">{votaram}</span>
        <span className="text-[17px] font-bold text-white/45 mt-1">de {aptos} eleitores</span>
      </div>
    </div>
  );
};

const BarraGrande: React.FC<{ nome: string; votos: number; maximo: number; eleito: boolean; pct: number }> = ({
  nome, votos, maximo, eleito, pct,
}) => (
  <div className={`rounded-2xl border p-4 ${eleito ? 'border-verde-500/50 bg-verde-600/15' : 'border-white/10 bg-white/[0.05]'}`}>
    <div className="flex items-baseline justify-between gap-4">
      <p className="text-[22px] sm:text-[26px] font-extrabold text-white truncate leading-tight">
        {eleito && <IcCheck className="w-6 h-6 inline-block mr-2 text-verde-400" />}
        {nome}
      </p>
      <p className={`text-[30px] sm:text-[36px] font-extrabold tnum flex-none leading-none ${eleito ? 'text-verde-400' : 'text-white'}`}>
        {votos}
      </p>
    </div>
    <div className="mt-3 h-3 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-3 rounded-full transition-all duration-700 ease-swift ${eleito ? 'bg-verde-500' : 'bg-brand-500'}`}
        style={{ width: `${maximo ? Math.max((votos / maximo) * 100, votos > 0 ? 4 : 0) : 0}%` }}
      />
    </div>
    <p className="text-[13px] text-white/40 mt-2">{pct.toFixed(1).replace('.', ',')}% dos votos expressos</p>
  </div>
);

/* ═══════════════════════════════ Corpo do acto ═════════════════════════════ */

const Acto: React.FC<{ sala: Assembleia; vt: VotacaoVivo }> = ({ sala, vt }) => {
  const volta = voltaEmCurso(vt);
  const ap = volta?.apuramento ?? null;
  const aptos = sala.membros.filter((m) => m.podeVotar).length;

  if (vt.estado === 'PREPARACAO') {
    return (
      <div>
        <Etiqueta>Candidaturas · consulta prévia</Etiqueta>
        <h2 className="text-[38px] sm:text-[52px] font-extrabold tracking-tight leading-[1.05] mt-2 mb-7">{vt.titulo}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {vt.candidatos.map((c) => (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 flex items-center gap-3 ${
                c.aceitou === true ? 'border-verde-500/50 bg-verde-600/15'
                  : c.aceitou === false ? 'border-white/10 bg-white/[0.03] opacity-50'
                    : 'border-gold-500/40 bg-gold-500/10'
              }`}
            >
              <p className="text-[22px] font-extrabold text-white flex-1 truncate">{c.nome}</p>
              <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-white/60 flex-none">
                {c.aceitou === true ? 'aceitou' : c.aceitou === false ? 'recusou' : 'a aguardar'}
              </span>
            </div>
          ))}
          {vt.candidatos.length === 0 && <p className="text-[20px] text-white/40">Sem candidaturas propostas.</p>}
        </div>
      </div>
    );
  }

  if (vt.estado === 'ABERTA' && volta) {
    return (
      <div className="flex flex-col lg:flex-row items-center gap-10">
        <AnelGrande votaram={volta.votantes.length} aptos={aptos} />
        <div className="min-w-0 flex-1 text-center lg:text-left">
          <Etiqueta>Urna aberta desde as {horas(volta.abertaEm)} · {volta.numero}.ª volta</Etiqueta>
          <h2 className="text-[38px] sm:text-[52px] font-extrabold tracking-tight leading-[1.05] mt-2">{vt.titulo}</h2>
          <p className="text-[19px] text-white/50 mt-4 leading-relaxed">
            {volta.votantes.length === aptos
              ? 'Todos os eleitores votaram. A mesa vai encerrar a urna.'
              : `Faltam ${aptos - volta.votantes.length} camaradas por votar.`}
          </p>
          {!vt.resultadosEmDirecto && (
            <p className="text-[15px] text-white/30 mt-3 max-w-lg">
              Os votos só são revelados depois de a urna encerrar — para que o escrutínio em curso não influencie quem
              ainda não votou.
            </p>
          )}
          {vt.resultadosEmDirecto && ap && (
            <div className="mt-5 space-y-2 max-w-xl mx-auto lg:mx-0">
              {ap.linhas.map((l) => (
                <BarraGrande key={l.candidatoId} nome={l.nome} votos={l.votos} maximo={Math.max(1, ...ap.linhas.map((x) => x.votos))} eleito={false} pct={l.pctExpressos} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (ap) {
    const eleitos = vt.eleitos.filter((x) => !x.suplente);
    return (
      <div>
        <Etiqueta tom={vt.estado === 'PROCLAMADA' ? 'text-verde-400' : 'text-brand-300'}>
          {vt.estado === 'PROCLAMADA' ? 'Resultado proclamado' : 'Apuramento'} · {ap.volta}.ª volta ·{' '}
          {ap.expressos} boletins
        </Etiqueta>
        <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight leading-[1.05] mt-2 mb-6">{vt.titulo}</h2>

        {vt.estado === 'PROCLAMADA' && eleitos.length > 0 && (
          <div className="mb-6 rounded-2xl bg-verde-600/20 border border-verde-500/40 px-6 py-5">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-verde-300">Eleito</p>
            {eleitos.map((x) => (
              <p key={x.nome} className="text-[40px] sm:text-[54px] font-extrabold text-white leading-tight">{x.nome}</p>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {ap.linhas.map((l) => (
            <BarraGrande
              key={l.candidatoId}
              nome={l.nome}
              votos={l.votos}
              maximo={Math.max(1, ...ap.linhas.map((x) => x.votos))}
              eleito={l.eleito}
              pct={l.pctExpressos}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-6 text-[17px] text-white/45">
          <span>brancos <strong className="text-white tnum">{ap.brancos}</strong></span>
          <span>nulos <strong className="text-white tnum">{ap.nulos}</strong></span>
          <span>maioria absoluta <strong className="text-white tnum">{ap.maioriaExigida}</strong> de {ap.efectividade}</span>
          {ap.precisaSegundaVolta && <span className="text-gold-300 font-bold">segunda volta necessária</span>}
        </div>
      </div>
    );
  }

  return <p className="text-[24px] text-white/40">Aguarda o início do acto.</p>;
};

/* ════════════════════════════════ Projecção ════════════════════════════════ */

export const Projeccao: React.FC<{
  sala: Assembleia;
  estado: EstadoLigacao;
  ir: (r: string) => void;
}> = ({ sala, estado, ir }) => {
  const vt =
    sala.votacoes.find((v) => v.estado === 'ABERTA') ??
    sala.votacoes.find((v) => v.estado === 'ENCERRADA') ??
    sala.votacoes.find((v) => v.estado === 'PROCLAMADA') ??
    sala.votacoes.find((v) => v.estado === 'PREPARACAO') ??
    null;

  const ligacao = `${window.location.origin}${window.location.pathname}#/votar/${sala.codigo}`;

  return (
    <div className="relative min-h-screen hero-bg text-white flex flex-col overflow-hidden">
      <FaixaBandeira altura={6} />
      <div className="absolute inset-0 grid-paper opacity-[0.06] pointer-events-none" />

      <header className="relative px-6 sm:px-10 pt-6 flex items-start justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <Emblema tamanho={52} />
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/40">{sala.orgao}</p>
            <p className="text-[20px] font-extrabold text-white truncate leading-tight">{sala.nome}</p>
            {sala.local && <p className="text-[13px] text-white/35">{sala.local}</p>}
          </div>
        </div>
        <button
          onClick={() => ir(`#/votar/${sala.codigo}`)}
          className="flex items-center gap-1.5 text-[12px] font-bold text-white/35 hover:text-white transition-colors flex-none"
        >
          <IcSetaEsq className="w-4 h-4" /> mesa
        </button>
      </header>

      <main className="relative flex-1 flex items-center px-6 sm:px-10 py-8">
        <div className="w-full max-w-[1400px] mx-auto">{vt ? <Acto sala={sala} vt={vt} /> : (
          <div className="text-center">
            <h2 className="text-[42px] font-extrabold tracking-tight">Assembleia constituída</h2>
            <p className="text-[20px] text-white/45 mt-3">
              {sala.membros.filter((m) => m.ligado).length} de {sala.membros.length} camaradas já entraram.
            </p>
          </div>
        )}</div>
      </main>

      <footer className="relative px-6 sm:px-10 pb-7 flex items-end justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white rounded-xl"><QR texto={ligacao} tamanho={104} /></div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/35">Para votar</p>
            <p className="text-[42px] font-mono font-extrabold tracking-[0.22em] text-white leading-none mt-1">
              {sala.codigo}
            </p>
            <p className="text-[13px] text-white/30 mt-1.5">
              {sala.membros.filter((m) => m.ligado).length} ligados · {sala.membros.filter((m) => m.presente).length} presentes
            </p>
          </div>
        </div>
        <div className="text-right">
          <SinalLigacao estado={estado} />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/25 mt-2">A Luta Continua</p>
        </div>
      </footer>
    </div>
  );
};

/* ===========================================================================
   O telemóvel do camarada.

   Um ecrã de cada vez, comandado pelo que a mesa faz: espera → consulta prévia
   da candidatura → boletim de voto → confirmação → resultado. Tudo chega por
   si, sem recarregar nada.
   ========================================================================= */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ErroServidor, horas, jaVotou, voltaEmCurso, type Assembleia, type EstadoLigacao,
  type Sessao, type VotacaoVivo,
} from '../lib/vivo';
import { Alerta, Avatar, Btn, Emblema, FaixaBandeira, Lei, Modal, Pill } from '../ui/primitives';
import { IcAviso, IcCheck, IcFechar, IcRelogio, IcSair, IcUrna } from '../ui/icons';
import { Afluencia, BarraCandidato, CodigoSala, PillFase, SinalLigacao } from './comuns';

/* ═════════════════════════════════ Cabeçalho ═══════════════════════════════ */

const Topo: React.FC<{ sala: Assembleia; nome: string; estado: EstadoLigacao; onSair: () => void }> = ({
  sala, nome, estado, onSair,
}) => (
  <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-ink-100">
    <FaixaBandeira altura={3} />
    <div className="px-4 py-2.5 flex items-center gap-3">
      <Avatar nome={nome} tamanho={36} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-extrabold text-ink truncate leading-tight">{nome}</p>
        <p className="text-[11px] text-ink-400 truncate">{sala.nome}</p>
      </div>
      <SinalLigacao estado={estado} compacto />
      <button onClick={onSair} title="Sair" className="w-8 h-8 rounded-lg grid place-items-center text-ink-300 hover:text-brand-600 hover:bg-brand-50">
        <IcSair className="w-4 h-4" />
      </button>
    </div>
  </header>
);

/* ════════════════════════════════ Consulta prévia ══════════════════════════ */

const ConsultaPrevia: React.FC<{
  votacao: VotacaoVivo;
  candidatoId: string;
  onResponder: (aceitou: boolean) => void;
}> = ({ votacao, candidatoId, onResponder }) => {
  const c = votacao.candidatos.find((x) => x.id === candidatoId)!;
  return (
    <div className="rounded-3xl bg-white border-2 border-gold-300 shadow-lift overflow-hidden a-scale">
      <div className="bg-gold-100/70 px-5 py-3 border-b border-gold-300/60">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold-700">Consulta prévia</p>
      </div>
      <div className="p-5">
        <h2 className="text-[19px] font-extrabold text-ink leading-tight">
          Camarada, foi proposto para {votacao.titulo}.
        </h2>
        {c.propostoPor && <p className="text-[13px] text-ink-400 mt-1">Proposto por {c.propostoPor}.</p>}
        <p className="text-[13.5px] text-ink-500 mt-3 leading-relaxed">
          Nenhum camarada vai a votos sem o aceitar. A sua resposta é registada na acta e a mesa vê-a de imediato.
        </p>
        <div className="mt-3"><Lei id="art22" /></div>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Btn variante="contorno" tamanho="lg" onClick={() => onResponder(false)} icone={<IcFechar className="w-4 h-4" />}>
            Não aceito
          </Btn>
          <Btn variante="sucesso" tamanho="lg" onClick={() => onResponder(true)} icone={<IcCheck className="w-4 h-4" />}>
            Aceito
          </Btn>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════ Boletim de voto ═══════════════════════════ */

type Escolha = { tipo: 'VALIDO'; ids: string[] } | { tipo: 'BRANCO' } | { tipo: 'NULO' };

const Boletim: React.FC<{
  votacao: VotacaoVivo;
  onVotar: (e: Escolha) => Promise<void>;
}> = ({ votacao, onVotar }) => {
  const volta = voltaEmCurso(votacao)!;
  const [ids, setIds] = useState<string[]>([]);
  const [especial, setEspecial] = useState<'BRANCO' | 'NULO' | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const candidatos = volta.candidatos
    .map((id) => votacao.candidatos.find((c) => c.id === id))
    .filter(Boolean) as VotacaoVivo['candidatos'];

  const alternar = (id: string) => {
    setEspecial(null);
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= votacao.vagas) return votacao.vagas === 1 ? [id] : prev;
      return [...prev, id];
    });
  };

  const escolha: Escolha | null = especial
    ? { tipo: especial }
    : ids.length > 0 ? { tipo: 'VALIDO', ids } : null;

  const resumo = especial === 'BRANCO'
    ? 'Voto em branco'
    : especial === 'NULO'
      ? 'Voto nulo'
      : ids.map((id) => candidatos.find((c) => c.id === id)?.nome).join(', ');

  const depositar = async () => {
    if (!escolha) return;
    setAEnviar(true);
    setErro(null);
    try {
      await onVotar(escolha);
      setConfirmar(false);
    } catch (ex) {
      setErro(ex instanceof ErroServidor ? ex.message : 'Não foi possível registar o voto.');
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl bg-white border border-ink-100 shadow-lift overflow-hidden">
        {/* cabeçalho do boletim, como o impresso */}
        <div className="relative px-5 pt-5 pb-4 border-b-2 border-dashed border-ink-200 text-center">
          <div className="faixa-diagonal absolute top-0 right-0 w-24 h-12 opacity-[0.14]" />
          <Emblema tamanho={44} className="mx-auto" />
          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-brand-600 mt-3">Boletim de voto</p>
          <h2 className="text-[17px] font-extrabold text-ink leading-tight mt-1">{votacao.titulo}</h2>
          <p className="text-[12px] text-ink-400 mt-1">
            {volta.numero}.ª volta · {votacao.vagas === 1 ? 'assinale um candidato' : `assinale até ${votacao.vagas} candidatos`}
          </p>
        </div>

        <div className="p-4 space-y-2">
          {candidatos.map((c) => {
            const on = ids.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => alternar(c.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                  on ? 'border-brand-600 bg-brand-50' : 'border-ink-100 bg-white hover:border-ink-300'
                }`}
              >
                <Avatar nome={c.nome} tamanho={40} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-ink leading-tight">{c.nome}</span>
                  {c.incumbente && <span className="text-[11px] text-ink-400">exerce o cargo</span>}
                </span>
                <span
                  className={`w-7 h-7 rounded-md border-2 grid place-items-center flex-none ${
                    on ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200'
                  }`}
                >
                  {on && <IcCheck className="w-4 h-4" />}
                </span>
              </button>
            );
          })}

          <div className="pt-2 grid grid-cols-2 gap-2">
            {(['BRANCO', 'NULO'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setEspecial((v) => (v === t ? null : t)); setIds([]); }}
                className={`p-3 rounded-2xl border-2 text-[13px] font-bold transition-all ${
                  especial === t ? 'border-ink bg-ink text-white' : 'border-ink-100 text-ink-500 hover:border-ink-300'
                }`}
              >
                {t === 'BRANCO' ? 'Voto em branco' : 'Voto nulo'}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <Btn
            variante="primaria"
            tamanho="lg"
            largo
            disabled={!escolha}
            onClick={() => setConfirmar(true)}
            icone={<IcUrna className="w-5 h-5" />}
          >
            Depositar o voto
          </Btn>
          <p className="text-[11px] text-ink-300 text-center mt-2.5 leading-relaxed">
            O boletim é guardado sem qualquer ligação ao seu nome. Fica registado que votou — nunca em quem.
          </p>
        </div>
      </div>

      <Modal
        aberto={confirmar}
        onFechar={() => setConfirmar(false)}
        titulo="Confirma o seu voto?"
        sub="Depois de depositado, o boletim não pode ser alterado nem retirado."
        largura="max-w-md"
        rodape={
          <>
            <Btn variante="fantasma" onClick={() => setConfirmar(false)}>Rever</Btn>
            <Btn variante="primaria" onClick={depositar} disabled={aEnviar}>
              {aEnviar ? 'A depositar…' : 'Sim, depositar'}
            </Btn>
          </>
        }
      >
        <div className="rounded-2xl bg-ink-50 border border-ink-100 p-4 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-400">O seu voto</p>
          <p className="text-[18px] font-extrabold text-ink mt-1.5 leading-snug">{resumo}</p>
        </div>
        {erro && <div className="mt-3"><Alerta tom="brand" titulo="Não foi registado">{erro}</Alerta></div>}
      </Modal>
    </>
  );
};

/* ═════════════════════════════════ Resultados ══════════════════════════════ */

const Resultado: React.FC<{ votacao: VotacaoVivo }> = ({ votacao }) => {
  const volta = voltaEmCurso(votacao);
  const ap = volta?.apuramento;
  if (!ap) {
    return (
      <div className="rounded-3xl bg-white border border-ink-100 shadow-card p-6 text-center">
        <span className="w-12 h-12 rounded-2xl bg-ink-50 text-ink-400 grid place-items-center mx-auto mb-3">
          <IcRelogio className="w-5 h-5" />
        </span>
        <p className="text-[15px] font-extrabold text-ink">Urna encerrada</p>
        <p className="text-[13px] text-ink-400 mt-1 leading-relaxed">A mesa está a apurar. O resultado aparece aqui.</p>
      </div>
    );
  }
  const maximo = Math.max(1, ...ap.linhas.map((l) => l.votos));
  const eleitos = votacao.eleitos.filter((x) => !x.suplente);

  return (
    <div className="rounded-3xl bg-white border border-ink-100 shadow-lift overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-extrabold text-ink leading-tight truncate">{votacao.titulo}</h2>
          <p className="text-[11.5px] text-ink-400 mt-0.5">{ap.volta}.ª volta · {ap.expressos} boletins</p>
        </div>
        <PillFase estado={votacao.estado} />
      </div>

      {votacao.estado === 'PROCLAMADA' && eleitos.length > 0 && (
        <div className="px-5 py-4 bg-verde-100/60 border-b border-verde-200">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-verde-800">Proclamado</p>
          {eleitos.map((x) => (
            <p key={x.nome} className="text-[18px] font-extrabold text-verde-900 mt-1 leading-tight">{x.nome}</p>
          ))}
        </div>
      )}

      <div className="p-4 space-y-2">
        {ap.linhas.map((l) => (
          <BarraCandidato
            key={l.candidatoId}
            nome={l.nome}
            votos={l.votos}
            maximo={maximo}
            eleito={l.eleito}
            linha={`${l.pctExpressos.toFixed(1).replace('.', ',')}% dos votos expressos`}
          />
        ))}
        <div className="flex items-center justify-center gap-4 pt-2 text-[12px] text-ink-400">
          <span>brancos: <strong className="text-ink tnum">{ap.brancos}</strong></span>
          <span className="w-px h-3 bg-ink-200" />
          <span>nulos: <strong className="text-ink tnum">{ap.nulos}</strong></span>
          <span className="w-px h-3 bg-ink-200" />
          <span>maioria: <strong className="text-ink tnum">{ap.maioriaExigida}</strong></span>
        </div>
      </div>

      {ap.precisaSegundaVolta && votacao.estado === 'ENCERRADA' && (
        <div className="px-4 pb-4">
          <Alerta tom="gold" titulo="Segunda volta" base="art25n4">
            Nenhum candidato alcançou a maioria absoluta ({ap.maioriaExigida} votos). A mesa vai abrir a segunda volta.
          </Alerta>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════ Espera ════════════════════════════════ */

const Espera: React.FC<{ titulo: string; texto: string; children?: React.ReactNode }> = ({ titulo, texto, children }) => (
  <div className="rounded-3xl bg-white border border-ink-100 shadow-card p-7 text-center">
    <span className="relative flex w-14 h-14 mx-auto mb-4">
      <span className="absolute inline-flex w-full h-full rounded-2xl bg-brand-100 opacity-70 animate-ping" />
      <span className="relative inline-flex w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 items-center justify-center">
        <IcUrna className="w-6 h-6" />
      </span>
    </span>
    <p className="text-[16px] font-extrabold text-ink">{titulo}</p>
    <p className="text-[13px] text-ink-400 mt-1.5 leading-relaxed max-w-sm mx-auto">{texto}</p>
    {children && <div className="mt-4">{children}</div>}
  </div>
);

/* ═══════════════════════════════════ Votante ═══════════════════════════════ */

export const Votante: React.FC<{
  sala: Assembleia;
  sessao: Sessao;
  estado: EstadoLigacao;
  accao: (nome: string, dados?: Record<string, unknown>) => Promise<any>;
  onSair: () => void;
}> = ({ sala, sessao, estado, accao, onSair }) => {
  const eu = sala.membros.find((m) => m.id === sessao.membroId);
  const [recibo, setRecibo] = useState<string | null>(null);

  /* A votação que interessa a este camarada: a que está aberta; senão, a que
     lhe pede resposta; senão, a mais recente com resultado. */
  const votacao = useMemo(() => {
    /* Primeiro o que exige acção deste camarada: um boletim por depositar,
       depois uma consulta prévia por responder. */
    const porVotar = sala.votacoes.find(
      (v) => v.estado === 'ABERTA' && !jaVotou(v, sessao.membroId ?? null),
    );
    if (porVotar) return porVotar;
    const pendente = sala.votacoes.find(
      (v) => v.estado === 'PREPARACAO' && v.candidatos.some((c) => c.membroId === sessao.membroId && c.aceitou === null),
    );
    if (pendente) return pendente;
    return (
      sala.votacoes.find((v) => v.estado === 'ABERTA') ??
      sala.votacoes.find((v) => v.estado === 'ENCERRADA') ??
      sala.votacoes.find((v) => v.estado === 'PROCLAMADA') ??
      sala.votacoes.find((v) => v.estado === 'PREPARACAO') ??
      null
    );
  }, [sala.votacoes, sessao.membroId]);

  const minhaCandidatura = votacao?.candidatos.find((c) => c.membroId === sessao.membroId && c.aceitou === null);
  const votou = jaVotou(votacao, sessao.membroId ?? null);
  const volta = voltaEmCurso(votacao);
  const aptos = sala.membros.filter((m) => m.podeVotar).length;

  useEffect(() => {
    if (!votou) setRecibo(null);
  }, [votou, votacao?.id, volta?.numero]);

  const votar = async (escolha: Escolha) => {
    await accao('voto.registar', {
      votacaoId: votacao!.id,
      tipo: escolha.tipo,
      escolhas: escolha.tipo === 'VALIDO' ? escolha.ids : [],
    });
    setRecibo(new Date().toISOString());
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(60);
  };

  return (
    <div className="min-h-screen canvas-bg pb-10">
      <Topo sala={sala} nome={eu?.nome ?? sessao.nome ?? 'Camarada'} estado={estado} onSair={onSair} />

      <main className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {(estado === 'A_RELIGAR' || estado === 'SEM_SERVIDOR') && (
          <Alerta
            tom="gold"
            titulo={estado === 'SEM_SERVIDOR' ? 'Sem resposta do servidor' : 'Ligação instável'}
            icone={<IcAviso className="w-4 h-4" />}
            accao={<Btn tamanho="sm" onClick={onSair}>Voltar a entrar</Btn>}
          >
            A religar à assembleia — o seu voto, se já foi depositado, está seguro. Se isto não passar em alguns
            segundos, volte a entrar com o seu nome.
          </Alerta>
        )}

        {eu && !eu.podeVotar && (
          <Alerta tom="neutro" titulo="Sem capacidade eleitoral activa" base="art28">
            A mesa registou que não vota neste acto. Pode acompanhar os trabalhos.
          </Alerta>
        )}

        {minhaCandidatura && votacao && (
          <ConsultaPrevia
            votacao={votacao}
            candidatoId={minhaCandidatura.id}
            onResponder={(aceitou) =>
              void accao('candidatura.responder', { votacaoId: votacao.id, candidatoId: minhaCandidatura.id, aceitou })
            }
          />
        )}

        {!votacao && (
          <Espera
            titulo="Assembleia aberta"
            texto="Está registado no caderno eleitoral. Aguarde que a mesa convoque a primeira votação — o boletim aparece aqui automaticamente."
          />
        )}

        {votacao && !minhaCandidatura && votacao.estado === 'PREPARACAO' && (
          <Espera
            titulo={votacao.titulo}
            texto="Candidaturas em curso. A urna ainda não abriu."
          >
            <div className="space-y-1.5 text-left">
              {votacao.candidatos.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-ink-50 border border-ink-100">
                  <Avatar nome={c.nome} tamanho={30} />
                  <span className="text-[13.5px] font-bold text-ink flex-1 truncate text-left">{c.nome}</span>
                  {c.aceitou === true && <Pill tom="verde">aceitou</Pill>}
                  {c.aceitou === false && <Pill tom="brand">recusou</Pill>}
                  {c.aceitou === null && <Pill tom="gold">a aguardar</Pill>}
                </div>
              ))}
              {votacao.candidatos.length === 0 && (
                <p className="text-[12.5px] text-ink-400 text-center py-2">Ainda não há candidaturas propostas.</p>
              )}
            </div>
          </Espera>
        )}

        {votacao && votacao.estado === 'ABERTA' && !votou && eu?.podeVotar && (
          <Boletim votacao={votacao} onVotar={votar} />
        )}

        {votacao && votacao.estado === 'ABERTA' && votou && volta && (
          <div className="rounded-3xl bg-white border border-verde-200 shadow-lift overflow-hidden a-scale">
            <div className="bg-verde-100/70 px-5 py-6 text-center border-b border-verde-200">
              <span className="w-14 h-14 rounded-2xl bg-verde-600 text-white grid place-items-center mx-auto mb-3">
                <IcCheck className="w-7 h-7" />
              </span>
              <p className="text-[18px] font-extrabold text-verde-900">Voto depositado</p>
              <p className="text-[12.5px] text-verde-800/80 mt-1">
                Registado às {horas(recibo ?? volta.abertaEm)} · {votacao.titulo}
              </p>
            </div>
            <div className="p-5 flex flex-col items-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-400 mb-3">
                Afluência em directo
              </p>
              <Afluencia votaram={volta.votantes.length} aptos={aptos} />
              <p className="text-[12.5px] text-ink-400 mt-3 text-center leading-relaxed max-w-xs">
                O resultado aparece neste ecrã assim que a mesa encerrar a urna.
              </p>
            </div>
          </div>
        )}

        {votacao && votacao.estado === 'ABERTA' && votou === false && eu && !eu.podeVotar && (
          <Espera titulo="Urna aberta" texto="A votação decorre. O seu nome não consta dos eleitores deste acto." />
        )}

        {votacao && (votacao.estado === 'ENCERRADA' || votacao.estado === 'PROCLAMADA') && (
          <Resultado votacao={votacao} />
        )}

        {votacao?.estado === 'ANULADA' && (
          <Alerta tom="brand" titulo="Votação anulada">{votacao.motivoAnulacao}</Alerta>
        )}

        <div className="flex items-center justify-center gap-2 pt-2">
          <CodigoSala codigo={sala.codigo} />
          <Pill tom="neutro">{sala.orgao}</Pill>
        </div>
      </main>
    </div>
  );
};

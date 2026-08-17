/* ===========================================================================
   Superfície da votação em directo.

   Vive fora do resto do protótipo — não usa o `store` nem o armazenamento
   local do cenário de demonstração — porque aqui os dados são reais e vêm
   todos do servidor. O endereço é a única memória: `#/votar/ABCDE`.
   ========================================================================= */

import React, { useCallback, useEffect, useState } from 'react';
import { esquecerSessao, lerSessao, useAssembleia, type Sessao } from '../lib/vivo';
import { Emblema } from '../ui/primitives';
import { Portao } from './Portao';
import { Mesa } from './Mesa';
import { Votante } from './Votante';
import { Projeccao } from './Projeccao';
import { MolduraEscura, SinalLigacao } from './comuns';

export interface Rota {
  codigo: string;
  sub: string;
}

/** `#/votar/ABCDE/projeccao` → { codigo: 'ABCDE', sub: 'projeccao' } */
export function lerRota(): Rota {
  const partes = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { codigo: (partes[1] ?? '').toUpperCase(), sub: partes[2] ?? '' };
}

const AEsperar: React.FC<{ texto: string; estado?: React.ReactNode; onDesistir?: () => void }> = ({
  texto, estado, onDesistir,
}) => (
  <MolduraEscura>
    <div className="flex-1 grid place-items-center px-6">
      <div className="text-center">
        <Emblema tamanho={64} className="mx-auto" />
        <p className="text-[14px] text-white/50 mt-5">{texto}</p>
        {estado && <div className="mt-3 flex justify-center">{estado}</div>}
        {/* Nunca deixar o camarada sem saída, seja qual for a avaria. */}
        {onDesistir && (
          <button
            onClick={onDesistir}
            className="mt-6 text-[12.5px] font-bold text-white/40 hover:text-white border border-white/15 hover:border-white/40 rounded-xl px-4 py-2 transition-colors"
          >
            Voltar a entrar
          </button>
        )}
      </div>
    </div>
  </MolduraEscura>
);

export const AppVivo: React.FC = () => {
  const [rota, setRota] = useState<Rota>(lerRota);
  const [sessao, setSessao] = useState<Sessao | null>(() => {
    const r = lerRota();
    return r.codigo && r.codigo !== 'NOVO' ? lerSessao(r.codigo) : null;
  });

  useEffect(() => {
    const mudou = () => {
      const r = lerRota();
      setRota(r);
      setSessao((actual) => {
        if (!r.codigo || r.codigo === 'NOVO') return null;
        if (actual?.codigo === r.codigo) return actual;
        return lerSessao(r.codigo);
      });
    };
    window.addEventListener('hashchange', mudou);
    return () => window.removeEventListener('hashchange', mudou);
  }, []);

  const ir = useCallback((destino: string) => { window.location.hash = destino.replace(/^#/, ''); }, []);

  const { sala, estado, motivo, accao } = useAssembleia(sessao);
  const [aviso, setAviso] = useState<string | null>(null);

  const sair = useCallback(() => {
    if (sessao) esquecerSessao(sessao.codigo);
    setSessao(null);
    ir(`#/votar/${rota.codigo}`);
  }, [sessao, rota.codigo, ir]);

  /* A sessão morreu do lado do servidor — por exemplo, porque o serviço foi
     republicado e o disco volátil levou consigo a assembleia. Devolvemos o
     camarada ao ecrã de entrada com o motivo à vista, em vez de o deixar a
     olhar para «a religar» indefinidamente. */
  useEffect(() => {
    if (estado === 'SEM_SESSAO' && sessao) {
      esquecerSessao(sessao.codigo);
      setAviso(motivo ?? 'A sua sessão terminou. Volte a entrar com o seu nome.');
      setSessao(null);
    }
  }, [estado, sessao, motivo]);

  const entrar = useCallback((s: Sessao) => { setAviso(null); setSessao(s); }, []);

  if (!sessao) return <Portao codigo={rota.codigo} ir={ir} onSessao={entrar} aviso={aviso} />;

  if (!sala) {
    return (
      <AEsperar
        texto={
          estado === 'SEM_SERVIDOR'
            ? 'Sem resposta do servidor da votação. A insistir…'
            : `A ligar à assembleia ${sessao.codigo}…`
        }
        estado={<SinalLigacao estado={estado} />}
        onDesistir={sair}
      />
    );
  }

  if (rota.sub === 'projeccao') return <Projeccao sala={sala} estado={estado} ir={ir} />;

  return sessao.papel === 'MESA'
    ? <Mesa sala={sala} sessao={sessao} estado={estado} accao={accao} ir={ir} onSair={sair} />
    : <Votante sala={sala} sessao={sessao} estado={estado} accao={accao} onSair={sair} />;
};

export default AppVivo;

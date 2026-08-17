# SGC — Sistema de Gestão da Célula (protótipo funcional)

Protótipo do sistema descrito na proposta *«Criação e Implementação de um Sistema
Informático de Gestão da Célula»* (DRAFT v2, Julho de 2026), estendido com um
módulo de **democracia interna** desenhado a partir dos Estatutos da FRELIMO
(6 de Fevereiro de 2023).

O protótipo tem **duas superfícies**:

1. **O sistema de demonstração** — os doze ecrãs de gestão da Célula. Não tem
   base de dados nem backend: o cenário é gerado em memória no arranque e
   espelhado no armazenamento local do navegador. O botão de reposição, no canto
   inferior esquerdo, devolve tudo ao estado inicial.
2. **A votação em directo** (`#/votar`) — esta é real. Corre sobre um servidor
   próprio, sem dependências externas, e sincroniza toda a sala em tempo real:
   cada camarada vota do seu telemóvel e a mesa vê a afluência ao segundo.
   Ver [Votação em directo](#votação-em-directo).

---

## Como executar

O protótipo reutiliza as dependências já instaladas na raiz do repositório
(React 19, Vite 6, Recharts). A partir da **raiz do projecto**:

```bash
npx vite --config prototipo-sgc/vite.config.ts
```

Depois abrir <http://localhost:5180>.

Alternativa, a partir desta pasta:

```bash
npm run dev
```

Verificação de tipos:

```bash
npm run typecheck
```

> O Tailwind e as fontes são carregados por CDN, como no projecto principal — o
> primeiro arranque precisa de ligação à Internet.

---

## Votação em directo

Escrutínio a sério, com pessoas reais, em tempo real. Foi feito para o ensaio
com os camaradas do Comité do Círculo, mas serve qualquer órgão.

### Preparar a sala (um só comando)

```bash
npm run assembleia
```

Constrói a aplicação e levanta o servidor na porta **5190**, servindo tudo —
aplicação e API — do mesmo endereço. O arranque imprime os endereços da rede
local:

```
  local:      http://localhost:5190
  na rede:    http://192.168.1.184:5190
```

É o endereço «na rede» que se dá aos camaradas: todos os telemóveis ligados ao
mesmo Wi-Fi chegam lá. Quem preside abre-o no portátil e segue para
**Constituir a assembleia**.

Para desenvolver, com recarregamento automático, correm-se os dois lado a lado
(o Vite encaminha `/api` para o servidor):

```bash
npm run servidor
```

```bash
npm run dev
```

### Como decorre o acto

1. **Constituir a assembleia.** Escolhe-se o órgão — Reunião Geral da Célula
   (quórum de mais de metade) ou Comité/Conferência (dois terços) — e escreve-se
   o caderno eleitoral, um nome por linha. Há dois cadernos-tipo prontos: o
   Comité do Círculo n.º 12 e a Célula n.º 7. Sai daí um **código de cinco
   letras**, um endereço e um **código pessoal de quatro dígitos por camarada**.
2. **Entrar.** Cada camarada abre o endereço (ou lê o código QR no separador
   *Credenciais*, ou no ecrã de projecção), **procura o seu nome na lista** e
   escreve o seu código pessoal. A mesa vê-o aparecer como *ligado* no momento.
3. **Convocar a votação.** Cargo, número de vagas e forma de votação. Os cargos
   e as regras vêm dos Estatutos: o sistema calcula sozinho o quórum do órgão e
   a maioria absoluta exigida.
4. **Candidaturas com consulta prévia.** Ao propor um camarada, aparece-lhe no
   telemóvel um pedido de aceitação. Enquanto não aceitar, não vai a votos
   (Art. 22) — e a urna não abre sem, pelo menos, uma aceitação.
5. **Abrir a urna.** O sistema verifica o quórum antes. Se não estiver
   verificado, avisa e obriga a mesa a assumir a decisão por escrito.
6. **Votar.** O boletim aparece em todos os telemóveis ao mesmo tempo, com o
   emblema, os candidatos, o voto em branco e o voto nulo, e um passo de
   confirmação. A afluência sobe em directo em todos os ecrãs.
7. **Encerrar e apurar.** Só aqui os votos são revelados. Se ninguém alcançar a
   maioria absoluta dos membros em efectividade de funções, o sistema abre a
   **segunda volta** entre os mais votados (Art. 25 n.º 4).
8. **Proclamar.** Eleitos e suplentes pela ordem de eleição (Art. 32 n.º 1),
   prazo de trinta dias de impugnação (Art. 33) e **acta de eleição** redigida
   automaticamente, pronta a descarregar ou imprimir.

O separador **Projectar** abre um ecrã para o projector da sala: resultado em
letras grandes e o código QR de entrada para quem chega atrasado.

### Segredo do voto

O boletim e o votante são guardados em estruturas separadas. O caderno de
descarga regista **quem votou**; a urna regista **o sentido do voto**. Não
existe, em parte alguma, a ligação entre os dois — nem a mesa a consegue fazer.
Enquanto a urna está aberta ninguém vê votos, só a afluência: um apuramento à
vista influenciaria quem ainda não votou. A mesa pode ligar o *apuramento em
directo* quando o acto o justificar.

### O servidor

`servidor/index.mjs` — Node puro, **sem uma única dependência**. A leitura faz-se
por *Server-Sent Events*, o mecanismo nativo do navegador para receber
actualizações em tempo real: religa-se sozinho quando a rede falha e atravessa
qualquer proxy. A escrita faz-se por POST. O estado é gravado em
`servidor/dados/assembleias.json`, por isso um reinício não perde a assembleia
nem os votos já depositados.

Variáveis de ambiente: `PORT` (porta, por omissão 5190) e `SGC_DADOS` (caminho
do ficheiro de estado).

Ensaio de ponta a ponta — constituição, consulta prévia, escrutínio sem maioria,
segunda volta, proclamação, acta, controlo de acessos e segredo do voto — com o
servidor a correr:

```bash
npm run ensaio
```

### Pôr o site num link

O servidor serve também a aplicação, por isso **um só serviço dá um só
endereço** — sem Netlify e sem partir nada em dois.

Esta pasta é autónoma: tem o seu próprio `package.json`, `package-lock.json` e
`.gitignore`. Publique-a **como repositório próprio**, não o repositório inteiro
do projecto — é mais rápido e não expõe o resto do trabalho.

```bash
cd prototipo-sgc
git init && git add . && git commit -m "SGC — protótipo com votação em directo"
```

Criado o repositório no GitHub e enviado o código, no [Render](https://render.com)
escolhe-se **New → Blueprint** e aponta-se ao repositório. O
[`render.yaml`](render.yaml) já diz o resto: constrói com `npm ci && npm run
build`, arranca com `node servidor/index.mjs` e verifica a saúde em
`/api/saude`. Não há variáveis de ambiente para preencher. Sai daí um endereço
`https://sgc-frelimo.onrender.com` que serve tudo — os ecrãs de demonstração e a
votação em directo.

Duas notas sobre o plano gratuito, que contam no dia:

- **adormece ao fim de quinze minutos sem visitas.** A primeira pessoa a abrir o
  link espera cerca de um minuto. Abra-o você uns minutos antes da sessão. Durante
  o acto o canal de tempo real mantém o serviço acordado;
- **o disco é volátil.** O estado sobrevive a um reinício do processo, mas uma
  nova publicação apaga as assembleias antigas. Para uma sessão isolada não
  incomoda; para guardar histórico, é preciso um plano com disco.

Há também um [`Dockerfile`](Dockerfile) equivalente, para Railway, Fly.io, Koyeb
ou Cloud Run. *(Não foi construído aqui — o daemon do Docker não estava a correr
nesta máquina.)*

**Um link em sessenta segundos**, sem conta nenhuma, para mostrar a alguém já e
já — com o servidor local a correr, num segundo terminal:

```bash
npx cloudflared tunnel --url http://localhost:5190
```

Devolve um endereço `https://….trycloudflare.com` que aponta para o seu
computador. Serve para uma demonstração; enquanto o portátil estiver ligado.
*(O comando descarrega o programa oficial da Cloudflare na primeira utilização.)*

### Se preferir manter a aplicação no Netlify

Publica-se como sempre e acrescenta-se no painel do Netlify a variável de
ambiente `VITE_SGC_API` com o endereço do servidor; a API já responde com os
cabeçalhos de origem cruzada necessários. Atenção: um site em HTTPS não pode
falar com uma API em HTTP — o navegador bloqueia —, por isso o servidor tem de
estar também em HTTPS.

> O Netlify sozinho **não chega** para a votação em directo: publica ficheiros
> estáticos e o tempo real precisa de um processo a correr.

---

## Publicar no Netlify

A pasta é autónoma: declara as suas próprias dependências e traz um
[`netlify.toml`](netlify.toml) já configurado.

**Opção 1 — ligar o repositório (recomendado).** No Netlify, criar um site a
partir do repositório e definir apenas:

| Campo | Valor |
| --- | --- |
| Base directory | `prototipo-sgc` |
| Build command | `npm run build` |
| Publish directory | `prototipo-sgc/dist` |

Com o *base directory* definido, o Netlify lê o `netlify.toml` desta pasta e o
resto (Node 20, redireccionamentos de página única, cabeçalhos de cache) já vem
preenchido.

**Opção 2 — arrastar para o Netlify Drop.** Construir primeiro e arrastar
**apenas a pasta `dist`**:

```bash
npm run build
```

O Netlify Drop publica ficheiros já construídos, por isso não serve arrastar a
pasta `prototipo-sgc` inteira — o que se arrasta é o `dist`.

Notas:

- o `vite.config.ts` usa `base: './'`, portanto o site funciona tanto na raiz de
  um domínio como num subcaminho;
- não há variáveis de ambiente, backend nem base de dados para configurar;
- os dados de demonstração vivem no navegador de cada visitante — cada pessoa que
  abrir o site começa com o mesmo cenário e as alterações que fizer só a ela
  dizem respeito;
- **a votação em directo não funciona nesta publicação**: precisa de um processo
  a correr. Ver [Publicar fora da rede local](#publicar-fora-da-rede-local).

---

## Identidade visual

O protótipo usa a identidade do Partido, não uma paleta genérica.

- **Emblema oficial** em [`public/frelimo.webp`](public/frelimo.webp) — o batuque e a
  espiga de milho sobre campo vermelho, com as diagonais da bandeira nacional.
  Aparece na barra lateral, no cabeçalho de cada painel, no cartão de membro, no
  relatório mensal e como ícone do separador do navegador. Componente `<Emblema />`,
  apresentado sobre selo branco como no original impresso e sempre na proporção
  original (1280 × 1542).
- **Paleta extraída pixel a pixel do emblema**: vermelho `#E61923`, verde
  `#00A34F`, amarelo `#FFF000`, preto `#211E1E`. Substituiu por completo as cores
  provisórias, incluindo os gráficos.
- **Faixa da bandeira** — verde, preto, amarelo, vermelho — como elemento de
  assinatura: sob a barra de topo, no cimo da barra lateral, no cartão de membro,
  no cabeçalho do relatório e no rodapé. Componente `<FaixaBandeira />`, com a
  variante diagonal `.faixa-diagonal` nos cantos dos cabeçalhos, a citar as
  diagonais do emblema.
- **Tipografia e tons neutros** ajustados ao preto quente do emblema (`#1A1717`),
  em vez do cinzento-azulado anterior.
- Contraste verificado: os tons usados em texto cumprem AA (≥ 4,5) sobre os
  respectivos fundos; o amarelo da bandeira fica reservado a elementos gráficos.
- Assinatura institucional no rodapé e no relatório: *Frente de Libertação de
  Moçambique · A Luta Continua*.

---

## Sessão

Ao abrir, o sistema apresenta um **ecrã de entrada** com o emblema e os quatro
perfis de acesso. Escolhido o perfil, abre-se a sessão e entra-se no painel
correspondente.

Para sair há duas vias: o botão **Terminar sessão**, no fundo da barra lateral,
ou a acção com o mesmo nome na paleta de comandos (`Ctrl K`). Terminar a sessão
devolve ao ecrã de entrada, onde se pode escolher outro perfil — os dados de
demonstração mantêm-se; só a sessão é fechada.

A sessão persiste ao recarregar a página. Para apagar tudo, incluindo o cenário,
use **Repor cenário**, ao lado do nome do utilizador.

---

## Quatro perfis de acesso

O selector no topo da barra lateral troca a lente sobre os mesmos dados:

| Perfil | O que vê |
| --- | --- |
| **Secretário da Célula** | Painel, membros, cotas e contas, reuniões e actas, eleições e mandatos, comunicação, documentos, relatório mensal, conformidade |
| **Comité de Círculo** | Síntese do Círculo, as onze Células subordinadas com vitalidade e alertas, eleições do escalão |
| **Administração Central** | Consolidação nacional: reuniões realizadas em todo o País, províncias, cotização, adopção faseada |
| **Membro da Célula** | Painel de consulta: as suas cotas, as próximas reuniões, os avisos e os documentos partilhados |

`Ctrl K` abre a paleta de comandos (membros, ecrãs e acções).

---

## O que está implementado

### Âmbito da proposta (Versão 1)

- **Painel do Secretário** — estado da filiação, cotização do mês com repartição
  60/40, próxima reunião, avisos pendentes e os cinco atalhos do dia-a-dia.
- **Registo de membros** — ficha digital com os campos do Anexo A, ciclo
  candidato → efectivo → suspenso → cessado, contagem do prazo de 120 dias,
  cartão de membro, assiduidade e completude da ficha.
- **Cotas e contribuições** — registo em três passos (membro → valor →
  modalidade), numerário ou espécie, repartição automática 60/40, mapa de
  atrasos, alerta de suspensão ao décimo segundo mês, movimento de fundos com
  comprovativo e relatório de contas mensal.
- **Comunicação** — WhatsApp, SMS e email; audiências calculadas em tempo real
  (todos, em atraso, ausentes na última sessão, candidatos, aniversariantes,
  Secretariado, não recenseados), modelos prontos, pré-visualização, estimativa
  de custo e histórico por membro.
- **Reuniões e eventos** — calendário, convocatória com validação da
  antecedência mínima de dois dias, agenda-tipo do Manual da Célula, registo de
  presenças com verificação de quórum, limite de 90 minutos, decisões com
  responsável e prazo, arquivo e aprovação de actas.
- **Documentos e contactos** — repositório da Célula e normativos centrais
  mantidos numa única versão.
- **Painel do Membro** — apenas consulta, sem funções administrativas.
- **Relatório mensal ao Círculo** — montado a partir dos dados já registados,
  com a estrutura do ponto 1.9 do Manual e limite de cinco páginas; imprimível.

### Extensões desenhadas a partir dos Estatutos

- **Módulo eleitoral completo**, em cinco fases — convocação, caderno eleitoral,
  candidaturas, escrutínio e proclamação — para nove cargos: Secretário da
  Célula, Assistentes, Elemento de Ligação, Delegados à Conferência do Círculo,
  Primeiro Secretário e Secretariado do Comité do Círculo, Comité do Círculo,
  Presidium da Conferência e Comité de Verificação.
  - caderno eleitoral apurado membro a membro, com **capacidade activa e
    passiva** e o fundamento de cada exclusão;
  - **voluntariedade e consulta prévia**: nenhum camarada vai a votos sem
    aceitar a candidatura;
  - medidor de **continuidade e renovação** e composição por sexo;
  - mesa de escrutínio com **quórum**, **maioria absoluta dos membros em
    efectividade de funções** à primeira volta e abertura automática de
    **segunda volta** entre os mais votados;
  - proclamação com **ordem de eleição e suplentes**, acta de eleição gerada e
    contagem do **prazo de trinta dias de impugnação** até à homologação.
- **Mandatos** — mandato de cinco anos com progresso, vagas por preencher e
  **risco de cessação por faltas injustificadas** (25% / 50%).
- **Conformidade estatutária** — oito verificações permanentes sobre os dados
  reais da Célula, cada uma com o artigo citado e o atalho para a correcção.
- **Índice de Vitalidade Orgânica (IVO)** — índice composto 0–100 sobre cinco
  pilares com base normativa própria: assiduidade (25%), cotização (30%),
  cadência das Reuniões Gerais (20%), actualização da base de dados (15%) e vida
  orgânica (10%).
- **Votação em directo** — assembleia real, em tempo real, com servidor próprio:
  caderno eleitoral com códigos pessoais, entrada pelo nome, consulta prévia no
  telemóvel do candidato, boletim de voto secreto, afluência ao segundo em todos
  os ecrãs, apuramento com maioria absoluta e segunda volta, proclamação com
  suplentes, acta gerada e ecrã de projecção para a sala. Ver
  [Votação em directo](#votação-em-directo).
- **Consolidação hierárquica** — Círculo e escala nacional, incluindo a
  **contagem de reuniões de Célula em todo o País** (mês, ano, cadência
  cumprida, série de doze meses e desagregação por província).

### O sistema explica-se a si mesmo

Sempre que o SGC calcula, avisa ou impede algo, mostra a norma em que se apoia:
as etiquetas `ART. …` e `MANUAL DA CÉLULA` abrem o texto do artigo. Estão
declaradas em [`src/lib/estatutos.ts`](src/lib/estatutos.ts) — 40 normas dos
Estatutos e do Manual, com as regras numéricas que delas resultam.

---

## Estrutura

```
src/
  lib/
    types.ts        modelo de domínio
    estatutos.ts    normas citadas, agendas-tipo, cargos eleitorais, regras numéricas
    seed.ts         cenário de demonstração determinístico (Célula n.º 7, Círculo n.º 12, 12 províncias)
    selectors.ts    cálculo: quórum, maiorias, atrasos, prazos, assiduidade, IVO, consolidação
    store.tsx       estado da aplicação e todas as acções
    format.ts       datas, moeda e números em português de Moçambique
    vivo.ts         cliente da votação em directo: tipos, API e canal SSE
  ui/               primitivas visuais e ícones
  layout/           barra lateral, topo e paleta de comandos
  views/            os doze ecrãs
  vivo/             votação em directo
    AppVivo.tsx     encaminhamento por endereço (#/votar/CÓDIGO)
    Portao.tsx      constituir a assembleia · entrar pelo nome
    Mesa.tsx        consola de quem preside
    Votante.tsx     o telemóvel do camarada
    Projeccao.tsx   ecrã para o projector da sala
servidor/
  index.mjs         HTTP + SSE + ficheiros da aplicação (sem dependências)
  dominio.mjs       modelo da assembleia, acções, apuramento e acta
  ensaio.mjs        ensaio de ponta a ponta (npm run ensaio)
```

## Cenário de demonstração

Célula n.º 7 «Josina Machel», Bairro Polana Caniço A, Círculo n.º 12,
KaMaxakeni, Cidade de Maputo. Data de referência congelada em **12 de Agosto de
2026**, para que os prazos façam sentido:

- 15 membros na base de dados — 11 efectivos, 2 candidatos, 1 suspenso, 1 cessado;
- Reunião Geral marcada para 15 de Agosto **sem convocatória difundida** — o
  prazo de dois dias termina a 13;
- uma camarada com quatorze meses de incumprimento, no limiar do Art. 16 n.º 4;
- um Assistente com 42% de faltas injustificadas, em risco nos termos do
  Art. 27 n.º 6;
- Elemento de Ligação **vago** por renúncia, com eleição em curso na fase de
  candidaturas;
- eleição do Primeiro Secretário do Círculo já proclamada, decidida em segunda
  volta, dentro do prazo de impugnação;
- relatório mensal de Julho **por entregar**.

---
draft: false
title: "Outlier Ventures busca builders: 10 problemas, 56 primitivas, y una oportunidad para LatAm"
snippet: "Outlier Ventures abrió un Request for Builders con 10 problemas y capital listo para desplegar. Acá te mostramos cómo atacar cada uno combinando primitivas Web3 — con tres moonshots de ADN colombiano."
publishDate: "2026-04-21 10:36"
image:
  {
    src: "/blog/16/16.png",
    alt: "Outlier Ventures busca builders",
  }
category: "Guía"
author: "George Donnelly"
tags: ["web3", "ideas", "funding", "agentes", "convictionmarkets", "2026"]
---

Outlier Ventures — el fondo londinense detrás de las primeras inversiones en Fetch.ai y IOTA, con más de 400 compañías en portfolio — acaba de abrir un **Request for Builders** público. Traducción: tienen capital listo para desplegar, pero reconocen que **el instrumento correcto para hacerlo todavía no existe**, y quieren co-diseñarlo con la comunidad.

Para los builders de Solana Colombia, esto es una invitación directa. No es un pitch competition. No es un accelerator con forma cerrada. Es una conversación abierta con capital real detrás.

En este post te contamos qué están buscando, y — lo más importante — **cómo podrías construir algo que les haga sentido**, combinando las primitivas Web3 que ya cubrimos en nuestra [guía de primitivas para 2026](/blog/primitivos).

## El diagnóstico: el modelo de venture está roto

La tesis de OV se puede resumir así:

> Un producto se construye en un fin de semana. Pero financiarlo todavía exige abogados, cap table y 10 años de compromiso. Los equipos que shippean hoy son **híbridos humano–IA**. El equity no fue diseñado para eso. Los grants no dan ownership. El código se clona en una semana y el "first-mover advantage" dura días.

Y entonces: ¿cómo fundás, coordinás y repartís ownership en un mundo donde humanos y agentes construyen juntos?

Esto es lo que OV llama **Conviction Markets**: sistemas on-chain donde problemas se valorizan, builders y capital se alinean, y todos ganan una tajada proporcional a su riesgo y contribución. Pueden leer el paper completo en [convictionmarkets.io](https://convictionmarkets.io).

## Los 10 problemas abiertos

Este es el framing inicial que publicaron (no es una lista cerrada — si ves un problema que falta, también lo quieren escuchar):

1. **Funding sin equity**
2. **Ownership sin cap tables**
3. **Confianza sin instituciones**
4. **Verificación sin managers**
5. **Coordinación sin empresas**
6. **Disputas sin cortes**
7. **Gobernanza de costos para agentes**
8. **Salida sin adquisición**
9. **Discovery y matching**
10. **Nuevos moats**

Ahora viene la parte divertida: **cada uno de estos problemas se puede atacar combinando primitivas que ya existen**. Vamos idea por idea.

## Ideas concretas para construir

Cada idea referencia las primitivas por número, tal como aparecen en la [guía de 56 primitivas](/blog/primitivos). Úsenla como mapa.

### 🧩 Problema 01 — Funding sin equity

**💡 Milestone Vaults — capital gatillado por convicción**
Un protocolo donde fundadores publican un roadmap; los backers bloquean stablecoins en un **escrow (9)** que se libera por hito, verificado vía **oráculos (26)** + **atestaciones (16)** de reviewers con skin in the game. Mientras el capital espera, genera **yield (2)**. Los backers reciben revenue-share vía **fee-sharing (54)**, sin tocar el cap table.
> **Stack:** Stablecoins (1) · Escrow (9) · Yield (2) · Oráculos (26) · Atestaciones (16) · Fee-sharing (54)

**💡 Revenue streams para equipos híbridos**
El fundador tokeniza una fracción de ingresos futuros como un **stream (3)**. Los compradores cobran por segundo a medida que el producto factura. Funciona igual para un indie hacker que para un agente autónomo.
> **Stack:** Tokenización (4) · Streaming (3) · Stablecoins (1) · Oráculos (26)

### 🧩 Problema 02 — Ownership sin cap tables

**💡 Grafo de contribuciones → ownership dinámico**
Cada commit, doc, diseño o acción de agente genera una **atestación on-chain (16)**. Una función **cuadrática (35)** las convierte en tokens de ownership con **vesting (56)**. Nuevos contribuidores (humanos o agentes) entran proporcionalmente. Cero papeleo.
> **Stack:** Atestaciones (16) · Cuadrático (35) · Vesting (56) · SBTs (12) · Distribución de tokens (53)

**💡 Wrapper post-cap-table**
Un template de DAO donde el ownership se expresa como **streaming tokens (3)** que se rebalancean continuamente según señales de contribución. Si dejás de shippear, tu parte se diluye naturalmente. Justicia nativa.
> **Stack:** DAOs (33) · Streaming (3) · Grafos Sociales (15) · Atestaciones (16)

### 🧩 Problema 03 — Confianza sin instituciones

**💡 Mercados de reputación stakeada**
En vez de "confiá en nosotros, somos una DAO", los contribuidores **stakean (36)** tokens contra sus claims. Si mienten → **slashing (55)**. La reputación es portable vía **ZKPs (13)** cuando hace falta privacidad.
> **Stack:** Staking (36) · Slashing (55) · SBTs (12) · ZKPs (13) · Identidad de Wallet (11)

**💡 KYC cypherpunk — "probá que no sos un sybil, no quién sos"**
Un sistema de **divulgación selectiva (20)** donde probás acreditación, jurisdicción o compliance sin doxearte. Particularmente útil para fundadores latinoamericanos accediendo a capital global sin entregar toda su vida privada.
> **Stack:** ZKPs (13) · Divulgación Selectiva (20) · Atestaciones (16) · SBTs (12)

### 🧩 Problema 04 — Verificación sin managers

**💡 Recibos de trabajo verificables para equipos humano–IA**
Cada unidad de trabajo (un PR, un dataset, una inferencia) emite una **prueba de cómputo verificable (31)** + **atestación de hardware (47)** + **hash direccionado por contenido (30)** del output. Pagás contra prueba, no contra timesheet.
> **Stack:** Cómputo Verificable (31) · Atestación de Hardware (47) · Direccionamiento por Contenido (30) · x402 (25)

**💡 Mercado de calificadores de agentes**
Oráculos y **mercados de predicción (37)** califican los outputs de agentes. Buenos calificadores stakean y ganan; malos calificadores son **slasheados (55)**. El mercado es el manager.
> **Stack:** Mercados de Predicción (37) · Staking (36) · Oráculos (26) · KYA (14)

### 🧩 Problema 05 — Coordinación sin empresas

**💡 Pools de workers basados en intents**
Un fundador publica un **intent (8)**: "shipear esta feature, para el viernes, ≤$500". Humanos y agentes compiten como solvers. Pago vía **streaming (3)** + **escrow (9)**.
> **Stack:** Intents (8) · Escrow (9) · Streaming (3) · Bounties (38) · KYA (14)

**💡 DAOs efímeras para un solo entregable**
Armás una DAO, shippeás, la cerrás. **Gas patrocinado (41)**, **abstracción de cuenta (40)** para onboarding sin fricción, **protocolos de mensajería (50)** para coordinar con contribuidores remotos cross-chain.
> **Stack:** DAOs (33) · Abstracción de Cuentas (40) · Patrocinio de Gas (41) · Mensajería (50)

### 🧩 Problema 06 — Disputas sin cortes

**💡 Capa de disputas tipo Schelling point**
Jurados stakean para votar en una disputa. Si coinciden con la mayoría honesta → recompensa. Si no → **slashing (55)**. La evidencia sensible se procesa vía **MPC (18)** o **FHE (19)** para que no se filtre.
> **Stack:** Staking (36) · Slashing (55) · MPC (18) / FHE (19) · Escrow (9) · Mercados de Predicción (37)

**💡 Escrow reversible con reputación como colateral**
Los pagos se bloquean en **escrow (9)**. Si hay disputa, la carga de la prueba recae sobre la parte con menor reputación on-chain stakeada. El 95% de los casos se resuelve sin llegar a arbitraje formal.
> **Stack:** Escrow (9) · Identidad de Wallet (11) · Atestaciones (16) · SBTs (12)

### 🧩 Problema 07 — Gobernanza de costos para agentes

**💡 Wallets de agentes con guardrails de política**
**Wallets de agentes (23)** con reglas vía **abstracción de cuenta (40)**: "máximo $X/día, solo estas APIs, pausar si detecta anomalía". **Keepers (27)** hacen enforcement. **x402 (25)** maneja el billing.
> **Stack:** Wallets de Agentes (23) · Abstracción de Cuentas (40) · Keepers (27) · x402 (25) · Micropagos (24)

**💡 Tesorerías compartidas con voto cuadrático**
Los agentes del equipo comparten tesorería; gastos grandes requieren **votación cuadrática (35)** de los co-owners humanos. Gastos chicos pasan automáticamente.
> **Stack:** DAOs (33) · Cuadrático (35) · Wallets de Agentes (23) · Patrocinio de Gas (41)

### 🧩 Problema 08 — Salida sin adquisición

**💡 Liquidez continua vía AMMs de revenue-tokens**
Tokenizás el stream de ingresos del proyecto y lo listás en un **AMM (6)** con **hooks (7)** que recompran tokens desde la tesorería del protocolo. Fundadores y early backers salen progresivamente. Ni IPO, ni acquirer.
> **Stack:** Tokenización (4) · AMMs (6) · Hooks (7) · Streaming (3) · Fee-sharing (54)

**💡 "Exit perpetuo" — perpetuales sobre revenue privado**
**Perpetuales (10)** contra el oráculo de ingresos del proyecto. Cualquiera puede abrir long/short, los fundadores pueden hacer hedging, los inversores pueden salir cuando quieran — sin evento de liquidación.
> **Stack:** Perpetuales (10) · Oráculos (26) · Tokenización (4)

### 🧩 Problema 09 — Discovery y matching

**💡 Mercado de matching por intents: fundadores ↔ capital ↔ agentes**
Fundadores publican problemas como intents, el capital publica mandatos como intents, los agentes publican capacidades. Los solvers hacen match. El match mismo es un evento on-chain ponderado por reputación.
> **Stack:** Intents (8) · Grafos Sociales (15) · Atestaciones (16) · Mercados de Predicción (37) · KYA (14)

**💡 Dealflow en el feed, vía Blinks**
Embebés funding calls directamente en feeds de X o Farcaster como **Blinks (42)**: un click, commit, listo. Los fundadores latinoamericanos no necesitan navegar 12 dashboards.
> **Stack:** Blinks (42) · Deep Links (43) · Abstracción de Cuentas (40) · Patrocinio de Gas (41)

### 🧩 Problema 10 — Nuevos moats

Si el código se clona en una semana y el first-mover dura días, lo defendible cambia de naturaleza:

**💡 Moats de reputación (no de código)**
Productos que acumulan **SBTs (12)** no transferibles por uso real. El grafo de credenciales del usuario se vuelve el lock-in.
> **Stack:** SBTs (12) · Grafos Sociales (15) · Atestaciones (16)

**💡 Moats de datos vía cómputo privado**
Pipelines de **FHE (19)** / **MPC (18)** donde el *modelo o insight* es útil pero los *datos nunca salen* del usuario. Los clones no pueden replicar la confianza.
> **Stack:** FHE (19) · MPC (18) · Cómputo Verificable (31)

**💡 Moats físicos — oráculos del mundo real**
Redes **DePIN (45, 46, 47, 48)** de ground-truth. El hardware es lento de clonar, las redes de atestación se componen con el tiempo.
> **Stack:** IoT (45) · Geolocalización (46) · Atestación de Hardware (47) · Identidad de Máquinas (48)

## 🇨🇴 Tres moonshots con ADN colombiano

No todo tiene que ser global-first. Acá tres ideas que un builder colombiano está mejor posicionado que nadie para construir:

### 1. Remesa-as-conviction

Remesas de EE.UU. a Colombia ruteadas a través de un **milestone vault** que financia equipos locales de builders. Stablecoins (1) + streaming (3) + atestaciones de geolocalización (46). Capital formation nativo de LatAm, con los diáspora como primeros inversores.

### 2. Nómina de agentes

Rieles de nómina para equipos híbridos humano–IA operando desde LatAm: wallets con abstracción de cuenta y gas patrocinado, salarios en stablecoin por streaming, atestaciones por tarea completada, recibos fiscales automáticos vía divulgación selectiva. Resuelve un dolor real para los equipos que ya están operando así de manera informal.

### 3. Open Barrio

DAOs barriales usando verificación de geolocalización (46) + quadratic funding (35) para coordinar bienes públicos locales, financiadas por un pequeño streaming tax sobre negocios de la zona. Un test de estrés real de "coordinación sin empresas" — en un contexto donde las instituciones tradicionales ya fallan.

## ¿Por qué Solana para esto?

De los 10 problemas, **al menos 8** demandan cosas donde Solana tiene ventaja estructural:

- **Micropagos reales (24)** y **x402 (25)** → agentes pagando a agentes por llamadas API
- **Blinks (42)** → dealflow y ownership embebidos en el feed
- **Throughput** → streaming de pagos por segundo sin que te quiebre el gas
- **Latencia** → intents y solvers resueltos en tiempo humano
- **Account abstraction nativa** → onboarding sin fricción para no-crypto-natives

No es casualidad que la mayoría de agentes autónomos del último año se hayan desplegado en Solana. Esto juega a nuestro favor.

## Cómo aplicar

OV ofrece tres formas de engagement — elegí la que te quede:

1. **Ya estás construyendo algo adyacente** → mandales el demo.
2. **Te estás topando con estos muros** → contales cuáles y cómo los estás sorteando.
3. **Viste un problema que falta** → decíselos (por ejemplo: *trust en rampas on/off en LatAm*, *superficie regulatoria para revenue generado por agentes*, *sybil-resistance más allá del Gitcoin passport*).

**Submit:** [convictionmarkets.io/submit](https://convictionmarkets.io/submit)

**Lo importante:** *"You own what you build. That's non-negotiable."* No es one-shot, es un proceso abierto y continuo. Ofrecen capital en formatos flexibles, apoyo de comercialización y acceso a una red de builders trabajando en lo mismo.

Dado el tono de su comunicación, un **1-pager filoso con un prototipo funcionando** le va a ganar a cualquier deck pulido.

## Conclusión

OV no está buscando que les construyas *lo que ellos ya pensaron*. Están diciendo explícitamente: **"las respuestas no están terminadas, y no deberían ser construidas solo por nosotros"**.

Ese es exactamente el tipo de apertura que un ecosistema como el colombiano puede aprovechar — porque los problemas que OV describe (confianza sin instituciones, coordinación sin empresas, disputas sin cortes) no son teóricos acá: son el día a día de mucha gente.

Tenés el mapa de primitivas. Tenés los 10 problemas. Tenés capital buscando ser desplegado.

Ahora toca construir.

**¿Estás trabajando en algo que pega con alguno de estos 10 problemas? Escribinos a hola@solanacolombia.com o pasate por el Telegram — queremos conectar builders colombianos con esta oportunidad.**
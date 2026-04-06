---
draft: true
title: "Challenge #4: Frankenstein Build"
snippet: "Sin template. Sin guía. Combina todo lo que aprendiste en un solo programa. Esto es lo más parecido al hackathon que vas a experimentar antes del hackathon."
publishDate: "2026-02-25 10:00"
image:
  {
    src: "/blog/14/14.png",
    alt: "Challenge #4: Frankenstein Build",
  }
category: "Challenge"
author: "George Donnelly"
tags: ["bootcamp", "challenge", "solana", "anchor", "pinocchio"]
---

## El Challenge

Sin template. Sin pistas detalladas. Sin que nadie te diga qué hacer.

Combina todo lo que aprendiste en las últimas 3 semanas en un solo programa:

1. Un programa que guarda estado (como el counter)
2. Un token SPL (como la semana pasada)
3. Lógica que conecte ambos: "Cuando pasa X, se emiten Y tokens"

Eso es todo. El diseño es tuyo. La arquitectura es tuya. Los errores son tuyos. Y el deploy también.

**Fecha:** Viernes 27 de Febrero, 4:00 PM  
**Duración:** 90 minutos  
**Dificultad:** 🔴 Sin guía

---

## Antes de Llegar

### Obligatorio:
- Haber completado los Challenges [#1](/blog/challenge-hello-solana), [#2](/blog/challenge-build-a-counter) y [#3](/blog/challenge-token-time)
- Tener SOL en Devnet
- Tener una idea de qué quieres construir

### Recomendado:
- Pensar en tu proyecto de hackathon. Este challenge es tu oportunidad de prototipar la feature principal.
- Dibujar la arquitectura antes de escribir código. Qué cuentas necesitas. Qué instrucciones. Qué datos guardas.

---

## No Hay Template

No hay repo. No hay skeleton. No hay TODOs.

Inicializa tu propio proyecto:

```bash
anchor init mi-proyecto
cd mi-proyecto
```

Y empieza a construir.

---

## Ideas (Si No Tienes Una)

Estos son ejemplos. No tienes que hacer ninguno de estos. Pero si estás en blanco, elige uno y adáptalo:

**Check-in con recompensa**
- Un programa donde los usuarios hacen "check-in" (llaman una instrucción)
- Cada check-in incrementa un contador personal
- Cada 5 check-ins, el programa mintea tokens al usuario

**Sistema de tareas**
- Un programa donde un admin crea tareas
- Los usuarios completan tareas (marcan como completadas)
- Al completar una tarea, reciben tokens

**Marketplace mínimo**
- Un programa donde los usuarios listan items (con precio en tokens)
- Otros usuarios compran items transfiriendo tokens
- El programa transfiere la propiedad del item

**Votación con peso**
- Un programa de votación donde el peso del voto depende de cuántos tokens tienes
- Crear una propuesta, votar, cerrar votación

---

## Pistas (Pocas)

### Pista 1: CPI (Cross-Program Invocation)

Para que tu programa interactúe con el programa de SPL Token (mintear, transferir), necesitas hacer un CPI. Anchor facilita esto:

```rust
use anchor_spl::token::{self, MintTo, Transfer};
```

Busca "CPI" en el [Anchor Book](https://www.anchor-lang.com/docs/cross-program-invocations).

### Pista 2: PDA como autoridad

Si tu programa necesita mintear tokens, el programa mismo necesita ser el `mint authority`. Para esto usas un PDA (Program Derived Address) como autoridad del mint.

### Pista 3: Planifica antes de codear

Antes de escribir una línea de código, responde:
- ¿Cuántas instrucciones necesito?
- ¿Qué datos guardo en cada cuenta?
- ¿Quién paga por el almacenamiento?
- ¿Qué puede salir mal?

---

## Formato: Show & Tell Extendido

Esta semana el Show & Tell dura 30 minutos en vez de 20.

- **Todos** muestran lo que hicieron, funcione o no
- Celebramos cada deploy
- El grupo da feedback
- Votamos: "¿Cuál proyecto tiene más potencial para el hackathon?"

Si tu código no compila, muestra lo que tienes y explica dónde te atascaste. Eso también cuenta.

---

## Stretch Goals

### Nivel 2: Frontend
Agrega un frontend básico. No tiene que ser bonito. Puede ser un script de terminal, una página HTML con un botón, o una app Next.js. Lo que sea que permita interactuar con tu programa sin usar el CLI.

### Nivel 3: @solana/kit como cliente
Escribe toda la interacción del cliente usando `@solana/kit` directamente, sin el cliente generado por Anchor:

```bash
npm install @solana/kit
```

Documentación: [solanakit.com/docs](https://www.solanakit.com/docs)

Esto te obliga a entender cómo se construyen las transacciones a bajo nivel.

### Nivel 4: Reescríbelo en Pinocchio
Si terminaste todo lo anterior y quieres un desafío real: intenta reescribir tu programa usando [Pinocchio](https://github.com/anza-xyz/pinocchio) en vez de Anchor.

Pinocchio es un framework zero-dependency para programas Solana. No tiene macros. No tiene generación automática de cuentas. Escribes todo a mano. Es más rápido en ejecución pero mucho más trabajo.

Recursos para Pinocchio:
- [GitHub](https://github.com/anza-xyz/pinocchio)
- [Helius Deep Dive](https://www.helius.dev/blog/pinocchio)
- [QuickNode Tutorial](https://www.quicknode.com/guides/solana-development/pinocchio/how-to-build-and-deploy-a-solana-program-using-pinocchio)
- [Solana Counter Template (Pinocchio)](https://solana.com/developers/templates/pinocchio-counter)

No es para principiantes. Pero si llegas hasta aquí, ya no eres principiante.

---

## Recursos

| Recurso | Link |
|:--|:--|
| Anchor Book - CPI | [anchor-lang.com/docs/cross-program-invocations](https://www.anchor-lang.com/docs/cross-program-invocations) |
| Anchor Book - PDA | [anchor-lang.com/docs/pdas](https://www.anchor-lang.com/docs/pdas) |
| SPL Token Docs | [spl.solana.com/token](https://spl.solana.com/token) |
| @solana/kit Docs | [solanakit.com/docs](https://www.solanakit.com/docs) |
| Pinocchio | [github.com/anza-xyz/pinocchio](https://github.com/anza-xyz/pinocchio) |
| Solscan (Devnet) | [solscan.io/?cluster=devnet](https://solscan.io/?cluster=devnet) |
| Telegram Solana Colombia | [t.me/solana_colombia](https://t.me/solana_colombia) |

---

## Cómo Entregar

Cuando tu programa esté deployado:

1. Copia el **Program ID**
2. Graba un video de 1 minuto mostrando cómo funciona (Loom, screen recording, lo que sea)
3. Comparte en Telegram:

```
Challenge #4 ✅
Program ID: [tu program id]
Qué hace: [una frase]
Video: [link]
Repo: [link a tu código]
```

---

## Qué Sigue

Si llegaste hasta aquí, completaste el bootcamp.

Ahora empieza lo real:

- **Marzo:** Build Phase. 8 semanas de construcción con standups semanales y milestones.
- **Abril:** Mentoría intensiva. Office hours técnicos y de pitch.
- **Mayo:** Colosseum Hackathon. Submissions y Demo Day.
- **Junio:** Post-hackathon. Conexión con VCs y aceleradores.

El bootcamp fue el calentamiento. Marzo es donde se construye el producto.

El jueves 26 de febrero en el X Space formamos equipos oficialmente. Si todavía no tienes equipo, ese es el momento.

---

## Recuerda

- No hay respuesta correcta. Hay código que compila y código que no. Ambos te enseñan algo.
- 90 minutos no es mucho tiempo. No intentes construir todo. Construye la feature más importante y deployala.
- Si tu código no compila al final de la sesión, muestra lo que tienes. El esfuerzo cuenta.
- Esto es lo más parecido al hackathon que vas a experimentar antes del hackathon. Acostúmbrate a la presión.

Nos vemos el viernes 27 de febrero a las 4 PM.

→ [Únete al Telegram](https://t.me/solana_colombia)
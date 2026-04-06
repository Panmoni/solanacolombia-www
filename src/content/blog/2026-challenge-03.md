---
draft: true
title: "Challenge #3: Token Time"
snippet: "Crea tu primer token SPL en Solana. No un meme coin. Un token que represente algo real para tu proyecto de hackathon."
publishDate: "2026-02-18 10:00"
image:
  {
    src: "/blog/13/13.png",
    alt: "Challenge #3: Token Time",
  }
category: "Challenge"
author: "George Donnelly"
tags: ["bootcamp", "challenge", "solana", "spl-token", "metaplex"]
---

## El Challenge

Crear un token SPL en Solana Devnet que represente algo real. No un token genérico. No un meme coin. Un token que tenga sentido para el proyecto que estás pensando construir en el hackathon.

Puede ser un token de membresía, puntos de fidelidad, representación de un asset físico, acceso a un servicio, lo que sea. Pero tiene que tener un propósito.

**Fecha:** Viernes 20 de Febrero, 4:00 PM  
**Duración:** 90 minutos  
**Dificultad:** 🟠 Guía mínima

---

## Antes de Llegar

### Obligatorio:
- Haber completado los Challenges [#1](/blog/challenge-hello-solana) y [#2](/blog/challenge-build-a-counter)
- Tener SOL en Devnet (`solana airdrop 2`)
- Tener `@solana/kit` instalado:

```bash
npm install @solana/kit
```

### Recomendado:
- Leer la documentación de [SPL Token](https://spl.solana.com/token)
- Revisar la documentación de [Metaplex Token Metadata](https://developers.metaplex.com/token-metadata)

---

## Esta Vez No Hay Template

En serio. No hay repo para clonar.

Las primeras dos semanas tuviste templates con TODOs. Esta semana empiezas desde cero.

Tienes la documentación. Tienes los mentores. Tienes 90 minutos.

---

## Pistas

### Pista 1: Dos caminos

Hay dos formas de crear un token SPL:

**Camino A: CLI (más rápido para empezar)**

```bash
spl-token create-token
spl-token create-account <TOKEN_ADDRESS>
spl-token mint <TOKEN_ADDRESS> 1000
```

**Camino B: Programático con @solana/kit (más útil para tu proyecto)**

Usa `@solana/kit` para crear el token desde un script TypeScript. Esto es lo que necesitarás para tu proyecto real.

### Pista 2: Metadatos

Un token sin nombre ni imagen es solo un address. Para que tenga identidad necesitas metadatos.

Investiga cómo usar Metaplex Token Metadata para agregar:
- Nombre
- Símbolo
- URI (link a un JSON con la imagen y descripción)

### Pista 3: El JSON de metadatos

Los metadatos de un token apuntan a un archivo JSON. Puedes hostear ese JSON en cualquier lugar público. Para Devnet, puedes usar un Gist de GitHub:

```json
{
  "name": "Mi Token",
  "symbol": "MTK",
  "description": "Token de membresía para mi proyecto",
  "image": "https://url-de-tu-imagen.png"
}
```

### Pista 4: Mint Authority

Cuando creas un token, tú eres el `mint authority`. Eso significa que puedes crear más tokens cuando quieras. Piensa si eso tiene sentido para tu caso de uso o si deberías renunciar a esa autoridad.

### Pista 5: Verificar

Busca tu token en [Solscan Devnet](https://solscan.io/?cluster=devnet). Deberías ver el nombre, símbolo, supply y los holders.

---

## Stretch Goals

### Nivel 2: Mint a múltiples wallets
Crea un script que mintee tokens a 3 wallets diferentes. Simula una distribución inicial.

### Nivel 3: Transfer con @solana/kit
Escribe un script usando `@solana/kit` que transfiera tokens de una wallet a otra. Sin usar el CLI.

Documentación: [solanakit.com/docs](https://www.solanakit.com/docs)

### Nivel 4: Token Extensions
Investiga [Token Extensions](https://solana.com/developers/guides/token-extensions/getting-started) (Token-2022). Intenta crear un token con una extensión como `transfer fee` o `non-transferable`. Esto es lo que usan los proyectos más avanzados.

---

## Recursos

| Recurso | Link |
|:--|:--|
| SPL Token Docs | [spl.solana.com/token](https://spl.solana.com/token) |
| Metaplex Token Metadata | [developers.metaplex.com/token-metadata](https://developers.metaplex.com/token-metadata) |
| Token Extensions Guide | [solana.com/developers/guides/token-extensions/getting-started](https://solana.com/developers/guides/token-extensions/getting-started) |
| @solana/kit Docs | [solanakit.com/docs](https://www.solanakit.com/docs) |
| Solscan (Devnet) | [solscan.io/?cluster=devnet](https://solscan.io/?cluster=devnet) |
| Telegram Solana Colombia | [t.me/solana_colombia](https://t.me/solana_colombia) |

---

## Cómo Entregar

Cuando tu token esté creado:

1. Copia el **Token Address**
2. Comparte en Telegram:

```
Challenge #3 ✅
Token: [tu token address]
Nombre: [nombre de tu token]
Propósito: [una frase explicando qué representa]
Solscan: [link]
```

---

## Recuerda

- Esta semana no hay template. Eso es intencional. En el hackathon nadie te va a dar un repo con TODOs.
- Si no sabes por dónde empezar, empieza por el CLI. Crea el token primero. Después intenta hacerlo programáticamente.
- La documentación es tu mejor amiga. Aprende a leerla ahora porque en marzo la vas a necesitar todos los días.
- Si ya terminaste, ayuda a alguien. Explicar cómo funciona un token SPL a otra persona es la mejor forma de consolidar lo que aprendiste.

Nos vemos el viernes 20 de febrero a las 4 PM.

→ [Únete al Telegram](https://t.me/solana_colombia)
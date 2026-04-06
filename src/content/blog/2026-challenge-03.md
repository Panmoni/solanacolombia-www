---
draft: false
title: "Challenge #3: Token Time"
snippet: "Crea tu primer token SPL en Solana. No un meme coin. Un token que represente algo real para tu proyecto de hackathon."
publishDate: "2026-04-20 10:00"
image:
  {
    src: "/blog/13/13.png",
    alt: "Challenge #3: Token Time",
  }
category: "Challenge"
author: "George Donnelly"
tags: ["bootcamp", "challenge", "solana", "spl-token", "metaplex"]
---

En los primeros dos challenges usaste Anchor para deployar programas y guardar estado. Ahora vas a crear algo que se siente más real: tu propio token.

## El Challenge

Crear un token SPL en Solana Devnet que represente algo real. No un token genérico. No un meme coin. Un token que tenga sentido para el proyecto que estás pensando construir en el hackathon.

Puede ser un token de membresía, puntos de fidelidad, representación de un asset físico, acceso a un servicio, lo que sea. Pero tiene que tener un propósito.

## Primero: ¿Qué Es un Token SPL?

SPL Token es el estándar de tokens en Solana. Es el equivalente a ERC-20 en Ethereum, pero con diferencias importantes.

En Ethereum, un token es un smart contract que mantiene un mapping de balances internamente. En Solana, el token está separado en múltiples cuentas:

- **Mint Account** → Define el token: cuántos decimales tiene, cuántos existen (supply), y quién puede crear más (mint authority).
- **Token Account** → Guarda el balance de un usuario específico para un token específico. Cada combinación de wallet + token necesita su propia Token Account.
- **Metadata Account** → Guarda el nombre, símbolo e imagen del token (a través de Metaplex).

Cuando "creas un token," en realidad estás creando un Mint Account. Cuando "le das tokens a alguien," estás creando una Token Account para esa persona y minteando tokens ahí.

## Antes de Iniciar

Si completaste los Challenges [#1](/blog/2026-challenge-01) y [#2](/blog/2026-challenge-02), ya tienes todo instalado.

```bash
solana airdrop 2
```

**Lectura recomendada:**
- [SPL Token Docs](https://spl.solana.com/token)
- [Metaplex Token Metadata](https://developers.metaplex.com/token-metadata)

## Esta Vez No Hay Proyecto de Anchor

Los dos primeros challenges usaron `anchor init` para generar un proyecto. Esta vez no. Vas a trabajar directamente con el CLI de SPL Token y opcionalmente con scripts en TypeScript.

La razón: no todos los tokens necesitan un programa custom. El programa SPL Token ya existe en Solana y tú solo lo usas. No necesitas deployar nada propio para crear un token.

## Pistas

### Pista 1: Crear el token por CLI

El camino más rápido para tener un token funcionando:

```bash
spl-token create-token
```

Esto crea un nuevo Mint Account y te devuelve la dirección. Tú eres automáticamente el mint authority.

Ahora crea una Token Account para tu wallet:

```bash
spl-token create-account <TOKEN_ADDRESS>
```

Y mintea tokens:

```bash
spl-token mint <TOKEN_ADDRESS> 1000
```

Verifica tu balance:

```bash
spl-token balance <TOKEN_ADDRESS>
```

Línea por línea:
- `create-token` → Crea el Mint Account en la blockchain. Define un token nuevo con 9 decimales por default.
- `create-account` → Crea una Token Account asociada a tu wallet para ese token específico. Sin esta cuenta, tu wallet no puede "tener" ese token.
- `mint` → Crea 1000 tokens nuevos y los deposita en tu Token Account. Solo funciona si eres el mint authority.
- `balance` → Lee tu Token Account y muestra cuántos tokens tienes.

### Pista 2: Hacer lo mismo programáticamente con @solana/kit

El CLI es conveniente para probar, pero para un proyecto real necesitas hacerlo desde código. Instala el SDK:

```bash
npm install @solana/kit
```

Documentación: [solanakit.com/docs](https://www.solanakit.com/docs)

Investiga cómo crear un mint, crear token accounts y mintear tokens usando el SDK. Es más trabajo que el CLI, pero es lo que necesitarás para tu proyecto de hackathon.

### Pista 3: Metadatos

Un token sin nombre ni imagen es solo una dirección hexadecimal. Para que tenga identidad necesitas metadatos a través de Metaplex Token Metadata.

Necesitas agregar:
- **Nombre** (ej: "Puntos Café Colombia")
- **Símbolo** (ej: "PCC")
- **URI** (link a un JSON con la imagen y descripción completa)

### Pista 4: El JSON de metadatos

Los metadatos de un token apuntan a un archivo JSON que hosteas en cualquier lugar público. Para Devnet, un Gist de GitHub funciona:

```json
{
  "name": "Puntos Café Colombia",
  "symbol": "PCC",
  "description": "Token de fidelidad para cafeterías colombianas",
  "image": "https://url-de-tu-imagen.png"
}
```

Crea el Gist, copia la URL del archivo raw, y úsala como URI cuando agregues los metadatos con Metaplex.

### Pista 5: Mint Authority

Cuando creas un token, tú eres el `mint authority`. Eso significa que puedes crear más tokens cuando quieras. Piensa si eso tiene sentido para tu caso de uso.

Ejemplos:
- **Token de fidelidad:** Sí necesitas mint authority para dar puntos nuevos
- **Token de membresía limitada:** Podrías renunciar al mint authority después de crear los tokens iniciales
- **Representación de un asset fijo:** Probablemente quieras un supply fijo

Para renunciar al mint authority:

```bash
spl-token authorize <TOKEN_ADDRESS> mint --disable
```

Esto es irreversible. Nadie podrá crear más tokens.

### Pista 6: Verificar

Busca tu token en [Solscan Devnet](https://solscan.io/?cluster=devnet). Deberías ver el nombre, símbolo, supply y los holders.

## Tu Objetivo

1. Crea un token SPL en Devnet (por CLI o programáticamente)
2. Agrégale metadatos (nombre, símbolo, imagen)
3. Mintea tokens a tu wallet
4. Verifica en Solscan que el token existe con sus metadatos

## Stretch Goals

### Nivel 2: Mint a múltiples wallets
Crea un script que mintee tokens a 3 wallets diferentes. Simula una distribución inicial. Puedes generar wallets de prueba con `solana-keygen new --outfile wallet2.json`.

### Nivel 3: Transfer con @solana/kit
Escribe un script usando `@solana/kit` que transfiera tokens de una wallet a otra. Sin usar el CLI. Esto implica:
- Crear una Token Account para la wallet destino (si no existe)
- Construir y firmar la transacción de transferencia
- Enviarla a la red

### Nivel 4: Token Extensions
Investiga [Token Extensions](https://solana.com/developers/guides/token-extensions/getting-started) (Token-2022). Intenta crear un token con una extensión como:
- `transfer fee` → Cobra una comisión en cada transferencia
- `non-transferable` → Los tokens no se pueden enviar (útil para badges o certificados)
- `confidential transfers` → El monto de la transferencia es privado

Esto es lo que usan los proyectos más avanzados en producción.

## Recursos

| Recurso | Link |
|:--|:--|
| SPL Token Docs | [spl.solana.com/token](https://spl.solana.com/token) |
| Metaplex Token Metadata | [developers.metaplex.com/token-metadata](https://developers.metaplex.com/token-metadata) |
| Token Extensions Guide | [solana.com/developers/guides/token-extensions/getting-started](https://solana.com/developers/guides/token-extensions/getting-started) |
| @solana/kit Docs | [solanakit.com/docs](https://www.solanakit.com/docs) |
| Solscan (Devnet) | [solscan.io/?cluster=devnet](https://solscan.io/?cluster=devnet) |
| Telegram | [t.me/solana_colombia](https://t.me/solana_colombia) |

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

## Recuerda

- Si no sabes por dónde empezar, empieza por el CLI. Crea el token primero. Después intenta hacerlo programáticamente.
- La documentación es tu mejor amiga. Aprende a leerla ahora porque la vas a necesitar todos los días.
- Si ya terminaste, ayuda a alguien. Explicar cómo funciona un token SPL a otra persona es la mejor forma de consolidar lo que aprendiste.

→ [Únete al Telegram](https://t.me/solana_colombia)

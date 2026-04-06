---
draft: false
title: "Challenge #1: Hello Solana"
snippet: "Tu primer deploy en la blockchain. Sin teoría. Sin slides. Solo código, 90 minutos y un programa funcionando en Devnet."
publishDate: "2026-04-06 10:01"
image:
  {
    src: "/blog/11/11.png",
    alt: "Challenge #1: Hello Solana",
  }
category: "Challenge"
author: "George Donnelly"
tags: ["bootcamp", "challenge", "solana", "anchor", "rust"]
---

Febrero y Marzo fueron meses muy intensos para mi pero no me he olvidado de ti y del bootcamp. He convertido el bootcamp en 4 retos que puedes hacer a tu ritmo en tus momentos libres.

Aquí va reto número 1.

## El Challenge

Deployar tu primer programa en Solana Devnet. Un programa que recibe una instrucción y registra un mensaje en el log de la transacción.

Eso es todo. Suena simple. Y lo es. Pero al final vas a tener una transacción real en una blockchain real que TÚ escribiste.

## Antes de Iniciar

Necesitas instalar el ambiente de desarrollo de Solana. Un solo comando instala todo: Rust, Solana CLI, Anchor y Node.js.

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
```

Verifica que todo se instaló correctamente:

```bash
rustc --version && solana --version && anchor --version && node --version
```

Deberías ver las versiones de cada herramienta. Si algo falla, revisa la [guía de instalación individual](https://solana.com/docs/intro/installation/dependencies).

Ahora configura tu wallet para Devnet:

```bash
solana config set --url devnet
solana-keygen new
solana airdrop 2
```

Esto crea una wallet nueva y le carga 2 SOL de prueba. Si el airdrop falla (a veces pasa), intenta de nuevo en unos minutos o usa el [faucet web](https://faucet.solana.com/).

Si algo falla durante la instalación, pregunta en el [Telegram](https://t.me/solana_colombia).

## Crea Tu Proyecto

No hay repo que clonar. Vas a crear el proyecto tú mismo.

Inicializa un nuevo proyecto Anchor:

```bash
anchor init hello-solana
cd hello-solana
```

Esto genera la siguiente estructura:

```
hello-solana/
├── programs/
│   └── hello-solana/
│       └── src/
│           └── lib.rs          ← TU CÓDIGO VA AQUÍ
├── tests/
│   └── hello-solana.ts         ← TEST PARA VERIFICAR
├── Anchor.toml
├── Cargo.toml
└── package.json
```

Anchor ya generó un programa básico en `lib.rs` y un test en `hello-solana.ts`. Ábrelos y léelos antes de seguir. No necesitas entender todo. Solo familiarízate con la estructura.

## Pistas (No Soluciones)

Estas son migajas de pan. No un tutorial paso a paso. Si te atascas, busca en la documentación o pregunta.

### Pista 1: La estructura básica de un programa Anchor

Un programa Anchor tiene tres partes:
- `declare_id!` → La dirección de tu programa
- `#[program]` → Las instrucciones (funciones que los usuarios pueden llamar)
- `#[derive(Accounts)]` → Las cuentas que cada instrucción necesita

### Pista 2: Logging

Para escribir un mensaje en el log de una transacción:

```rust
msg!("Tu mensaje aquí");
```

### Pista 3: Recibir un argumento

Las instrucciones de Anchor pueden recibir argumentos:

```rust
pub fn mi_instruccion(ctx: Context<MiContexto>, nombre: String) -> Result<()> {
    // ...
    Ok(())
}
```

### Pista 4: Build y Deploy

```bash
anchor build
anchor deploy
```

### Pista 5: Verificar

Después de deployar, copia el Transaction Signature y búscalo en [Solscan Devnet](https://solscan.io/?cluster=devnet). Deberías ver tu mensaje en los logs.

## Tu Objetivo

1. Modifica el programa generado en `lib.rs` para que tenga una instrucción que registre un mensaje en el log
2. Haz build y deploy a Devnet
3. Ejecuta el test para llamar a tu programa
4. Verifica en Solscan que tu mensaje aparece en los logs de la transacción

## Stretch Goals

¿Terminaste? Intenta esto:

### Nivel 2: Hazlo dinámico
Modifica tu programa para que acepte un nombre como argumento y registre "Hola, [nombre]!" en el log.

### Nivel 3: Llámalo desde @solana/kit
Escribe un script usando `@solana/kit` (el SDK oficial de Solana) que llame a tu programa directamente, sin usar el cliente de Anchor:

```bash
npm install @solana/kit
```

Documentación: [solanakit.com/docs](https://www.solanakit.com/docs)

### Nivel 4: Pinocchio (Avanzado)
Si ya conoces Rust y quieres ver cómo se escribe un programa Solana SIN Anchor, investiga [Pinocchio](https://github.com/anza-xyz/pinocchio). Es un framework zero-dependency que prioriza rendimiento sobre comodidad. No es para principiantes, pero si te gusta ir al metal, vale la pena explorarlo.

## Recursos

| Recurso | Link |
|:--|:--|
| Instalación Solana | [solana.com/docs/intro/installation](https://solana.com/docs/intro/installation) |
| Anchor Book | [anchor-lang.com](https://www.anchor-lang.com/) |
| Solana Cookbook | [solanacookbook.com](https://solanacookbook.com/) |
| Solana Docs | [solana.com/docs](https://solana.com/docs) |
| @solana/kit Docs | [solanakit.com/docs](https://www.solanakit.com/docs) |
| Pinocchio (avanzado) | [github.com/anza-xyz/pinocchio](https://github.com/anza-xyz/pinocchio) |
| Solscan (Devnet) | [solscan.io/?cluster=devnet](https://solscan.io/?cluster=devnet) |
| Telegram | [t.me/solana_colombia](https://t.me/solana_colombia) |

## Cómo Entregar

Cuando tu programa esté deployado:

1. Copia el **Transaction Signature** de tu deploy
2. Copia el **Program ID**
3. Comparte ambos en el canal de Telegram con el formato:

```
Challenge #1 ✅
Program ID: [tu program id]
TX: [link a Solscan]
```

Si lograste el Stretch Goal de hacerlo dinámico, comparte también el TX donde se ve tu nombre en los logs.

## Recuerda

- No necesitas entender TODO antes de empezar
- Si algo falla, lee el error. El 90% de los problemas se resuelven leyendo el error
- Si llevas 15 minutos atascado en lo mismo, pregunta
- Si ya terminaste, ayuda a alguien que esté atascado

→ [Únete al Telegram](https://t.me/solana_colombia)

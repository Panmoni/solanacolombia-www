---
draft: true
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

Eso es todo. Suena simple. Y lo es. Pero al final de esta sesión vas a tener una transacción real en una blockchain real que TÚ escribiste.

## Antes de Llegar (Obligatorio)

Necesitas tener esto instalado antes de iniciar.

### 1. Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version
```

### 2. Solana CLI

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
solana --version
```

### 3. Anchor

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest
anchor --version
```

### 4. Node.js (v18+)

```bash
node --version
```

### 5. Configurar Devnet

```bash
solana config set --url devnet
solana-keygen new
solana airdrop 2
```

Si algo falla durante la instalación, pregunta en el [Telegram](https://t.me/solana_colombia). Los mentores están ahí para ayudar con setup.

## El Template

Clona el repo del challenge:

```bash
git clone https://github.com/solanacolombia/challenge-01-hello-solana
cd challenge-01-hello-solana
```

El proyecto tiene esta estructura:

```
challenge-01-hello-solana/
├── programs/
│   └── hello-solana/
│       └── src/
│           └── lib.rs          ← TU CÓDIGO VA AQUÍ
├── tests/
│   └── hello-solana.ts         ← TEST PARA VERIFICAR
├── Anchor.toml
└── README.md
```

---

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

---

## Stretch Goals

¿Terminaste temprano? Intenta esto:

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

---

## Recursos

| Recurso | Link |
|:--|:--|
| Anchor Book | [anchor-lang.com](https://www.anchor-lang.com/) |
| Solana Cookbook | [solanacookbook.com](https://solanacookbook.com/) |
| Solana Docs | [solana.com/docs](https://solana.com/docs) |
| @solana/kit Docs | [solanakit.com/docs](https://www.solanakit.com/docs) |
| Pinocchio (avanzado) | [github.com/anza-xyz/pinocchio](https://github.com/anza-xyz/pinocchio) |
| Solscan (Devnet) | [solscan.io/?cluster=devnet](https://solscan.io/?cluster=devnet) |
| Telegram Solana Colombia | [t.me/solana_colombia](https://t.me/solana_colombia) |

---

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

---

## Recuerda

- No necesitas entender TODO antes de empezar
- Si algo falla, lee el error. El 90% de los problemas se resuelven leyendo el error
- Si llevas 15 minutos atascado en lo mismo, pregunta
- Si ya terminaste, ayuda a alguien que esté atascado

Nos vemos el viernes 6 de febrero a las 4 PM.

→ [Únete al Telegram](https://t.me/solana_colombia)

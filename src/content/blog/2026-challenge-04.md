---
draft: false
title: "Challenge #4: Frankenstein Build"
snippet: "Sin template. Sin guía. Combina todo lo que aprendiste en un solo programa. Esto es lo más parecido al hackathon que vas a experimentar antes del hackathon."
publishDate: "2026-04-27 10:00"
image:
  {
    src: "/blog/14/14.png",
    alt: "Challenge #4: Frankenstein Build",
  }
category: "Challenge"
author: "George Donnelly"
tags: ["bootcamp", "challenge", "solana", "anchor", "pinocchio"]
---

Sin template. Sin pistas detalladas. Sin que nadie te diga qué hacer.

## El Challenge

Combina todo lo que aprendiste en los últimos 3 challenges en un solo programa:

1. Un programa que guarda estado (como el counter)
2. Un token SPL (como el challenge anterior)
3. Lógica que conecte ambos: "Cuando pasa X, se emiten Y tokens"

El diseño es tuyo. La arquitectura es tuya. Los errores son tuyos. Y el deploy también.

## Primero: ¿Qué Es un CPI y Por Qué Lo Necesitas?

En los challenges anteriores, tu programa hacía todo internamente. Guardaba datos, los modificaba, listo. Pero ahora quieres que tu programa mintee tokens. El problema: tu programa no sabe mintear tokens. El que sabe es el **SPL Token Program**, un programa que ya existe en Solana.

Un CPI (Cross-Program Invocation) es cuando tu programa llama a otro programa. Es como hacer un API call, pero on-chain. Tu programa le dice al SPL Token Program: "oye, mintea 10 tokens a esta wallet" y el SPL Token Program lo ejecuta.

¿Por qué no puedes mintear tokens directamente? Porque en Solana, **solo el programa dueño de una cuenta puede modificarla**. Las Token Accounts son propiedad del SPL Token Program. Tu programa no puede tocarlas directamente. Tiene que pedirle al SPL Token Program que lo haga.

Esto es lo que hace un CPI especial: tu programa firma la llamada con su propia autoridad (un PDA), y el SPL Token Program confía en esa firma para ejecutar la operación.

## Antes de Iniciar

Si completaste los Challenges [#1](/blog/2026-challenge-01), [#2](/blog/2026-challenge-02) y [#3](/blog/2026-challenge-03), ya tienes todo lo que necesitas.

```bash
solana airdrop 2
```

**Recomendado antes de empezar:**
- Piensa en tu proyecto de hackathon. Este challenge es tu oportunidad de prototipar la feature principal.
- Dibuja la arquitectura antes de escribir código. Qué cuentas necesitas. Qué instrucciones. Qué datos guardas.

## Crea Tu Proyecto

```bash
anchor init mi-proyecto
cd mi-proyecto
```

Necesitas agregar la dependencia de `anchor-spl` para trabajar con tokens. En tu `programs/mi-proyecto/Cargo.toml`:

```toml
[dependencies]
anchor-lang = "0.30.1"
anchor-spl = "0.30.1"
```

Las versiones deben coincidir con tu versión de Anchor. Verifica con `anchor --version`.

## Ideas (Si No Tienes Una)

No tienes que hacer ninguno de estos. Pero si estás en blanco, elige uno y adáptalo:

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

## Pistas

### Pista 1: CPI con Anchor

Primero, importa lo que necesitas:

```rust
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Transfer};
```

Línea por línea:
- `token` → El módulo que contiene las funciones para interactuar con el SPL Token Program
- `Mint` → El tipo para la cuenta del mint (la definición del token)
- `Token` → El tipo para referenciar al SPL Token Program
- `TokenAccount` → El tipo para las cuentas que guardan balances de tokens
- `MintTo` → La estructura que define las cuentas necesarias para mintear tokens
- `Transfer` → La estructura que define las cuentas necesarias para transferir tokens

Para mintear tokens desde tu programa, necesitas estas cuentas en tu instrucción:

```rust
#[derive(Accounts)]
pub struct RewardUser<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    /// CHECK: PDA used as mint authority
    #[account(
        seeds = [b"authority"],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}
```

Línea por línea:
- `pub mint: Account<'info, Mint>` → La cuenta del mint de tu token. Marcada como `mut` porque mintear cambia el supply total.
- `pub user_token_account: Account<'info, TokenAccount>` → La Token Account del usuario que va a recibir los tokens. Marcada como `mut` porque su balance va a cambiar.
- `pub mint_authority: UncheckedAccount<'info>` → Un PDA (Program Derived Address) que actúa como la autoridad del mint. Tu programa "controla" esta dirección porque solo tu programa puede generar firmas válidas para ella. El `/// CHECK` es un comentario obligatorio de Anchor cuando usas `UncheckedAccount` explicando por qué es seguro.
- `seeds = [b"authority"]` → Los seeds que se usan para derivar el PDA. Pueden ser cualquier combinación de bytes. `b"authority"` es un string convertido a bytes.
- `bump` → Un byte extra que Anchor calcula automáticamente para hacer la dirección válida.
- `pub token_program: Program<'info, Token>` → Referencia al SPL Token Program. Necesario porque tu programa va a hacer un CPI hacia él.

Y la llamada CPI en sí:

```rust
pub fn reward_user(ctx: Context<RewardUser>, amount: u64) -> Result<()> {
    let seeds = &[b"authority".as_ref(), &[ctx.bumps.mint_authority]];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        },
        signer_seeds,
    );

    token::mint_to(cpi_ctx, amount)?;
    Ok(())
}
```

Línea por línea:
- `let seeds = &[b"authority".as_ref(), &[ctx.bumps.mint_authority]]` → Construye los seeds completos del PDA: el string "authority" + el bump byte. Estos seeds son la "llave privada" del PDA. Solo tu programa los conoce.
- `let signer_seeds = &[&seeds[..]]` → Wrappea los seeds en el formato que Solana espera. Puede parecer redundante, pero es necesario por cómo la runtime de Solana verifica las firmas de PDAs.
- `CpiContext::new_with_signer(...)` → Crea el contexto del CPI. `new_with_signer` (en vez de `new`) indica que el PDA va a "firmar" la transacción. Le pasas:
  - El programa que quieres llamar (`token_program`)
  - Las cuentas que necesita la instrucción (`MintTo` con mint, destino y autoridad)
  - Los seeds del PDA para la firma
- `token::mint_to(cpi_ctx, amount)?` → Ejecuta el CPI. Le dice al SPL Token Program: "mintea `amount` tokens del mint al destino, firmado por esta autoridad." El `?` propaga errores (si falla, tu instrucción también falla).

### Pista 2: PDA como autoridad (más detalle)

Un PDA es una dirección que no tiene llave privada. Nadie puede firmar con ella directamente. Pero tu programa puede "simular" una firma porque conoce los seeds que la generan.

Para que funcione:
1. Genera el PDA con seeds fijos (ej: `[b"authority"]`)
2. Al crear el token (en Challenge #3 o en un `initialize`), usa este PDA como mint authority
3. Cuando tu programa necesite mintear, usa `CpiContext::new_with_signer` con los seeds

Para encontrar la dirección del PDA (útil cuando creas el mint):

```rust
let (pda, bump) = Pubkey::find_program_address(&[b"authority"], program_id);
```

O desde el lado del cliente en TypeScript, usa `PublicKey.findProgramAddressSync()`.

### Pista 3: Planifica antes de codear

Antes de escribir una línea de código, responde:
- ¿Cuántas instrucciones necesito? (mínimo: initialize + la acción principal)
- ¿Qué datos guardo en cada cuenta? (dibuja las structs)
- ¿Quién paga por el almacenamiento? (el usuario o un admin)
- ¿Qué puede salir mal? (¿qué pasa si alguien llama las instrucciones en mal orden? ¿qué pasa si alguien intenta hacer trampa?)

## Tu Objetivo

1. Diseña un programa que combine estado + tokens + lógica propia
2. Implementa al menos 2 instrucciones
3. Deploy a Devnet
4. Graba un video de 1 minuto mostrando cómo funciona

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

## Recursos

| Recurso | Link |
|:--|:--|
| Anchor Book - CPI | [anchor-lang.com/docs/cross-program-invocations](https://www.anchor-lang.com/docs/cross-program-invocations) |
| Anchor Book - PDA | [anchor-lang.com/docs/pdas](https://www.anchor-lang.com/docs/pdas) |
| SPL Token Docs | [spl.solana.com/token](https://spl.solana.com/token) |
| @solana/kit Docs | [solanakit.com/docs](https://www.solanakit.com/docs) |
| Pinocchio | [github.com/anza-xyz/pinocchio](https://github.com/anza-xyz/pinocchio) |
| Solscan (Devnet) | [solscan.io/?cluster=devnet](https://solscan.io/?cluster=devnet) |
| Telegram | [t.me/solana_colombia](https://t.me/solana_colombia) |

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

## Qué Sigue

Si llegaste hasta aquí, completaste el bootcamp.

Ahora empieza lo real. Toma lo que construiste en este challenge y conviértelo en tu proyecto de hackathon. Forma equipo si no lo has hecho. Define tu MVP. Empieza a construir.

El bootcamp fue el calentamiento. Ahora se construye el producto.

## Recuerda

- No hay respuesta correcta. Hay código que compila y código que no. Ambos te enseñan algo.
- No intentes construir todo. Construye la feature más importante y deployala.
- Si tu código no compila, muestra lo que tienes. El esfuerzo cuenta.
- Esto es lo más parecido al hackathon que vas a experimentar antes del hackathon. Acostúmbrate a la presión.

→ [Únete al Telegram](https://t.me/solana_colombia)

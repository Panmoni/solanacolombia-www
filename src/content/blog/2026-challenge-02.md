---
draft: false
title: "Challenge #2: Build a Counter"
snippet: "Tu primer programa con estado. Un contador que vive en la blockchain y recuerda su valor entre transacciones."
publishDate: "2026-04-13 10:00"
image:
  {
    src: "/blog/12/12.png",
    alt: "Challenge #2: Build a Counter",
  }
category: "Challenge"
author: "George Donnelly"
tags: ["bootcamp", "challenge", "solana", "anchor", "rust"]
---

En el Challenge #1 deployaste un programa que hacía algo y se olvidaba. Este programa va a recordar.

## El Challenge

Construir un programa que guarda estado en la blockchain. Un contador simple: incrementar, decrementar, resetear.

Después de este reto vas a entender cómo Solana almacena datos y por qué el modelo de cuentas es diferente a todo lo que conoces.

## Primero: ¿Cómo Guarda Datos Solana?

En una base de datos normal, tienes tablas con filas. En Solana no existen tablas. Todo son **cuentas**.

Una cuenta es un espacio de almacenamiento en la blockchain que tiene:
- **Una dirección** (como una URL única)
- **Un dueño** (el programa que puede modificarla)
- **Datos** (los bytes que tú decides qué significan)
- **Lamports** (SOL para pagar el "alquiler" del espacio)

Cuando quieres guardar un contador, creas una cuenta que contiene un número. Cuando quieres incrementar ese número, llamas a una instrucción de tu programa que modifica los datos de esa cuenta.

La diferencia clave con Web2: en Solana, **los datos viven separados del programa**. Tu programa es código puro. Los datos están en cuentas que el programa puede leer y escribir. Es como si tu código viviera en un lugar y tu base de datos en otro, conectados por permisos.

## Antes de Iniciar

Si completaste el [Challenge #1](/blog/2026-challenge-01), ya tienes todo instalado. Solo asegúrate de tener SOL en Devnet:

```bash
solana airdrop 2
```

Si el airdrop falla, usa el [faucet web](https://faucet.solana.com/).

Si no completaste el Challenge #1, empieza por ahí. Este reto asume que ya sabes hacer build y deploy con Anchor.

**Lectura recomendada antes de empezar:** La sección de [Accounts](https://www.anchor-lang.com/docs/the-accounts-struct) del Anchor Book. No tienes que entenderlo todo. Solo léelo una vez para que los conceptos no sean 100% nuevos.

## Crea Tu Proyecto

```bash
anchor init counter
cd counter
```

Abre `programs/counter/src/lib.rs`. Ahí es donde vas a trabajar.

## Paso a Paso (Con Explicación)

### Paso 1: Define la estructura de datos

Lo primero es decidir qué datos quieres guardar. Para un contador, solo necesitas un número:

```rust
#[account]
pub struct Counter {
    pub count: i64,
}
```

Línea por línea:
- `#[account]` → Es un macro de Anchor que le dice "esta estructura va a vivir en una cuenta de Solana." Anchor agrega automáticamente serialización (convertir la estructura a bytes para guardarla) y deserialización (convertir los bytes de vuelta a la estructura para leerla).
- `pub struct Counter` → Defines una estructura de Rust llamada `Counter`. Es `pub` porque necesita ser accesible desde fuera del módulo.
- `pub count: i64` → Un campo llamado `count` de tipo `i64` (un número entero con signo de 64 bits). Puede ser positivo o negativo. Si solo quisieras positivos, usarías `u64`.

### Paso 2: Crea la instrucción para inicializar el contador

Antes de poder incrementar un contador, necesitas crearlo. En Solana, crear una cuenta cuesta SOL (para pagar el almacenamiento). La instrucción `initialize` crea la cuenta y pone el contador en 0.

Primero, define qué cuentas necesita la instrucción:

```rust
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

Línea por línea:
- `#[derive(Accounts)]` → Macro de Anchor que valida automáticamente las cuentas. Cuando alguien llama a tu instrucción, Anchor verifica que las cuentas que enviaron cumplen con lo que defines aquí.
- `pub struct Initialize<'info>` → La estructura que define las cuentas necesarias. El `<'info>` es un lifetime de Rust (no te preocupes mucho por eso ahora, es necesario por cómo Solana pasa datos al programa).
- `#[account(init, payer = user, space = 8 + 8)]` → Tres cosas a la vez:
  - `init` → Crea una cuenta nueva. Si la cuenta ya existe, falla.
  - `payer = user` → El usuario que llama a la instrucción paga por crear la cuenta.
  - `space = 8 + 8` → Reserva 16 bytes de espacio. Los primeros 8 son el **discriminador** de Anchor (un identificador único que Anchor usa para saber qué tipo de cuenta es). Los siguientes 8 son para tu `i64` (que ocupa exactamente 8 bytes).
- `pub counter: Account<'info, Counter>` → La cuenta que va a contener los datos del contador. `Account<'info, Counter>` le dice a Anchor "esta cuenta es de tipo Counter."
- `#[account(mut)]` → El `mut` significa que esta cuenta va a ser modificada (va a gastar SOL para pagar el rent de la nueva cuenta).
- `pub user: Signer<'info>` → La persona que llama la instrucción. `Signer` significa que Anchor verifica que esta persona realmente firmó la transacción (no se puede falsificar).
- `pub system_program: Program<'info, System>` → El System Program de Solana. Es necesario porque crear cuentas nuevas requiere llamar al System Program internamente.

Ahora la instrucción en sí:

```rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = 0;
    Ok(())
}
```

Línea por línea:
- `pub fn initialize(ctx: Context<Initialize>) -> Result<()>` → Una función pública que recibe un `Context<Initialize>`. El Context contiene todas las cuentas que definiste en la struct `Initialize`. Retorna `Result<()>` que significa "o sale bien, o retorna un error."
- `let counter = &mut ctx.accounts.counter` → Obtiene una referencia mutable a la cuenta del contador. `&mut` significa "quiero poder modificar esto."
- `counter.count = 0` → Pone el valor en 0.
- `Ok(())` → Todo salió bien, no hubo error.

### Paso 3: Crea la instrucción para incrementar

```rust
#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}
```

Línea por línea:
- Esto es más simple que `Initialize` porque no estás creando una cuenta nueva. Solo estás modificando una existente.
- `#[account(mut)]` → La cuenta del contador va a ser modificada (el valor cambia). Sin `mut`, Anchor no te deja escribir en la cuenta.
- No necesitas `Signer` (cualquiera puede incrementar). No necesitas `system_program` (no estás creando cuentas).

La instrucción:

```rust
pub fn increment(ctx: Context<Update>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count += 1;
    Ok(())
}
```

- `counter.count += 1` → Incrementa el valor. Anchor automáticamente serializa el nuevo valor y lo guarda en la cuenta al final de la instrucción. No necesitas hacer un "save" explícito.

### Paso 4: Decrement y Reset

Siguiendo el mismo patrón, implementa:
- `decrement` → Resta 1 al contador
- `reset` → Pone el contador en 0

Ambas instrucciones usan la misma struct `Update` de cuentas.

### Paso 5: Build, Deploy, Test

```bash
anchor build
anchor deploy
anchor test
```

## Tu Objetivo

1. Crea un programa con una cuenta `Counter` que guarde un `i64`
2. Implementa cuatro instrucciones: `initialize`, `increment`, `decrement`, `reset`
3. Haz build y deploy a Devnet
4. Escribe tests que verifiquen que el contador funcione correctamente
5. Ejecuta `anchor test` y que pasen todos los tests

## Errores Comunes

**"Account not initialized"**
Llamaste increment antes de initialize. Necesitas crear la cuenta primero.

**"Error: Account does not have enough lamports"**
No tienes suficiente SOL. Haz `solana airdrop 2`.

**"Error: 0x0. already in use"**
Estás intentando inicializar una cuenta que ya existe. Cada cuenta tiene una dirección única. Para hacer otra, genera una nueva keypair.

**"Space constraint violated"**
Tu `space` no coincide con el tamaño real de la struct. Recuerda: 8 (discriminador) + el tamaño de tus campos. Un `i64` = 8 bytes. Un `Pubkey` = 32 bytes. Un `bool` = 1 byte.

## Stretch Goals

### Nivel 2: Agregar un owner
Modifica el programa para que solo la persona que inicializó el contador pueda resetearlo.

Pistas:
- Agrega un campo `pub authority: Pubkey` a la struct `Counter`
- En `initialize`, guarda `ctx.accounts.user.key()` como la authority
- En `reset`, agrega una restricción `has_one = authority` al account constraint
- Tu `space` ahora es `8 + 8 + 32` (discriminador + i64 + Pubkey)

### Nivel 3: Timer
Agrega una restricción: el contador solo se puede incrementar una vez cada 10 segundos.

Pistas:
- Agrega un campo `pub last_updated: i64` a la struct `Counter`
- Usa `Clock::get()?.unix_timestamp` para obtener el tiempo actual
- Compara con `last_updated` y retorna un error si no han pasado 10 segundos
- Para errores custom, investiga `#[error_code]` en Anchor

### Nivel 4: Frontend básico
Crea un script en TypeScript que:
1. Inicialice el contador
2. Lo incremente 3 veces
3. Lea el valor final e imprima el resultado

Intenta hacerlo con `@solana/kit` directamente:

```bash
npm install @solana/kit
```

Documentación: [solanakit.com/docs](https://www.solanakit.com/docs)

## Recursos

| Recurso | Link |
|:--|:--|
| Anchor Book - Accounts | [anchor-lang.com/docs/the-accounts-struct](https://www.anchor-lang.com/docs/the-accounts-struct) |
| Anchor Book - Space | [anchor-lang.com/docs/space](https://www.anchor-lang.com/docs/space) |
| Solana Account Model | [solana.com/docs/core/accounts](https://solana.com/docs/core/accounts) |
| @solana/kit Docs | [solanakit.com/docs](https://www.solanakit.com/docs) |
| Solscan (Devnet) | [solscan.io/?cluster=devnet](https://solscan.io/?cluster=devnet) |
| Telegram | [t.me/solana_colombia](https://t.me/solana_colombia) |

## Cómo Entregar

Cuando tu programa esté deployado:

1. Copia el **Program ID**
2. Ejecuta los tests y haz un screenshot
3. Comparte en Telegram:

```
Challenge #2 ✅
Program ID: [tu program id]
Screenshot: [imagen de tests pasando]
```

Si lograste algún Stretch Goal, cuéntanos cuál y comparte el código.

## Recuerda

- El modelo de cuentas de Solana es diferente a bases de datos. No hay tablas. Hay cuentas individuales con datos serializados. Es normal que se sienta raro al principio.
- Si `anchor test` falla, lee el error completo. Usualmente te dice exactamente qué cuenta falta o qué restricción no se cumplió.
- Si ya terminaste, busca a alguien que esté atascado y ayúdalo. Enseñar es la mejor forma de aprender.

→ [Únete al Telegram](https://t.me/solana_colombia)

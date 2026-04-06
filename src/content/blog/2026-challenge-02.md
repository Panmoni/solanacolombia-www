---
draft: true
title: "Challenge #2: Build a Counter"
snippet: "Tu primer programa con estado. Un contador que vive en la blockchain y recuerda su valor entre transacciones."
publishDate: "2026-02-11 10:00"
image:
  {
    src: "/blog/12/12.png",
    alt: "Challenge #2: Build a Counter",
  }
category: "Challenge"
author: "George Donnelly"
tags: ["bootcamp", "challenge", "solana", "anchor", "rust"]
---

## El Challenge

Construir un programa que guarda estado en la blockchain. Un contador simple: incrementar, decrementar, resetear.

La semana pasada deployaste un programa que hacía algo y se olvidaba. Hoy vas a construir algo que **recuerda**. Después de esta sesión vas a entender cómo Solana almacena datos y por qué el modelo de cuentas es diferente a todo lo que conoces.

**Fecha:** Viernes 13 de Febrero, 4:00 PM  
**Duración:** 90 minutos  
**Dificultad:** 🟡 Semi-guiado

---

## Antes de Llegar

### Obligatorio:
- Haber completado el [Challenge #1](/blog/challenge-hello-solana) (o al menos tener el ambiente funcionando)
- Tener SOL en Devnet (`solana airdrop 2`)

### Recomendado:
- Leer la sección de [Accounts](https://www.anchor-lang.com/docs/the-accounts-struct) del Anchor Book
- No tienes que entenderlo todo. Solo léelo una vez para que los conceptos no sean 100% nuevos

---

## El Template

```bash
git clone https://github.com/solanacolombia/challenge-02-build-a-counter
cd challenge-02-build-a-counter
```

```
challenge-02-build-a-counter/
├── programs/
│   └── counter/
│       └── src/
│           └── lib.rs          ← TU CÓDIGO VA AQUÍ
├── tests/
│   └── counter.ts              ← TESTS
├── Anchor.toml
└── README.md
```

Esta vez el template tiene la estructura del programa pero las instrucciones están vacías. Tú escribes la lógica.

---

## Pistas

### Pista 1: Definir una cuenta que guarde datos

En Anchor, defines una cuenta con `#[account]`:

```rust
#[account]
pub struct Counter {
    pub count: i64,
}
```

### Pista 2: Inicializar una cuenta

Para crear una cuenta nueva en Solana, alguien tiene que pagar por el espacio de almacenamiento (rent). Anchor maneja esto con `init`:

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

El `space = 8 + 8` significa: 8 bytes para el discriminador de Anchor + 8 bytes para un `i64`.

### Pista 3: Modificar el valor

Para acceder y modificar los datos de una cuenta dentro de una instrucción:

```rust
pub fn increment(ctx: Context<Update>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count += 1;
    Ok(())
}
```

### Pista 4: Restricciones de cuenta

Cuando modificas una cuenta existente (no la creas), usas `#[account(mut)]`:

```rust
#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}
```

### Pista 5: Build, Deploy, Test

```bash
anchor build
anchor deploy
anchor test
```

---

## Formato de la Sesión: Mob Programming

Esta semana trabajamos en grupo:

1. Nos dividimos en grupos de 3-4 personas
2. Un grupo comparte pantalla
3. Los demás guían verbalmente sin escribir código
4. Cada 15 minutos rotamos quién escribe

**¿Por qué?** Porque explicarle a otra persona qué escribir es la forma más rápida de entender algo. Si puedes guiar a alguien, lo entiendes. Si no puedes, descubres exactamente dónde está tu confusión.

---

## Stretch Goals

### Nivel 2: Agregar un owner
Modifica el programa para que solo la persona que inicializó el contador pueda resetearlo. Pista: guarda el `Pubkey` del owner en la cuenta.

### Nivel 3: Timer
Agrega una restricción: el contador solo se puede incrementar una vez cada 10 segundos. Pista: necesitarás guardar un timestamp y comparar con `Clock::get()`.

### Nivel 4: Frontend básico
Crea un script en TypeScript que:
1. Inicialice el contador
2. Lo incremente 3 veces
3. Lea el valor final e imprima el resultado

Usa el cliente generado por Anchor o intenta hacerlo con `@solana/kit` directamente.

---

## Recursos

| Recurso | Link |
|:--|:--|
| Anchor Book - Accounts | [anchor-lang.com/docs/the-accounts-struct](https://www.anchor-lang.com/docs/the-accounts-struct) |
| Anchor Book - Space | [anchor-lang.com/docs/space](https://www.anchor-lang.com/docs/space) |
| Solana Account Model | [solana.com/docs/core/accounts](https://solana.com/docs/core/accounts) |
| Solana Clock Sysvar | [solana.com/docs/core/runtime](https://solana.com/docs/core/runtime) |
| @solana/kit Docs | [solanakit.com/docs](https://www.solanakit.com/docs) |
| Solscan (Devnet) | [solscan.io/?cluster=devnet](https://solscan.io/?cluster=devnet) |
| Telegram Solana Colombia | [t.me/solana_colombia](https://t.me/solana_colombia) |

---

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

---

## Recuerda

- El modelo de cuentas de Solana es diferente a bases de datos. No hay tablas. Hay cuentas individuales con datos serializados. Eso es normal que se sienta raro al principio.
- Si `anchor test` falla, lee el error completo. Usualmente te dice exactamente qué cuenta falta o qué restricción no se cumplió.
- Si ya terminaste, busca a alguien que esté atascado y ayúdalo. Enseñar es la mejor forma de aprender.

Nos vemos el viernes 13 de febrero a las 4 PM.

→ [Únete al Telegram](https://t.me/solana_colombia)
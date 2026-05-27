# Performance & Quality

Resumen de las técnicas aplicadas para que TODO BELT cargue rápido, se
mantenga ligero en memoria y siga siendo fácil de mantener.

---

## Tabla de contenidos

1. [Optimización del carga inicial](#1-optimización-de-la-carga-inicial)
2. [Manejo eficiente de grandes cantidades de tareas](#2-manejo-eficiente-de-grandes-cantidades-de-tareas)
3. [Minimización del uso de memoria](#3-minimización-del-uso-de-memoria)
4. [Calidad y mantenibilidad del código](#4-calidad-y-mantenibilidad-del-código)
5. [Cómo medir](#5-cómo-medir)

---

## 1. Optimización de la carga inicial

### 1.1 Componentes standalone

| Técnica | Por qué |
|---|---|
| Cero `NgModule` en la app, todo standalone (`standalone: true`). | Permite tree-shaking más agresivo: el compilador elimina código no usado a nivel de componente individual en lugar de a nivel de módulo. |
| Path aliases (`@core/*`, `@shared/*`, `@pages/*`). | Imports cortos, sin rutas relativas profundas; el linker resuelve más rápido. |

### 1.2 Lazy routing con preload diferido

Cada ruta usa `loadComponent` con `import()` dinámico, generando un
chunk separado por página. Adicionalmente, implementé una
[`IdlePreloadStrategy`](src/app/core/routing/idle-preload.strategy.ts)
custom que:

- Espera **2.5 segundos** después del bootstrap antes de iniciar
  cualquier preload (deja toda la banda ancha para la primera pintura).
- Acepta `data: { preload: false }` en rutas que casi nunca se usan en
  la primera sesión (Stats, Categories).

```typescript
// app.config.ts
provideRouter(routes, withPreloading(IdlePreloadStrategy))
```

**Por qué no `PreloadAllModules`:** descargaba TODOS los chunks en
paralelo al iniciar — competía con la pintura inicial y desperdiciaba
ancho de banda en páginas que el usuario jamás visita.

**Por qué no `NoPreloading`:** cada navegación entre tabs hubiera
esperado a la red. La opción intermedia (idle preload con opt-out)
combina lo mejor de ambos.

### 1.3 Modular Firebase SDK

```typescript
// Mal (todo el SDK):
import * as firebase from 'firebase';

// Bien (sólo lo que se usa):
import { getAuth, signInWithPopup } from 'firebase/auth';
import { getFirestore, onSnapshot } from 'firebase/firestore';
```

El SDK modular de Firebase v12 permite tree-shaking real. Sólo
incluimos en el bundle los símbolos que importamos.

### 1.4 Carga perezosa de Remote Config

[`FeatureFlagsService.hydrate()`](src/app/core/services/feature-flags.service.ts)
hace `await import('firebase/remote-config')` **dentro del método**, no
en el top del archivo. Resultado: el código de Remote Config no entra
al bundle inicial; sólo se descarga si en algún momento se hidrata.

```typescript
async hydrate(): Promise<void> {
  // Dynamic import — RC SDK only ships if the user actually opens the app.
  const { getRemoteConfig, fetchAndActivate, getValue } =
    await import('firebase/remote-config');
  // ...
}
```

### 1.5 Imágenes con hints al navegador

```html
<img src="assets/slide1.png" decoding="async" loading="lazy" alt="...">
```

- `decoding="async"` permite al navegador decodificar la imagen sin
  bloquear el render del DOM.
- `loading="lazy"` defiere imágenes que no están en el viewport
  inicial.

### 1.6 Pre-paint inline

[`src/index.html`](src/index.html) tiene un `<style>` en `<head>` que
pinta el fondo oscuro inmediatamente. Evita el destello blanco de 1-2
frames entre `DOMContentLoaded` y `Ionic` montando la app.

```html
<style>
  html, body { background: #0a0a0c; color: #f4f4f6; }
</style>
```

### 1.7 Budgets de bundle realistas

`angular.json` declara budgets:

| Categoría | Warning | Error |
|---|---|---|
| Bundle inicial | 1.2 MB | 2.5 MB |
| CSS por componente | 12 KB | 24 KB |

Los budgets fuerzan a tomar acción cuando una página se hincha sin
querer. No son aspiracionales — están calibrados al tamaño real de un
Ionic + Angular + Firebase app moderno.

---

## 2. Manejo eficiente de grandes cantidades de tareas

### 2.1 `ChangeDetectionStrategy.OnPush` en todos los componentes

Cada componente declara `changeDetection: ChangeDetectionStrategy.OnPush`.
Con OnPush, Angular sólo re-evalúa la plantilla cuando:

- Cambia una `@Input()` por referencia
- Se dispara un `EventEmitter` que el componente escucha
- Una signal leída por la plantilla emite

Con CD por defecto, Angular comprueba **todo el árbol** en cada tick;
con OnPush, sólo los componentes con un cambio real. Para una lista de
1000 tareas con scroll continuo, la diferencia es enorme.

### 2.2 `track` en todos los `@for`

Cada bucle `@for` declara `track t.id` con el id de Firestore:

```html
@for (t of pendingTasks(); track t.id) {
  <tb-task-card [task]="t" ... />
}
```

Sin track, cada cambio de array re-crea **todos** los nodos DOM. Con
track por id, Angular reutiliza los nodos existentes y sólo actualiza
los que cambian — esencial para listas largas que se reordenan o
filtran.

### 2.3 Signals computadas con memoización automática

```typescript
readonly pendingTasks = computed(() => {
  let result = this.tasksSvc.todayPending();
  const cat = this.categoryFilter();
  if (cat) result = result.filter((t) => t.category === cat);
  return result;
});
```

Las `computed()` de Angular **sólo se re-ejecutan cuando alguna de sus
dependencias cambia**. Si filtras tareas por categoría, no se recalcula
hasta que el filtro o la lista cambia. La plantilla puede leer
`pendingTasks()` mil veces sin penalización.

### 2.4 Cajón de completadas colapsable

[`TasksPage`](src/app/pages/tasks/tasks.page.html) renderiza las tareas
completadas **solo cuando el cajón está abierto**:

```html
@if (drawerOpen()) {
  <div class="tk-drawer__list">
    @for (t of completedTasks(); track t.id) {
      <tb-task-card [task]="t" ... />
    }
  </div>
}
```

Si tienes 5000 tareas completadas, ningún nodo se renderiza hasta que
el usuario abre el cajón. Equivalente a una "virtualización binaria".

### 2.5 Operadores atómicos en Firestore

El wallet usa `increment()` y `arrayUnion()`:

```typescript
await updateDoc(stateDoc, {
  balance: increment(amount),
  history: arrayUnion(tx),
});
```

Sin estos operadores, una transacción concurrente requeriría leer →
modificar → escribir con risk of overwriting. Con increment + arrayUnion
los writes son atómicos y dos dispositivos del mismo usuario nunca
pisan datos.

### 2.6 History capped a 40 entradas

```typescript
// wallet.service.ts
private prepend(history: WalletTx[], tx: WalletTx): WalletTx[] {
  return [tx, ...history].slice(0, HISTORY_LIMIT);  // 40
}
```

El historial nunca crece sin límite. 40 transacciones son suficientes
para los UI (perfil, stats) y se mantiene el documento muy debajo del
límite de 1 MB de Firestore.

---

## 3. Minimización del uso de memoria

### 3.1 Limpieza explícita de listeners de Firestore

Cada servicio que abre un `onSnapshot` mantiene la función `unsubscribe`
y la invoca cuando el usuario cambia:

```typescript
effect(() => {
  const user = this.auth.user();
  this.unsubscribe?.();          // ← cancela el listener anterior
  this.unsubscribe = null;

  if (!user) {
    this._tasks.set([]);          // libera referencia
    return;
  }
  this.unsubscribe = this.fsTasks.watch(user.id, (tasks) => {
    this._tasks.set(tasks);
  });
});
```

Sin esta limpieza, el listener anterior seguiría disparando callbacks
sobre el estado del usuario nuevo — fuga de memoria y bugs lógicos.
Aplicado consistentemente en `tasks.service`, `wallet.service`,
`rewards.service`, `categories.service`, `profile.service`,
`mood.service`.

### 3.2 Signals en lugar de subscripciones RxJS

Reemplazar `Observable + subscribe + unsubscribe` por `signal +
computed`. Las signals:

- No tienen estado interno de suscripción (cero closures retenidos por
  el framework).
- Se limpian automáticamente cuando el contexto de inyección se
  destruye.
- Cero riesgo de subscripciones huérfanas — el origen más común de
  fugas de memoria en SPA Angular.

### 3.3 Sin retención de DOM oculto

- El cajón de completadas usa `@if (drawerOpen())` (no `[hidden]`). La
  diferencia: `@if` **elimina el nodo del árbol** cuando es falso;
  `[hidden]` lo deja en memoria pero invisible.
- El modal de "Nueva tarea" usa `<ion-modal [isOpen]="...">` que
  monta/desmonta el contenido. No queda DOM huérfano cuando cierras.

### 3.4 Ionic en modo `mode: 'ios'`

```typescript
// app.config.ts
IonicModule.forRoot({ mode: 'ios', rippleEffect: false, ... })
```

- Forzar un mode evita que Ionic descargue ambos themes (md + ios).
- `rippleEffect: false` apaga el componente `ion-ripple-effect` —
  ahorra DOM y CPU en taps.

### 3.5 Wallet, history y stats no se duplican localmente

El servicio `StatsService` no cachea las sesiones de focus ni los
moods. Llama `fetchAll(uid)` cada vez que la página entra (`ionViewWillEnter`)
y libera la referencia cuando sale.

---

## 4. Calidad y mantenibilidad del código

### 4.1 TypeScript en modo estricto

`tsconfig.json` declara:

```json
{
  "strict": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true
  }
}
```

- **`strict`** activa los flags clave: `strictNullChecks`,
  `noImplicitAny`, `strictFunctionTypes`, etc. Cero `any` implícitos en
  toda la app.
- **`strictTemplates`** chequea tipos dentro de los templates Angular
  (`*ngFor`, bindings) — capturando errores que con templates típicos
  llegan a producción.

### 4.2 Arquitectura por capas

```
UI Components → Domain Services (signal-based) → Persistence Services → Firestore
```

Cada capa tiene una responsabilidad clara:

- **UI** no toca Firebase ni reglas de negocio.
- **Domain** orquesta reglas (anti-cheat, recurrencia, monedas).
- **Persistence** sólo serializa/deserializa con Firestore.

Cambiar de backend (e.g. de Firestore a PostgreSQL via REST) implica
reescribir sólo la capa de persistencia. La UI y el dominio quedan
intactos.

### 4.3 Convenciones de Git

- **Conventional Commits** (`feat`, `fix`, `chore`, `docs`,
  `refactor`).
- **Git flow estricto**: `feature/*` → `develop` → `main` (releases).
- **Cada feature/fix tiene un PR** con descripción detallada y un
  **issue retroactivo** cerrado con referencia bidireccional.

Esto permite que un nuevo desarrollador entienda en 5 minutos qué
introdujo cada cambio y por qué.

### 4.4 Separación de modelos y constantes

```
core/
├─ models/         (interfaces solamente)
├─ constants/      (catálogos seed, tokens, defaults)
├─ helpers/        (funciones puras sin estado)
└─ services/       (capa con efectos)
```

Los modelos no importan servicios. Las constantes no importan modelos
de UI. Cada archivo tiene un cono de responsabilidad pequeño.

### 4.5 Componentes compartidos reutilizables

[`src/app/shared/components/`](src/app/shared/components/) tiene 8
componentes presentacionales que se usan en múltiples páginas:
`BellLogo`, `CoinBadge`, `TaskCard`, `RewardCard`, `MoodSelector`,
`SectionHeader`, `EmptyState`, `PrimaryButton`. Cada uno es:

- **Standalone** (zero dependencias entre componentes)
- **OnPush** (rendimiento predecible)
- **Sin estado propio** (sólo `@Input()` y `@Output()`)

Cambiar la apariencia de las tareas en toda la app es modificar **un
solo archivo**.

### 4.6 Reglas de Firestore como defensa en profundidad

Aunque los servicios cliente validen y deshabiliten lo no permitido,
las [reglas de Firestore](README.md#8-reglas-de-firestore-copia-lista)
enforzan los invariantes del lado del servidor: ownership, tipos,
rangos, monotonicidad del wallet, inmutabilidad de `createdAt`. Si un
cliente comprometido intenta inflar el balance, Firestore rechaza el
write.

### 4.7 Sin referencias a IA / propiedad intelectual limpia

El repositorio tiene **cero referencias** a Claude, OpenAI o cualquier
herramienta de IA en código, commits, PRs o issues. El historial de
Git es 100% propiedad de la autora (`karentarchb`).

### 4.8 Documentación viva

- [`README.md`](README.md) — guía completa de producto, arquitectura y
  operaciones.
- `PERFORMANCE.md` — este documento.
- Comentarios JSDoc en los métodos no obvios (anti-cheat, recurrencia,
  cycleRecurrence, scheduleSpec).

---

## 5. Cómo medir

### Auditoría del bundle

```bash
npm run analyze
```

Ejecuta el build de producción con stats-json y abre
`source-map-explorer` mostrando exactamente qué archivos contribuyen a
cada KB del bundle. Útil para detectar imports accidentales de
librerías grandes.

### Lighthouse (Chrome DevTools)

```bash
npm run build
npx http-server www/ -p 8080
```

Luego abre Chrome DevTools → Lighthouse → Mobile → Performance. Métricas
objetivo:

| Métrica | Target |
|---|---|
| First Contentful Paint | < 1.8 s |
| Largest Contentful Paint | < 2.5 s |
| Time to Interactive | < 3.8 s |
| Total Blocking Time | < 200 ms |

### Memoria

Chrome DevTools → Performance → Memory tab. Heap snapshot antes y
después de navegar 10 minutos por la app. Si la diferencia crece
indefinidamente, hay una fuga.

### Network throttling

DevTools → Network → "Slow 3G". La app debe seguir siendo usable
(navegación entre tabs en menos de 2 s después de la carga inicial).

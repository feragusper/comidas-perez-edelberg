## Objetivo

Hoy cada comida (nuestra cena, cena de Nico, nuestro almuerzo, almuerzo de Nico, desayuno de Nico, merienda de Nico) guarda **un plato principal + una guarnición + una nota**. Lo querés reemplazar por una **lista de hasta 5 alimentos** por comida: arranca con 1 slot, y al llenar uno aparece el siguiente (máximo 5).

## Modelo de datos

Cada slot pasa a guardar un array de items en lugar de `meal`/`side`:

```text
comida = {
  items: Meal[]      // 1 a 5 alimentos
  note: string       // nota general de la comida (se mantiene)
  overridden / hidden // sin cambios (almuerzo/cena heredados)
}
```

- El **primer item** cumple el rol del "plato principal" actual (para herencia cena→almuerzo, sugerencias, reportes, tipo delivery/takeaway/restaurante).
- Se elimina el concepto separado de "guarnición": pasa a ser simplemente el segundo item de la lista.
- **Migración automática** de planes guardados: `[meal, side].filter(Boolean)` → `items`. Sin pérdida de datos.

## Lógica de herencia (useMealPlan)

- Cena → almuerzo del día siguiente: se hereda **toda la lista de items** (no solo el principal).
- Delivery/takeaway → sobras (item único). Restaurante → sin herencia. Igual que hoy, mirando `items[0]`.
- Detección delivery/takeaway/restaurante/pasta usa `items[0]`.
- Drag & drop (`swapSlots`): intercambia el array `items` completo + nota entre slots.
- `autocompleteWeek`: rellena `items` en slots vacíos.

## UI — Vista lista (DayCard)

Cada comida muestra sus items apilados:
- Item lleno: emoji + nombre + nota inline + botones cambiar/eliminar.
- Si hay menos de 5 items y el último está lleno, aparece un botón "＋ Agregar alimento".
- El picker (`MealPicker`) se reusa tal cual pero ahora al elegir agrega un item a la lista en vez de fijar main/side (se saltea el paso "side").
- Drag handle sigue por comida (arrastra la comida entera con todos sus items), como pediste antes.

## UI — Vista tabla (WeekTableView)

Cada celda de comida lista sus items en líneas separadas, con botón para agregar hasta 5 y eliminar individuales.

## Reportes / Súper / Autocomplete

- `Reports.tsx`: `extractMeals` recorre `items` (todos los alimentos cuentan, con sus tags) en lugar de meal+side.
- `Shopping.tsx` y edge functions (`generate-shopping-list`, `autocomplete-week`, `suggest-*`): se ajusta el payload para enviar/recibir listas de items.

## Archivos afectados

- `src/hooks/useMealPlan.ts` (modelo, migración, herencia, swap, autocomplete)
- `src/components/DayCard.tsx` (render multi-item + agregar/eliminar)
- `src/components/WeekTableView.tsx`
- `src/pages/Index.tsx` (props/handlers)
- `src/pages/Reports.tsx`, `src/pages/Shopping.tsx`
- `supabase/functions/*` (payload de comidas)
- `mem://logic/meal-logic`

## Nota

Es un cambio grande y central. La migración conserva lo ya cargado. Los alimentos extra (item 3+) no se heredan de forma especial: la cena entera (todos sus items) pasa al almuerzo del día siguiente.

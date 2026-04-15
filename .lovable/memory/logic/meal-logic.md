---
name: Meal Logic
description: Core inheritance rules for meals (dinner to lunch, delivery as regular meal, no hardcoded Sunday pasta)
type: feature
---
- Dinner from previous day auto-suggests as next day's lunch (adult + baby).
- Delivery (id="delivery") is a regular selectable meal, not a toggle. When selected, card turns orange and side dish is hidden.
- Delivery leftovers auto-suggest as next-day lunch.
- Sunday pasta is no longer hardcoded — user picks it like any other meal.
- Baby meals skip delivery leftovers and unsafe meals in suggestions.
- `isDeliveryMeal()` helper checks `meal?.id === "delivery"`.

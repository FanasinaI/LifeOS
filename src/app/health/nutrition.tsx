import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  addMealItem,
  computeDailyMacros,
  computeMealMacros,
  createFood,
  createMeal,
  listFoods,
  listMealsForDay,
  type Meal,
} from '@/modules/nutrition';
import { useAsyncData } from '@/utils/use-async-data';

const MEAL_TYPES: { value: Meal['type']; label: string }[] = [
  { value: 'breakfast', label: 'Petit-déj' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Collation' },
];

export default function NutritionScreen() {
  const { data: foods, reload: reloadFoods } = useAsyncData(() => listFoods(), []);
  const { data: todayMeals, reload: reloadMeals } = useAsyncData(() => listMealsForDay(), []);
  const { data: dailyMacros, reload: reloadDaily } = useAsyncData(() => computeDailyMacros(), []);

  const [mealType, setMealType] = useState<Meal['type']>('lunch');
  const [currentMealId, setCurrentMealId] = useState<number | null>(null);
  const { data: mealMacros, reload: reloadMealMacros } = useAsyncData(
    () => (currentMealId ? computeMealMacros(currentMealId) : Promise.resolve(null)),
    [currentMealId]
  );

  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCalories, setNewFoodCalories] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [grams, setGrams] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleStartMeal() {
    const meal = await createMeal(mealType);
    setCurrentMealId(meal.id);
    reloadMeals();
  }

  async function handleAddFood() {
    const calories = Number(newFoodCalories.replace(',', '.'));
    if (!newFoodName.trim() || !Number.isFinite(calories) || calories < 0) return;
    const food = await createFood({ name: newFoodName.trim(), caloriesPer100g: calories });
    setNewFoodName('');
    setNewFoodCalories('');
    setSelectedFoodId(food.id);
    reloadFoods();
  }

  async function handleAddItem() {
    const parsedGrams = Number(grams.replace(',', '.'));
    if (!currentMealId || !selectedFoodId || !Number.isFinite(parsedGrams) || parsedGrams <= 0) return;

    setSaving(true);
    try {
      await addMealItem(currentMealId, selectedFoodId, parsedGrams);
      setGrams('');
      reloadMealMacros();
      reloadDaily();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={todayMeals ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="small" themeColor="textSecondary">
                Total du jour
              </ThemedText>
              <ThemedText type="subtitle">{dailyMacros ? `${Math.round(dailyMacros.calories)} kcal` : '…'}</ThemedText>
            </ThemedView>

            {currentMealId ? (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold">Repas en cours</ThemedText>
                {mealMacros ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {Math.round(mealMacros.calories)} kcal · P {Math.round(mealMacros.protein)}g · G{' '}
                    {Math.round(mealMacros.carbs)}g · L {Math.round(mealMacros.fat)}g
                  </ThemedText>
                ) : null}

                <ThemedText type="small">Aliment</ThemedText>
                <ChipRow>
                  {(foods ?? []).map((food) => (
                    <Chip
                      key={food.id}
                      label={food.name}
                      selected={selectedFoodId === food.id}
                      onPress={() => setSelectedFoodId(food.id)}
                    />
                  ))}
                </ChipRow>
                <ThemedView style={styles.inlineForm}>
                  <TextField value={newFoodName} onChangeText={setNewFoodName} placeholder="Nouvel aliment" />
                  <TextField
                    value={newFoodCalories}
                    onChangeText={setNewFoodCalories}
                    placeholder="kcal / 100g"
                    keyboardType="decimal-pad"
                  />
                  <PrimaryButton label="+ Aliment" onPress={handleAddFood} />
                </ThemedView>

                <TextField value={grams} onChangeText={setGrams} placeholder="Grammes" keyboardType="decimal-pad" />
                <PrimaryButton label="Ajouter au repas" onPress={handleAddItem} disabled={saving} />
              </ThemedView>
            ) : (
              <ThemedView style={styles.inlineForm}>
                <ChipRow>
                  {MEAL_TYPES.map((t) => (
                    <Chip key={t.value} label={t.label} selected={mealType === t.value} onPress={() => setMealType(t.value)} />
                  ))}
                </ChipRow>
                <PrimaryButton label="Nouveau repas" onPress={handleStartMeal} />
              </ThemedView>
            )}
            <ThemedText type="smallBold">Repas du jour</ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => <MealRow mealId={item.id} type={item.type} />}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={<ThemedText themeColor="textSecondary">Aucun repas enregistré aujourd&apos;hui.</ThemedText>}
      />
    </SafeAreaView>
  );
}

function MealRow({ mealId, type }: { mealId: number; type: Meal['type'] }) {
  const { data: macros } = useAsyncData(() => computeMealMacros(mealId), [mealId]);
  const label = MEAL_TYPES.find((t) => t.value === type)?.label ?? type;
  return <SummaryRow title={label} value={macros ? `${Math.round(macros.calories)} kcal` : '…'} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  inlineForm: {
    gap: Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
});

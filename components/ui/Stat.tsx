import { Text, View } from 'react-native';

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-3xl bg-white dark:bg-zinc-900 p-4 shadow-md border border-black/5 dark:border-white/5">
      <Text className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</Text>
      <Text className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-50">{value}</Text>
    </View>
  );
}

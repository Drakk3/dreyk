import { View } from 'react-native';

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-3xl bg-white/90 dark:bg-zinc-900/90 p-4 shadow-lg border border-black/5 dark:border-white/5">
      {children}
    </View>
  );
}

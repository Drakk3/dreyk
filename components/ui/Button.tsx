import { Pressable, Text, View } from 'react-native';

type Props = { title: string; onPress?: () => void; iconLeft?: React.ReactNode };

export default function Button({ title, onPress, iconLeft }: Props) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: '#00000022' }}
      className="active:opacity-90"
    >
      <View className="flex-row items-center gap-2 rounded-2xl bg-black dark:bg-white px-5 py-3 shadow-lg">
        {iconLeft}
        <Text className="text-white dark:text-black font-semibold">{title}</Text>
      </View>
    </Pressable>
  );
}

import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-zinc-50 dark:bg-black">
      {/* Header */}
      <View className="px-5 pt-12 pb-6">
        <Text className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Tu casa, al día ✨
        </Text>
        <Text className="text-zinc-600 dark:text-zinc-400 mt-1">
          Gastos y mercado en un solo lugar
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
      >
        {/* Stats */}
        <View className="flex-row gap-3">
          <Stat label="Total del mes" value="$ 0.00" />
          <Stat label="Pendientes" value="0" />
        </View>

        {/* Acciones rápidas */}
        <View className="flex-row gap-3 mt-4">
          <ActionButton
            title="Agregar gasto"
            icon={<Ionicons name="add-circle" size={18} color="#fff" />}
          />
          <View className="flex-1">
            <ActionButton
              title="Nuevo ítem"
              icon={<Ionicons name="cart" size={18} color="#fff" />}
            />
          </View>
        </View>

        {/* Últimos gastos */}
        <Card className="mt-5">
          <HeaderRow title="Últimos gastos" actionText="ver todo" />
          <View className="mt-3 gap-3">
            <Row label="Ejemplo · Mercado" right="$ 12.50" />
            <Row label="Ejemplo · Transporte" right="$ 3.00" />
          </View>
        </Card>

        {/* Lista de mercado */}
        <Card className="mt-4">
          <HeaderRow title="Lista de mercado" actionText="ver todo" />
          <View className="mt-3 gap-3">
            <Row label="Leche (2)" right="pendiente" />
            <Row label="Huevos (12)" right="pendiente" />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

/* ---------- UI subcomponents (mismos estilos “cool”) ---------- */

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-3xl bg-white/90 dark:bg-zinc-900/90 p-4 shadow-lg border border-black/5 dark:border-white/5 ${className}`}
    >
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-3xl bg-white dark:bg-zinc-900 p-4 shadow-md border border-black/5 dark:border-white/5">
      <Text className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </Text>
      <Text className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-50">{value}</Text>
    </View>
  );
}

function ActionButton({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <Pressable
      android_ripple={{ color: '#00000022' }}
      className="active:opacity-90 rounded-2xl"
    >
      <View className="flex-row items-center gap-2 rounded-2xl bg-black dark:bg-white px-5 py-3 shadow-lg">
        {icon}
        <Text className="text-white dark:text-black font-semibold">{title}</Text>
      </View>
    </Pressable>
  );
}

function HeaderRow({ title, actionText }: { title: string; actionText?: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</Text>
      {actionText ? <Text className="text-xs text-zinc-500">{actionText}</Text> : null}
    </View>
  );
}

function Row({ label, right }: { label: string; right?: string }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/70 px-3 py-3">
      <Text className="text-zinc-800 dark:text-zinc-200">{label}</Text>
      {right ? (
        <Text className="text-zinc-600 dark:text-zinc-400 font-medium">{right}</Text>
      ) : null}
    </View>
  );
}

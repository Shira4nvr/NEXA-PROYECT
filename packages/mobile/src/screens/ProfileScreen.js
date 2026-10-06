import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useAuthStore } from "@shein-clone/shared";
import { useCartStore } from "@shein-clone/shared";
import { colors } from "../theme/colors";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const clearCart = useCartStore((state) => state.clearCart);

  function handleLogout() {
    logout();
    clearCart();
    navigation.getParent()?.replace("Login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.name ?? "Invitado"}</Text>
      {user && <Button title="Cerrar sesión" color={colors.primary} onPress={handleLogout} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  name: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
});

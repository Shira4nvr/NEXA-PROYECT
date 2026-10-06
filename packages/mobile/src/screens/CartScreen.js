import React, { useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, Button } from "react-native";
import { useCartStore, formatCurrency, createOrder, useAuthStore } from "@shein-clone/shared";
import { colors } from "../theme/colors";

export default function CartScreen() {
  const { items, removeItem, getTotal, error, clearCart } = useCartStore();
  const token = useAuthStore((state) => state.token);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [address, setAddress] = useState({
    label: "Entrega",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "CO",
  });

  async function handlePurchase() {
    if (!token || items.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await createOrder(address);
      clearCart();
      setOrderId(result.orderId);
    } catch (purchaseError) {
      useCartStore.getState().setError?.(purchaseError.response?.data?.error || "No se pudo crear el pedido");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(item) => item.variantId || item.productId}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 40 }}>Tu carrito esta vacío</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={{ uri: item.image }} accessibilityLabel={item.name} style={styles.thumb} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text numberOfLines={1}>{item.name}</Text>
              <Text style={{ fontWeight: "bold" }}>{formatCurrency(item.price)} x {item.quantity}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.variantId || item.productId)}>
              <Text style={{ color: colors.primary }}>Quitar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: {formatCurrency(getTotal())}</Text>
        <TextInput
          accessibilityLabel="Dirección de entrega"
          placeholder="Calle, ciudad, departamento, código postal"
          value={address.street}
          onChangeText={(value) => setAddress({ ...address, street: value })}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Ciudad"
          placeholder="Ciudad"
          value={address.city}
          onChangeText={(value) => setAddress({ ...address, city: value })}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Departamento"
          placeholder="Departamento"
          value={address.state}
          onChangeText={(value) => setAddress({ ...address, state: value })}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Código postal"
          placeholder="Código postal"
          value={address.zipCode}
          onChangeText={(value) => setAddress({ ...address, zipCode: value })}
          style={styles.input}
        />
        <Button title={isSubmitting ? "Creando pedido…" : "Comprar"} onPress={handlePurchase} disabled={isSubmitting || items.length === 0 || !token} />
        {orderId && <Text accessibilityRole="status" style={styles.success}>Pedido creado: {orderId}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  thumb: { width: 56, height: 56, borderRadius: 6, backgroundColor: colors.border },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  total: { fontSize: 16, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 10, marginBottom: 8, backgroundColor: "#FFFFFF" },
  error: { paddingHorizontal: 16, paddingTop: 12, color: "#8A1C1C", fontSize: 12 },
  success: { color: colors.primary, marginTop: 8 },
});

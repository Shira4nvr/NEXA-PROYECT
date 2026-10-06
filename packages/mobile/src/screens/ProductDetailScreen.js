import React, { useEffect } from "react";
import { View, Text, Image, Button, StyleSheet, ScrollView } from "react-native";
import { useProductStore, useCartStore, formatCurrency } from "@shein-clone/shared";
import { colors } from "../theme/colors";

export default function ProductDetailScreen({ route }) {
  const { id } = route.params;
  const { selectedProduct, fetchProductById, error, isLoading } = useProductStore();
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetchProductById(id);
  }, [id]);

  if (isLoading && !selectedProduct) return <View style={styles.container}><Text style={styles.message}>Cargando producto…</Text></View>;
  if (error || !selectedProduct) return <View style={styles.container}><Text accessibilityRole="alert" style={styles.message}>{error || "Producto no encontrado"}</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: selectedProduct.image }}
        accessibilityLabel={selectedProduct.imageAlt || selectedProduct.name || "Producto"}
        style={styles.image}
      />
      <View style={{ padding: 16 }}>
        <Text style={styles.name}>{selectedProduct.name}</Text>
        <Text style={styles.price}>{formatCurrency(selectedProduct.price)}</Text>
        <Button title="Agregar al carrito" color={colors.primary} onPress={() => addItem(selectedProduct)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  image: { width: "100%", aspectRatio: 0.9, backgroundColor: colors.border },
  name: { fontSize: 18, fontWeight: "600", color: colors.text },
  message: { padding: 20, color: colors.text, fontSize: 13 },
  price: { fontSize: 20, fontWeight: "bold", color: colors.primary, marginVertical: 8 },
});

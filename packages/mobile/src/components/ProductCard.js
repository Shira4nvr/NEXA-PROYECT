import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { formatCurrency } from "@shein-clone/shared";
import { colors } from "../theme/colors";

export default function ProductCard({ product, onPress }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatCurrency(product.price)}`}
      style={styles.card}
      onPress={onPress}
    >
      <Image
        source={{ uri: product.image }}
        accessibilityLabel={product.imageAlt || product.name || "Producto"}
        style={styles.image}
      />
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.price}>{formatCurrency(product.price)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: "48%", marginBottom: 16 },
  image: { width: "100%", aspectRatio: 0.8, borderRadius: 8, backgroundColor: colors.border },
  name: { marginTop: 6, fontSize: 13, color: colors.text },
  price: { marginTop: 2, fontSize: 14, fontWeight: "bold", color: colors.text },
});

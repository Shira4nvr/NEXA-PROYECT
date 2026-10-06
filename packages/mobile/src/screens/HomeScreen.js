import React, { useEffect } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useProductStore } from "@shein-clone/shared";
import ProductCard from "../components/ProductCard";
import { colors } from "../theme/colors";

export default function HomeScreen({ navigation }) {
  const { products, fetchProducts, isLoading, error } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <View style={styles.container}>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 12 }}
        refreshing={isLoading}
        onRefresh={() => fetchProducts()}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate("ProductDetail", { id: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  error: { padding: 12, color: "#8A1C1C", fontSize: 12 },
});

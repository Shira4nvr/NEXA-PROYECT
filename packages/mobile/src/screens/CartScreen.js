import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  createAddress,
  createOrder,
  formatCurrency,
  getAddresses,
  updateAddress,
  useAuthStore,
  useCartStore,
} from "@shein-clone/shared";
import DeliveryAddressForm, { EMPTY_ADDRESS } from "../components/DeliveryAddressForm";
import { colors } from "../theme/colors";

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQuantity, getTotal, error, clearCart, setError } = useCartStore();
  const token = useAuthStore((state) => state.token);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  function openOrders() {
    navigation.getParent()?.navigate("Orders");
  }

  useFocusEffect(useCallback(() => {
    let active = true;
    setIsLoadingAddresses(true);
    getAddresses()
      .then((result) => {
        if (!active) return;
        setAddresses(result);
        const preferred = result.find((item) => item.isDefault) || result[0];
        if (preferred) {
          setSelectedAddressId(preferred.id);
          setAddress({ ...preferred });
        }
      })
      .catch((loadError) => {
        if (active) setNotice(loadError.response?.data?.error || "No se pudieron cargar tus direcciones guardadas.");
      })
      .finally(() => { if (active) setIsLoadingAddresses(false); });
    return () => { active = false; };
  }, []));

  function selectAddress(id) {
    setSelectedAddressId(id);
    setAddress(id ? { ...addresses.find((item) => item.id === id) } : { ...EMPTY_ADDRESS });
    setNotice("");
  }

  function submitPurchase() {
    if (!token || items.length === 0) return;
    if (!address.label?.trim() || !address.street?.trim() || !address.city || !address.state || !address.zipCode?.trim()) {
      setNotice("Completa la dirección y selecciona departamento y ciudad.");
      return;
    }
    Alert.alert(
      "Confirmar pedido",
      `¿Confirmas ${items.length} producto(s) por ${formatCurrency(getTotal())}, con entrega en ${address.city}, ${address.state}?`,
      [
        { text: "Revisar", style: "cancel" },
        { text: "Confirmar", onPress: () => { void confirmPurchase(); } },
      ],
    );
  }

  async function confirmPurchase() {
    setIsSubmitting(true);
    setNotice("");
    setError(null);
    try {
      const savedAddress = selectedAddressId
        ? await updateAddress(selectedAddressId, address)
        : await createAddress({ ...address, isDefault: addresses.length === 0 });
      setAddresses((current) => [
        savedAddress,
        ...current.filter((item) => item.id !== savedAddress.id)
          .map((item) => savedAddress.isDefault ? { ...item, isDefault: false } : item),
      ]);
      setSelectedAddressId(savedAddress.id);
      const result = await createOrder(savedAddress.id);
      clearCart();
      setNotice(`Pedido creado: ${result.orderId}`);
      Alert.alert("Compra registrada", "Tu pedido ya está en Mis pedidos.", [
        { text: "Ver mis pedidos", onPress: openOrders },
        { text: "Continuar", style: "cancel" },
      ]);
    } catch (purchaseError) {
      const message = purchaseError.response?.data?.error || "No se pudo registrar el pedido. Revisa tu conexión e inténtalo de nuevo.";
      setError(message);
      setNotice(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const quantity = items.reduce((total, item) => total + item.quantity, 0);
  const total = getTotal();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>TU COMPRA</Text>
      <Text style={styles.title}>Tu carrito</Text>
      <Text style={styles.subtitle}>{quantity} {quantity === 1 ? "artículo" : "artículos"} · revisa tus productos y la dirección antes de confirmar.</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}

      {!items.length ? (
        <View style={styles.empty}>
          <Text style={styles.sectionTitle}>Tu carrito está vacío</Text>
          <Text style={styles.subtitle}>Cuando agregues productos podrás revisar la compra aquí.</Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Home")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Explorar productos</Text></Pressable>
          {!!notice.startsWith("Pedido creado:") && <Pressable accessibilityRole="button" onPress={openOrders} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Consultar mis pedidos</Text></Pressable>}
        </View>
      ) : <>
        <View style={styles.productList}>
          {items.map((item) => (
            <View style={styles.item} key={item.variantId}>
              {item.image
                ? <Image source={{ uri: item.image }} accessibilityLabel={item.name} style={styles.image} />
                : <View style={[styles.image, styles.imageFallback]}><Text style={styles.muted}>NEXO</Text></View>}
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.muted}>{formatCurrency(item.price)} por unidad</Text>
                <View style={styles.quantity}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Disminuir cantidad de ${item.name}`} onPress={() => updateQuantity(item.variantId, item.quantity - 1)}><Text style={styles.quantityAction}>−</Text></Pressable>
                  <Text style={styles.quantityValue}>{item.quantity}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar cantidad de ${item.name}`} onPress={() => updateQuantity(item.variantId, item.quantity + 1)}><Text style={styles.quantityAction}>＋</Text></Pressable>
                </View>
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                <Pressable accessibilityRole="button" onPress={() => removeItem(item.variantId)}><Text style={styles.remove}>Quitar</Text></Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dirección de entrega</Text>
          {addresses.length > 0 && <View style={styles.savedAddresses}>
            {addresses.map((item) => <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedAddressId === item.id }}
              key={item.id}
              onPress={() => selectAddress(item.id)}
              style={[styles.addressChoice, selectedAddressId === item.id && styles.addressChoiceActive]}
            >
              <Text style={styles.addressChoiceTitle}>{item.label}{item.isDefault ? " · Principal" : ""}</Text>
              <Text style={styles.muted}>{item.street} · {item.city}, {item.state}</Text>
            </Pressable>)}
            <Pressable accessibilityRole="button" onPress={() => selectAddress("")} style={[styles.addressChoice, !selectedAddressId && styles.addressChoiceActive]}>
              <Text style={styles.addressChoiceTitle}>＋ Usar otra dirección</Text>
            </Pressable>
          </View>}
          {isLoadingAddresses
            ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Cargando direcciones…</Text></View>
            : <DeliveryAddressForm value={address} onChange={setAddress} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.summaryRow}><Text style={styles.muted}>Productos ({quantity})</Text><Text style={styles.summaryValue}>{formatCurrency(total)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.muted}>Envío</Text><Text style={styles.summaryValue}>Por coordinar</Text></View>
          <View style={[styles.summaryRow, styles.grandTotal]}><Text style={styles.grandTotalText}>Total productos</Text><Text style={styles.grandTotalText}>{formatCurrency(total)}</Text></View>
          <Text style={styles.shippingNote}>El costo del envío se coordinará con el vendedor y no está incluido.</Text>
          {!token && <Text style={styles.error}>Inicia sesión para completar la compra.</Text>}
          <Pressable accessibilityRole="button" disabled={isSubmitting || isLoadingAddresses || !token} onPress={submitPurchase} style={[styles.primaryButton, (isSubmitting || isLoadingAddresses || !token) && styles.disabled]}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Confirmar compra</Text>}
          </Pressable>
        </View>
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 40 },
  eyebrow: { marginTop: 5, color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  title: { marginTop: 6, color: colors.text, fontSize: 29, fontWeight: "700" },
  subtitle: { marginTop: 6, marginBottom: 14, color: "#555", fontSize: 12, lineHeight: 18 },
  productList: { gap: 10, marginBottom: 16 },
  item: { flexDirection: "row", alignItems: "center", gap: 11, padding: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  image: { width: 66, height: 78, backgroundColor: colors.surface },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  itemMain: { flex: 1, gap: 5 },
  itemName: { color: colors.text, fontSize: 12, fontWeight: "700" },
  muted: { color: "#555", fontSize: 10, lineHeight: 15 },
  quantity: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 12, marginTop: 3, borderWidth: 1, borderColor: "#bbb" },
  quantityAction: { paddingHorizontal: 9, paddingVertical: 4, color: colors.text, fontSize: 15 },
  quantityValue: { minWidth: 16, color: colors.text, fontSize: 11, textAlign: "center" },
  itemActions: { alignItems: "flex-end", gap: 12 },
  itemTotal: { color: colors.text, fontSize: 12, fontWeight: "700" },
  remove: { color: "#803b32", fontSize: 10, textDecorationLine: "underline" },
  section: { marginBottom: 15, padding: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  sectionTitle: { marginBottom: 10, color: colors.text, fontSize: 16, fontWeight: "700" },
  savedAddresses: { gap: 7, marginBottom: 10 },
  addressChoice: { padding: 10, borderWidth: 1, borderColor: "#aaa" },
  addressChoiceActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  addressChoiceTitle: { color: colors.text, fontSize: 11, fontWeight: "700" },
  loading: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 9 },
  summaryValue: { color: colors.text, fontSize: 11, fontWeight: "600" },
  grandTotal: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.border },
  grandTotalText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  shippingNote: { marginTop: 10, color: "#555", fontSize: 10, lineHeight: 15 },
  primaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 14, paddingHorizontal: 14, backgroundColor: colors.primary },
  primaryButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  secondaryButton: { minHeight: 42, alignItems: "center", justifyContent: "center", marginTop: 12, borderWidth: 1, borderColor: "#444" },
  secondaryButtonText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  disabled: { opacity: 0.45 },
  empty: { padding: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  error: { marginVertical: 7, color: "#8A1C1C", fontSize: 11 },
  notice: { marginVertical: 8, color: "#315d3b", fontSize: 11 },
});

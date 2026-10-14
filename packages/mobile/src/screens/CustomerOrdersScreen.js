import React, { useCallback, useState } from "react";
import {
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
  deleteAddress,
  formatCurrency,
  getAddresses,
  getCustomerOrders,
  getPublicAssetUrl,
  updateAddress,
} from "@shein-clone/shared";
import DeliveryAddressForm, { EMPTY_ADDRESS } from "../components/DeliveryAddressForm";
import { colors } from "../theme/colors";

const FULFILLMENT_STEPS = [
  ["PENDING", "Recibido"],
  ["PREPARING", "Alistamiento"],
  ["IN_TRANSIT", "Transporte"],
  ["DELIVERED", "Entregado"],
];
const ORDER_LABELS = {
  PENDING: "Pago pendiente",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function dateLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value));
}

export default function CustomerOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS });
  const [editingId, setEditingId] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(() => {
    let active = true;
    setIsLoading(true);
    Promise.all([getCustomerOrders(), getAddresses()])
      .then(([customerOrders, savedAddresses]) => {
        if (!active) return;
        setOrders(customerOrders);
        setAddresses(savedAddresses);
        setNotice("");
      })
      .catch((error) => {
        if (active) setNotice(error.response?.data?.error || "No se pudo cargar la información de tu cuenta.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(loadData);

  function editAddress(item) {
    setEditingId(item.id);
    setAddress({ ...item });
    setNotice("");
  }

  function resetAddressForm() {
    setEditingId("");
    setAddress({ ...EMPTY_ADDRESS });
  }

  async function saveAddress() {
    if (!address.label?.trim() || !address.street?.trim() || !address.city || !address.state || !address.zipCode?.trim()) {
      setNotice("Completa todos los campos y selecciona una ciudad de la lista.");
      return;
    }
    setIsSaving(true);
    setNotice("");
    try {
      const saved = editingId
        ? await updateAddress(editingId, address)
        : await createAddress({ ...address, isDefault: addresses.length === 0 });
      setAddresses((current) => {
        const next = editingId
          ? current.map((item) => item.id === saved.id ? saved : saved.isDefault ? { ...item, isDefault: false } : item)
          : [...current, saved];
        return next.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.label.localeCompare(b.label, "es"));
      });
      setNotice(editingId ? "Dirección actualizada." : "Dirección guardada en tu cuenta.");
      resetAddressForm();
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo guardar la dirección.");
    } finally {
      setIsSaving(false);
    }
  }

  function removeAddress(item) {
    Alert.alert("Eliminar dirección", `¿Quieres eliminar «${item.label}»?`, [
      { text: "Conservar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => { void confirmRemoveAddress(item); } },
    ]);
  }

  async function confirmRemoveAddress(item) {
    try {
      await deleteAddress(item.id);
      setAddresses((current) => {
        const remaining = current.filter((entry) => entry.id !== item.id);
        if (item.isDefault && remaining.length) remaining[0] = { ...remaining[0], isDefault: true };
        return remaining;
      });
      if (editingId === item.id) resetAddressForm();
      setNotice("Dirección eliminada.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo eliminar la dirección.");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>SOLICITUDES Y COMPRAS</Text>
      <Text style={styles.title}>Mis pedidos</Text>
      <Text style={styles.subtitle}>Consulta el avance de cada producto y administra tus direcciones de entrega.</Text>
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Seguimiento</Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Store", { screen: "Home" })}><Text style={styles.link}>Seguir comprando</Text></Pressable>
        </View>
        {isLoading && <Text style={styles.muted}>Cargando tus pedidos…</Text>}
        {!isLoading && !orders.length && <Text style={styles.empty}>Aún no tienes pedidos. Cuando confirmes una compra, su seguimiento aparecerá aquí.</Text>}
        {orders.map((order) => (
          <View key={order.id} style={styles.order}>
            <View style={styles.orderHeader}>
              <View style={styles.orderId}><Text style={styles.eyebrow}>PEDIDO</Text><Text selectable style={styles.orderIdText}>{order.id.slice(0, 8).toUpperCase()}</Text></View>
              <View style={styles.orderDate}><Text style={styles.eyebrow}>FECHA</Text><Text style={styles.muted}>{dateLabel(order.createdAt)}</Text></View>
              <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
            </View>
            <Text style={styles.orderStatus}>{ORDER_LABELS[order.status] || order.status}</Text>
            {order.items.map((item) => {
              const product = item.variant.product;
              const currentStep = FULFILLMENT_STEPS.findIndex(([status]) => status === item.fulfillmentStatus);
              const image = product.images?.[0];
              return (
                <View key={item.id} style={styles.orderItem}>
                  {image?.url ? <Image accessibilityLabel={image.altText || product.name} source={{ uri: getPublicAssetUrl(image.url) }} style={styles.productImage} /> : <View style={styles.imagePlaceholder}><Text style={styles.muted}>NEXO</Text></View>}
                  <View style={styles.orderItemContent}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.muted}>Cantidad {item.quantity} · {formatCurrency(item.priceAtOrder * item.quantity)}</Text>
                    <View style={styles.timeline}>
                      {FULFILLMENT_STEPS.map(([status, label], index) => (
                        <View style={styles.step} key={status}>
                          <View style={[styles.stepDot, index <= currentStep && styles.stepDone, order.status === "CANCELLED" && styles.stepCancelled]}>
                            <Text style={[styles.stepNumber, index <= currentStep && styles.stepNumberActive]}>{index < currentStep ? "✓" : index + 1}</Text>
                          </View>
                          <Text style={styles.stepLabel}>{label}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.muted}>Vendedor: {product.seller?.storeName || "NEXO"}</Text>
                    {item.estimatedArrival && <Text style={styles.arrival}>Llegada estimada: {dateLabel(item.estimatedArrival)}</Text>}
                  </View>
                </View>
              );
            })}
            <Text style={styles.delivery}>Entrega: {order.deliveryLabel} · {order.deliveryStreet}, {order.deliveryCity}, {order.deliveryState} · {order.deliveryZipCode}</Text>
            {!!order.payment && <Text style={styles.muted}>Pago: {order.payment.method === "CASH_ON_DELIVERY" ? "Contra entrega" : order.payment.method}</Text>}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direcciones guardadas</Text>
        {addresses.map((item) => (
          <View key={item.id} style={styles.addressCard}>
            <View style={styles.addressDetails}>
              <Text style={styles.addressTitle}>{item.label}{item.isDefault ? " · Principal" : ""}</Text>
              <Text style={styles.muted}>{item.street}</Text>
              <Text style={styles.muted}>{item.city}, {item.state} {item.zipCode}</Text>
            </View>
            <View style={styles.addressActions}>
              <Pressable accessibilityRole="button" onPress={() => editAddress(item)}><Text style={styles.link}>Editar</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => removeAddress(item)}><Text style={styles.deleteLink}>Eliminar</Text></Pressable>
            </View>
          </View>
        ))}
        <Text style={styles.formTitle}>{editingId ? "Editar dirección" : "Agregar dirección"}</Text>
        <DeliveryAddressForm value={address} onChange={setAddress} />
        <View style={styles.formActions}>
          {editingId && <Pressable accessibilityRole="button" onPress={resetAddressForm} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>}
          <Pressable accessibilityRole="button" disabled={isSaving} onPress={saveAddress} style={[styles.primaryButton, isSaving && styles.disabled]}>
            <Text style={styles.primaryText}>{isSaving ? "Guardando…" : editingId ? "Guardar cambios" : "Guardar dirección"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 17, paddingBottom: 40 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  title: { marginTop: 6, color: colors.text, fontSize: 27, fontWeight: "700" },
  subtitle: { marginTop: 6, marginBottom: 14, color: "#555", fontSize: 12, lineHeight: 18 },
  section: { marginBottom: 15, padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  sectionTitle: { marginBottom: 11, color: colors.text, fontSize: 16, fontWeight: "700" },
  order: { marginTop: 11, padding: 11, borderWidth: 1, borderColor: colors.border },
  orderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  orderId: { flex: 1 },
  orderIdText: { marginTop: 3, color: colors.text, fontSize: 13, fontWeight: "700" },
  orderDate: { flex: 1 },
  orderTotal: { color: colors.text, fontSize: 13, fontWeight: "700" },
  orderStatus: { alignSelf: "flex-start", marginTop: 9, paddingVertical: 4, paddingHorizontal: 7, backgroundColor: colors.surface, color: colors.text, fontSize: 10, fontWeight: "700" },
  orderItem: { flexDirection: "row", gap: 9, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  productImage: { width: 58, height: 68, backgroundColor: colors.surface },
  imagePlaceholder: { width: 58, height: 68, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  orderItemContent: { flex: 1, gap: 5 },
  productName: { color: colors.text, fontSize: 12, fontWeight: "700" },
  timeline: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
  step: { flex: 1, alignItems: "center", gap: 3 },
  stepDot: { width: 21, height: 21, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#888", borderRadius: 11 },
  stepDone: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepCancelled: { borderColor: "#888", backgroundColor: "#888" },
  stepNumber: { color: colors.text, fontSize: 9 },
  stepNumberActive: { color: "#fff" },
  stepLabel: { color: "#444", fontSize: 8, textAlign: "center" },
  arrival: { color: "#205329", fontSize: 10, fontWeight: "700" },
  delivery: { marginTop: 11, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, color: colors.text, fontSize: 10, lineHeight: 15 },
  muted: { color: "#555", fontSize: 10, lineHeight: 15 },
  empty: { paddingVertical: 9, color: "#555", fontSize: 11, lineHeight: 17 },
  link: { color: colors.text, fontSize: 10, fontWeight: "700", textDecorationLine: "underline" },
  addressCard: { flexDirection: "row", justifyContent: "space-between", gap: 9, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  addressDetails: { flex: 1, gap: 2 },
  addressTitle: { color: colors.text, fontSize: 11, fontWeight: "700" },
  addressActions: { justifyContent: "space-around", alignItems: "flex-end", gap: 8 },
  deleteLink: { color: "#803b32", fontSize: 10, textDecorationLine: "underline" },
  formTitle: { marginTop: 15, marginBottom: 4, color: colors.text, fontSize: 13, fontWeight: "700" },
  formActions: { flexDirection: "row", gap: 9, marginTop: 12 },
  primaryButton: { minHeight: 43, flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, backgroundColor: colors.primary },
  primaryText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cancelButton: { minHeight: 43, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#777" },
  cancelText: { color: colors.text, fontSize: 11 },
  disabled: { opacity: 0.5 },
  notice: { marginVertical: 8, color: "#315d3b", fontSize: 11 },
});

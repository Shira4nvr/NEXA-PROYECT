import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  getAdminAnalytics,
  getAdminOrders,
  getAdminUsers,
  setAdminSellerStatus,
  setAdminUserStatus,
  useAuthStore,
} from "@shein-clone/shared";
import { colors } from "../theme/colors";

const SECTIONS = [
  ["metrics", "Métricas"],
  ["orders", "Pedidos"],
  ["users", "Usuarios"],
  ["sellers", "Vendedores"],
];
const ORDER_LABELS = { PENDING: "Pago pendiente", PAID: "Pagado", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELLED: "Cancelado" };
const FULFILLMENT_LABELS = { PENDING: "Recibido", PREPARING: "Alistamiento", IN_TRANSIT: "En transporte", DELIVERED: "Entregado" };

function dateLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value));
}

export default function AdminDashboardScreen({ navigation }) {
  const [section, setSection] = useState("metrics");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAdminAnalytics()
      .then((stats) => { if (active) setAnalytics(stats); })
      .catch((error) => { if (active) setNotice(error.response?.data?.error || "No se pudieron cargar las métricas."); })
      .finally(() => { if (active) setMetricsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (section === "metrics") return undefined;
    let active = true;
    setIsLoading(true);
    setNotice("");
    const request = section === "orders"
      ? getAdminOrders()
      : getAdminUsers(query, section === "sellers" ? "SELLER" : "CUSTOMER");
    request
      .then((result) => {
        if (!active) return;
        if (section === "orders") setOrders(result);
        else setUsers(result.map((user) => ({ ...user, label: user.name || "Sin nombre" })));
      })
      .catch((error) => { if (active) setNotice(error.response?.data?.error || "No se pudieron cargar los datos solicitados."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [query, section]);

  async function toggleUser(user) {
    try {
      const updated = await setAdminUserStatus(user.id, !user.isActive);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, isActive: updated.isActive } : item));
      setNotice("Estado de cuenta actualizado.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo actualizar la cuenta.");
    }
  }

  async function updateSellerStatus(user, status) {
    try {
      const sellerProfile = await setAdminSellerStatus(user.sellerProfile.id, status);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, sellerProfile } : item));
      setNotice("Estado del vendedor actualizado.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo actualizar el vendedor.");
    }
  }

  function logout() {
    useAuthStore.getState().logout();
    navigation.replace("Login");
  }

  const metrics = analytics ? [
    ["Órdenes", analytics.orders],
    ["Valor bruto", `$ ${new Intl.NumberFormat("es-CO").format(analytics.grossCop)} COP`],
    ["Cuentas activas", `${analytics.activeUsers} / ${analytics.users}`],
  ] : [];

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={logout}><Text style={styles.topLink}>Cerrar sesión</Text></Pressable>
        <Text style={styles.brand}>NEXO / ADMIN</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Legal", { document: "privacy" })}><Text style={styles.topLink}>Legal</Text></Pressable>
      </View>
      <View style={styles.warning}>
        <Text style={styles.warningTitle}>CENTRO ADMINISTRATIVO</Text>
        <Text style={styles.warningCopy}>Cada área de gestión tiene su vista propia. Las acciones quedan registradas en la base de datos.</Text>
      </View>
      <Text style={styles.eyebrow}>ADMINISTRACIÓN</Text>
      <Text style={styles.title}>{SECTIONS.find(([id]) => id === section)?.[1]}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabs} accessibilityRole="tablist">
        {SECTIONS.map(([id, label]) => <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: section === id }}
          key={id}
          onPress={() => setSection(id)}
          style={[styles.sectionTab, section === id && styles.sectionTabActive]}
        ><Text style={[styles.sectionTabText, section === id && styles.sectionTabTextActive]}>{label}</Text></Pressable>)}
      </ScrollView>

      {section === "metrics" && <>
        <Text style={styles.subtitle}>Indicadores generales y estado de las órdenes.</Text>
        <View style={styles.metrics}>
          {metrics.map(([label, value]) => <View key={label} style={styles.metric}>
            <Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricNote}>Base de datos</Text>
          </View>)}
          {!metrics.length && <Text style={styles.empty}>{metricsLoading ? "Cargando métricas…" : "Métricas no disponibles."}</Text>}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Órdenes por estado</Text>
          {Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => <View key={status} style={styles.statusRow}><Text style={styles.userRole}>{ORDER_LABELS[status] || status}</Text><Text style={styles.userName}>{count}</Text></View>)}
          {!Object.keys(analytics?.ordersByStatus || {}).length && <Text style={styles.empty}>Aún no hay órdenes.</Text>}
        </View>
      </>}

      {section === "orders" && <>
        <Text style={styles.subtitle}>Pedidos registrados, clientes, pago y avance logístico.</Text>
        {isLoading && <Text style={styles.empty}>Cargando pedidos…</Text>}
        {!isLoading && !orders.length && <Text style={styles.empty}>No hay pedidos registrados.</Text>}
        {orders.map((order) => <View key={order.id} style={styles.section}>
          <View style={styles.orderHeader}>
            <View><Text style={styles.eyebrow}>PEDIDO</Text><Text selectable style={styles.orderId}>{order.id.slice(0, 8).toUpperCase()}</Text></View>
            <View><Text style={styles.eyebrow}>FECHA</Text><Text style={styles.muted}>{dateLabel(order.createdAt)}</Text></View>
          </View>
          <Text style={styles.orderCustomer}>{order.user?.name || "Cliente"} · {order.user?.email}</Text>
          <Text style={styles.orderTotal}>{ORDER_LABELS[order.status] || order.status} · {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(order.total)}</Text>
          {order.items.map((item) => <View key={item.id} style={styles.orderItem}>
            <Text style={styles.productName}>{item.variant.product.name} · {item.quantity} unidades</Text>
            <Text style={styles.muted}>{item.variant.product.seller?.storeName || "NEXO"} · {FULFILLMENT_LABELS[item.fulfillmentStatus] || item.fulfillmentStatus}</Text>
            {!!item.estimatedArrival && <Text style={styles.arrival}>Llegada estimada: {dateLabel(item.estimatedArrival)}</Text>}
          </View>)}
          <Text style={styles.delivery}>Entrega: {order.deliveryLabel} · {order.deliveryStreet}, {order.deliveryCity}, {order.deliveryState} · {order.deliveryZipCode}</Text>
        </View>)}
      </>}

      {(section === "users" || section === "sellers") && <>
        <Text style={styles.subtitle}>{section === "users" ? "Cuentas de clientes y estado de acceso." : "Solicitudes, tiendas y estado de vendedores."}</Text>
        <View style={styles.section}>
          <Text style={styles.label}>{section === "users" ? "Buscar clientes" : "Buscar vendedores"}</Text>
          <TextInput accessibilityLabel={`Buscar ${section === "users" ? "clientes" : "vendedores"}`} value={query} onChangeText={setQuery} placeholder="Nombre o correo" placeholderTextColor="#626262" returnKeyType="search" style={styles.search} />
          {isLoading && <Text style={styles.empty}>Cargando cuentas…</Text>}
          {users.map((user) => (
            <View key={user.id} style={styles.userRow}>
              <Text style={styles.userName}>{user.label}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}><Text style={styles.userRole}>{user.role}</Text><Text style={[styles.userState, user.isActive ? styles.active : styles.paused]}>{user.isActive ? "Activa" : "Pausada"}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel={`${user.isActive ? "Desactivar" : "Reactivar"} ${user.label}`} onPress={() => toggleUser(user)} style={styles.action}>
                <Text style={styles.actionText}>{user.isActive ? "Desactivar cuenta" : "Reactivar cuenta"}</Text>
              </Pressable>
              {section === "sellers" && user.sellerProfile && <>
                <Text style={styles.userEmail}>Tienda: {user.sellerProfile.storeName} · {user.sellerProfile.status}</Text>
                {user.sellerProfile.status !== "ACTIVE" && <Pressable accessibilityRole="button" onPress={() => updateSellerStatus(user, "ACTIVE")} style={styles.action}><Text style={styles.actionText}>Aprobar vendedor</Text></Pressable>}
                {user.sellerProfile.status === "ACTIVE" && <Pressable accessibilityRole="button" onPress={() => updateSellerStatus(user, "SUSPENDED")} style={styles.action}><Text style={styles.actionText}>Suspender vendedor</Text></Pressable>}
              </>}
            </View>
          ))}
          {!isLoading && !users.length && <Text style={styles.empty}>{section === "users" ? "No hay clientes que coincidan." : "No hay vendedores que coincidan."}</Text>}
        </View>
      </>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  topBar: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: colors.text, fontSize: 12, fontWeight: "800", letterSpacing: 1.6 },
  topLink: { color: "#333", fontSize: 12, textDecorationLine: "underline" },
  warning: { marginTop: 4, marginBottom: 22, padding: 13, borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.surface },
  warningTitle: { color: colors.text, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  warningCopy: { marginTop: 5, color: "#333", fontSize: 11, lineHeight: 16 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  title: { marginTop: 5, color: colors.text, fontSize: 27, fontWeight: "700" },
  subtitle: { marginTop: 6, marginBottom: 16, color: "#555", fontSize: 12, lineHeight: 18 },
  sectionTabs: { gap: 8, paddingVertical: 12 },
  sectionTab: { minHeight: 39, justifyContent: "center", paddingHorizontal: 13, borderWidth: 1, borderColor: "#555" },
  sectionTabActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  sectionTabText: { color: colors.text, fontSize: 11, fontWeight: "600" },
  sectionTabTextActive: { color: "#fff" },
  metrics: { gap: 9, marginBottom: 17 },
  metric: { padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  metricLabel: { color: "#444", fontSize: 11 },
  metricValue: { marginTop: 5, color: colors.text, fontSize: 22, fontWeight: "700" },
  metricNote: { marginTop: 2, color: "#595959", fontSize: 10 },
  section: { marginBottom: 14, padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  sectionTitle: { marginBottom: 10, color: colors.text, fontSize: 15, fontWeight: "700" },
  statusRow: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border },
  userRole: { color: "#333", fontSize: 11 },
  userName: { color: colors.text, fontSize: 13, fontWeight: "700" },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  orderId: { marginTop: 3, color: colors.text, fontSize: 13, fontWeight: "700" },
  orderCustomer: { marginTop: 9, color: colors.text, fontSize: 11 },
  orderTotal: { marginTop: 5, color: colors.text, fontSize: 11, fontWeight: "700" },
  orderItem: { marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.border },
  productName: { color: colors.text, fontSize: 11, fontWeight: "700" },
  arrival: { marginTop: 4, color: "#205329", fontSize: 10 },
  delivery: { marginTop: 9, color: "#333", fontSize: 10, lineHeight: 15 },
  muted: { color: "#555", fontSize: 10, lineHeight: 15 },
  label: { marginBottom: 6, color: "#333", fontSize: 11, fontWeight: "600" },
  search: { minHeight: 44, marginBottom: 8, paddingHorizontal: 11, borderWidth: 1, borderColor: "#666", color: colors.text, fontSize: 13 },
  userRow: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
  userEmail: { marginTop: 3, color: "#4A4A4A", fontSize: 11 },
  userMeta: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  userState: { fontSize: 10, fontWeight: "700" },
  active: { color: "#24572A" },
  paused: { color: "#823A2B" },
  action: { minHeight: 40, alignSelf: "flex-start", justifyContent: "center", marginTop: 7, paddingHorizontal: 10, borderWidth: 1, borderColor: "#555" },
  actionText: { color: "#252525", fontSize: 11, fontWeight: "600" },
  empty: { paddingVertical: 10, color: "#555", fontSize: 11, lineHeight: 17 },
  notice: { marginTop: 8, color: "#333", fontSize: 11, lineHeight: 16 },
});

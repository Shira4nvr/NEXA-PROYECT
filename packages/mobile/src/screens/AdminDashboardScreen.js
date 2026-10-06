import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAdminAnalytics, getAdminUsers, setAdminSellerStatus, setAdminUserStatus, useAuthStore } from "@shein-clone/shared";
import { colors } from "../theme/colors";

export default function AdminDashboardScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    Promise.all([getAdminAnalytics(), getAdminUsers(query)])
      .then(([stats, accountList]) => {
        if (!active) return;
        setAnalytics(stats);
        setUsers(accountList.map((user) => ({ ...user, label: user.name || "Sin nombre" })));
        setNotice("");
      })
      .catch((error) => { if (active) setNotice(error.response?.data?.error || "No se pudieron cargar datos de administración."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [query]);

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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={logout}><Text style={styles.topLink}>Cerrar sesión</Text></Pressable>
          <Text style={styles.brand}>NEXO / ADMIN</Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Legal", { document: "privacy" })}><Text style={styles.topLink}>Legal</Text></Pressable>
        </View>
        <View style={styles.warning} accessibilityRole="alert">
          <Text style={styles.warningTitle}>CENTRO ADMINISTRATIVO</Text>
          <Text style={styles.warningCopy}>Datos operativos reales. Las acciones quedan registradas en la base de datos.</Text>
        </View>
        <Text style={styles.eyebrow}>OPERACIÓN</Text>
        <Text style={styles.title}>Administración</Text>
        <Text style={styles.subtitle}>Resumen de pedidos, catálogo y cuentas registradas.</Text>

        <View style={styles.metrics}>
          {metrics.map(([label, value]) => <View key={label} style={styles.metric}>
            <Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricNote}>Base de datos</Text>
          </View>)}
          {!metrics.length && <Text style={styles.empty}>{isLoading ? "Cargando métricas…" : "Métricas no disponibles."}</Text>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Órdenes por estado</Text></View>
          {Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => <View key={status} style={styles.statusRow}><Text style={styles.userRole}>{status}</Text><Text style={styles.userName}>{count}</Text></View>)}
          {!Object.keys(analytics?.ordersByStatus || {}).length && <Text style={styles.empty}>Aún no hay órdenes.</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión de usuarios</Text>
          <Text style={styles.label}>Filtrar por nombre, correo o rol</Text>
          <TextInput accessibilityLabel="Filtrar usuarios" value={query} onChangeText={setQuery} placeholder="Buscar cuentas" placeholderTextColor="#626262" returnKeyType="search" style={styles.search} />
          {users.map((user) => (
            <View key={user.id} style={styles.userRow}>
              <Text style={styles.userName}>{user.label}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}><Text style={styles.userRole}>{user.role}</Text><Text style={[styles.userState, user.isActive ? styles.active : styles.paused]}>{user.isActive ? "Activa" : "Pausada"}</Text></View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${user.isActive ? "Desactivar" : "Reactivar"} ${user.label}`}
                onPress={() => toggleUser(user)}
                style={styles.action}
              ><Text style={styles.actionText}>{user.isActive ? "Desactivar cuenta" : "Reactivar cuenta"}</Text></Pressable>
              {user.sellerProfile && <>
                <Text style={styles.userEmail}>Tienda: {user.sellerProfile.storeName} · {user.sellerProfile.status}</Text>
                {user.sellerProfile.status !== "ACTIVE" && <Pressable accessibilityRole="button" onPress={() => updateSellerStatus(user, "ACTIVE")} style={styles.action}><Text style={styles.actionText}>Aprobar vendedor</Text></Pressable>}
                {user.sellerProfile.status === "ACTIVE" && <Pressable accessibilityRole="button" onPress={() => updateSellerStatus(user, "SUSPENDED")} style={styles.action}><Text style={styles.actionText}>Suspender vendedor</Text></Pressable>}
              </>}
            </View>
          ))}
          {!users.length && <Text style={styles.empty}>{isLoading ? "Cargando usuarios…" : "No hay cuentas que coincidan."}</Text>}
          <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  topBar: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: colors.text, fontSize: 28, lineHeight: 32 },
  brand: { color: colors.text, fontSize: 12, fontWeight: "800", letterSpacing: 1.6 },
  topLink: { color: "#333", fontSize: 12, textDecorationLine: "underline" },
  warning: { marginTop: 4, marginBottom: 22, padding: 13, borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.surface },
  warningTitle: { color: colors.text, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  warningCopy: { marginTop: 5, color: "#333", fontSize: 11, lineHeight: 16 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  title: { marginTop: 5, color: colors.text, fontSize: 29, fontWeight: "700" },
  subtitle: { marginTop: 6, marginBottom: 18, color: "#555", fontSize: 13, lineHeight: 19 },
  metrics: { gap: 9, marginBottom: 17 },
  metric: { padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  metricLabel: { color: "#444", fontSize: 11 },
  metricValue: { marginTop: 5, color: colors.text, fontSize: 22, fontWeight: "700" },
  metricNote: { marginTop: 2, color: "#595959", fontSize: 10 },
  section: { marginBottom: 17, padding: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { marginBottom: 12, color: colors.text, fontSize: 16, fontWeight: "700" },
  sampleBadge: { marginBottom: 12, color: "#333", fontSize: 8, fontWeight: "700", letterSpacing: 1 },
  chart: { height: 130, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingHorizontal: 7, borderBottomWidth: 1, borderColor: "#888", backgroundColor: "#FAFAF8" },
  bar: { width: 14, backgroundColor: "#222" },
  chartNote: { marginTop: 9, color: "#4A4A4A", fontSize: 9, fontWeight: "700", letterSpacing: 1, textAlign: "center" },
  label: { marginBottom: 7, color: "#333", fontSize: 11, fontWeight: "600" },
  search: { minHeight: 44, paddingHorizontal: 11, borderWidth: 1, borderColor: "#666", color: colors.text, fontSize: 13 },
  userRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  userName: { color: colors.text, fontSize: 13, fontWeight: "700" },
  userEmail: { marginTop: 3, color: "#4A4A4A", fontSize: 11 },
  userMeta: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  statusRow: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border },
  userRole: { color: "#333", fontSize: 11 },
  userState: { fontSize: 10, fontWeight: "700" },
  active: { color: "#205329" },
  paused: { color: "#5B3A18" },
  action: { minHeight: 40, alignSelf: "flex-start", justifyContent: "center", marginTop: 7, paddingHorizontal: 10, borderWidth: 1, borderColor: "#555" },
  actionText: { color: "#222", fontSize: 10, fontWeight: "600" },
  notice: { minHeight: 17, marginTop: 8, color: "#333", fontSize: 11 },
  empty: { marginTop: 12, color: "#444", fontSize: 12 },
});
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { archiveSellerProduct, createSellerProduct, getCategories, getSellerOrders, getSellerProducts, getSellerProfile, updateSellerOrderItemFulfillment, updateSellerProduct, useAuthStore } from "@shein-clone/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

function formatPrice(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$ ${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(amount)} COP` : "Precio sin definir";
}

const FULFILLMENT_STEPS = [
  ["PENDING", "Pedido recibido"],
  ["PREPARING", "Alistamiento"],
  ["IN_TRANSIT", "En transporte"],
  ["DELIVERED", "Entregado"],
];
const colombianToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

export default function SellerDashboardScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fulfillmentDrafts, setFulfillmentDrafts] = useState({});
  const [categories, setCategories] = useState([]);
  const [section, setSection] = useState("products");
  const [categoryId, setCategoryId] = useState("");
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [alt, setAlt] = useState("");
  const [image, setImage] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getSellerProfile(), getCategories()])
      .then(async ([sellerProfile, availableCategories]) => {
        const [sellerProducts, sellerOrders] = sellerProfile.status === "ACTIVE"
          ? await Promise.all([getSellerProducts(), getSellerOrders()])
          : [[], []];
        if (!active) return;
        setProfile(sellerProfile);
        setCategories(availableCategories);
        setCategoryId(availableCategories[0]?.id || "");
        setProducts(sellerProducts);
        setOrders(sellerOrders);
        setFulfillmentDrafts(Object.fromEntries(sellerOrders.map((item) => [item.id, {
          status: item.fulfillmentStatus,
          estimatedArrival: item.estimatedArrival ? item.estimatedArrival.slice(0, 10) : "",
        }])));
      })
      .catch((error) => { if (active) setNotice(error.response?.data?.error || "No se pudo cargar el módulo de vendedor."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice("Sin permiso para acceder a las fotos. Puedes habilitarlo en los ajustes del dispositivo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
      setNotice("");
    }
  }

  async function addProduct() {
    if (!name.trim() || !categoryId || !image || Number(price) <= 0 || Number(stock) < 0 || !alt.trim()) {
      setNotice("Completa nombre, categoría, precio, stock, foto y texto alternativo.");
      return;
    }
    const payload = new FormData();
    payload.append("name", name.trim());
    payload.append("categoryId", categoryId);
    payload.append("price", price);
    payload.append("stock", stock);
    payload.append("imageAlt", alt.trim());
    payload.append("image", { uri: image.uri, name: image.fileName || `product-${Date.now()}.jpg`, type: image.mimeType || "image/jpeg" });
    try {
      const product = await createSellerProduct(payload);
      setProducts((current) => [product, ...current]);
      setName(""); setPrice(""); setStock("0"); setAlt(""); setImage(null);
      setNotice("Producto guardado en la base de datos.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo guardar el producto.");
    }
  }

  async function updateStock(product, amount) {
    const currentStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
    const nextStock = Math.max(0, currentStock + amount);
    try {
      await updateSellerProduct(product.id, { stock: nextStock });
      setProducts((current) => current.map((item) => item.id === product.id
        ? { ...item, variants: item.variants.map((variant) => ({ ...variant, stock: nextStock })) }
        : item));
      setNotice("Stock actualizado en la base de datos.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo actualizar el stock.");
    }
  }

  async function removeProduct(productId) {
    try {
      await archiveSellerProduct(productId);
      setProducts((current) => current.filter((item) => item.id !== productId));
      setNotice("Producto retirado del catálogo.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo retirar el producto.");
    }
  }

  function setFulfillmentDraft(item, changes) {
    setFulfillmentDrafts((current) => {
      const existing = current[item.id] || {
        status: item.fulfillmentStatus,
        estimatedArrival: item.estimatedArrival?.slice(0, 10) || "",
      };
      return { ...current, [item.id]: { ...existing, ...changes } };
    });
  }

  async function saveFulfillment(item) {
    const draft = fulfillmentDrafts[item.id] || {
      status: item.fulfillmentStatus,
      estimatedArrival: item.estimatedArrival?.slice(0, 10) || "",
    };
    if (draft.estimatedArrival && !/^\d{4}-\d{2}-\d{2}$/.test(draft.estimatedArrival)) {
      setNotice("Escribe la fecha de llegada con el formato AAAA-MM-DD.");
      return;
    }
    try {
      const updated = await updateSellerOrderItemFulfillment(item.id, draft.status, draft.estimatedArrival || undefined);
      setOrders((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...updated } : entry));
      setFulfillmentDrafts((current) => ({
        ...current,
        [item.id]: {
          status: updated.fulfillmentStatus,
          estimatedArrival: updated.estimatedArrival ? updated.estimatedArrival.slice(0, 10) : "",
        },
      }));
      setNotice("El seguimiento del pedido se actualizó.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo actualizar el seguimiento del pedido.");
    }
  }

  const groupedOrders = [...orders.reduce((groups, item) => {
    const group = groups.get(item.order.id) || { order: item.order, items: [] };
    group.items.push(item);
    groups.set(item.order.id, group);
    return groups;
  }, new Map()).values()];

  function logout() {
    useAuthStore.getState().logout();
    navigation.replace("Login");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={logout}><Text style={styles.topLink}>Cerrar sesión</Text></Pressable>
          <Text style={styles.brand}>NEXO / VENDEDOR</Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Legal", { document: "terms" })}><Text style={styles.topLink}>Ayuda</Text></Pressable>
        </View>
        <View style={styles.demoWarning} accessibilityRole="alert">
          <Text style={styles.warningTitle}>PERFIL {profile?.status || "CARGANDO"}</Text>
          <Text style={styles.warningCopy}>{profile?.status === "ACTIVE" ? "Los productos y el inventario se guardan en la base de datos." : "Administración debe aprobar el perfil antes de publicar productos."}</Text>
        </View>
        <View style={styles.sectionTabs} accessibilityRole="tablist">
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: section === "products" }} onPress={() => setSection("products")} style={[styles.sectionTab, section === "products" && styles.sectionTabActive]}>
            <Text style={[styles.sectionTabText, section === "products" && styles.sectionTabTextActive]}>Productos</Text>
          </Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: section === "orders" }} onPress={() => setSection("orders")} style={[styles.sectionTab, section === "orders" && styles.sectionTabActive]}>
            <Text style={[styles.sectionTabText, section === "orders" && styles.sectionTabTextActive]}>Pedidos ({groupedOrders.length})</Text>
          </Pressable>
        </View>
        {section === "orders" ? <>
          <Text style={styles.eyebrow}>VENTAS Y LOGÍSTICA</Text>
          <Text style={styles.title}>Pedidos de clientes</Text>
          <Text style={styles.subtitle}>Actualiza el alistamiento, registra el transporte y agenda la fecha estimada de llegada.</Text>
          {groupedOrders.map(({ order, items }) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderTitle}>Pedido {order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString("es-CO", { dateStyle: "medium" })}</Text>
              </View>
              <Text style={styles.orderCustomer}>{order.user?.name || "Cliente"} · {order.user?.email}</Text>
              <Text style={styles.orderAddress}>Entrega: {order.deliveryLabel} · {order.deliveryStreet}, {order.deliveryCity}, {order.deliveryState} {order.deliveryZipCode}</Text>
              {items.map((item) => {
                const statusIndex = FULFILLMENT_STEPS.findIndex(([status]) => status === item.fulfillmentStatus);
                const draft = fulfillmentDrafts[item.id] || {
                  status: item.fulfillmentStatus,
                  estimatedArrival: item.estimatedArrival?.slice(0, 10) || "",
                };
                const nextStatuses = FULFILLMENT_STEPS.slice(statusIndex, Math.min(statusIndex + 2, FULFILLMENT_STEPS.length));
                return (
                  <View key={item.id} style={styles.orderItem}>
                    <Text style={styles.orderProduct}>{item.variant.product.name} · {item.variant.size} / {item.variant.color} · Cantidad {item.quantity}</Text>
                    <Text style={styles.orderStatus}>Estado actual: {FULFILLMENT_STEPS[statusIndex]?.[1] || item.fulfillmentStatus}</Text>
                    <Text style={styles.label}>Avance del pedido</Text>
                    <View style={styles.statusOptions}>
                      {nextStatuses.map(([status, label]) => <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: draft.status === status }}
                        key={status}
                        onPress={() => setFulfillmentDraft(item, { status })}
                        style={[styles.statusOption, draft.status === status && styles.statusOptionActive]}
                      ><Text style={[styles.statusOptionText, draft.status === status && styles.statusOptionTextActive]}>{label}</Text></Pressable>)}
                    </View>
                    <Text style={styles.label}>Fecha estimada de llegada</Text>
                    <TextInput
                      accessibilityLabel={`Fecha estimada de llegada para ${item.variant.product.name}`}
                      value={draft.estimatedArrival}
                      onChangeText={(value) => setFulfillmentDraft(item, { estimatedArrival: value })}
                      placeholder="AAAA-MM-DD"
                      maxLength={10}
                      keyboardType="numbers-and-punctuation"
                      editable={item.fulfillmentStatus !== "DELIVERED"}
                      style={styles.input}
                    />
                    <Text style={styles.dateHint}>Usa el formato AAAA-MM-DD. Para iniciar el transporte se requiere una fecha válida desde hoy ({colombianToday()}).</Text>
                    {item.estimatedArrival && <Text style={styles.arrival}>Llegada agendada: {new Date(item.estimatedArrival).toLocaleDateString("es-CO", { dateStyle: "medium" })}</Text>}
                    <Pressable accessibilityRole="button" disabled={item.fulfillmentStatus === "DELIVERED"} onPress={() => saveFulfillment(item)} style={[styles.primaryButton, item.fulfillmentStatus === "DELIVERED" && styles.disabled]}>
                      <Text style={styles.primaryButtonText}>{item.fulfillmentStatus === "DELIVERED" ? "Pedido entregado" : "Guardar seguimiento"}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
          {!groupedOrders.length && <Text style={styles.empty}>{isLoading ? "Cargando pedidos…" : "Todavía no tienes pedidos de clientes."}</Text>}
          <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>
        </> : <>
        <Text style={styles.eyebrow}>CATÁLOGO</Text>
        <Text style={styles.title}>Tus productos</Text>
        <Text style={styles.subtitle}>Añade fotos, define precios en COP y administra existencias.</Text>
        {isLoading && <Text style={styles.notice}>Cargando perfil e inventario…</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Añadir producto</Text>
          <Text style={styles.label}>Nombre del producto</Text>
          <TextInput accessibilityLabel="Nombre del producto" value={name} onChangeText={setName} maxLength={100} returnKeyType="next" style={styles.input} />
          <View style={styles.twoFields}>
            <View style={styles.halfField}><Text style={styles.label}>Precio (COP)</Text><TextInput accessibilityLabel="Precio en pesos colombianos" value={price} onChangeText={setPrice} keyboardType="numeric" inputMode="numeric" style={styles.input} /></View>
            <View style={styles.halfField}><Text style={styles.label}>Stock</Text><TextInput accessibilityLabel="Unidades disponibles" value={stock} onChangeText={setStock} keyboardType="numeric" inputMode="numeric" style={styles.input} /></View>
          </View>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.categoryList}>{categories.map((category) => <Pressable key={category.id} accessibilityRole="radio" accessibilityState={{ selected: categoryId === category.id }} onPress={() => setCategoryId(category.id)} style={[styles.categoryButton, categoryId === category.id && styles.categoryButtonActive]}><Text style={[styles.categoryText, categoryId === category.id && styles.categoryTextActive]}>{category.name}</Text></Pressable>)}</View>
          <Pressable accessibilityRole="button" onPress={chooseImage} style={styles.imagePicker}>
            {image ? <Image source={{ uri: image.uri }} accessibilityLabel="Vista previa de la foto seleccionada" style={styles.preview} /> : <Text style={styles.imagePickerText}>＋  Elegir foto del dispositivo</Text>}
          </Pressable>
          {image && <>
            <Text style={styles.label}>Texto alternativo de la foto</Text>
            <TextInput accessibilityLabel="Texto alternativo de la foto" value={alt} onChangeText={setAlt} maxLength={180} returnKeyType="done" placeholder="Describe la información visual" placeholderTextColor="#666" style={styles.input} />
          </>}
          <Pressable accessibilityRole="button" disabled={isLoading || profile?.status !== "ACTIVE"} onPress={addProduct} style={[styles.primaryButton, (isLoading || profile?.status !== "ACTIVE") && styles.disabled]}><Text style={styles.primaryButtonText}>Publicar producto</Text></Pressable>
          <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.listHeading}><Text style={styles.sectionTitle}>Inventario</Text><Text style={styles.count}>{products.length} productos</Text></View>
          {products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image source={{ uri: product.image }} accessibilityLabel={product.imageAlt || product.name} style={styles.productImage} />
              <View style={styles.productDetails}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                <Text style={styles.altState}>{product.imageAlt ? "Texto alternativo disponible" : "Sin texto alternativo"}</Text>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Stock {product.variants.reduce((sum, variant) => sum + variant.stock, 0)}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Reducir stock de ${product.name}`} onPress={() => updateStock(product, -1)} style={styles.stockButton}><Text style={styles.stockButtonText}>−</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar stock de ${product.name}`} onPress={() => updateStock(product, 1)} style={styles.stockButton}><Text style={styles.stockButtonText}>+</Text></Pressable>
                </View>
                <Pressable accessibilityRole="button" onPress={() => removeProduct(product.id)}><Text style={styles.deleteText}>Retirar del catálogo</Text></Pressable>
              </View>
            </View>
          ))}
          {!products.length && <Text style={styles.empty}>Todavía no hay productos en esta vista.</Text>}
        </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  topBar: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: colors.text, fontSize: 28, lineHeight: 32 },
  brand: { color: colors.text, fontSize: 12, fontWeight: "800", letterSpacing: 1.8 },
  topLink: { color: "#333", fontSize: 12, textDecorationLine: "underline" },
  demoWarning: { marginTop: 4, marginBottom: 24, padding: 13, borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.surface },
  sectionTabs: { flexDirection: "row", gap: 8, marginBottom: 20 },
  sectionTab: { minHeight: 40, flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#555" },
  sectionTabActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  sectionTabText: { color: colors.text, fontSize: 11, fontWeight: "600" },
  sectionTabTextActive: { color: "#fff" },
  warningTitle: { color: colors.text, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  warningCopy: { marginTop: 5, color: "#333", fontSize: 11, lineHeight: 16 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.6 },
  title: { marginTop: 5, color: colors.text, fontSize: 29, fontWeight: "700" },
  subtitle: { marginTop: 7, marginBottom: 20, color: "#555", fontSize: 13, lineHeight: 19 },
  section: { marginBottom: 20, padding: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  sectionTitle: { marginBottom: 14, color: colors.text, fontSize: 16, fontWeight: "700" },
  label: { marginTop: 11, marginBottom: 6, color: "#333", fontSize: 12, fontWeight: "600" },
  input: { minHeight: 46, paddingHorizontal: 11, borderWidth: 1, borderColor: "#767676", backgroundColor: "#fff", color: colors.text, fontSize: 14 },
  twoFields: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  categoryList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#555" },
  categoryButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.text, fontSize: 11 },
  categoryTextActive: { color: "#fff" },
  imagePicker: { minHeight: 48, marginTop: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#555", borderStyle: "dashed" },
  imagePickerText: { color: "#222", fontSize: 12, fontWeight: "600" },
  preview: { width: "100%", height: 150, resizeMode: "cover" },
  primaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 14, backgroundColor: colors.primary },
  disabled: { opacity: 0.5 },
  primaryButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  notice: { minHeight: 18, marginTop: 8, color: "#3D3D3D", fontSize: 11, lineHeight: 16 },
  listHeading: { flexDirection: "row", justifyContent: "space-between" },
  count: { color: "#555", fontSize: 10 },
  productCard: { flexDirection: "row", gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.border },
  productImage: { width: 86, height: 108, backgroundColor: colors.surface },
  productDetails: { flex: 1, alignItems: "flex-start" },
  productName: { color: colors.text, fontSize: 13, fontWeight: "700" },
  productPrice: { marginTop: 4, color: "#222", fontSize: 12 },
  altState: { marginTop: 4, color: "#555", fontSize: 10 },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  stockLabel: { marginRight: "auto", color: "#333", fontSize: 11 },
  stockButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#555" },
  stockButtonText: { color: colors.text, fontSize: 18 },
  deleteText: { minHeight: 36, paddingTop: 10, color: "#292929", fontSize: 11, textDecorationLine: "underline" },
  empty: { color: "#555", fontSize: 12 },
  orderCard: { marginBottom: 12, padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  orderTitle: { color: colors.text, fontSize: 13, fontWeight: "700" },
  orderDate: { color: "#555", fontSize: 10 },
  orderCustomer: { marginTop: 6, color: colors.text, fontSize: 11, fontWeight: "600" },
  orderAddress: { marginTop: 4, color: "#444", fontSize: 10, lineHeight: 15 },
  orderItem: { marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  orderProduct: { color: colors.text, fontSize: 12, fontWeight: "700" },
  orderStatus: { marginTop: 5, color: "#444", fontSize: 10 },
  statusOptions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusOption: { minHeight: 35, justifyContent: "center", paddingHorizontal: 8, borderWidth: 1, borderColor: "#888" },
  statusOptionActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  statusOptionText: { color: colors.text, fontSize: 9 },
  statusOptionTextActive: { color: "#fff" },
  dateHint: { marginTop: 5, color: "#555", fontSize: 9, lineHeight: 14 },
  arrival: { marginTop: 6, color: "#205329", fontSize: 10, fontWeight: "700" },
});
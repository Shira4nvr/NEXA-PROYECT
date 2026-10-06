import React, { useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore, useCartStore } from "@shein-clone/shared";
import { colors } from "../theme/colors";

const editorialImage =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85";
const emptyFields = { name: "", storeName: "", document: "", address: "", phone: "", email: "", password: "" };

export default function LoginScreen({ navigation }) {
  const [role, setRole] = useState("customer");
  const [remember, setRemember] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [formFields, setFormFields] = useState(emptyFields);
  const [status, setStatus] = useState("");
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAdmin = role === "admin";
  const roleLabel = role === "customer" ? "cliente" : isAdmin ? "administrador" : "vendedor";

  async function handleSubmit() {
    const requiredFields = isRegistering
      ? [formFields.email, formFields.password, ...(role === "seller" ? [formFields.name, formFields.storeName, formFields.document, formFields.address, formFields.phone] : [])]
      : [formFields.email, formFields.password];

    if (requiredFields.some((value) => !value.trim())) {
      setStatus("Completa todos los campos obligatorios.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formFields.email.trim())) {
      setStatus("Escribe un correo electrónico válido.");
      return;
    }

    if (isRegistering && (!acceptTerms || !acceptPrivacy)) {
      setStatus("Para continuar debes aceptar los términos y autorizar el tratamiento de datos.");
      return;
    }
    setStatus("");
    try {
      const result = isRegistering
        ? await register({
            email: formFields.email,
            password: formFields.password,
            role: role === "seller" ? "SELLER" : "CUSTOMER",
            termsAccepted: acceptTerms,
            privacyAuthorized: acceptPrivacy,
            marketingConsent,
            ...(role === "seller" ? {
              name: formFields.name,
              legalName: formFields.name,
              storeName: formFields.storeName,
              identificationNumber: formFields.document,
              noticeAddress: formFields.address,
              contactPhone: formFields.phone,
            } : {}),
          })
        : await login(formFields.email, formFields.password);
      const expectedRole = role === "seller" ? "SELLER" : role === "admin" ? "ADMIN" : "CUSTOMER";
      if (result.user.role !== expectedRole) {
        useAuthStore.getState().logout();
        setStatus("Esta cuenta no corresponde al tipo de acceso seleccionado.");
        return;
      }
      await useCartStore.getState().syncFromServer();
      navigation.replace(result.user.role === "ADMIN" ? "Admin" : result.user.role === "SELLER" ? "Seller" : "Store");
    } catch (error) {
      setStatus(error.response?.data?.error || "No se pudo conectar con el servidor.");
    }
  }

  function chooseRole(nextRole) {
    setRole(nextRole);
    setIsRegistering(false);
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setMarketingConsent(false);
    setFormFields(emptyFields);
    setStatus("");
  }

  function openHiddenAdminAccess() {
    setRole("admin");
    setIsRegistering(false);
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setMarketingConsent(false);
    setFormFields(emptyFields);
    setStatus("Acceso administrativo. Inicia sesión con una cuenta de administrador.");
  }

  function updateField(field, value) {
    setFormFields((current) => ({ ...current, [field]: value }));
  }

  function openDemo() {
    navigation.navigate(role === "seller" ? "Seller" : isAdmin ? "Admin" : "Store");
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground source={{ uri: editorialImage }} resizeMode="cover" style={styles.hero}>
            <View style={styles.heroShade} />
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>N</Text></View>
              <Text style={styles.brandName}>NEXO</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>MODA, A TU MANERA</Text>
              <Text style={styles.heroTitle}>Encuentra tu propio ritmo.</Text>
            </View>
          </ImageBackground>

          <View style={styles.formPanel}>
            <Text style={styles.eyebrow}>ACCESO NEXO</Text>
            <Text style={styles.title}>{isRegistering ? "Crea tu cuenta." : "Qué bueno verte."}</Text>
            <Text style={styles.intro}>
              {isRegistering ? `Registro de ${roleLabel}. No se guardará información en este prototipo.` : "Elige cómo quieres continuar."}
            </Text>

            <View style={styles.roleSwitch} accessibilityRole="tablist">
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: role === "customer" }}
                onPress={() => chooseRole("customer")}
                style={[styles.roleButton, role === "customer" && styles.roleButtonActive]}
              >
                <Text style={[styles.roleText, role === "customer" && styles.roleTextActive]}>Cliente</Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: role === "seller" }}
                onPress={() => chooseRole("seller")}
                style={[styles.roleButton, role === "seller" && styles.roleButtonActive]}
              >
                <Text style={[styles.roleText, role === "seller" && styles.roleTextActive]}>Vendedor</Text>
              </Pressable>
            </View>

            {isRegistering && role === "seller" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nombre o razón social</Text>
                <TextInput
                  accessibilityLabel="Nombre o razón social"
                  accessibilityHint="Campo obligatorio"
                  value={formFields.name}
                  onChangeText={(value) => updateField("name", value)}
                  autoComplete="name"
                  returnKeyType="next"
                  style={styles.input}
                />
                <Text style={styles.label}>Nombre de la tienda</Text>
                <TextInput
                  accessibilityLabel="Nombre de la tienda"
                  accessibilityHint="Campo obligatorio"
                  value={formFields.storeName}
                  onChangeText={(value) => updateField("storeName", value)}
                  autoComplete="organization"
                  returnKeyType="next"
                  style={styles.input}
                />
                {role === "seller" && <>
                  <Text style={styles.label}>Documento de identificación</Text>
                  <TextInput accessibilityLabel="Documento de identificación" accessibilityHint="Campo obligatorio" value={formFields.document} onChangeText={(value) => updateField("document", value)} autoComplete="off" returnKeyType="next" style={styles.input} />
                  <Text style={styles.label}>Dirección física para notificaciones</Text>
                  <TextInput accessibilityLabel="Dirección física para notificaciones" accessibilityHint="Campo obligatorio" value={formFields.address} onChangeText={(value) => updateField("address", value)} autoComplete="street-address" returnKeyType="next" style={styles.input} />
                  <Text style={styles.label}>Teléfono de contacto</Text>
                  <TextInput accessibilityLabel="Teléfono de contacto" accessibilityHint="Campo obligatorio" value={formFields.phone} onChangeText={(value) => updateField("phone", value)} autoComplete="tel" keyboardType="phone-pad" returnKeyType="next" style={styles.input} />
                  <Text style={styles.fieldHint}>La Ley 1480 contempla identificar a oferentes de portales de contacto. No ingreses datos reales aquí: el formulario no los guarda.</Text>
                </>}
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                accessibilityLabel="Correo electrónico"
                accessibilityHint="Campo obligatorio"
                value={formFields.email}
                onChangeText={(value) => updateField("email", value)}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="nombre@correo.com"
                placeholderTextColor="#666666"
                returnKeyType="next"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>Contraseña</Text>
                <Pressable onPress={() => setStatus("La recuperación de contraseña estará disponible más adelante.")}>
                  <Text style={styles.textAction}>¿La olvidaste?</Text>
                </Pressable>
              </View>
              <TextInput
                accessibilityLabel="Contraseña"
                accessibilityHint="Campo obligatorio"
                value={formFields.password}
                onChangeText={(value) => updateField("password", value)}
                autoComplete={isRegistering ? "new-password" : "current-password"}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#666666"
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                style={styles.input}
              />
            </View>

            {isRegistering ? (
              <View style={styles.consentGroup}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptTerms }}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  style={styles.consentRow}
                >
                  <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>{acceptTerms && <Text style={styles.checkmark}>✓</Text>}</View>
                  <Text style={styles.consentText}>Acepto los términos de uso. <Text style={styles.requiredText}>Obligatorio</Text></Text>
                </Pressable>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptPrivacy }}
                  onPress={() => setAcceptPrivacy(!acceptPrivacy)}
                  style={styles.consentRow}
                >
                  <View style={[styles.checkbox, acceptPrivacy && styles.checkboxChecked]}>{acceptPrivacy && <Text style={styles.checkmark}>✓</Text>}</View>
                  <Text style={styles.consentText}>Autorizo el tratamiento de datos según privacidad. <Text style={styles.requiredText}>Obligatorio</Text></Text>
                </Pressable>
                <View style={styles.inlineLinks}>
                  <Text accessibilityRole="link" onPress={() => navigation.navigate("Legal", { document: "terms" })} style={styles.textAction}>Leer términos</Text>
                  <Text accessibilityRole="link" onPress={() => navigation.navigate("Legal", { document: "privacy" })} style={styles.textAction}>Leer privacidad</Text>
                </View>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: marketingConsent }}
                  onPress={() => setMarketingConsent(!marketingConsent)}
                  style={styles.consentRow}
                >
                  <View style={[styles.checkbox, marketingConsent && styles.checkboxChecked]}>{marketingConsent && <Text style={styles.checkmark}>✓</Text>}</View>
                  <Text style={styles.consentText}>Quiero recibir novedades comerciales por correo. <Text style={styles.optionalText}>Opcional</Text></Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: remember }}
                onPress={() => setRemember(!remember)}
                style={styles.rememberRow}
              >
                <View style={[styles.checkbox, remember && styles.checkboxChecked]}>{remember && <Text style={styles.checkmark}>✓</Text>}</View>
                <Text style={styles.rememberText}>Recordar mi sesión en este dispositivo</Text>
              </Pressable>
            )}

            <Pressable accessibilityRole="button" disabled={isLoading} onPress={handleSubmit} style={[styles.submitButton, isLoading && styles.submitDisabled]}>
              <Text style={styles.submitText}>{isLoading ? "Conectando…" : isRegistering ? "Crear cuenta" : "Iniciar sesión"}</Text>
              <Text style={styles.submitArrow}>→</Text>
            </Pressable>
            <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text>

            {!isRegistering ? (
              <>
                <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>VISTA SIN CUENTA</Text><View style={styles.dividerLine} /></View>
                {role === "customer" ? (
                  <Pressable accessibilityRole="button" onPress={openDemo} style={styles.guestButton}>
                    <Text style={styles.guestText}>Explorar tienda sin cuenta</Text>
                    <Text style={styles.guestArrow}>↗</Text>
                  </Pressable>
                ) : <Text style={styles.fieldHint}>Inicia sesión con una cuenta de {roleLabel} para continuar.</Text>}
                {role !== "admin" && <Text style={styles.signupPrompt}>¿Nuevo en Nexo? <Text onPress={() => { setIsRegistering(true); setStatus(""); }} style={styles.signupAction}>Crear una cuenta</Text></Text>}
              </>
            ) : (
              <Text style={styles.signupPrompt}>¿Ya tienes cuenta? <Text onPress={() => { setIsRegistering(false); setStatus(""); }} style={styles.signupAction}>Iniciar sesión</Text></Text>
            )}
            <View style={styles.legalLinks}>
              <Text accessibilityRole="link" onPress={() => navigation.navigate("Legal", { document: "terms" })} style={styles.legalLink}>Términos</Text>
              <Text accessibilityRole="link" onPress={() => navigation.navigate("Legal", { document: "privacy" })} style={styles.legalLink}>Privacidad</Text>
              <Text accessibilityRole="link" onPress={() => navigation.navigate("Legal", { document: "refunds" })} style={styles.legalLink}>Reembolsos</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 NEXO</Text>
            <Text style={styles.footerText}>PRIVACIDAD  ·  AYUDA</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Pressable accessibilityRole="button" onPress={openHiddenAdminAccess} style={styles.hiddenAdminEntry}>
        <Text style={styles.hiddenAdminEntryText}>otro usuario</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, position: "relative", backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, backgroundColor: colors.background },
  hero: { height: 220, justifyContent: "space-between", paddingHorizontal: 22, paddingVertical: 20, backgroundColor: "#222" },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.62)" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 34, height: 34, borderWidth: 1, borderColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" },
  brandMarkText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  brandName: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 3 },
  heroCopy: { maxWidth: 310 },
  heroEyebrow: { marginBottom: 9, color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 1.8 },
  heroTitle: { color: "#fff", fontSize: 31, fontWeight: "500", lineHeight: 37 },
  formPanel: { width: "100%", maxWidth: 500, alignSelf: "center", paddingHorizontal: 24, paddingTop: 26, paddingBottom: 8 },
  eyebrow: { marginBottom: 10, color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 28, fontWeight: "700", lineHeight: 34 },
  intro: { marginTop: 8, marginBottom: 20, color: colors.muted, fontSize: 13, lineHeight: 19 },
  roleSwitch: { flexDirection: "row", padding: 4, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  roleButton: { minHeight: 38, flex: 1, alignItems: "center", justifyContent: "center" },
  roleButtonActive: { backgroundColor: colors.background, elevation: 1 },
  roleText: { color: colors.muted, fontSize: 12 },
  roleTextActive: { color: colors.text, fontWeight: "600" },
  fieldGroup: { marginTop: 19 },
  label: { marginBottom: 8, color: "#333", fontSize: 12, fontWeight: "600" },
  input: { height: 46, paddingHorizontal: 13, borderWidth: 1, borderColor: "#DCDCD9", backgroundColor: "#fff", color: colors.text, fontSize: 13 },
  passwordLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  textAction: { marginBottom: 8, color: "#333", fontSize: 11, textDecorationLine: "underline" },
  fieldHint: { marginTop: 7, color: "#595959", fontSize: 11, lineHeight: 16 },
  rememberRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9, marginTop: 4, marginBottom: 8 },
  checkbox: { width: 16, height: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#777" },
  checkboxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkmark: { color: "#fff", fontSize: 11, fontWeight: "700", lineHeight: 14 },
  rememberText: { color: "#565656", fontSize: 11 },
  consentGroup: { gap: 5, marginTop: 12, marginBottom: 12 },
  consentRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 },
  consentText: { flex: 1, color: "#454545", fontSize: 11, lineHeight: 16 },
  requiredText: { color: "#222", fontWeight: "700" },
  optionalText: { color: "#595959" },
  inlineLinks: { flexDirection: "row", gap: 14, paddingLeft: 26 },
  legalLinks: { flexDirection: "row", justifyContent: "center", gap: 18, marginTop: 18 },
  legalLink: { color: "#454545", fontSize: 10, textDecorationLine: "underline", textDecorationColor: "#454545" },
  submitButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, backgroundColor: colors.primary },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  submitArrow: { color: "#fff", fontSize: 20, lineHeight: 23 },
  status: { minHeight: 17, marginTop: 8, color: "#5D5D5D", fontSize: 11, lineHeight: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 2, marginBottom: 13 },
  dividerLine: { height: 1, flex: 1, backgroundColor: "#E2E2DF" },
  dividerText: { color: "#888", fontSize: 8, fontWeight: "700", letterSpacing: 1.2 },
  guestButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 13, borderWidth: 1, borderColor: "#DCDCD9" },
  guestText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  guestArrow: { color: colors.text, fontSize: 17 },
  signupPrompt: { marginTop: 18, color: colors.muted, fontSize: 11, textAlign: "center" },
  signupAction: { color: colors.text, textDecorationLine: "underline" },
  footer: { width: "100%", maxWidth: 500, alignSelf: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 15 },
  footerText: { color: "#595959", fontSize: 8, fontWeight: "600", letterSpacing: 0.8 },
  hiddenAdminEntry: { position: "absolute", right: 15, bottom: 12, zIndex: 1, padding: 3, paddingHorizontal: 5, backgroundColor: "transparent" },
  hiddenAdminEntryText: { color: "#8c8c88", fontSize: 8, letterSpacing: 0.08 },
});
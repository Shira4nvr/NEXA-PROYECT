import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

const docs = {
  terms: {
    title: "Términos de uso",
    intro: "Borrador de diseño; no es un contrato vigente ni debe publicarse como definitivo.",
    sections: [
      ["Quién opera Nexo", "Completar identidad legal, NIT, dirección de notificación, teléfono, correo y canales de atención. Definir si Nexo vende productos o facilita ventas de terceros; esa diferencia afecta responsabilidades."],
      ["Compras y publicaciones", "Antes de comprar, mostrar información comprobable del producto, disponibilidad, precio total en COP, impuestos, envío, plazo, garantía, pago y condiciones de oferta."],
      ["Vendedores", "Si Nexo funciona como portal de contacto, diseñar la identificación del oferente y el canal de reclamación conforme a las obligaciones aplicables. Validar el proceso con asesoría local."],
      ["Derechos del consumidor", "Los términos no deben renunciar ni limitar derechos mínimos establecidos en la ley. Debe existir un canal accesible de atención y constancia de las reclamaciones."],
      ["Pendiente", "Definir entidad operadora, alcance territorial, comisiones, logística, pagos, moderación de productos, garantías, seguridad y reclamaciones antes de publicar."]
    ]
  },
  privacy: {
    title: "Política de privacidad",
    intro: "Borrador de estructura. Este prototipo no guarda datos en el backend ni tiene una política aprobada.",
    sections: [
      ["Responsable y contacto", "Identificar responsable del tratamiento y canales de contacto para consultas y reclamos antes de solicitar datos."],
      ["Datos mínimos", "Correo y credencial para cuenta; pedir datos adicionales solo al necesitarlos para compra, entrega o una operación de vendedor. No solicitar datos sensibles para registro o navegación."],
      ["Finalidades y autorización", "Describir usos concretos por separado. La Ley 1581 requiere autorización previa e informada cuando aplica, finalidad comunicada y medios para conservar prueba. El consentimiento comercial debe ser opcional y no preseleccionado."],
      ["Derechos y seguridad", "Informar cómo conocer, actualizar y rectificar datos, solicitar prueba de autorización, presentar consultas/reclamos y, cuando proceda, pedir supresión o revocatoria. Definir conservación, proveedores, transferencias, controles y gestión de incidentes según el sistema real."],
      ["Vendedores y menores", "Definir identificación mínima del oferente si Nexo es portal de contacto. Establecer controles adecuados para menores y no recolectar datos sensibles sin una base y autorización apropiadas."]
    ]
  },
  refunds: {
    title: "Retracto y reembolsos",
    intro: "Resumen informativo para Colombia. El texto final depende del producto, la venta, el vendedor y las excepciones aplicables.",
    sections: [
      ["Retracto", "La Ley 1480 contempla generalmente cinco (5) días hábiles en ventas a distancia, sujeto a excepciones legales, como productos personalizados, perecederos y bienes de uso personal. Evaluar cada producto; no declarar una exclusión general."],
      ["Reversión del pago", "Es diferente al retracto. Puede aplicar a pagos electrónicos en supuestos legales como fraude, operación no solicitada, no entrega, producto diferente o defectuoso. La norma prevé aviso/reclamo en cinco (5) días hábiles desde el hecho relevante y actuaciones del proveedor y emisor."],
      ["Tiempos", "El texto consultado contempla hasta treinta (30) días calendario para reembolsar tras ejercer retracto. Retrasos o falta de disponibilidad tienen reglas separadas y cambios recientes; verifica el texto consolidado vigente antes de implementar."],
      ["Procedimiento pendiente", "Definir devoluciones, costos, radicados, canal y seguimiento, responsables en ventas de terceros y coordinación con pasarela. Garantía legal, retracto y cambios voluntarios son procesos distintos."]
    ]
  },
};

const sources = [
  ["Ley 1581 de 2012 · datos personales", "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981"],
  ["Ley 1480 de 2011 · Estatuto del Consumidor", "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306"],
  ["Ley 2439 de 2024 · comercio electrónico", "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=255065"],
  ["Superintendencia de Industria y Comercio", "https://www.sic.gov.co/"],
];

export default function LegalScreen({ navigation, route }) {
  const document = route.params?.document || "terms";
  const content = docs[document] || docs.terms;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.brand}>NEXO / POLÍTICAS</Text>
          <View style={styles.backSpace} />
        </View>
        <Text style={styles.eyebrow}>CENTRO LEGAL · BORRADOR</Text>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.intro}>{content.intro}</Text>
        <View style={styles.tabs} accessibilityRole="tablist">
          {[["terms", "Términos"], ["privacy", "Privacidad"], ["refunds", "Reembolsos"]].map(([key, label]) => (
            <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: document === key }} onPress={() => navigation.setParams({ document: key })} style={[styles.tab, document === key && styles.tabActive]}>
              <Text style={[styles.tabText, document === key && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.alert} accessibilityRole="alert"><Text style={styles.alertText}>No publicar como política final. Faltan datos de la entidad responsable y revisión jurídica del modelo operativo.</Text></View>
        {content.sections.map(([heading, body]) => <View key={heading} style={styles.section}><Text style={styles.sectionTitle}>{heading}</Text><Text style={styles.body}>{body}</Text></View>)}
        <View style={styles.sources}>
          <Text style={styles.sectionTitle}>Fuentes oficiales consultadas</Text>
          {sources.map(([label, url]) => <Pressable key={url} accessibilityRole="link" onPress={() => Linking.openURL(url)} style={styles.sourceLink}><Text style={styles.linkText}>{label} ↗</Text></Pressable>)}
        </View>
        <Text style={styles.disclaimer}>Referencia normativa, no asesoría legal. La aplicabilidad depende del domicilio de Nexo, países de operación, modelo de marketplace, categorías y terceros. Solicita revisión de abogado colombiano y valida la vigencia en fuente oficial antes del lanzamiento.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  topBar: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  back: { color: colors.text, fontSize: 28, lineHeight: 32 },
  brand: { color: colors.text, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  backSpace: { width: 20 },
  eyebrow: { color: "#555", fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  title: { marginTop: 7, color: colors.text, fontSize: 28, fontWeight: "700" },
  intro: { marginTop: 9, marginBottom: 17, color: "#444", fontSize: 13, lineHeight: 19 },
  tabs: { flexDirection: "row", gap: 5, marginBottom: 15 },
  tab: { minHeight: 42, flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#666" },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: "#222", fontSize: 10, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  alert: { marginBottom: 16, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.surface },
  alertText: { color: "#292929", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  section: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { marginBottom: 6, color: colors.text, fontSize: 14, fontWeight: "700" },
  body: { color: "#333", fontSize: 12, lineHeight: 19 },
  sources: { marginTop: 21, padding: 15, borderWidth: 1, borderColor: colors.border },
  sourceLink: { minHeight: 40, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border },
  linkText: { color: "#222", fontSize: 11, textDecorationLine: "underline" },
  disclaimer: { marginTop: 18, color: "#444", fontSize: 10, lineHeight: 16 },
});
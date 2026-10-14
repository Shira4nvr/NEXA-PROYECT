import React from "react";
import Constants from "expo-constants";
import { StyleSheet, Text, View } from "react-native";
import { configureApiBaseUrl } from "@shein-clone/shared";
import AppNavigator from "./src/navigation/AppNavigator";

const expoHost = Constants.expoConfig?.hostUri?.split(":")[0]
  || Constants.manifest2?.extra?.expoGo?.debuggerHost?.split(":")[0]
  || (typeof window !== "undefined" ? window.location.hostname : null);
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
const apiBaseUrl = configuredApiUrl || (__DEV__ && expoHost ? `http://${expoHost}:4000/api` : "");
const invalidProductionApiUrl = !__DEV__ && !/^https:\/\/.+\/api\/?$/i.test(apiBaseUrl);

if (apiBaseUrl && !invalidProductionApiUrl) configureApiBaseUrl(apiBaseUrl);

export default function App() {
  if (invalidProductionApiUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Falta configurar el servidor</Text>
        <Text style={styles.message}>Configura EXPO_PUBLIC_API_URL con la dirección HTTPS de la API (incluido /api) y vuelve a compilar la aplicación.</Text>
      </View>
    );
  }
  return <AppNavigator />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 28, backgroundColor: "#fff" },
  title: { color: "#111", fontSize: 21, fontWeight: "700" },
  message: { marginTop: 12, color: "#333", fontSize: 14, lineHeight: 21 },
});

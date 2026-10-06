import React from "react";
import Constants from "expo-constants";
import { configureApiBaseUrl } from "@shein-clone/shared";
import AppNavigator from "./src/navigation/AppNavigator";

const expoHost = Constants.expoConfig?.hostUri?.split(":")[0]
  || Constants.manifest2?.extra?.expoGo?.debuggerHost?.split(":")[0]
  || (typeof window !== "undefined" ? window.location.hostname : null);
const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL
  || (expoHost ? `http://${expoHost}:4000/api` : "http://localhost:4000/api");

configureApiBaseUrl(apiBaseUrl);

export default function App() {
  return <AppNavigator />;
}

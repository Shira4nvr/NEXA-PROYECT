import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getColombianCities } from "@shein-clone/shared";
import { colors } from "../theme/colors";

export const EMPTY_ADDRESS = {
  label: "Casa",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "CO",
};

export default function DeliveryAddressForm({ value, onChange, showLabel = true }) {
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    getColombianCities()
      .then((results) => { if (active) setCities(results); })
      .catch((error) => {
        if (active) setLoadError(error.response?.data?.error || "No se pudo cargar el listado de ciudades.");
      });
    return () => { active = false; };
  }, []);

  const departments = useMemo(
    () => [...new Set(cities.map((item) => item.department))].sort((a, b) => a.localeCompare(b, "es")),
    [cities],
  );
  const departmentCities = useMemo(
    () => cities.filter((item) => item.department === value.state),
    [cities, value.state],
  );
  const filteredCities = useMemo(
    () => departmentCities
      .filter((item) => item.city.toLocaleLowerCase("es").includes(citySearch.trim().toLocaleLowerCase("es")))
      .slice(0, 40),
    [citySearch, departmentCities],
  );

  function change(field, nextValue) {
    onChange({ ...value, [field]: nextValue });
  }

  return (
    <View style={styles.container}>
      {showLabel && <>
        <Text style={styles.label}>Etiqueta</Text>
        <TextInput accessibilityLabel="Etiqueta de la dirección" value={value.label} maxLength={80} onChangeText={(text) => change("label", text)} placeholder="Casa, trabajo…" style={styles.input} />
      </>}
      <Text style={styles.label}>Dirección y número</Text>
      <TextInput accessibilityLabel="Dirección y número" value={value.street} maxLength={180} onChangeText={(text) => change("street", text)} placeholder="Calle, carrera, número y complemento" autoComplete="street-address" style={styles.input} />

      <Text style={styles.label}>Departamento</Text>
      {departments.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionList}>
          {departments.map((department) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: value.state === department }}
              key={department}
              onPress={() => onChange({ ...value, state: department, city: "" })}
              style={[styles.option, value.state === department && styles.optionActive]}
            >
              <Text style={[styles.optionText, value.state === department && styles.optionTextActive]}>{department}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : <Text style={styles.hint}>{loadError || "Cargando departamentos…"}</Text>}

      <Text style={styles.label}>Ciudad o municipio</Text>
      {!value.state
        ? <Text style={styles.hint}>Selecciona primero el departamento.</Text>
        : <TextInput
            accessibilityLabel="Buscar una ciudad"
            value={citySearch}
            onChangeText={setCitySearch}
            placeholder="Busca para filtrar las opciones"
            style={styles.input}
          />}
      {value.state && value.city && <Text style={styles.selectedCity}>Seleccionada: {value.city}, {value.state}</Text>}
      {!!value.state && !loadError && (
        <ScrollView style={styles.cityList} contentContainerStyle={styles.cityListContent} nestedScrollEnabled>
          {filteredCities.map((item) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: value.city === item.city }}
              key={item.id}
              onPress={() => { change("city", item.city); setCitySearch(""); }}
              style={[styles.cityChoice, value.city === item.city && styles.cityChoiceActive]}
            >
              <Text style={[styles.cityChoiceText, value.city === item.city && styles.cityChoiceTextActive]}>{item.city}</Text>
            </Pressable>
          ))}
          {!filteredCities.length && <Text style={styles.hint}>No encontramos opciones con esa búsqueda.</Text>}
        </ScrollView>
      )}
      {!!loadError && <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text>}

      <Text style={styles.label}>Código postal</Text>
      <TextInput accessibilityLabel="Código postal" value={value.zipCode} maxLength={20} onChangeText={(text) => change("zipCode", text)} placeholder="Código postal" keyboardType="number-pad" autoComplete="postal-code" style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 5 },
  label: { marginTop: 9, marginBottom: 4, color: "#333", fontSize: 12, fontWeight: "600" },
  input: { minHeight: 45, paddingHorizontal: 11, borderWidth: 1, borderColor: "#767676", backgroundColor: "#fff", color: colors.text, fontSize: 13 },
  optionList: { gap: 7, paddingVertical: 5 },
  option: { minHeight: 36, justifyContent: "center", paddingHorizontal: 10, borderWidth: 1, borderColor: "#888", backgroundColor: "#fff" },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { color: colors.text, fontSize: 10 },
  optionTextActive: { color: "#fff" },
  cityList: { maxHeight: 180 },
  cityListContent: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingVertical: 3 },
  cityChoice: { minHeight: 34, justifyContent: "center", paddingHorizontal: 9, borderWidth: 1, borderColor: "#aaa", backgroundColor: "#fff" },
  cityChoiceActive: { borderColor: colors.primary, backgroundColor: "#eee" },
  cityChoiceText: { color: colors.text, fontSize: 10 },
  cityChoiceTextActive: { fontWeight: "700" },
  selectedCity: { marginVertical: 4, color: "#205329", fontSize: 11, fontWeight: "700" },
  hint: { paddingVertical: 8, color: "#555", fontSize: 11 },
  error: { paddingVertical: 6, color: "#8A1C1C", fontSize: 11 },
});

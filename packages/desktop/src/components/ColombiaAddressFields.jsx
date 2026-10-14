import React, { useEffect, useMemo, useState } from "react";
import { getColombianCities } from "@shein-clone/shared";

export default function ColombiaAddressFields({ value, onChange, idPrefix = "delivery" }) {
  const [cities, setCities] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    getColombianCities()
      .then((results) => { if (active) setCities(results); })
      .catch((error) => {
        if (active) setLoadError(error.response?.data?.error || "No se pudieron cargar las ciudades.");
      });
    return () => { active = false; };
  }, []);

  const departments = useMemo(
    () => [...new Set(cities.map((item) => item.department))].sort((a, b) => a.localeCompare(b, "es")),
    [cities],
  );
  const departmentCities = cities.filter((item) => item.department === value.state);

  function update(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <>
      <label>Etiqueta de la dirección
        <input required maxLength="80" value={value.label} onChange={(event) => update("label", event.target.value)} placeholder="Casa, trabajo…" />
      </label>
      <label>Dirección y número
        <input required maxLength="180" autoComplete="street-address" value={value.street} onChange={(event) => update("street", event.target.value)} placeholder="Calle, carrera, número y complemento" />
      </label>
      <label>Departamento
        <select
          required
          value={value.state}
          onChange={(event) => onChange({ ...value, state: event.target.value, city: "" })}
        >
          <option value="" disabled>Selecciona un departamento</option>
          {!departments.includes(value.state) && value.state && <option value={value.state}>{value.state} (dirección guardada)</option>}
          {departments.map((department) => <option value={department} key={department}>{department}</option>)}
        </select>
      </label>
      <label>Ciudad o municipio
        <select
          required
          value={value.city}
          disabled={!value.state || (!departmentCities.length && !loadError)}
          onChange={(event) => update("city", event.target.value)}
        >
          <option value="" disabled>{loadError ? "Ciudades no disponibles" : "Selecciona una ciudad"}</option>
          {!departmentCities.some((item) => item.city === value.city) && value.city && <option value={value.city}>{value.city} (dirección guardada)</option>}
          {departmentCities.map((item) => <option key={item.id} value={item.city}>{item.city}</option>)}
        </select>
      </label>
      <label>Código postal
        <input required maxLength="20" autoComplete="postal-code" value={value.zipCode} onChange={(event) => update("zipCode", event.target.value)} placeholder="Código postal" />
      </label>
      <input type="hidden" value="CO" readOnly />
      {loadError
        ? <p className="form-status" role="alert">{loadError} Comprueba la conexión y vuelve a intentarlo.</p>
        : <p className="address-api-note">Ciudades y municipios de Colombia · catálogo consultado por API.</p>}
      <span id={`${idPrefix}-city-help`} className="visually-hidden">Primero selecciona un departamento para cargar sus ciudades.</span>
    </>
  );
}

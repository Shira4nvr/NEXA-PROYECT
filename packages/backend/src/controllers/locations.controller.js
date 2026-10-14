const API_BASE = "https://api-colombia.com/api/v1";
const CACHE_TTL_MS = 60 * 60 * 1000;
let cachedCities = null;
let cachedAt = 0;

async function loadCities() {
  if (cachedCities && Date.now() - cachedAt < CACHE_TTL_MS) return cachedCities;

  const [citiesResponse, departmentsResponse] = await Promise.all([
    fetch(`${API_BASE}/City`, { signal: AbortSignal.timeout(10000) }),
    fetch(`${API_BASE}/Department`, { signal: AbortSignal.timeout(10000) }),
  ]);
  if (!citiesResponse.ok || !departmentsResponse.ok) {
    throw new Error(`El proveedor de ciudades respondió con HTTP ${citiesResponse.status}/${departmentsResponse.status}`);
  }
  const [cities, departments] = await Promise.all([citiesResponse.json(), departmentsResponse.json()]);
  if (!Array.isArray(cities) || !Array.isArray(departments)) {
    throw new Error("El proveedor de ciudades devolvió un formato no válido");
  }

  const departmentNames = new Map(departments.map((department) => [department.id, department.name]));
  cachedCities = cities
    .filter((city) => typeof city.name === "string" && departmentNames.has(city.departmentId))
    .map((city) => ({
      id: city.id,
      city: city.name,
      department: departmentNames.get(city.departmentId),
      departmentId: city.departmentId,
    }))
    .sort((a, b) => a.department.localeCompare(b.department, "es") || a.city.localeCompare(b.city, "es"));
  cachedAt = Date.now();
  return cachedCities;
}

async function listCities(req, res, next) {
  try {
    const cities = await loadCities();
    const department = typeof req.query.department === "string" ? req.query.department : "";
    res.json(department ? cities.filter((city) => city.department === department) : cities);
  } catch (err) {
    console.error("No se pudieron cargar las ciudades de Colombia:", err.message);
    res.status(502).json({ error: "No se pudieron cargar las ciudades de Colombia. Inténtalo de nuevo." });
  }
}

module.exports = { listCities };

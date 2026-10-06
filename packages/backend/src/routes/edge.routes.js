// Ruta de demostracion: simula una consulta de "nodo edge" hacia la nube
// central, usando la conexion autenticada por IAM (no por password).
const { Router } = require("express");
const { iamPool } = require("../config/iamDb");

const router = Router();

// GET /api/edge/status
// Confirma que el nodo puede autenticarse con su propio token IAM y hacer
// una lectura rapida contra la base de datos central (ej: verificar stock).
router.get("/status", async (req, res, next) => {
  try {
    const result = await iamPool.query(
      "SELECT NOW() AS hora_nube_central, current_user AS nodo_autenticado_como"
    );
    res.json({
      conexion: "IAM (token temporal, sin password fijo)",
      ...result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

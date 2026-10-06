// Middleware centralizado de errores: cualquier throw/next(err) termina aqui.
function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || (err.code === "LIMIT_FILE_SIZE" ? 413 : err.code?.startsWith("LIMIT_") ? 400 : err.code === "P2002" ? 409 : err.code === "P2003" ? 400 : err.code === "P2025" ? 404 : 500);
  const message = status >= 500 ? "Error interno del servidor" : err.message || "Solicitud no válida";
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };

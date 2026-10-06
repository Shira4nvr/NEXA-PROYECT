import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore, useCartStore } from "@shein-clone/shared";
import "./login.css";

const editorialImage =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85";

export default function Login() {
  const [role, setRole] = useState("customer");
  const [remember, setRemember] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState("");
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();
  const roleLabel = role === "customer" ? "cliente" : role === "seller" ? "vendedor" : "administrador";

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");
    const formData = new FormData(event.currentTarget);
    try {
      const result = isRegistering
        ? await register({
            email: formData.get("email"),
            password: formData.get("password"),
            role: role === "seller" ? "SELLER" : "CUSTOMER",
            termsAccepted: acceptTerms,
            privacyAuthorized: acceptPrivacy,
            marketingConsent,
            ...(role === "seller" ? {
              name: formData.get("legal-name"),
              legalName: formData.get("legal-name"),
              storeName: formData.get("store-name"),
              identificationNumber: formData.get("seller-document"),
              noticeAddress: formData.get("seller-notice-address"),
              contactPhone: formData.get("seller-phone"),
            } : {}),
          })
        : await login(formData.get("email"), formData.get("password"));

      const rolePath = { CUSTOMER: "/store", SELLER: "/seller", ADMIN: "/admin" };
      if (result.user.role !== (role === "seller" ? "SELLER" : role === "admin" ? "ADMIN" : "CUSTOMER")) {
        useAuthStore.getState().logout();
        setStatus("Esta cuenta no corresponde al tipo de acceso seleccionado.");
        return;
      }
      await useCartStore.getState().syncFromServer();
      navigate(rolePath[result.user.role], { replace: true });
    } catch (error) {
      setStatus(error.response?.data?.error || "No se pudo completar la solicitud. Revisa el servidor e inténtalo de nuevo.");
    }
  }

  function openDemo() {
    navigate("/store");
  }

  function openHiddenAdminAccess() {
    setRole("admin");
    setIsRegistering(false);
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setStatus("Acceso administrativo. Inicia sesión con una cuenta de administrador.");
  }

  function selectRole(nextRole) {
    setRole(nextRole);
    setIsRegistering(false);
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setStatus("");
  }

  return (
    <main className="nexo-login-page">
      <section className="login-editorial" style={{ "--editorial-image": `url("${editorialImage}")` }}>
        <Link className="login-brand" to="/" aria-label="Nexo, inicio">
          <span className="brand-mark">N</span>
          <span>NEXO</span>
        </Link>
        <div className="editorial-copy">
          <p className="editorial-kicker">MODA, A TU MANERA</p>
          <h1>Encuentra tu<br />propio ritmo.</h1>
          <p className="editorial-note">Una nueva forma de descubrir lo que va contigo.</p>
        </div>
        <div className="editorial-footer">
          <span>ESTILO EN MOVIMIENTO</span>
          <span>01 / 03</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-top"><span>PLATAFORMA NEXO</span><span>ACCESO SEGURO</span></div>
        <div className="login-content">
          <p className="form-eyebrow">ACCESO NEXO</p>
          <h2>{isRegistering ? "Crea tu cuenta." : "Qué bueno verte."}</h2>
          <p className="form-intro">{isRegistering ? `Registro de ${roleLabel}. Solo pedimos los datos necesarios para esta demostración.` : "Elige cómo quieres continuar."}</p>

          <div className="role-switch role-switch-two" aria-label="Tipo de acceso">
            <button type="button" aria-pressed={role === "customer"} className={role === "customer" ? "active" : ""} onClick={() => selectRole("customer")}>
              Cliente
            </button>
            <button type="button" aria-pressed={role === "seller"} className={role === "seller" ? "active" : ""} onClick={() => selectRole("seller")}>
              Vendedor
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {isRegistering && role === "seller" && (
              <>
                <label htmlFor="nexo-name">Nombre o razón social</label>
                <input id="nexo-name" name="legal-name" type="text" autoComplete="name" required />
                <label htmlFor="seller-store-name">Nombre de la tienda</label>
                <input id="seller-store-name" name="store-name" type="text" autoComplete="organization" required />
                {role === "seller" && <>
                  <label htmlFor="seller-document">Documento de identificación</label>
                  <input id="seller-document" name="seller-document" type="text" autoComplete="off" required />
                  <label htmlFor="seller-notice-address">Dirección física para notificaciones</label>
                  <input id="seller-notice-address" name="seller-notice-address" type="text" autoComplete="street-address" required />
                  <label htmlFor="seller-phone">Teléfono de contacto</label>
                  <input id="seller-phone" name="seller-phone" type="tel" autoComplete="tel" required />
                  <p className="field-hint">La Ley 1480 contempla identificar a oferentes de portales de contacto. No ingreses datos reales aquí: este formulario no los transmite ni los guarda.</p>
                </>}
              </>
            )}
            <label htmlFor="nexo-email">Correo electrónico</label>
            <input id="nexo-email" name="email" type="email" placeholder="nombre@correo.com" autoComplete="email" required />
            <div className="password-label-row">
              <label htmlFor="nexo-password">Contraseña</label>
              <button type="button" className="text-action" onClick={() => setStatus("La recuperación de contraseña estará disponible más adelante.")}>
                ¿La olvidaste?
              </button>
            </div>
            <input id="nexo-password" name="password" type="password" placeholder="Ingresa tu contraseña" autoComplete={isRegistering ? "new-password" : "current-password"} required />
            {isRegistering ? (
              <div className="consent-list">
                <label className="consent-option">
                  <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} required />
                  <span>Acepto los <Link to="/legal/terms">términos de uso</Link>. <strong>Obligatorio</strong></span>
                </label>
                <label className="consent-option">
                  <input type="checkbox" checked={acceptPrivacy} onChange={(event) => setAcceptPrivacy(event.target.checked)} required />
                  <span>Autorizo el tratamiento de mis datos según la <Link to="/legal/privacy">política de privacidad</Link>. <strong>Obligatorio</strong></span>
                </label>
                <label className="consent-option">
                  <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />
                  <span>Quiero recibir novedades comerciales por correo. <strong>Opcional</strong></span>
                </label>
              </div>
            ) : (
              <label className="remember-option">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                <span>Recordar mi sesión en este dispositivo</span>
              </label>
            )}
            <button className="submit-button" type="submit" disabled={isLoading}>{isLoading ? "Conectando…" : isRegistering ? "Crear cuenta" : "Iniciar sesión"}<span aria-hidden="true">→</span></button>
            <p className="form-status" aria-live="polite">{status}</p>
          </form>

          {!isRegistering && (
            <>
              <div className="login-divider"><span>VISTA SIN CUENTA</span></div>
              {role === "customer" ? <button className="guest-link demo-entry" type="button" onClick={openDemo}>Explorar tienda sin cuenta<span aria-hidden="true">↗</span></button> : <p className="form-intro">Para entrar a este espacio necesitas una cuenta con el rol correspondiente.</p>}
              {role !== "admin" && <p className="signup-prompt">¿Nuevo en Nexo? <button type="button" onClick={() => { setIsRegistering(true); setStatus(""); }}>Crear una cuenta</button></p>}
            </>
          )}
          {isRegistering && <p className="signup-prompt">¿Ya tienes cuenta? <button type="button" onClick={() => { setIsRegistering(false); setStatus(""); }}>Iniciar sesión</button></p>}
          <nav className="login-policy-links" aria-label="Documentos legales">
            <Link to="/legal/terms">Términos</Link><Link to="/legal/privacy">Privacidad</Link><Link to="/legal/refunds">Reembolsos</Link>
          </nav>
        </div>
        <footer className="login-legal"><span>© 2026 NEXO</span><span>PRIVACIDAD&nbsp;&nbsp; · &nbsp;&nbsp;AYUDA</span></footer>
        <button className="hidden-admin-entry" type="button" onClick={openHiddenAdminAccess} aria-label="Abrir acceso administrativo oculto">
          otro usuario
        </button>
      </section>
    </main>
  );
}
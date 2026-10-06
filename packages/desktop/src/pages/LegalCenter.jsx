import React from "react";
import { Link, useParams } from "react-router-dom";

const documents = {
  terms: {
    title: "Términos de uso",
    intro: "Borrador de estructura para revisión legal. No es un contrato vigente ni debe publicarse como definitivo.",
    sections: [
      ["Quién opera Nexo", "Antes de publicar, identifica la razón social o nombre del responsable, NIT, dirección de notificación judicial, teléfono, correo y canales de atención. También debe definirse si Nexo vende directamente o facilita ventas entre terceros; esa diferencia cambia responsabilidades."],
      ["Compras y publicaciones", "Las descripciones, disponibilidad, precio total en COP, impuestos, envío, plazo de entrega, garantía, medios de pago y condiciones de oferta deben ser claros y verificables antes de comprar. La información y publicidad ofrecidas pueden generar obligaciones para quien las anuncia."],
      ["Vendedores", "Si Nexo opera como portal de contacto, debe definir cómo verifica y mantiene los datos de identificación del oferente requeridos por la norma y cómo los facilita para reclamaciones en los casos previstos. El alta real de vendedores requiere revisión del proceso y de los datos que se solicitarán."],
      ["Reclamaciones y derechos", "Los términos no pueden eliminar derechos mínimos de consumidores. Debe existir un canal de atención accesible y trazable con constancia de radicación y seguimiento."],
      ["Pendientes de completar", "Añadir entidad operadora, país y jurisdicción, papel de Nexo y de cada vendedor, comisiones, logística, propiedad intelectual, moderación de productos, pagos, garantías, seguridad, limitaciones permitidas y canal oficial de reclamación."]
    ]
  },
  privacy: {
    title: "Política de privacidad",
    intro: "Borrador de diseño. No existe aún una política aprobada ni un tratamiento persistente conectado a este prototipo.",
    sections: [
      ["Responsable y contacto", "Completar con la identidad legal y datos de contacto del responsable del tratamiento y el canal para consultas y reclamos. La Ley 1581 exige informar esta identificación junto con finalidades, tratamiento y derechos al solicitar autorización."],
      ["Datos y necesidad", "Solicitar solo lo requerido para la finalidad concreta: correo y credencial para una cuenta; datos adicionales solo cuando una compra o la operación como vendedor los haga necesarios. Para un portal de contacto, revisar el mínimo de identificación de oferentes previsto en la Ley 1480. No pedir datos sensibles para estas funciones."],
      ["Finalidades y consentimiento", "Describir por separado registro, seguridad, compras, entrega, soporte y obligaciones legales. La autorización debe ser previa, informada y demostrable. El consentimiento comercial es opcional, específico y no debe venir preseleccionado ni condicionar el servicio básico."],
      ["Derechos y conservación", "Informar cómo conocer, actualizar, rectificar, solicitar prueba de autorización, presentar consultas/reclamos y, cuando proceda, pedir supresión o revocar autorización. Definir plazos de conservación, proveedores, transferencias internacionales, controles de seguridad y respuesta a incidentes según la operación real."],
      ["Menores y datos sensibles", "Definir controles y tratamiento conforme a las reglas especiales aplicables; no recolectar datos sensibles en los formularios de acceso, catálogo o compra de este prototipo."]
    ]
  },
  refunds: {
    title: "Retracto, cambios y reembolsos",
    intro: "Resumen informativo basado en la normativa colombiana consultada; la política final depende del producto, vendedor, flujo de pago y excepciones aplicables.",
    sections: [
      ["Derecho de retracto", "En ventas a distancia, la Ley 1480 contempla un plazo general de cinco (5) días hábiles desde la entrega del bien o celebración del servicio, sujeto a excepciones legales, entre ellas bienes personalizados, perecederos y bienes de uso personal. Verifica si la excepción aplica al producto concreto; no se debe prometer una exclusión general."],
      ["Reversión de pagos", "La reversión es distinta del retracto. Puede proceder para pagos electrónicos en supuestos legales como fraude, operación no solicitada, no entrega, producto diferente o defectuoso; la ley fija un aviso/reclamo en cinco (5) días hábiles desde el hecho relevante, con actuaciones del proveedor y del emisor del pago."],
      ["Tiempos y procedimiento", "La norma consultada contempla para el retracto la devolución de sumas pagadas dentro del término legal, que el texto vigente consultado fija en hasta treinta (30) días calendario desde el ejercicio. Los supuestos de falta de disponibilidad o retraso tienen reglas propias, modificadas parcialmente por Ley 2439 de 2024. Verifica el texto consolidado vigente antes de fijar el flujo."],
      ["Antes de publicar", "Definir dirección y costo de devolución, responsable por cada tipo de venta, pruebas y radicado de solicitudes, canal de soporte, estados de reembolso, coordinación con pasarela y procedimiento para vendedores terceros. La garantía legal y los reclamos por producto defectuoso no deben confundirse con cambios voluntarios."],
    ]
  },
};

export default function LegalCenter() {
  const { document = "terms" } = useParams();
  const content = documents[document] || documents.terms;

  return (
    <article className="legal-document">
      <p className="section-eyebrow">CENTRO DE POLÍTICAS · BORRADOR</p>
      <h1>{content.title}</h1>
      <p className="legal-intro">{content.intro}</p>
      <nav className="legal-tabs" aria-label="Documentos legales">
        <Link aria-current={document === "terms" ? "page" : undefined} to="/legal/terms">Términos</Link>
        <Link aria-current={document === "privacy" ? "page" : undefined} to="/legal/privacy">Privacidad</Link>
        <Link aria-current={document === "refunds" ? "page" : undefined} to="/legal/refunds">Retracto y reembolsos</Link>
      </nav>
      <div className="legal-draft-alert" role="note">No publicar como política final. Faltan datos de la entidad responsable y validación jurídica del modelo operativo de Nexo.</div>
      <div className="legal-sections">{content.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</div>
      <section className="legal-sources" aria-labelledby="legal-sources-title">
        <h2 id="legal-sources-title">Fuentes oficiales consultadas</h2>
        <ul>
          <li><a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981" target="_blank" rel="noreferrer">Ley 1581 de 2012 · protección de datos personales</a></li>
          <li><a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306" target="_blank" rel="noreferrer">Ley 1480 de 2011 · Estatuto del Consumidor</a></li>
          <li><a href="https://www.sic.gov.co/" target="_blank" rel="noreferrer">Superintendencia de Industria y Comercio (SIC)</a></li>
        </ul>
      </section>
      <p className="legal-disclaimer">Revisión normativa de referencia, no asesoría legal. La aplicabilidad depende del domicilio de Nexo, lugar de operación, estructura de marketplace, categorías de producto y terceros que procesen datos o pagos. Solicita revisión de abogado colombiano y valida vigencia en fuente oficial antes del lanzamiento.</p>
    </article>
  );
}
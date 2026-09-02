import axios from 'axios';

class AiExplanationService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || null;
    this.openaiApiKey = process.env.OPENAI_API_KEY || null;
  }

  /**
   * Genera una explicación pedagógica y un micro-quiz adaptativo basado en el resultado del análisis
   * @param {Object} analysisData
   * @returns {Promise<Object>}
   */
  async generarExplicacionYQuiz(analysisData) {
    // Si hay una API Key configurada de Gemini, intentar consultar la IA
    if (this.geminiApiKey) {
      try {
        const resultadoIA = await this.consultarGemini(analysisData);
        if (resultadoIA) return resultadoIA;
      } catch (err) {
        console.warn('⚠️ Error al consultar Gemini API, usando generador local inteligente:', err.message);
      }
    }

    // Fallback: Generador determinista inteligente y enriquecido
    return this.generarExplicacionLocal(analysisData);
  }

  /**
   * Generador local que produce explicaciones pedagógicas precisas y micro-quizzes interactivos
   */
  generarExplicacionLocal(analysisData) {
    const { url, riesgo, puntuacion, probabilidad_ml, indicadores = [], inspeccion_ssl, inspeccion_dom, caracteristicas_tecnicas } = analysisData;

    const tieneHomografo = indicadores.some(i => i.includes('homógrafos') || i.includes('Unicode') || i.includes('Punycode'));
    const tieneTyposquatting = indicadores.some(i => i.includes('TYPOSQUATTING') || i.includes('SUPLANTACIÓN'));
    const tienePassword = inspeccion_dom && inspeccion_dom.tienePassword;
    const tieneTarjeta = inspeccion_dom && inspeccion_dom.tieneTarjeta;
    const tieneSslInvalido = inspeccion_ssl && (!inspeccion_ssl.autorizado || inspeccion_ssl.esAutofirmado);
    const tieneSslReciente = inspeccion_ssl && inspeccion_ssl.esReciente;
    const esIP = caracteristicas_tecnicas && caracteristicas_tecnicas.esIP;
    const esHttp = caracteristicas_tecnicas && !caracteristicas_tecnicas.esHTTPS;

    let resumen = '';
    let recomendacion = '';
    let quiz = null;

    if (riesgo === 'alto') {
      if (tieneHomografo) {
        resumen = `🚨 **Ataque de Homógrafo Detectado:** Esta URL utiliza caracteres de alfabetos extranjeros (como el alfabeto cirílico) que se ven idénticos a las letras latinas a simple vista. Los atacantes usan este truco para engañar a tus ojos y hacerte creer que estás en el sitio oficial cuando en realidad es una página trampa.`;
        recomendacion = `Nunca ingreses contraseñas ni datos personales. Cierra la pestaña inmediatamente.`;
        quiz = {
          pregunta: "¿Por qué este enlace es peligroso a pesar de verse casi igual al original?",
          opciones: [
            "Porque utiliza caracteres de otros alfabetos (como cirílico) que se ven iguales pero van a otro servidor.",
            "Porque el protocolo HTTPS siempre significa que la página es un fraude.",
            "Porque los enlaces cortos nunca son seguros en ningún caso."
          ],
          respuesta_correcta: 0,
          explicacion: "¡Correcto! Los ataques de homógrafos explotan la similitud visual entre letras de diferentes idiomas (por ejemplo, una 'a' cirílica frente a una 'a' latina) para crear copias casi indetectables a simple vista."
        };
      } else if (tieneTyposquatting) {
        resumen = `🎯 **Suplantación de Marca (Typosquatting):** El dominio analizado imita intencionalmente el nombre de una entidad reconocida cambiando sutilmente algunas letras o agregando palabras como "-login" o "-seguro".`;
        if (tienePassword || tieneTarjeta) {
          resumen += ` Además, el sistema detectó formularios para capturar **${tieneTarjeta ? 'tarjetas bancarias' : 'contraseñas'}** en este sitio no autorizado.`;
        }
        recomendacion = `No inicies sesión ni proporciones números de tarjeta. Escribe siempre la dirección oficial directamente en la barra de tu navegador.`;
        quiz = {
          pregunta: "¿Cuál es la forma más segura de ingresar a tu cuenta bancaria o servicio corporativo?",
          opciones: [
            "Hacer clic directamente en los enlaces recibidos por correo o WhatsApp.",
            "Escribir manualmente la dirección oficial en la barra del navegador o usar los marcadores guardados.",
            "Verificar únicamente que el sitio tenga el candado verde/gris de HTTPS."
          ],
          respuesta_correcta: 1,
          explicacion: "¡Excelente! Escribir la URL oficial tú mismo o usar marcadores de confianza evita caer en dominios similares creados por atacantes para robar credenciales."
        };
      } else if (tienePassword || tieneTarjeta) {
        resumen = `🚨 **Captura No Autorizada de Datos:** Esta página contiene formularios para ingresar ${tieneTarjeta ? 'datos de tarjetas bancarias' : 'contraseñas maestras'}, pero el dominio no cuenta con verificación de autenticidad ni reputación oficial.`;
        recomendacion = `No completes ningún campo. Notifica de inmediato al área de Tecnología si recibiste este enlace en un correo corporativo.`;
        quiz = {
          pregunta: "¿Qué debes hacer si una página web desconocida te pide tu contraseña o tarjeta de crédito?",
          opciones: [
            "Ingresar los datos para probar si el sistema los rechaza.",
            "Cerrar la página de inmediato y verificar con el canal oficial de la empresa.",
            "Reenviar el enlace a todos tus compañeros de trabajo."
          ],
          respuesta_correcta: 1,
          explicacion: "¡Exacto! Nunca debes ingresar información sensible en sitios cuya procedencia no esté 100% verificada."
        };
      } else {
        resumen = `🚨 **Alto Riesgo de Phishing:** Múltiples motores de análisis e inteligencia de amenazas clasifican esta URL como potencialmente maliciosa (Probabilidad de IA: ${probabilidad_ml ? (probabilidad_ml * 100).toFixed(0) + '%' : 'Alta'}).`;
        recomendacion = `Evita interactuar con el enlace y no descargues ningún archivo asociado.`;
        quiz = {
          pregunta: "Si un enlace es clasificado como 'Alto Riesgo', ¿cuál es la mejor acción preventiva?",
          opciones: [
            "Abrir el enlace en modo incógnito para estar protegido.",
            "Ignorar el enlace, no ingresar datos y reportarlo como sospechoso.",
            "Hacer clic pero no descargar ningún archivo ejecutable."
          ],
          respuesta_correcta: 1,
          explicacion: "¡Muy bien! El modo incógnito no previene el robo de contraseñas si tú mismo las escribes en una página falsa; la mejor defensa es no interactuar con el enlace."
        };
      }
    } else if (riesgo === 'medio') {
      if (esIP || esHttp) {
        resumen = `⚠️ **Conexión Insegura / Servidor Directo:** Esta URL utiliza ${esHttp ? 'el protocolo HTTP no cifrado' : 'una dirección IP numérica directa en lugar de un nombre de dominio'}. ${tieneSslInvalido ? 'Además, su certificado de seguridad no es confiable.' : ''}`;
        recomendacion = `Ten precaución. No transmitas información confidencial a través de conexiones sin cifrar.`;
        quiz = {
          pregunta: "¿Por qué es riesgoso navegar en un sitio que utiliza 'http://' en lugar de 'https://'?",
          opciones: [
            "Porque la información viaja en texto plano y puede ser interceptada por terceros en la red.",
            "Porque los sitios HTTP son automáticamente eliminados por los navegadores.",
            "Porque no permite reproducir videos en línea."
          ],
          respuesta_correcta: 0,
          explicacion: "¡Correcto! En los sitios 'http://' sin cifrar, cualquier persona en la misma red Wi-Fi o punto de acceso podría interceptar las contraseñas que envíes."
        };
      } else if (tieneSslReciente) {
        resumen = `⚠️ **Certificado SSL Recién Creado:** El certificado de seguridad de este sitio fue emitido hace menos de 72 horas. Aunque el sitio cuenta con cifrado, los atacantes suelen registrar certificados nuevos justo antes de lanzar un ataque.`;
        recomendacion = `Verifica con cautela la identidad del remitente antes de interactuar.`;
        quiz = {
          pregunta: "¿El hecho de que un sitio web tenga candado (HTTPS) significa que es 100% seguro y legítimo?",
          opciones: [
            "Sí, el candado garantiza que el dueño de la página es una empresa legal.",
            "No, el candado solo indica que la conexión está cifrada, pero los atacantes también pueden obtener certificados para páginas falsas.",
            "Sí, ningún atacante puede obtener un certificado SSL."
          ],
          respuesta_correcta: 1,
          explicacion: "¡Excelente! Hoy en día cualquier persona puede obtener un certificado SSL gratuito en minutos. El candado cifra la comunicación, pero no garantiza la honestidad del sitio web."
        };
      } else {
        resumen = `⚠️ **Indicadores Sospechosos:** La URL presenta anomalías estructurales (como longitud excesiva, múltiples subdominios o parámetros inusuales) que ameritan precaución.`;
        recomendacion = `Revisa cuidadosamente el contenido antes de compartir datos.`;
        quiz = {
          pregunta: "¿Cuál de estas opciones representa una señal de alerta común en enlaces fraudulentos?",
          opciones: [
            "El dominio contiene múltiples subdominios confusos y guiones en el nombre.",
            "El sitio web carga en menos de dos segundos.",
            "El enlace termina en '.com' oficial."
          ],
          respuesta_correcta: 0,
          explicacion: "¡Así es! El uso de múltiples subdominios y guiones es una técnica recurrente para intentar confundir al usuario sobre el verdadero destino web."
        };
      }
    } else {
      resumen = `✅ **Sitio Verificado y Estable:** El dominio corresponde a una entidad legítima con certificado SSL maduro y confiable (${inspeccion_ssl?.emisor || 'Entidad reconocida'}), y el modelo de Inteligencia Artificial no encontró patrones de phishing.`;
      recomendacion = `El enlace presenta un perfil seguro para la navegación cotidiana.`;
      quiz = {
        pregunta: "¿Qué buena práctica de seguridad digital debes mantener incluso en sitios legítimos?",
        opciones: [
          "Usar la misma contraseña en todos los servicios para no olvidarla.",
          "Verificar que la URL en la barra de direcciones coincida con el servicio que deseas utilizar y usar autenticación en dos pasos (2FA).",
          "Desactivar las alertas de seguridad del navegador."
        ],
        respuesta_correcta: 1,
        explicacion: "¡Perfecto! Activar la autenticación de dos factores (2FA) y comprobar siempre el dominio en la barra de navegación son las mejores defensas para tu identidad digital."
      };
    }

    return {
      resumen_ia: resumen,
      recomendacion_ia: recomendacion,
      quiz_interactivo: quiz,
      fuente: 'Asistente Educativo PhishShield AI'
    };
  }

  /**
   * Consulta a Google Gemini API si la clave está configurada
   */
  async consultarGemini(analysisData) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
    
    const prompt = `
Eres el Asistente Educativo de Ciberseguridad de PhishShield. Analiza los siguientes datos técnicos de una URL y genera una explicación en lenguaje natural accesible para un empleado de oficina y un micro-quiz interactivo de 1 pregunta.

Datos técnicos:
${JSON.stringify(analysisData, null, 2)}

Responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "resumen_ia": "Explicación clara y didáctica de por qué es segura o peligrosa (máximo 3 párrafos cortos en markdown)",
  "recomendacion_ia": "Acción concreta recomendada para el usuario",
  "quiz_interactivo": {
    "pregunta": "¿Pregunta interactiva sobre la amenaza detectada?",
    "opciones": ["Opción A", "Opción B", "Opción C"],
    "respuesta_correcta": 0,
    "explicacion": "Explicación pedagógica de por qué esa opción es la correcta"
  }
}
`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    const response = await axios.post(endpoint, payload, { timeout: 4000 });
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return {
      ...parsed,
      fuente: 'Google Gemini 1.5 Flash'
    };
  }
}

export default AiExplanationService;

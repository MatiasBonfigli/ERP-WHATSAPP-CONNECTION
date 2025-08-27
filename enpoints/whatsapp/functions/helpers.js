const { MessageMedia } = require("whatsapp-web.js");

/**
 * Función para Enviar un mensaje por whatsapp
 *
 * @param {String} phoneNumber - Numero telefónico del cliente
 * @param {String} message - Mensaje a enviar
 * @param {Object} client - Objeto del cliente de whatsapp-web.js
 * @param {Int} senderId - Id de el remitente del mensaje
 * @param {Int} configId - Id de la configuración vinculada a la empresa
 * @param {String} base64Image - Imagen codificada en base 64
 * @param {String} mimeType - mimeType de la imagen
 *
 */
async function sendWhatsappMessage(phoneNumber, message, client, files) {
  // 1. Validaciones previas
  if (!client) {
    return { status: false, stmessage: "Cliente de WhatsApp no inicializado" };
  }

  // Si la instancia ya fue destruida, client.info será undefined o puppeteer cerrada
  if (client.info === undefined) {
    return {
      status: false,
      stmessage: "El cliente de WhatsApp no está conectado (info indefinida)",
    };
  }
  // A partir de whatsapp-web.js v1.16+, existe client.pupPage -> Puppeteer Page
  const pupPage = client.pupPage;
  if (!pupPage || pupPage.isClosed()) {
    return {
      status: false,
      stmessage:
        "La sesión de WhatsApp está desconectada (Puppeteer page cerrada)",
    };
  }

  try {
    const chatId = phoneNumber + "@c.us";

    let status = false;
    let stmessage = "";

    if (!files || !files.length > 0) {
      // Envía el mensaje sin imagen
      await client
        .sendMessage(chatId, message)
        .then(async (response) => {
          status = true;
          stmessage = "Mensaje enviado correctamente";
        })
        .catch((err) => {
          console.error("Error al enviar el mensaje:", err);
          status = false;
          stmessage = `Error al enviar el mensaje ${err}`;
        });
    } else {
      for (const file of files) {
        try {
          const media = MessageMedia.fromFilePath(file);

          await client
            .sendMessage(chatId, media, { caption: message ? message : "" })
            .then(async (response) => {
              status = true;
              stmessage = "Mensaje con imagen enviado correctamente";
            })
            .catch((err) => {
              console.error("Error al enviar el mensaje:", err);
              status = false;
              stmessage = `Error al enviar el mensaje con imagens${err}`;
            });
        } catch (error) {
          status = false;
          stmessage = `Error al enviar el mensaje con imagens${error}`;
        }
      }
    }

    return { status, stmessage };
  } catch (error) {
    return { status: false, stmessage: `Error al enviar el mensaje: ${Error}` };
  }
}

module.exports = {
  sendWhatsappMessage,
};

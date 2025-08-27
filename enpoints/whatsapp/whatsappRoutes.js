/**
 * @fileoverview endpoints relacionados a whatsapp
 *
 * @version                               1.0
 *
 * @author                 newWays Software <contacto@appysoftwarear.com>
 * @copyright           victoriassistant.com
 *
 * History
 * v1.0 - Se creo la primer version del archivo
 */


const express = require('express');
const { createWhatsappClient, removeWhatsappClient, loadContextIds, getAllClients, getClientById } = require('./functions/clientFunctions');
const { sendWhatsappMessage } = require('./functions/helpers');
const { addBroadcastJob } = require('./functions/queue');
const router = express.Router();

async function addNewClient(contextId) {

    //if (!processContext.whatsappContextIds.includes(contextId)) {
        const whatsappResponse =  await createWhatsappClient(contextId);
        return whatsappResponse;
    //} else {
    //    (`El contextId ${contextId} ya existe.`);
    //    return Promise.reject(new Error(`El contextId ${contextId} ya existe.`));
   // }
}

/**
 * Genera un ID aleatorio alfanumérico (sin espacios).
 * @param {number} length - Longitud del ID a generar
 * @returns {string} ID aleatorio
 */
function generateRandomId(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}


//endpoint para agrgar un nuevo numero de whatsapp a la empresa
router.post("/add", async (req, res) => { 
  
    try {

        const contextId = generateRandomId();
        //generar el QR para escanear
        const result = await addNewClient(contextId);
        if (typeof result === "string") {
          res.status(200).json({ message: result });
        } else {
          res.status(200).json({ qr: result });
        }
      
    } catch (error) {
      res.status(205).json({ error: error.message });
    }
  
});

// Endpoint para cerrar la sesión y eliminar los datos de un número de WhatsApp
router.post("/logout", async (req, res) => {
    const { contextId } = req.body; // Nombre o ID del teléfono
  
    try {
        const result = await removeWhatsappClient(contextId);
        res.status(200).json({ message: result });
    } catch (error) {
      console.log(error)
        res.status(500).json({ error: error.message });
    }
});

router.post("/getnumbers", async (req, res) => { 
  
    try {
     
  
      // Ejecutamos la consulta utilizando la función proporcionada
      const numbers = getAllClients();
  
      // Verificamos si se obtuvieron resultados
      if (numbers.length > 0) {
        res.json({ numbers }); // Retornamos los números en formato JSON
      } else {
        res.json({ numbers: [] }); // Retornamos un array vacío si no se encontraron números
      }
    } catch (error) {
      console.error('Error al obtener los números telefónicos:', error);
      res.status(204).json({ error: 'Error interno del servidor' });
    }
});

router.post("/sendmessage", async (req, res) => {

    const { phoneNumber, message, filesUrl, contextId } = req.body;

    const client = getClientById(contextId); 

    if(!client) {
      //Bscar los clientes disponibles
      const numbers = getAllClients();

      return res.status(555).json({
        message: `No existe un cliente de whatsapp con el id: ${contextId}}`,
        errored_context_id: contextId,
        available_numbers: numbers
      });
    } 

    const {status, stmessage} = await sendWhatsappMessage(phoneNumber, message, client, filesUrl);
    
    return (status === true) 
    ? res.status(200).send(stmessage) 
    : res.status(400).send(stmessage);
    

});

router.post("/broadcast", async (req, res) => {
    const { phoneNumbers, message, filesUrl, contextId } = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({ error: "phoneNumbers must be a non-empty array." });
    }

    const client = getClientById(contextId);

    if (!client) {
        const numbers = getAllClients();
        return res.status(404).json({
            message: `WhatsApp client with id ${contextId} not found.`,
            errored_context_id: contextId,
            available_numbers: numbers
        });
    }

    for (const phoneNumber of phoneNumbers) {
        await addBroadcastJob({
            phoneNumber,
            message,
            filesUrl,
            contextId,
        });
    }

    res.status(202).json({
        message: "Broadcast request accepted. Messages are being queued for sending.",
        contextId: contextId,
        total_numbers: phoneNumbers.length
    });
});



module.exports = router; 
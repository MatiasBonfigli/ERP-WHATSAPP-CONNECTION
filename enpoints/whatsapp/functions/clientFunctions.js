
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const { Client, LocalAuth } = require('whatsapp-web.js');

require("dotenv").config();

const datapath = process.env.DATA_PATH;
const DATAPATH = path.resolve(datapath);  

// Carpeta donde se guardarán las imágenes JPG del QR
const QRS_PATH  = path.join(DATAPATH, '/QRS');

/**
 * Guardar un QR en JPG y devolver su ruta absoluta (completa, desde la raíz del sistema)
 * @param {String} base64Data Base64 SIN encabezado data URI
 * @returns {String} Ruta absoluta, por ej. C:\Users\matias\APLICATION_DATA\QRS\QR-WHATSAPP-2025-05-29_15-23-45-123.jpg
 */
function saveQrToDisk(base64Data) {
    // Formato de timestamp sin dos puntos para ser válido en Windows
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
    const fileName = `QR-WHATSAPP-${stamp}.jpg`;
    const absolutePath = path.join(QRS_PATH, fileName);   // ← YA ES ABSOLUTA
  
    // Crear carpeta QRS si no existe (por si falla al arrancar)
    if (!fs.existsSync(QRS_PATH)) fs.mkdirSync(QRS_PATH, { recursive: true });
  
    fs.writeFileSync(absolutePath, Buffer.from(base64Data, 'base64'));
  
    return absolutePath;   
  }

//TODO CONFIGURAR DATAPATH EN .ENV para esta integracion
const SESSIONS_PATH = path.join(datapath, '/whatsapp/sessions');
const CONTEXT_IDS_FILE = path.join(datapath, '/whatsapp/contextIds.json');

//Variable para almacenar los clientes actuales de whatsapp
let clients = [];

/**
 * Verificar si es el primer inicio de sesion con dicho contexto
 * 
 * @param {String} contextId Id del contexto de whatsapp
 * @returns 
 */
function sessionExists(contextId) {
    const sessionDir = path.join(SESSIONS_PATH, `session-${contextId}`);
    const exists = fs.existsSync(sessionDir);
    return exists;
}

/**
 * Función para crear un nuevo cliente de whatsapp-web.js
 * 
 * @param {Int} contectId - Id de la configuracion vinculada a la empresa
 * @param {String} companyid - Id de la compañia a la que se vinculará el numero telefónico
 * 
 */
async function createWhatsappClient(contextId) {

    let resolveQR;  // Función para resolver la promesa del QR
    const qrPromise = new Promise(resolve => resolveQR = resolve); 

    const isFirstLogin = !sessionExists(contextId);

    const client = new Client({
        authStrategy: new LocalAuth({ 
            clientId: contextId,
            dataPath: SESSIONS_PATH
         }),
        // Evita cargar mensajes anteriores
        puppeteer: {
            args: ['--no-sandbox'],
        },
        // Opción para no sincronizar el historial (puede variar según la versión)
        syncHistory: false,
    });

    if (isFirstLogin) {
        console.log("first login")
        client.once('qr', (qr) => { 

            // Establece un temporizador que resolverá la promesa con null si el QR no se escanea a tiempo
            timeoutId = setTimeout(() => {

                if(!sessionExists(contextId)) {
                    resolveQR(null);  // Resuelve la promesa con null para indicar que el tiempo expiró
                    client.destroy();  // Opcional: destruir el cliente para limpiar recursos
                } 
                

            }, 20000);  // Espera 20 segundos para que el QR sea escaneado

            QRCode.toDataURL(
                qr,
                { type: 'image/jpeg', rendererOpts: { quality: 0.85 } },
                (err, url) => {
                  if (err) {
                    console.error('Error al generar QR:', err);
                    resolveQR(null);
                    return;
                  }
            
                  // url = 'data:image/jpeg;base64,<BASE64...>'
                  const base64Image = url.split(',')[1];
                  const filePath    = saveQrToDisk(base64Image);  // ← guarda y devuelve ruta
            
                  resolveQR(filePath);        // ➜ la promesa devuelve la ruta, no el base64
                }
              );

        });
    }

    
    //Este para cargar en l crm los mensajes enviados por mi y en el asistente
    client.on('message_create', async (message) => {});

    client.on('message', async (message) => {});


    client.on('ready', async  () => {
        console.log(`Cliente ${contextId} está listo.`);

        clients.push({ contextId, client });

        const contextIds = loadContextIds();

        if (!contextIds.includes(contextId)) {

            contextIds.push(contextId);

            const CONTEXT_IDS_FILE = path.join(datapath, '/whatsapp/contextIds.json');

            // Guardar los nuevos contextIds
            fs.writeFileSync(CONTEXT_IDS_FILE, JSON.stringify(contextIds));

        }
    });


    client.on('authenticated', () => {
        console.log(`Cliente ${contextId} autenticado.`);
    });

    client.on('auth_failure', (msg) => {
        console.error(`Error de autenticación en cliente ${contextId}:`, msg);

        return Promise.reject(new Error(`Error de autenticación: ${msg}`));
    });

    client.on('disconnected', (reason) => {
        console.log(`Cliente ${contextId} desconectado:`, reason);

        return Promise.reject(new Error(`Desconectado: ${reason}`));
    });

    await client.initialize();



    // Esperar a que la promesa del QR se resuelva antes de continuar
    const qrCodeData = await qrPromise;

    if (qrCodeData) {
        return qrCodeData;  // Devuelve el QR si se capturó
    } else {
        return "Cliente ya inicializado y listo para usar.";
    }

}

function getClientById(contextId, phoneNumber) {


    let client = (!phoneNumber) 
    ? clients.find(c => c.contextId === contextId) 
    : clients.find(c => c.client.info.wid.user === phoneNumber); 


    return (client) ? client.client : null;

}

function getAllClients() {

    //Crear el mapa de clientes para retornar
    const clients_map = clients.map(item => {

        // Obtener información del cliente
        const info = item.client.info;

        // Número de teléfono vinculado
        const phoneNumber = info.wid.user; // '1234567890'
        const pushname = info.pushname;

        return {

            contextId: item.contextId,
            phone_number: phoneNumber,
            push_name: pushname

        };

    });

    return clients_map;

}

async function removeWhatsappClient(contextId) {

    let client = clients.find(c => c.contextId === contextId);

    //Eliminar el archivo de la sesion
    const deleteSession = () => {

        // Eliminar el directorio de la sesión
        const sessionDir = path.join(SESSIONS_PATH, `session-${contextId}`);
        
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }

    };

    //Eliminar el context Id del archivo de ids
    const deleteFromContextIdFile = () => {

        //LEER LOS CONTEXTID ELIMINAR EL CORRESPONDIENTE Y VOLVER A ESCRIBIR EL ARCHIVO
        let contextIds = loadContextIds();

        const CONTEXT_IDS_FILE = path.join(datapath, '/whatsapp/contextIds.json');

        // Eliminar el contextId
        contextIds = contextIds.filter(id => id !== contextId);
    
        // Guardar los nuevos contextIds
        fs.writeFileSync(CONTEXT_IDS_FILE, JSON.stringify(contextIds));

    };
    
    if (client) {
        // Destruir la sesión del cliente
        await client.client.destroy();

        // Eliminar del array de clientes
        clients = clients.filter(c => c.contextId !== contextId);

        // Eliminar el directorio de la sesión
        deleteSession();
 
        deleteFromContextIdFile();

    } else {

        deleteSession();

        deleteFromContextIdFile();
        
    };

    return "Cliente eliminado correctamente";

}

//FUNCION PARA VCARGAR TODOS LOS CONTEXTiD DEL JSON
function loadContextIds() {
    const CONTEXT_IDS_FILE = path.join(datapath, '/whatsapp/contextIds.json');
    if (fs.existsSync(CONTEXT_IDS_FILE)) {
        const data = fs.readFileSync(CONTEXT_IDS_FILE);
        return JSON.parse(data);
    }
    return [];
}

module.exports = {
    createWhatsappClient, 
    removeWhatsappClient, 
    getClientById, 
    getAllClients, 
    loadContextIds
}
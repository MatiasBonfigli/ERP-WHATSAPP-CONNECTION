const express = require('express');
const bodyParser = require('body-parser'); 
const cors = require('cors'); // Importa el paquete cors

const whatsappRoutes = require("./enpoints/whatsapp/whatsappRoutes");
const { loadContextIds, createWhatsappClient } = require('./enpoints/whatsapp/functions/clientFunctions');
require('./enpoints/whatsapp/functions/queue'); // This will start the queue worker

const app = express();
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true })); 

const port = 3000;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/whatsapp', whatsappRoutes);

//VOLVER A ABRIR LAS SESIONES YA ABIERTAS
const contextIds = loadContextIds();

console.log(contextIds)

if(contextIds.length > -1) {
    contextIds.forEach((contextId) => {
      try {
        createWhatsappClient(contextId);
      } catch (error) {
          console.log(`el contextId tiene problemas para cargar : ${error}`);
      }
  
    });  
  }

// Start the server only if this file is run directly
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Servidor API corriendo en http://localhost:${port}`);
    });
}

module.exports = app;
require('dotenv').config(); // Load environment variables
const request = require('supertest');
const app = require('../main');
const { addBroadcastJob, broadcastQueue, redisConnection } = require('../enpoints/whatsapp/functions/queue');
const { getClientById, getAllClients, removeWhatsappClient } = require('../enpoints/whatsapp/functions/clientFunctions');
const { sendWhatsappMessage } = require('../enpoints/whatsapp/functions/helpers');

// Mock the external dependencies
jest.mock('whatsapp-web.js', () => ({
    Client: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        destroy: jest.fn().mockResolvedValue(),
        sendMessage: jest.fn().mockResolvedValue({ ack: 2 }),
        info: {
            wid: { user: '1234567890' },
            pushname: 'TestUser'
        }
    })),
    LocalAuth: jest.fn(),
    MessageMedia: {
        fromFilePath: jest.fn(),
    }
}));

// Mock the queue module
jest.mock('../enpoints/whatsapp/functions/queue', () => ({
    addBroadcastJob: jest.fn().mockResolvedValue(),
    broadcastQueue: {
        getCompletedCount: jest.fn().mockResolvedValue(100),
        getWaitingCount: jest.fn().mockResolvedValue(50),
        getActiveCount: jest.fn().mockResolvedValue(10),
        getDelayedCount: jest.fn().mockResolvedValue(5),
        getFailedCount: jest.fn().mockResolvedValue(2),
    },
    redisConnection: {
        get: jest.fn().mockResolvedValue('100'),
    },
    getTodaysCountKey: jest.fn().mockReturnValue('broadcast-count:test-date'),
}));

// Mock clientFunctions and helpers
jest.mock('../enpoints/whatsapp/functions/clientFunctions', () => ({
    loadContextIds: jest.fn().mockReturnValue([]),
    createWhatsappClient: jest.fn(),
    removeWhatsappClient: jest.fn(),
    getClientById: jest.fn(),
    getAllClients: jest.fn(),
}));
jest.mock('../enpoints/whatsapp/functions/helpers');


describe('WhatsApp API Endpoints', () => {

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('POST /whatsapp/sendmessage', () => {
        it('should send a message successfully with a valid client', async () => {
            getClientById.mockReturnValue({}); // Simulate a valid client
            sendWhatsappMessage.mockResolvedValue({ status: true, stmessage: "Mensaje enviado correctamente" });

            const response = await request(app)
                .post('/whatsapp/sendmessage')
                .send({
                    phoneNumber: '1234567890',
                    message: 'Hello',
                    contextId: 'existing-client'
                });

            expect(response.status).toBe(200);
            expect(response.text).toBe('Mensaje enviado correctamente');
            expect(getClientById).toHaveBeenCalledWith('existing-client');
            expect(sendWhatsappMessage).toHaveBeenCalled();
        });

        it('should return 555 if the client is not found', async () => {
            getClientById.mockReturnValue(null); // Simulate client not found
            getAllClients.mockReturnValue([]);

            const response = await request(app)
                .post('/whatsapp/sendmessage')
                .send({
                    phoneNumber: '1234567890',
                    message: 'Hello',
                    contextId: 'non-existing-client'
                });

            expect(response.status).toBe(555);
            expect(response.body.message).toContain('No existe un cliente de whatsapp');
        });
    });

    describe('POST /whatsapp/broadcast', () => {
        it('should queue broadcast messages successfully', async () => {
            getClientById.mockReturnValue({}); // Simulate a valid client

            const response = await request(app)
                .post('/whatsapp/broadcast')
                .send({
                    phoneNumbers: ['111', '222', '333'],
                    message: 'Broadcast test',
                    contextId: 'existing-client'
                });

            expect(response.status).toBe(202);
            expect(response.body.message).toBe('Broadcast request accepted. Messages are being queued for sending.');
            expect(addBroadcastJob).toHaveBeenCalledTimes(3);
            expect(addBroadcastJob).toHaveBeenCalledWith({
                phoneNumber: '111',
                message: 'Broadcast test',
                filesUrl: undefined,
                contextId: 'existing-client'
            });
        });

        it('should return 404 if the client for broadcast is not found', async () => {
            getClientById.mockReturnValue(null);

            const response = await request(app)
                .post('/whatsapp/broadcast')
                .send({
                    phoneNumbers: ['111', '222'],
                    message: 'Broadcast test',
                    contextId: 'non-existing-client'
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('WhatsApp client with id non-existing-client not found.');
        });

        it('should return 400 if phoneNumbers is not a valid array', async () => {
            const response = await request(app)
                .post('/whatsapp/broadcast')
                .send({
                    phoneNumbers: [], // Empty array
                    message: 'Broadcast test',
                    contextId: 'existing-client'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('phoneNumbers must be a non-empty array.');
        });
    });

    describe('GET /whatsapp/broadcast/status', () => {
        it('should return the queue status successfully', async () => {
            const response = await request(app).get('/whatsapp/broadcast/status');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('dailySentCount', 100);
            expect(response.body.queue).toEqual({
                sentCount: 100,
                pendingCount: 50,
                activeCount: 10,
                delayedCount: 5,
                failedCount: 2,
            });
        });
    });

    describe('POST /whatsapp/getnumbers', () => {
        it('should return a list of available numbers', async () => {
            getAllClients.mockReturnValue([
                { contextId: 'client1', phone_number: '111', push_name: 'User1' },
                { contextId: 'client2', phone_number: '222', push_name: 'User2' },
            ]);

            const response = await request(app).post('/whatsapp/getnumbers');

            expect(response.status).toBe(200);
            expect(response.body.numbers).toHaveLength(2);
            expect(response.body.numbers[0].phone_number).toBe('111');
        });
    });

    describe('POST /whatsapp/logout', () => {
        it('should logout a client successfully', async () => {
            removeWhatsappClient.mockResolvedValue("Cliente eliminado correctamente");

            const response = await request(app)
                .post('/whatsapp/logout')
                .send({ contextId: 'existing-client' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Cliente eliminado correctamente");
            expect(removeWhatsappClient).toHaveBeenCalledWith('existing-client');
        });
    });
});

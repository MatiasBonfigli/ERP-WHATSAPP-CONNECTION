const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');
const { getClientById } = require('./clientFunctions');
const { sendWhatsappMessage } = require('./helpers');

const connection = new Redis({
    maxRetriesPerRequest: null,
});

const broadcastQueue = new Queue('broadcast-queue', { connection });

const queueScheduler = new QueueScheduler('broadcast-queue', { connection });

const dailyLimit = 900;
const getTodaysCountKey = () => `broadcast-count:${new Date().toISOString().split('T')[0]}`;

const worker = new Worker('broadcast-queue', async job => {
    const { phoneNumber, message, filesUrl, contextId } = job.data;

    const todaysCountKey = getTodaysCountKey();
    const currentCount = await connection.get(todaysCountKey);

    if (currentCount && parseInt(currentCount, 10) >= dailyLimit) {
        // Postpone the job for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow

        await broadcastQueue.add('broadcast-job', job.data, {
            delay: tomorrow.getTime() - Date.now(),
        });
        console.log(`Daily limit reached. Job for ${phoneNumber} postponed to tomorrow.`);
        return;
    }


    const client = getClientById(contextId);
    if (!client) {
        throw new Error(`Client ${contextId} not found for job ${job.id}`);
    }

    await sendWhatsappMessage(phoneNumber, message, client, filesUrl);

    // Increment today's count
    const newCount = await connection.incr(todaysCountKey);
    if (newCount === 1) {
        // Set expiry for the key at the end of the day
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        await connection.expireat(todaysCountKey, Math.floor(endOfDay.getTime() / 1000));
    }

}, {
    connection,
    limiter: {
        max: 10,
        duration: 3000, // 10 jobs every 3 seconds
    },
});

worker.on('completed', job => {
    console.log(`Job ${job.id} has completed for ${job.data.phoneNumber}`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} has failed for ${job.data.phoneNumber} with ${err.message}`);
});

const addBroadcastJob = async (data) => {
    await broadcastQueue.add('broadcast-job', data);
};

module.exports = {
    addBroadcastJob,
    broadcastQueue,
    redisConnection: connection,
    getTodaysCountKey
};

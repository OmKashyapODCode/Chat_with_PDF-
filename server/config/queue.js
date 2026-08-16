import amqplib from 'amqplib';

const QUEUE_NAME = 'file-upload-queue';

let connection;
let channel;

/**
 * Connect to CloudAMQP and return a ready channel.
 * Calling this multiple times is safe - it reuses the existing connection.
 */
export async function connectQueue() {
  if (channel) return channel;

  connection = await amqplib.connect(process.env.CLOUDAMQP_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  return channel;
}

/**
 * Publish a job to the file-upload queue.
 * @param {object} payload - The job data to publish.
 */
export async function publishToQueue(payload) {
  const ch = await connectQueue();
  ch.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
}

export { QUEUE_NAME };

import express from 'express';

const app = express();
const PORT = process.env.STELLAR_SERVICE_PORT ?? 3002;

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`stellar-service running on port ${PORT}`);
});

import { createApp } from './app';
import { createYahooSource } from './yahooClient';

const port = Number(process.env.PORT ?? 8787);

createApp(createYahooSource()).listen(port, () => {
  console.log(`Market data proxy listening on http://localhost:${port}`);
});

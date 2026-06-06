import http from 'node:http';

const server = http.createServer((_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ service: 'ai-orchestrator', status: 'ready' }));
});

if (process.env.SYSTEMAI_RUN_SERVICES === 'true') {
  server.listen(4201, () => {
    process.stdout.write('ai-orchestrator running on 4201\n');
  });
}

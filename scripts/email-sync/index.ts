import { syncEmails } from './syncer.js';

syncEmails().catch((err) => {
  console.error('\n❌ O processo terminou com erro:', err);
  process.exit(1);
});

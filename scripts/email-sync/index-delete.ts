import { deleteSyncedEmails } from './delete-synced.js';

deleteSyncedEmails().catch((err) => {
  console.error('\n❌ O processo de exclusão terminou com erro:', err);
  process.exit(1);
});

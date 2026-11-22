import { closeDatabase, initializeDatabase } from './db.js';
try {
    await initializeDatabase();
    console.log('Database migrations are up to date.');
}
finally {
    await closeDatabase();
}
//# sourceMappingURL=migrate.js.map
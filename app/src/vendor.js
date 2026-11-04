// The only third-party code the pages load: Firebase (app, anonymous auth, Realtime Database) and a QR encoder.
// tool/build.sh bundles this file into public/vendor/vendor.js.
export { initializeApp } from 'firebase/app';
export {
  initializeAuth, signInAnonymously, connectAuthEmulator,
  browserSessionPersistence, inMemoryPersistence,
} from 'firebase/auth';
export {
  getDatabase, connectDatabaseEmulator, ref, set, update, get, onValue, onDisconnect, serverTimestamp,
} from 'firebase/database';
import QRCode from 'qrcode';
export { QRCode };

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
  // Or use { credential: cert(serviceAccount) } with your service account JSON
});

const db = getFirestore();

async function fixTickets() {
  const ticketsRef = db.collection('tickets');
  const snapshot = await ticketsRef.get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};

    if (!data.phone) updates.phone = 'Unknown';
    if (!data.userEmail) updates.userEmail = 'Unknown';
    if (!data.userName) updates.userName = 'Unknown';
    if (!data.price) updates.price = 0;

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`Updated ticket ${doc.id}:`, updates);
    }
  }
  console.log('All tickets checked and updated where needed.');
}

fixTickets().catch(console.error);

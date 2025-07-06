import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function fixTicketsWithUserInfo() {
  const ticketsRef = db.collection('tickets');
  const usersRef = db.collection('users');
  const snapshot = await ticketsRef.get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};

    // Try to fetch user info from users collection if missing
    let userDoc = null;
    if (data.userId) {
      userDoc = await usersRef.doc(data.userId).get();
    }
    const userInfo = userDoc && userDoc.exists ? userDoc.data() : {};

    if (!data.phone && userInfo.phone) updates.phone = userInfo.phone;
    if (!data.userEmail && userInfo.email) updates.userEmail = userInfo.email;
    if (!data.userName && (userInfo.displayName || userInfo.name)) updates.userName = userInfo.displayName || userInfo.name;
    if (!data.price) updates.price = 0;
    if (!data.ticketType) updates.ticketType = 'Unknown';

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`Updated ticket ${doc.id}:`, updates);
    }
  }
  console.log('All tickets checked and updated with user info where needed.');
}

fixTicketsWithUserInfo().catch(console.error);

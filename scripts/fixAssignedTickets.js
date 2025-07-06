import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function fixAssignedTickets() {
  const ticketsRef = db.collection('tickets');
  const usersRef = db.collection('users');
  const snapshot = await ticketsRef.get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    const missingFields = [];

    // Only update tickets that are assigned (status: confirmed, userId exists)
    if (data.status === 'confirmed' && data.userId) {
      // Try to fetch user info from users collection
      let userDoc = await usersRef.doc(data.userId).get();
      const userInfo = userDoc.exists ? userDoc.data() : {};

      // Check and log missing fields
      if (!data.userName) missingFields.push('userName');
      if (!data.userEmail) missingFields.push('userEmail');
      if (!data.phone) missingFields.push('phone');

      // Update ticket fields with user info if missing or blank
      if (!data.userName && (userInfo.displayName || userInfo.name)) updates.userName = userInfo.displayName || userInfo.name;
      if (!data.userEmail && userInfo.email) updates.userEmail = userInfo.email;
      if (!data.phone && userInfo.phone) updates.phone = userInfo.phone;
      if (!data.ticketType) updates.ticketType = 'Unknown';
      if (!data.price) updates.price = 0;

      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        console.log(`Updated assigned ticket ${doc.id}:`, updates, '| Missing fields:', missingFields);
      } else {
        if (missingFields.length > 0) {
          console.log(`Ticket ${doc.id} is missing fields:`, missingFields, '| No user info found to update.');
        } else {
          console.log(`No update needed for ticket ${doc.id}`);
        }
      }
    } else {
      console.log(`Skipped ticket ${doc.id} (not assigned)`);
    }
  }
  console.log('All assigned tickets checked and updated with user info where needed.');
}

fixAssignedTickets().catch(console.error);

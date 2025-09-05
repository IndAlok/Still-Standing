// Simple script to test invitations in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC3g5MdF4tEQ5X2OfZrQaXNtMlg8L_YG9I",
  authDomain: "crewconnect00.firebaseapp.com",
  databaseURL: "https://crewconnect00-default-rtdb.firebaseio.com",
  projectId: "crewconnect00",
  storageBucket: "crewconnect00.appspot.com",
  messagingSenderId: "957302386715",
  appId: "1:957302386715:web:7f3c7e5e5e1f1e1e1e1e1e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testInvitations() {
  try {
    console.log('🔍 Testing invitation queries...');
    
    // 1. Get all invitations
    console.log('\n1. Getting all invitations:');
    const allInvitations = await getDocs(collection(db, 'invitations'));
    console.log(`Total invitations: ${allInvitations.size}`);
    
    allInvitations.forEach(doc => {
      const data = doc.data();
      console.log(`- ID: ${doc.id}`);
      console.log(`  Group: ${data.crewName || data.groupName || 'Unknown'}`);
      console.log(`  Invited User ID: ${data.invitedUserId}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Created: ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt}`);
      console.log('');
    });

    // 2. Test specific user queries
    const testUserIds = [
      'DHRlbAgkUoa2h87hS1WIseQY2Fs2', 
      'S50ckRHcEZSEWbmIk2cTMaZRJrd2'
    ];

    for (const userId of testUserIds) {
      console.log(`\n2. Testing invitations for user: ${userId}`);
      
      // Query for this user
      const userQuery = query(
        collection(db, 'invitations'),
        where('invitedUserId', '==', userId)
      );
      
      const userSnapshot = await getDocs(userQuery);
      console.log(`  Found ${userSnapshot.size} invitations for this user`);
      
      userSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.crewName || data.groupName}: ${data.status}`);
      });

      // Query for pending invitations
      const pendingQuery = query(
        collection(db, 'invitations'),
        where('invitedUserId', '==', userId),
        where('status', '==', 'pending')
      );
      
      try {
        const pendingSnapshot = await getDocs(pendingQuery);
        console.log(`  Pending invitations: ${pendingSnapshot.size}`);
      } catch (error) {
        console.log(`  Error querying pending invitations: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error testing invitations:', error);
  }
  
  process.exit(0);
}

testInvitations();

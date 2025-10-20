require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = {
  projectId: process.env.ADMIN_PROJECT_ID,
  clientEmail: process.env.ADMIN_CLIENT_EMAIL,
  privateKey: process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkInvites() {
  try {
    // Get your user ID
    const email = 'belal.riyad@gmail.com';
    const userRecord = await admin.auth().getUserByEmail(email);
    const yourUid = userRecord.uid;
    
    console.log('👤 Your UID:', yourUid);
    console.log('📧 Your Email:', email);
    console.log('\n─────────────────────────────────────\n');
    
    // Get all team members where you are the manager
    const membersSnapshot = await db.collection('users')
      .where('managerId', '==', yourUid)
      .get();
    
    if (membersSnapshot.empty) {
      console.log('ℹ️  No team members found where you are the manager');
      console.log('   Expected managerId:', yourUid);
      console.log('\n📝 Checking all users...\n');
      
      // Check all users
      const allUsers = await db.collection('users').get();
      console.log(`Total users in database: ${allUsers.size}\n`);
      
      let usersWithInvites = [];
      
      allUsers.forEach(doc => {
        const data = doc.data();
        if (data.inviteSentAt) {
          usersWithInvites.push({
            id: doc.id,
            email: data.email,
            name: data.name,
            managerId: data.managerId,
            inviteSentAt: data.inviteSentAt
          });
        }
        console.log(`User: ${data.email}`);
        console.log(`  UID: ${doc.id}`);
        console.log(`  Manager ID: ${data.managerId || '⚠️  NONE'}`);
        console.log(`  Invite Sent: ${data.inviteSentAt || 'no'}`);
        console.log(`  Created: ${data.createdAt}`);
        console.log('');
      });
      
      console.log('\n🔍 DIAGNOSIS:\n');
      if (usersWithInvites.length > 0) {
        console.log(`Found ${usersWithInvites.length} user(s) with inviteSentAt:`);
        usersWithInvites.forEach(u => {
          console.log(`  - ${u.name} (${u.email})`);
          console.log(`    Their managerId: ${u.managerId || '⚠️  NOT SET'}`);
          console.log(`    Your UID: ${yourUid}`);
          console.log(`    Match: ${u.managerId === yourUid ? '✅ YES' : '❌ NO'}`);
          console.log('');
        });
        
        const matchingCount = usersWithInvites.filter(u => u.managerId === yourUid).length;
        console.log(`\n📊 Summary:`);
        console.log(`   Users with invites: ${usersWithInvites.length}`);
        console.log(`   Matching your managerId: ${matchingCount}`);
        
        if (matchingCount === 0) {
          console.log('\n❌ PROBLEM IDENTIFIED:');
          console.log('   None of the invited users have YOUR UID as their managerId!');
          console.log('   This is why the UI query returns 0 results.');
          console.log('\n💡 FIX: Update the managerId on these users to:', yourUid);
        }
      }
      
      return;
    }
    
    console.log(`✅ Found ${membersSnapshot.size} team member(s):\n`);
    
    let inviteCount = 0;
    
    membersSnapshot.forEach(doc => {
      const member = doc.data();
      const hasInvite = !!member.inviteSentAt;
      
      if (hasInvite) inviteCount++;
      
      console.log(`👤 ${member.name || 'No name'}`);
      console.log(`   Email: ${member.email}`);
      console.log(`   Status: ${member.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Invite: ${hasInvite ? '✉️ Sent on ' + new Date(member.inviteSentAt).toLocaleString() : '⚠️ Not sent'}`);
      console.log(`   Created: ${new Date(member.createdAt).toLocaleString()}`);
      console.log(`   Last Password Reset: ${member.lastPasswordResetAt ? new Date(member.lastPasswordResetAt).toLocaleString() : 'Never'}`);
      console.log('');
    });
    
    console.log('─────────────────────────────────────');
    console.log(`\n📊 Summary:`);
    console.log(`   Total Members: ${membersSnapshot.size}`);
    console.log(`   Invites Sent: ${inviteCount}`);
    console.log(`   Active: ${[...membersSnapshot.docs].filter(d => d.data().isActive).length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkInvites();

const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');

async function deployRules() {
  let auth;
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountVar) {
    try {
      let raw = serviceAccountVar.trim();
      if (!raw.startsWith('{') && !raw.startsWith('[')) {
        raw = Buffer.from(raw, 'base64').toString('utf8');
      }
      const credentials = JSON.parse(raw);
      auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']
      });
      console.log('Using credentials from FIREBASE_SERVICE_ACCOUNT environment variable.');
    } catch (e) {
      console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
  }

  if (!auth) {
    if (!fs.existsSync('./firebase-service-account.json')) {
      console.error('❌ Service account not found: neither FIREBASE_SERVICE_ACCOUNT env var nor ./firebase-service-account.json file exists.');
      console.error('💡 To deploy rules via Firebase CLI, run:');
      console.error('   npx firebase-tools deploy --only firestore:rules');
      process.exit(1);
    }
    auth = new GoogleAuth({
      keyFile: './firebase-service-account.json',
      scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']
    });
  }

  const client = await auth.getClient();
  const projectId = 'teras-warga';
  const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

  console.log('1. Creating ruleset on Firebase Rules API...');
  const createRes = await client.request({
    url: 'https://firebaserules.googleapis.com/v1/projects/' + projectId + '/rulesets',
    method: 'POST',
    data: {
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rulesContent
          }
        ]
      }
    }
  });

  const rulesetName = createRes.data.name;
  console.log('✅ Created ruleset:', rulesetName);

  console.log('2. Updating release cloud.firestore...');
  const releaseRes = await client.request({
    url: 'https://firebaserules.googleapis.com/v1/projects/' + projectId + '/releases/cloud.firestore',
    method: 'PATCH',
    data: {
      release: {
        name: 'projects/' + projectId + '/releases/cloud.firestore',
        rulesetName: rulesetName
      }
    }
  });

  console.log('✅ Rules released successfully to cloud.firestore!', releaseRes.data.name);
}

deployRules().catch(err => {
  console.error('❌ Error deploying rules:', err.response?.data || err.message);
  process.exit(1);
});

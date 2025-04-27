const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // ✅ Load .env

async function main() {
  try {
    // ✅ Resolve path using .env + go one level up from 'fabric/'
    const ccpPath = path.resolve(__dirname, '..', process.env.BLOCKCHAIN_CONNECTION_PROFILE);
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const ca = new FabricCAServices(caInfo.url);

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if appUser already exists
    const userExists = await wallet.get('appUser');
    if (userExists) {
      console.log('appUser already exists in the wallet');
      return;
    }

    // Check if admin exists
    const adminExists = await wallet.get('admin');
    if (!adminExists) {
      console.log('Admin identity not found. Enroll admin first.');
      return;
    }

    const provider = wallet.getProviderRegistry().getProvider('X.509');
    const adminUser = await provider.getUserContext(adminExists, 'admin');

    // Register and enroll appUser
    const secret = await ca.register({
      affiliation: 'org1.department1',
      enrollmentID: 'appUser',
      role: 'client'
    }, adminUser);
    const enrollment = await ca.enroll({
      enrollmentID: 'appUser',
      enrollmentSecret: secret
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };
    await wallet.put('appUser', x509Identity);
    console.log('✅ Successfully registered and enrolled appUser');
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
}

main();

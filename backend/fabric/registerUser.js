const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  try {
    // ✅ Load the connection profile
    const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json');
    if (!fs.existsSync(ccpPath)) {
      throw new Error(`Connection profile not found at: ${ccpPath}`);
    }
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // ✅ Extract CA info and init CA client
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const ca = new FabricCAServices(caInfo.url, {
      trustedRoots: caInfo.tlsCACerts.pem,
      verify: false
    }, caInfo.caName);

    // ✅ Set up the wallet to store identities
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // ✅ Check if appUser already exists
    const userExists = await wallet.get('appUser');
    if (userExists) {
      console.log('🔁 Identity "appUser" already exists in the wallet');
      return;
    }

    // ✅ Check if admin exists
    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      console.log('❌ Admin identity not found in wallet. Run enrollAdmin.js first.');
      return;
    }

    // ✅ Get provider to act as admin
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    // ✅ Register the appUser
    const secret = await ca.register({
      affiliation: 'org1.department1',
      enrollmentID: 'appUser2',
      role: 'client',
    }, adminUser);

    // ✅ Enroll the appUser using the secret
    const enrollment = await ca.enroll({
      enrollmentID: 'appUser2',
      enrollmentSecret: secret,
    });

    // ✅ Prepare identity and store it in wallet
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };

    await wallet.put('appUser', x509Identity);
    console.log('✅ Successfully registered and enrolled "appUser" and stored it in the wallet');

  } catch (error) {
    console.error(`❌ Error during registration: ${error.message}`);
    process.exit(1);
  }
}

main();

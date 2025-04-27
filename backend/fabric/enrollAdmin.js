'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // ✅ Load .env variables

async function main() {
  try {
    // ✅ Use .env or fallback to default
    const ccpPath = path.resolve(__dirname, '..', process.env.BLOCKCHAIN_CONNECTION_PROFILE || 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    const walletPath = path.resolve(__dirname, '..', process.env.BLOCKCHAIN_WALLET_PATH || 'fabric/wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('admin');
    if (identity) {
      console.log('✅ Admin identity already exists in the wallet');
      return;
    }

    const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };

    await wallet.put('admin', x509Identity);
    console.log('✅ Successfully enrolled admin user "admin" and imported it into the wallet');

  } catch (error) {
    console.error(`❌ Failed to enroll admin: ${error}`);
    process.exit(1);
  }
}

main();

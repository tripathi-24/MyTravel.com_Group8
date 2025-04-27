const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // ✅ Load .env variables

// ✅ Load connection profile (JSON version)
const loadConnectionProfile = () => {
  const ccpPath = path.resolve(__dirname, '..', process.env.BLOCKCHAIN_CONNECTION_PROFILE || 'connection-org1.json');
  const fileContent = fs.readFileSync(ccpPath, 'utf8');
  return JSON.parse(fileContent);
};

// ✅ Setup wallet using .env or default
const setupWallet = async () => {
  const walletPath = path.resolve(__dirname, '..', process.env.BLOCKCHAIN_WALLET_PATH || 'fabric/wallet');
  return await Wallets.newFileSystemWallet(walletPath);
};

// ✅ Enroll admin user if not exists
const enrollAdmin = async () => {
  try {
    const ccp = loadConnectionProfile();
    const wallet = await setupWallet();

    const identity = await wallet.get('admin');
    if (identity) {
      console.log('✅ Admin already enrolled.');
      return;
    }

    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    const enrollment = await ca.enroll({
      enrollmentID: 'admin',
      enrollmentSecret: 'adminpw'
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };

    await wallet.put('admin', x509Identity);
    console.log('✅ Admin enrolled and imported into the wallet.');
  } catch (error) {
    console.error(`❌ Failed to enroll admin: ${error}`);
    throw error;
  }
};

// ✅ Register and enroll user
const registerUser = async (userId) => {
  try {
    const ccp = loadConnectionProfile();
    const wallet = await setupWallet();

    const userIdentity = await wallet.get(userId);
    if (userIdentity) {
      console.log(`✅ Identity for user "${userId}" already exists.`);
      return;
    }

    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      console.log('⚠️ Admin identity not found. Enrolling admin...');
      await enrollAdmin();
    }

    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    const provider = wallet.getProviderRegistry().getProvider('X.509');
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    const secret = await ca.register({
      affiliation: 'org1.department1',
      enrollmentID: userId,
      role: 'client'
    }, adminUser);

    const enrollment = await ca.enroll({
      enrollmentID: userId,
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

    await wallet.put(userId, x509Identity);
    console.log(`✅ User "${userId}" registered and enrolled.`);
  } catch (error) {
    console.error(`❌ Failed to register user "${userId}": ${error}`);
    throw error;
  }
};

// ✅ Get a gateway and contract
const getContractInstance = async (userId) => {
  try {
    const ccp = loadConnectionProfile();
    const wallet = await setupWallet();

    const identity = await wallet.get(userId);
    if (!identity) {
      throw new Error(`User "${userId}" not found in wallet.`);
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: true }
    });

    const channelName = process.env.BLOCKCHAIN_CHANNEL || 'mychannel';
    const chaincodeName = process.env.BLOCKCHAIN_CHAINCODE || 'travel';

    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);

    return { gateway, contract };
  } catch (error) {
    console.error(`❌ Failed to get contract instance: ${error}`);
    throw error;
  }
};

module.exports = {
  enrollAdmin,
  registerUser,
  getContractInstance
};

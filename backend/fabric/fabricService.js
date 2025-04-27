const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ✅ Resolve connection profile path
const ccpPath = process.env.BLOCKCHAIN_CONNECTION_PROFILE
  ? path.resolve(__dirname, '..', process.env.BLOCKCHAIN_CONNECTION_PROFILE)
  : path.resolve(__dirname, '../connection-org1.json');

console.log("✅ Using connection profile at:", ccpPath);

// ✅ Resolve wallet path
const walletPath = process.env.BLOCKCHAIN_WALLET_PATH
  ? path.resolve(__dirname, '..', process.env.BLOCKCHAIN_WALLET_PATH)
  : path.join(__dirname, 'wallet');

// ✅ Use channel and chaincode name from .env or defaults
const channelName = process.env.BLOCKCHAIN_CHANNEL || 'mychannel';
const chaincodeName = process.env.BLOCKCHAIN_CHAINCODE || 'travel';

// ✅ Get contract instance using identity
async function getContractInstance(identity = 'appUser') {
  if (!fs.existsSync(ccpPath)) {
    throw new Error(`❌ Connection profile not found at: ${ccpPath}`);
  }

  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const userIdentity = await wallet.get(identity);
  if (!userIdentity) {
    throw new Error(`❌ Identity "${identity}" does not exist in wallet at ${walletPath}`);
  }

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity,
    discovery: { enabled: true, asLocalhost: true }
  });

  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);

  return { gateway, contract };
}

// ✅ Query function
async function query(fn, args = []) {
  const { gateway, contract } = await getContractInstance();
  try {
    const result = await contract.evaluateTransaction(fn, ...args);
    return result.toString();
  } finally {
    gateway.disconnect();
  }
}

// ✅ Invoke function
async function invoke(fn, args = []) {
  const { gateway, contract } = await getContractInstance();
  try {
    const result = await contract.submitTransaction(fn, ...args);
    return result.toString();
  } finally {
    gateway.disconnect();
  }
}

// ✅ Update Customer Ledger
async function updateCustomerLedger(userId, updatedFields) {
  const { gateway, contract } = await getContractInstance(userId);
  try {
    const customerBytes = await contract.evaluateTransaction('GetCustomer', userId);
    const customer = JSON.parse(customerBytes.toString());

    if (updatedFields.name) customer.Name = updatedFields.name;
    if (updatedFields.phone) customer.Phone = updatedFields.phone;

    await contract.submitTransaction('PutState', userId, JSON.stringify(customer));
  } finally {
    gateway.disconnect();
  }
}

// ✅ Update Provider Ledger
async function updateProviderLedger(userId, updatedFields) {
  const { gateway, contract } = await getContractInstance(userId);
  try {
    const providerBytes = await contract.evaluateTransaction('GetProvider', userId);
    const provider = JSON.parse(providerBytes.toString());

    if (updatedFields.name) provider.Name = updatedFields.name;
    if (updatedFields.phone) provider.Phone = updatedFields.phone;
    if (updatedFields.transportMode) provider.TransportMode = updatedFields.transportMode;

    await contract.submitTransaction('PutState', userId, JSON.stringify(provider));
  } finally {
    gateway.disconnect();
  }
}

// ✅ Export all functions
module.exports = {
  getContractInstance,
  query,
  invoke,
  updateCustomerLedger,
  updateProviderLedger
};

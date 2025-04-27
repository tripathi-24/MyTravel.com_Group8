const path = require('path');
const fs = require('fs');
const { Wallets } = require('fabric-network'); // ✅ Needed for getWallet
const { v4: uuidv4 } = require('uuid');

// Local JSON-based wallet for virtual payments
const walletDir = path.join(__dirname, '../database');
const walletFile = path.join(walletDir, 'paymentWallet.json');

// ✅ Ensure wallet directory exists
if (!fs.existsSync(walletDir)) {
  fs.mkdirSync(walletDir, { recursive: true });
}

// ✅ Read existing wallet data if available
const wallets = fs.existsSync(walletFile)
  ? JSON.parse(fs.readFileSync(walletFile, 'utf8'))
  : {};

// ✅ Persist wallets to file
const persistWallets = () => {
  fs.writeFileSync(walletFile, JSON.stringify(wallets, null, 2));
};

/**
 * ✅ Initialize a virtual payment wallet for a user
 */
const initializePaymentWallet = async (userId) => {
  if (!wallets[userId]) {
    wallets[userId] = { balance: 1000, transactions: [] };
    persistWallets();
    return true;
  }
  return false;
};

/**
 * ✅ Get wallet balance and transactions for a user
 */
const getWalletBalanceById = async (userId) => {
  return wallets[userId] || { balance: 0, transactions: [] };
};

/**
 * ✅ Blockchain wallet (Hyperledger Fabric Wallet API)
 * This is different from virtual payment wallet
 */
const getWallet = async () => {
  const walletPath = path.join(__dirname, '../wallet'); // Correct location for Fabric Wallet
  return await Wallets.newFileSystemWallet(walletPath);
};

/**
 * ✅ Dummy placeholder for registerAndEnrollUser (you may have real logic elsewhere)
 */
const registerAndEnrollUser = async (userId, userType) => {
  console.log(`🛠 Dummy registerAndEnrollUser called for user: ${userId} with type: ${userType}`);
  // Normally real CA client registration happens here
  return true;
};

// ✅ Export all
module.exports = {
  initializePaymentWallet,
  getWalletBalanceById,
  getWallet,
  registerAndEnrollUser
};

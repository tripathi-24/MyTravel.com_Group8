
MyTravel.com: Blockchain-Based Travel Ticket Management System

Project Structure
-----------------
/backend         => Node.js backend (Express.js, Fabric SDK, MongoDB)
/frontend        => React.js frontend (User and Provider Portals)
/test-network    => Hyperledger Fabric network setup (2 Orgs, CouchDB)
/travel          => Chaincode (Smart Contract in GoLang)

--------------------------------------

Step-by-Step Instructions
==========================

1. System Prerequisites
------------------------
- Node.js (v22.14)
- Docker and Docker Compose
- Hyperledger Fabric binaries (v2.5)
- GoLang (v1.20)
- MongoDB (local or remote)
- npm (for frontend)

2. Setting up Fabric Network
-----------------------------
cd test-network

# Clean previous setup (if any)
./network.sh down

# Start network with CouchDB (chaincode deployment ready)
./network.sh up createChannel -ca -s couchdb

# Package chaincode
peer lifecycle chaincode package travel.tar.gz --path ../travel --lang golang --label travel_1

# Install chaincode on both Org1 and Org2
peer lifecycle chaincode install travel.tar.gz

# Query installed
peer lifecycle chaincode queryinstalled

# Approve chaincode for Org1
peer lifecycle chaincode approveformyorg --channelID mychannel --name travel --version 1.0 --package-id <PACKAGE_ID_FROM_QUERY> --sequence 1 --init-required --orderer localhost:7050 --tls --cafile "$ORDERER_CA"

# Approve chaincode for Org2
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
export CORE_PEER_MSPCONFIGPATH=$ORG2_ADMIN
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode approveformyorg --channelID mychannel --name travel --version 1.0 --package-id <PACKAGE_ID_FROM_QUERY> --sequence 1 --init-required --orderer localhost:7050 --tls --cafile "$ORDERER_CA"

# Commit chaincode
peer lifecycle chaincode commit --channelID mychannel --name travel --version 1.0 --sequence 1 --init-required --orderer localhost:7050 --tls --cafile "$ORDERER_CA" --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA

# Initialize chaincode
peer chaincode invoke -o localhost:7050 --isInit --tls --cafile "$ORDERER_CA" -C mychannel -n travel --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA -c '{"function":"InitLedger","Args":[]}'

Fabric network and chaincode are now ready.

3. Setting up Backend Server
------------------------------
cd backend

# Install dependencies
npm install

The env variables for backend (.env) to be set as shown below:-

# ========================
# Server Configuration
# ========================
PORT=4000

# ========================
# MongoDB Configuration
# ========================
MONGO_URI=mongodb://localhost:27017/mytravel

# ========================
# JWT Authentication
# ========================
JWT_SECRET=3kfjv9832hf!@9sdklf2lfjWQElKZ
JWT_EXPIRE=30d

# ========================
# Blockchain Integration
# ========================
USE_MOCK_BLOCKCHAIN=false
BLOCKCHAIN_CONNECTION_PROFILE=connection-org1.json
BLOCKCHAIN_CHANNEL=mychannel
BLOCKCHAIN_CHAINCODE=travel
BLOCKCHAIN_WALLET_PATH=./fabric/wallet


# Initialize wallet identities
node fabric/enrollAdmin.js
node fabric/registerAppUser.js

# Start backend server
npm run dev

Backend server available at http://localhost:4000


4. Setting up Frontend App
----------------------------
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file to set:
# - REACT_APP_API_BASE_URL=http://localhost:4000/api

# Start frontend server
npm start

Frontend available at http://localhost:3000

=========================================
Full Workflow Summary
----------------------
1. Start Fabric Network
2. Deploy and Commit Chaincode (travel)
3. Run Backend Server (Node.js, Express)
4. Run Frontend App (React.js)
5. Test APIs using Postman, or UI

Important Notes
---------------
- Always keep test-network running during backend/frontend operations
- MongoDB should be running locally unless changed
- Wallet identities are saved in /backend/fabric/wallet/
- Blockchain-first logic: MongoDB updated only after blockchain transaction success

Useful Commands
---------------
# Shut Down Network
cd test-network
./network.sh down

# Restart Backend
cd backend
npm run dev

# Restart Frontend
cd frontend
npm start

Authors
-------
- Backend & Blockchain Developer: Lt Col Divya Sharma
- Frontend Developer: Maj KK Tripathi
- Blockchain Network Setup: Lt Col Divya Sharma and Maj KK Tripathi



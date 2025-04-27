import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Grid, Box, Card, CardContent, 
  Button, TextField, CircularProgress, Alert, Divider, Tab, Tabs,
  List, ListItem, ListItemText, ListItemSecondaryAction, Chip,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { customerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Helper to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format currency amounts
const formatAmount = (amount) => {
  return parseFloat(amount).toFixed(2);
};

const Wallet = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [transactionError, setTransactionError] = useState(null);
  
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        const response = await customerService.getWalletInfo();
        setWalletData(response.data);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to load wallet data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletData();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount) || parseFloat(depositAmount) <= 0) {
      setTransactionError('Please enter a valid amount');
      return;
    }
    
    try {
      setTransactionInProgress(true);
      setTransactionError(null);
      
      const response = await customerService.depositToWallet(parseFloat(depositAmount));
      
      // Update wallet balance
      setWalletData(prev => ({
        ...prev,
        balance: (parseFloat(prev.balance) + parseFloat(depositAmount)).toString(),
        transactions: [
          {
            id: response.data.transactionId,
            type: 'deposit',
            amount: depositAmount,
            status: 'completed',
            timestamp: new Date().toISOString(),
            blockchainTxId: response.data.blockchainTxId
          },
          ...prev.transactions
        ]
      }));
      
      setTransactionSuccess(true);
      setDepositAmount('');
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setDepositDialogOpen(false);
        setTransactionSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error depositing to wallet:', err);
      setTransactionError('Failed to process deposit. Please try again.');
    } finally {
      setTransactionInProgress(false);
    }
  };
  
  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      setTransactionError('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(withdrawAmount) > parseFloat(walletData.balance)) {
      setTransactionError('Insufficient funds');
      return;
    }
    
    try {
      setTransactionInProgress(true);
      setTransactionError(null);
      
      const response = await customerService.withdrawFromWallet(parseFloat(withdrawAmount));
      
      // Update wallet balance
      setWalletData(prev => ({
        ...prev,
        balance: (parseFloat(prev.balance) - parseFloat(withdrawAmount)).toString(),
        transactions: [
          {
            id: response.data.transactionId,
            type: 'withdraw',
            amount: withdrawAmount,
            status: 'completed',
            timestamp: new Date().toISOString(),
            blockchainTxId: response.data.blockchainTxId
          },
          ...prev.transactions
        ]
      }));
      
      setTransactionSuccess(true);
      setWithdrawAmount('');
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setWithdrawDialogOpen(false);
        setTransactionSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error withdrawing from wallet:', err);
      setTransactionError('Failed to process withdrawal. Please try again.');
    } finally {
      setTransactionInProgress(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Use mock data if real data is not available (for development)
  const mockWalletData = {
    balance: "500.00",
    address: "0x1234...5678",
    transactions: [
      {
        id: "tx1",
        type: "deposit",
        amount: "100.00",
        status: "completed",
        timestamp: "2023-07-15T10:00:00Z",
        blockchainTxId: "0xabcd...1234"
      },
      {
        id: "tx2",
        type: "payment",
        amount: "75.00",
        status: "completed",
        description: "Hotel Booking",
        timestamp: "2023-07-10T14:30:00Z",
        blockchainTxId: "0xefgh...5678"
      },
      {
        id: "tx3",
        type: "withdraw",
        amount: "25.00",
        status: "completed",
        timestamp: "2023-07-05T09:15:00Z",
        blockchainTxId: "0xijkl...9012"
      }
    ]
  };
  
  const data = walletData || mockWalletData;
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Wallet
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Wallet Balance Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Balance
              </Typography>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', my: 2 }}>
                ${formatAmount(data.balance)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Wallet Address
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {data.address}
              </Typography>
              
              <Box sx={{ mt: 2, '& button': { mx: 1 } }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setDepositDialogOpen(true)}
                >
                  Deposit
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setWithdrawDialogOpen(true)}
                  disabled={parseFloat(data.balance) <= 0}
                >
                  Withdraw
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Travel Reward Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Travel Rewards
              </Typography>
              <Typography variant="h3" color="secondary" sx={{ fontWeight: 'bold', my: 2 }}>
                250 pts
              </Typography>
              <Typography variant="body2" paragraph>
                Earn points when you book services through our platform. 
                100 points = $1 in booking credit.
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Coming Soon: Redeem your points for discounts on travel services!
              </Alert>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Transactions Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Transaction History
            </Typography>
            
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 3 }}
            >
              <Tab label="All" />
              <Tab label="Deposits" />
              <Tab label="Withdrawals" />
              <Tab label="Payments" />
            </Tabs>
            
            <List>
              {data.transactions
                .filter(tx => {
                  switch(tabValue) {
                    case 0: // All
                      return true;
                    case 1: // Deposits
                      return tx.type === 'deposit';
                    case 2: // Withdrawals
                      return tx.type === 'withdraw';
                    case 3: // Payments
                      return tx.type === 'payment';
                    default:
                      return true;
                  }
                })
                .map((tx, index) => (
                  <React.Fragment key={tx.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            {tx.type === 'deposit' ? 'Deposit' :
                             tx.type === 'withdraw' ? 'Withdrawal' :
                             tx.type === 'payment' ? `Payment for ${tx.description || 'Service'}` :
                             'Transaction'}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(tx.timestamp)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              TX: {tx.blockchainTxId}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="body1"
                            color={tx.type === 'deposit' ? 'success.main' : 
                                   tx.type === 'withdraw' ? 'error.main' : 
                                   'text.primary'}
                            sx={{ fontWeight: 'bold' }}
                          >
                            {tx.type === 'deposit' ? '+' : '-'}${formatAmount(tx.amount)}
                          </Typography>
                          <Chip
                            label={tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            color={tx.status === 'completed' ? 'success' : 
                                  tx.status === 'pending' ? 'warning' : 
                                  'default'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              
              {data.transactions.filter(tx => {
                switch(tabValue) {
                  case 0: return true;
                  case 1: return tx.type === 'deposit';
                  case 2: return tx.type === 'withdraw';
                  case 3: return tx.type === 'payment';
                  default: return true;
                }
              }).length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                        No transactions found
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Deposit Dialog */}
      <Dialog
        open={depositDialogOpen}
        onClose={() => !transactionInProgress && setDepositDialogOpen(false)}
      >
        <DialogTitle>Deposit Funds</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the amount you want to deposit to your wallet. 
            This will be processed securely through our blockchain network.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Amount (Rs)"
            type="number"
            fullWidth
            variant="outlined"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            disabled={transactionInProgress || transactionSuccess}
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            sx={{ mt: 2 }}
          />
          
          {transactionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {transactionError}
            </Alert>
          )}
          
          {transactionSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Deposit successful!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDepositDialogOpen(false)} 
            disabled={transactionInProgress || transactionSuccess}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeposit} 
            variant="contained" 
            disabled={transactionInProgress || transactionSuccess || !depositAmount}
          >
            {transactionInProgress ? <CircularProgress size={24} /> : 'Deposit'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Withdraw Dialog */}
      <Dialog
        open={withdrawDialogOpen}
        onClose={() => !transactionInProgress && setWithdrawDialogOpen(false)}
      >
        <DialogTitle>Withdraw Funds</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the amount you want to withdraw from your wallet.
            Maximum withdrawal amount: ${formatAmount(data.balance)}
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Amount ($)"
            type="number"
            fullWidth
            variant="outlined"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            disabled={transactionInProgress || transactionSuccess}
            InputProps={{ 
              inputProps: { 
                min: 0, 
                max: parseFloat(data.balance), 
                step: "0.01" 
              } 
            }}
            sx={{ mt: 2 }}
          />
          
          {transactionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {transactionError}
            </Alert>
          )}
          
          {transactionSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Withdrawal successful!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setWithdrawDialogOpen(false)} 
            disabled={transactionInProgress || transactionSuccess}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleWithdraw} 
            variant="contained" 
            disabled={
              transactionInProgress || 
              transactionSuccess || 
              !withdrawAmount || 
              parseFloat(withdrawAmount) <= 0 ||
              parseFloat(withdrawAmount) > parseFloat(data.balance)
            }
          >
            {transactionInProgress ? <CircularProgress size={24} /> : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Wallet; 
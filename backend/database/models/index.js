const User = require('./User');
const Customer = require('./Customer');
const Provider = require('./Provider');

module.exports = {
  User,
  Customer,
  Provider,
  Ticket: require('./ticket')
}; 
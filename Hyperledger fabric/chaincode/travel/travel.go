package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing travel records
type SmartContract struct {
	contractapi.Contract
}

// TransportMode represents the mode of transportation
type TransportMode string

const (
	Air   TransportMode = "air"
	Land  TransportMode = "land"
	Water TransportMode = "water"
)

// SeatStatus represents the status of a seat
type SeatStatus string

const (
	Vacant  SeatStatus = "vacant"
	Booked  SeatStatus = "booked"
	Blocked SeatStatus = "blocked"
)

// ProfileVisibility represents the visibility of a user profile
type ProfileVisibility string

const (
	Public    ProfileVisibility = "public"
	Anonymous ProfileVisibility = "anonymous"
)

// Seat represents a seat in a transport
type Seat struct {
	ID       string     `json:"id"`
	Number   string     `json:"number"`
	Status   SeatStatus `json:"status"`
	BookedBy string     `json:"bookedBy"`
}

// Customer represents a customer in the system
type Customer struct {
	ID              string            `json:"id"`
	Name            string            `json:"name"`
	Email           string            `json:"email"`
	Phone           string            `json:"phone"`
	Visibility      ProfileVisibility `json:"visibility"`
	RegisteredDate  string            `json:"registeredDate"`
	IsActive        bool              `json:"isActive"`
	BookingHistory  []string          `json:"bookingHistory"`
}

// Provider represents a service provider in the system
type Provider struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Email           string    `json:"email"`
	Phone           string    `json:"phone"`
	TransportMode   string    `json:"transportMode"`
	Rating          float64   `json:"rating"`
	TotalRatings    int       `json:"totalRatings"`
	RegisteredDate  string    `json:"registeredDate"`
	IsActive        bool      `json:"isActive"`
	TransportList   []string  `json:"transportList"`
}

// TravelRecord represents a travel record
type TravelRecord struct {
	ID          string `json:"id"`
	Destination string `json:"destination"`
	Date        string `json:"date"`
	Status      string `json:"status"`
	Owner       string `json:"owner"`
}

// Ticket represents a travel ticket
type Ticket struct {
	ID              string         `json:"id"`
	Origin          string         `json:"origin"`
	Destination     string         `json:"destination"`
	DepartureTime   string         `json:"departureTime"`
	ArrivalTime     string         `json:"arrivalTime"`
	Price           float64        `json:"price"`
	DynamicPrice    float64        `json:"dynamicPrice"`
	AvailableSeats  int            `json:"availableSeats"`
	TotalSeats      int            `json:"totalSeats"`
	Seats           []Seat         `json:"seats"`
	ServiceProvider string         `json:"serviceProvider"`
	TransportMode   TransportMode  `json:"transportMode"`
	Status          string         `json:"status"` // Available, Booked, Cancelled
	CreatedAt       string         `json:"createdAt"`
	UpdatedAt       string         `json:"updatedAt"`
}

// Booking represents a ticket booking
type Booking struct {
	ID                string    `json:"id"`
	TicketID          string    `json:"ticketId"`
	UserID            string    `json:"userId"`
	SeatIDs           []string  `json:"seatIds"`
	NumberOfSeats     int       `json:"numberOfSeats"`
	TotalPrice        float64   `json:"totalPrice"`
	Status            string    `json:"status"` // Pending, Confirmed, Cancelled
	IsPaymentConfirmed bool     `json:"isPaymentConfirmed"`
	PaymentBlockHeight string   `json:"paymentBlockHeight"`
	CreatedAt         string    `json:"createdAt"`
	UpdatedAt         string    `json:"updatedAt"`
}

// Payment represents a payment for a booking
type Payment struct {
	ID              string    `json:"id"`
	BookingID       string    `json:"bookingId"`
	Amount          float64   `json:"amount"`
	Status          string    `json:"status"` // Pending, Confirmed, Refunded
	TransactionID   string    `json:"transactionId"`
	CreatedAt       string    `json:"createdAt"`
	UpdatedAt       string    `json:"updatedAt"`
}

// getCurrentTime returns the current time in RFC3339 format in UTC
func getCurrentTime() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// InitLedger adds a base set of travel records to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	travelRecords := []TravelRecord{
		{ID: "TR1", Destination: "Paris", Date: "2024-05-01", Status: "Planned", Owner: "Org1MSP"},
		{ID: "TR2", Destination: "London", Date: "2024-06-15", Status: "Confirmed", Owner: "Org2MSP"},
	}

	for _, record := range travelRecords {
		recordJSON, err := json.Marshal(record)
		if err != nil {
			return fmt.Errorf("failed to marshal travel record: %v", err)
		}

		err = ctx.GetStub().PutState(record.ID, recordJSON)
		if err != nil {
			return fmt.Errorf("failed to put travel record: %v", err)
		}
	}

	return nil
}

// CreateTravelRecord creates a new travel record
func (s *SmartContract) CreateTravelRecord(ctx contractapi.TransactionContextInterface, id string, destination string, date string) error {
	exists, err := s.TravelRecordExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the travel record %s already exists", id)
	}

	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	record := TravelRecord{
		ID:          id,
		Destination: destination,
		Date:        date,
		Status:      "Planned",
		Owner:       mspID,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to marshal travel record: %v", err)
	}

	return ctx.GetStub().PutState(id, recordJSON)
}

// TravelRecordExists returns true when travel record with given ID exists in world state
func (s *SmartContract) TravelRecordExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	recordJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return recordJSON != nil, nil
}

// ReadTravelRecord returns the travel record stored in the world state with given id
func (s *SmartContract) ReadTravelRecord(ctx contractapi.TransactionContextInterface, id string) (*TravelRecord, error) {
	recordJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("the travel record %s does not exist", id)
	}

	var record TravelRecord
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

// UpdateTravelRecord updates an existing travel record in the world state with provided parameters
func (s *SmartContract) UpdateTravelRecord(ctx contractapi.TransactionContextInterface, id string, destination string, date string, status string) error {
	exists, err := s.TravelRecordExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("the travel record %s does not exist", id)
	}

	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	record := TravelRecord{
		ID:          id,
		Destination: destination,
		Date:        date,
		Status:      status,
		Owner:       mspID,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to marshal travel record: %v", err)
	}

	return ctx.GetStub().PutState(id, recordJSON)
}

// DeleteTravelRecord deletes a given travel record from the world state
func (s *SmartContract) DeleteTravelRecord(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := s.TravelRecordExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("the travel record %s does not exist", id)
	}

	return ctx.GetStub().DelState(id)
}

// GetAllTravelRecords returns all travel records found in world state
func (s *SmartContract) GetAllTravelRecords(ctx contractapi.TransactionContextInterface) ([]*TravelRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*TravelRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record TravelRecord
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			continue // Skip records that can't be unmarshaled
		}
		records = append(records, &record)
	}

	return records, nil
}

// TicketExists returns true when ticket with given ID exists in world state
func (s *SmartContract) TicketExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	ticketJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return ticketJSON != nil, nil
}

// updateState is a helper function to update state with proper error handling
func (s *SmartContract) updateState(ctx contractapi.TransactionContextInterface, key string, value interface{}) error {
	valueJSON, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %v", err)
	}

	err = ctx.GetStub().PutState(key, valueJSON)
	if err != nil {
		return fmt.Errorf("failed to update state: %v", err)
	}

	return nil
}

// CreateTicket creates a new ticket with seat-level details
func (s *SmartContract) CreateTicket(ctx contractapi.TransactionContextInterface,
	id string, origin string, destination string, departureTime string,
	arrivalTime string, price string, totalSeats string, serviceProvider string,
	transportMode string) error {

	// Validate required fields
	if id == "" || origin == "" || destination == "" || departureTime == "" || 
		arrivalTime == "" || price == "" || totalSeats == "" || serviceProvider == "" || 
		transportMode == "" {
		return fmt.Errorf("all fields are required for ticket creation")
	}

	// Check if ticket already exists
	exists, err := s.TicketExists(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check ticket existence: %v", err)
	}
	if exists {
		return fmt.Errorf("ticket with ID %s already exists", id)
	}

	// Check if provider exists and is active
	provider, err := s.GetProvider(ctx, serviceProvider)
	if err != nil {
		return fmt.Errorf("failed to get provider: %v", err)
	}
	if !provider.IsActive {
		return fmt.Errorf("provider %s is not active", serviceProvider)
	}

	// Validate transport mode
	if transportMode != string(Air) && transportMode != string(Land) && transportMode != string(Water) {
		return fmt.Errorf("invalid transport mode: %s", transportMode)
	}

	// Validate and parse price
	priceFloat, err := strconv.ParseFloat(price, 64)
	if err != nil {
		return fmt.Errorf("failed to parse price: %v", err)
	}
	if priceFloat <= 0 {
		return fmt.Errorf("price must be greater than 0")
	}

	// Validate and parse total seats
	totalSeatsInt, err := strconv.Atoi(totalSeats)
	if err != nil {
		return fmt.Errorf("failed to parse total seats: %v", err)
	}
	if totalSeatsInt <= 0 {
		return fmt.Errorf("total seats must be greater than 0")
	}

	// Validate date formats
	departureTimeParsed, err := time.Parse(time.RFC3339, departureTime)
	if err != nil {
		return fmt.Errorf("invalid departure time format: %v", err)
	}
	arrivalTimeParsed, err := time.Parse(time.RFC3339, arrivalTime)
	if err != nil {
		return fmt.Errorf("invalid arrival time format: %v", err)
	}

	// Validate departure is before arrival
	if departureTimeParsed.After(arrivalTimeParsed) {
		return fmt.Errorf("departure time must be before arrival time")
	}

	// Create seats
	seats := make([]Seat, totalSeatsInt)
	for i := 0; i < totalSeatsInt; i++ {
		seats[i] = Seat{
			ID:       fmt.Sprintf("%s-seat-%d", id, i+1),
			Number:   fmt.Sprintf("%d", i+1),
			Status:   Vacant,
			BookedBy: "",
		}
	}

	// Create ticket with UTC timestamps
	ticket := Ticket{
		ID:              id,
		Origin:          origin,
		Destination:     destination,
		DepartureTime:   departureTime,
		ArrivalTime:     arrivalTime,
		Price:           priceFloat,
		DynamicPrice:    priceFloat,
		AvailableSeats:  totalSeatsInt,
		TotalSeats:      totalSeatsInt,
		Seats:           seats,
		ServiceProvider: serviceProvider,
		TransportMode:   TransportMode(transportMode),
		Status:          "Available",
		CreatedAt:       getCurrentTime(),
		UpdatedAt:       getCurrentTime(),
	}

	// Update provider's transport list
	provider.TransportList = append(provider.TransportList, id)

	// Store ticket and updated provider using the helper function
	if err := s.updateState(ctx, id, ticket); err != nil {
		return fmt.Errorf("failed to store ticket: %v", err)
	}

	if err := s.updateState(ctx, serviceProvider, provider); err != nil {
		return fmt.Errorf("failed to update provider: %v", err)
	}

	return nil
}

// UpdateDynamicPrice updates the dynamic price of a ticket based on demand and time
func (s *SmartContract) UpdateDynamicPrice(ctx contractapi.TransactionContextInterface, 
	ticketID string) error {
	
	ticket, err := s.GetTicket(ctx, ticketID)
	if err != nil {
		return fmt.Errorf("failed to get ticket: %v", err)
	}

	// Calculate occupancy rate
	occupancyRate := float64(ticket.TotalSeats-ticket.AvailableSeats) / float64(ticket.TotalSeats)

	// Calculate days until departure
	departureTime, err := time.Parse(time.RFC3339, ticket.DepartureTime)
	if err != nil {
		return fmt.Errorf("failed to parse departure time: %v", err)
	}
	daysUntilDeparture := time.Until(departureTime).Hours() / 24

	// Get current month for seasonal pricing
	currentMonth := time.Now().Month()
	isPeakSeason := currentMonth >= time.June && currentMonth <= time.August || // Summer
		currentMonth >= time.December && currentMonth <= time.January // Holiday season

	// Dynamic pricing logic:
	// 1. Base price increases with occupancy rate (up to 50% increase at 100% occupancy)
	// 2. Price increases as departure date approaches (up to 30% increase for last-minute bookings)
	// 3. Seasonal pricing (20% increase during peak seasons)
	// 4. Minimum price is the base price, maximum is 2.5x base price

	// Occupancy factor (1.0 to 1.5)
	occupancyFactor := 1.0 + (occupancyRate * 0.5)

	// Time factor (1.0 to 1.3)
	timeFactor := 1.0
	if daysUntilDeparture < 1 {
		timeFactor = 1.3 // 30% increase for last-minute bookings
	} else if daysUntilDeparture < 3 {
		timeFactor = 1.2 // 20% increase for bookings within 3 days
	} else if daysUntilDeparture < 7 {
		timeFactor = 1.1 // 10% increase for bookings within a week
	}

	// Seasonal factor (1.0 or 1.2)
	seasonalFactor := 1.0
	if isPeakSeason {
		seasonalFactor = 1.2 // 20% increase during peak seasons
	}

	// Calculate new price with all factors
	newPrice := ticket.Price * occupancyFactor * timeFactor * seasonalFactor

	// Apply price caps
	if newPrice < ticket.Price {
		newPrice = ticket.Price // Minimum price is base price
	}
	if newPrice > ticket.Price*2.5 {
		newPrice = ticket.Price * 2.5 // Maximum price is 2.5x base price
	}

	// Round to 2 decimal places
	newPrice = float64(int(newPrice*100)) / 100

	ticket.DynamicPrice = newPrice
	ticket.UpdatedAt = getCurrentTime()

	return s.updateState(ctx, ticketID, ticket)
}

// BookTicket creates a new booking with seat-level details
func (s *SmartContract) BookTicket(ctx contractapi.TransactionContextInterface,
	bookingID string, ticketID string, userID string, seatNumbers []string) error {

	// Get the ticket
	ticket, err := s.GetTicket(ctx, ticketID)
	if err != nil {
		return fmt.Errorf("failed to get ticket: %v", err)
	}

	// Check if ticket is available
	if ticket.Status != "Available" {
		return fmt.Errorf("ticket %s is not available for booking", ticketID)
	}

	// Check if customer exists and is active
	customer, err := s.GetCustomer(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get customer: %v", err)
	}
	if !customer.IsActive {
		return fmt.Errorf("customer %s is not active", userID)
	}

	// Validate and reserve seats
	seatIDs := make([]string, 0)
	for _, seatNumber := range seatNumbers {
		seatIndex := -1
		for i, seat := range ticket.Seats {
			if seat.Number == seatNumber {
				seatIndex = i
				break
			}
		}

		if seatIndex == -1 {
			return fmt.Errorf("seat %s not found", seatNumber)
		}

		if ticket.Seats[seatIndex].Status != Vacant {
			return fmt.Errorf("seat %s is not available", seatNumber)
		}

		// Reserve the seat
		ticket.Seats[seatIndex].Status = Booked
		ticket.Seats[seatIndex].BookedBy = userID
		seatIDs = append(seatIDs, ticket.Seats[seatIndex].ID)
	}

	// Update ticket
	ticket.AvailableSeats -= len(seatNumbers)
	if ticket.AvailableSeats == 0 {
		ticket.Status = "Booked"
	}
	ticket.UpdatedAt = getCurrentTime()

	// Calculate total price using dynamic price
	totalPrice := ticket.DynamicPrice * float64(len(seatNumbers))

	// Create a booking
	booking := Booking{
		ID:                bookingID,
		TicketID:          ticketID,
		UserID:            userID,
		SeatIDs:           seatIDs,
		NumberOfSeats:     len(seatNumbers),
		TotalPrice:        totalPrice,
		Status:            "Pending",
		IsPaymentConfirmed: false,
		CreatedAt:         getCurrentTime(),
		UpdatedAt:         getCurrentTime(),
	}

	// Update customer's booking history
	customer.BookingHistory = append(customer.BookingHistory, bookingID)

	// Store all updates using the helper function
	if err := s.updateState(ctx, bookingID, booking); err != nil {
		return fmt.Errorf("failed to store booking: %v", err)
	}

	if err := s.updateState(ctx, ticketID, ticket); err != nil {
		return fmt.Errorf("failed to update ticket: %v", err)
	}

	if err := s.updateState(ctx, userID, customer); err != nil {
		return fmt.Errorf("failed to update customer: %v", err)
	}

	return nil
}

// ConfirmPayment confirms a payment for a booking
func (s *SmartContract) ConfirmPayment(ctx contractapi.TransactionContextInterface, 
	bookingID string, transactionID string) error {
	
	// Get booking
	booking, err := s.GetBooking(ctx, bookingID)
	if err != nil {
		return fmt.Errorf("failed to get booking: %v", err)
	}

	if booking.Status != "Pending" {
		return fmt.Errorf("booking %s is not in pending state", bookingID)
	}

	// Validate transaction ID format
	if transactionID == "" {
		return fmt.Errorf("invalid transaction ID")
	}

	// Get ticket to verify price
	ticket, err := s.GetTicket(ctx, booking.TicketID)
	if err != nil {
		return fmt.Errorf("failed to get ticket: %v", err)
	}

	// Verify payment amount matches booking amount
	expectedAmount := ticket.DynamicPrice * float64(booking.NumberOfSeats)
	if booking.TotalPrice != expectedAmount {
		return fmt.Errorf("payment amount mismatch: expected %f, got %f", expectedAmount, booking.TotalPrice)
	}

	// Create payment record
	payment := Payment{
		ID:            fmt.Sprintf("payment-%s", bookingID),
		BookingID:     bookingID,
		Amount:        booking.TotalPrice,
		Status:        "Confirmed",
		TransactionID: transactionID,
		CreatedAt:     getCurrentTime(),
		UpdatedAt:     getCurrentTime(),
	}

	// Update booking
	booking.IsPaymentConfirmed = true
	booking.Status = "Confirmed"
	booking.PaymentBlockHeight = ctx.GetStub().GetTxID()
	booking.UpdatedAt = getCurrentTime()

	// Store payment and updated booking using the helper function
	if err := s.updateState(ctx, payment.ID, payment); err != nil {
		return fmt.Errorf("failed to store payment: %v", err)
	}

	if err := s.updateState(ctx, bookingID, booking); err != nil {
		return fmt.Errorf("failed to update booking: %v", err)
	}

	return nil
}

// CancelBooking cancels a booking and handles refund
func (s *SmartContract) CancelBooking(ctx contractapi.TransactionContextInterface, bookingId string) error {
	// Get the booking
	booking, err := s.GetBooking(ctx, bookingId)
	if err != nil {
		return fmt.Errorf("failed to get booking: %v", err)
	}

	// Get the ticket
	ticket, err := s.GetTicket(ctx, booking.TicketID)
	if err != nil {
		return fmt.Errorf("failed to get ticket: %v", err)
	}

	// Get the customer
	customer, err := s.GetCustomer(ctx, booking.UserID)
	if err != nil {
		return fmt.Errorf("failed to get customer: %v", err)
	}

	// Update seat statuses
	for _, seatID := range booking.SeatIDs {
		for i := range ticket.Seats {
			if ticket.Seats[i].ID == seatID {
				ticket.Seats[i].Status = Vacant
				ticket.Seats[i].BookedBy = ""
				ticket.AvailableSeats++
			}
		}
	}

	// Update ticket status if it was fully booked
	if ticket.Status == "Booked" && ticket.AvailableSeats > 0 {
		ticket.Status = "Available"
	}
	ticket.UpdatedAt = getCurrentTime()

	// Calculate refund amount (e.g., 80% of original payment)
	refundAmount := booking.TotalPrice * 0.8

	// Update booking status
	booking.Status = "Cancelled"
	booking.IsPaymentConfirmed = true
	booking.TotalPrice = refundAmount
	booking.UpdatedAt = getCurrentTime()

	// Remove booking from customer's history
	for i, historyBookingID := range customer.BookingHistory {
		if historyBookingID == bookingId {
			customer.BookingHistory = append(customer.BookingHistory[:i], customer.BookingHistory[i+1:]...)
			break
		}
	}

	// Save all updates using the helper function
	if err := s.updateState(ctx, booking.TicketID, ticket); err != nil {
		return fmt.Errorf("failed to update ticket: %v", err)
	}

	if err := s.updateState(ctx, bookingId, booking); err != nil {
		return fmt.Errorf("failed to update booking: %v", err)
	}

	if err := s.updateState(ctx, booking.UserID, customer); err != nil {
		return fmt.Errorf("failed to update customer: %v", err)
	}

	return nil
}

// GetTicket returns the ticket with the given ID
func (s *SmartContract) GetTicket(ctx contractapi.TransactionContextInterface, id string) (*Ticket, error) {
	ticketJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if ticketJSON == nil {
		return nil, fmt.Errorf("the ticket %s does not exist", id)
	}

	var ticket Ticket
	err = json.Unmarshal(ticketJSON, &ticket)
	if err != nil {
		return nil, err
	}

	return &ticket, nil
}

// GetBooking returns the booking with the given ID
func (s *SmartContract) GetBooking(ctx contractapi.TransactionContextInterface, id string) (*Booking, error) {
	bookingJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if bookingJSON == nil {
		return nil, fmt.Errorf("the booking %s does not exist", id)
	}

	var booking Booking
	err = json.Unmarshal(bookingJSON, &booking)
	if err != nil {
		return nil, err
	}

	return &booking, nil
}

// RegisterCustomer registers a new customer
func (s *SmartContract) RegisterCustomer(ctx contractapi.TransactionContextInterface, 
	id string, name string, email string, phone string, visibility string) error {
	
	// Check if customer already exists
	exists, err := s.CustomerExists(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check customer existence: %v", err)
	}
	if exists {
		return fmt.Errorf("customer %s already exists", id)
	}

	// Validate visibility
	if visibility != string(Public) && visibility != string(Anonymous) {
		return fmt.Errorf("invalid visibility: %s", visibility)
	}

	// Create customer
	customer := Customer{
		ID:              id,
		Name:            name,
		Email:           email,
		Phone:           phone,
		Visibility:      ProfileVisibility(visibility),
		RegisteredDate:  getCurrentTime(),
		IsActive:        true,
		BookingHistory:  []string{},
	}

	return s.updateState(ctx, id, customer)
}

// DeregisterCustomer deregisters a customer
func (s *SmartContract) DeregisterCustomer(ctx contractapi.TransactionContextInterface, id string) error {
	customer, err := s.GetCustomer(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get customer: %v", err)
	}

	customer.IsActive = false
	return s.updateState(ctx, id, customer)
}

// UpdateCustomerVisibility updates a customer's profile visibility
func (s *SmartContract) UpdateCustomerVisibility(ctx contractapi.TransactionContextInterface, 
	id string, visibility string) error {
	
	customer, err := s.GetCustomer(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get customer: %v", err)
	}

	if visibility != string(Public) && visibility != string(Anonymous) {
		return fmt.Errorf("invalid visibility: %s", visibility)
	}

	customer.Visibility = ProfileVisibility(visibility)
	return s.updateState(ctx, id, customer)
}

// GetCustomer returns the customer with the given ID
func (s *SmartContract) GetCustomer(ctx contractapi.TransactionContextInterface, id string) (*Customer, error) {
	customerJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if customerJSON == nil {
		return nil, fmt.Errorf("customer %s does not exist", id)
	}

	var customer Customer
	err = json.Unmarshal(customerJSON, &customer)
	if err != nil {
		return nil, err
	}

	return &customer, nil
}

// CustomerExists returns true when customer with given ID exists in world state
func (s *SmartContract) CustomerExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	customerJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return customerJSON != nil, nil
}

// RegisterProvider registers a new service provider
func (s *SmartContract) RegisterProvider(ctx contractapi.TransactionContextInterface, 
	id string, name string, email string, phone string, transportMode string) error {
	
	// Check if provider already exists
	exists, err := s.ProviderExists(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check provider existence: %v", err)
	}
	if exists {
		return fmt.Errorf("provider %s already exists", id)
	}

	// Validate transport mode
	if transportMode != string(Air) && transportMode != string(Land) && transportMode != string(Water) {
		return fmt.Errorf("invalid transport mode: %s", transportMode)
	}

	// 
	provider := Provider{
		ID:              id,
		Name:            name,
		Email:           email,
		Phone:           phone,
		TransportMode:   transportMode,
		Rating:          0.0,
		TotalRatings:    0,
		RegisteredDate:  getCurrentTime(),
		IsActive:        true,
		TransportList:   []string{},
	}

	return s.updateState(ctx, id, provider)
}

// DeregisterProvider deregisters a service provider
func (s *SmartContract) DeregisterProvider(ctx contractapi.TransactionContextInterface, id string) error {
	provider, err := s.GetProvider(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get provider: %v", err)
	}

	provider.IsActive = false
	return s.updateState(ctx, id, provider)
}

// GetProvider returns the provider with the given ID
func (s *SmartContract) GetProvider(ctx contractapi.TransactionContextInterface, id string) (*Provider, error) {
	providerJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if providerJSON == nil {
		return nil, fmt.Errorf("provider %s does not exist", id)
	}

	var provider Provider
	err = json.Unmarshal(providerJSON, &provider)
	if err != nil {
		return nil, err
	}

	return &provider, nil
}

// ProviderExists returns true when provider with given ID exists in world state
func (s *SmartContract) ProviderExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	providerJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return providerJSON != nil, nil
}

// UpdateProviderRating updates a provider's rating
func (s *SmartContract) UpdateProviderRating(ctx contractapi.TransactionContextInterface, 
	id string, rating float64) error {
	
	provider, err := s.GetProvider(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get provider: %v", err)
	}

	// Validate rating
	if rating < 0 || rating > 5 {
		return fmt.Errorf("invalid rating: %f (must be between 0 and 5)", rating)
	}

	// Update rating
	provider.TotalRatings++
	provider.Rating = ((provider.Rating * float64(provider.TotalRatings-1)) + rating) / float64(provider.TotalRatings)

	return s.updateState(ctx, id, provider)
}

// QueryTicketsByRoute queries tickets by source, destination, and date
func (s *SmartContract) QueryTicketsByRoute(ctx contractapi.TransactionContextInterface,
	source string, destination string, date string) ([]*Ticket, error) {
	
	// Validate input parameters
	if source == "" || destination == "" || date == "" {
		return nil, fmt.Errorf("source, destination, and date are required parameters")
	}

	// Sanitize input to prevent injection
	source = strings.ReplaceAll(source, "\"", "\\\"")
	destination = strings.ReplaceAll(destination, "\"", "\\\"")
	date = strings.ReplaceAll(date, "\"", "\\\"")

	queryString := fmt.Sprintf(`{
		"selector": {
			"origin": "%s",
			"destination": "%s",
			"departureTime": {
				"$regex": "^%s"
			}
		},
		"use_index": ["route_index"]
	}`, source, destination, date)
	
	return s.queryTickets(ctx, queryString)
}

// QueryTicketsByProvider queries tickets by service provider
func (s *SmartContract) QueryTicketsByProvider(ctx contractapi.TransactionContextInterface,
	providerID string) ([]*Ticket, error) {
	
	// Validate input parameter
	if providerID == "" {
		return nil, fmt.Errorf("provider ID is required")
	}

	// Sanitize input
	providerID = strings.ReplaceAll(providerID, "\"", "\\\"")

	queryString := fmt.Sprintf(`{
		"selector": {
			"serviceProvider": "%s"
		},
		"use_index": ["provider_index"]
	}`, providerID)
	
	return s.queryTickets(ctx, queryString)
}

// QueryTicketsByTransportMode queries tickets by transport mode
func (s *SmartContract) QueryTicketsByTransportMode(ctx contractapi.TransactionContextInterface,
	mode string) ([]*Ticket, error) {
	
	// Validate transport mode
	if mode != string(Air) && mode != string(Land) && mode != string(Water) {
		return nil, fmt.Errorf("invalid transport mode: %s", mode)
	}

	queryString := fmt.Sprintf(`{
		"selector": {
			"transportMode": "%s"
		},
		"use_index": ["mode_index"]
	}`, mode)
	
	return s.queryTickets(ctx, queryString)
}

// QueryTicketsByPriceRange queries tickets within a price range
func (s *SmartContract) QueryTicketsByPriceRange(ctx contractapi.TransactionContextInterface,
	minPrice float64, maxPrice float64) ([]*Ticket, error) {
	
	// Validate price range
	if minPrice < 0 || maxPrice < 0 || minPrice > maxPrice {
		return nil, fmt.Errorf("invalid price range: min=%f, max=%f", minPrice, maxPrice)
	}

	queryString := fmt.Sprintf(`{
		"selector": {
			"dynamicPrice": {
				"$gte": %f,
				"$lte": %f
			}
		},
		"use_index": ["price_index"]
	}`, minPrice, maxPrice)
	
	return s.queryTickets(ctx, queryString)
}

// QueryTicketsByProviderRating queries tickets by provider rating
func (s *SmartContract) QueryTicketsByProviderRating(ctx contractapi.TransactionContextInterface,
	minRating float64) ([]*Ticket, error) {
	
	// First get all providers with rating >= minRating
	providerQueryString := fmt.Sprintf(`{"selector":{"rating":{"$gte":%f}}}`, minRating)
	providerResultsIterator, err := ctx.GetStub().GetQueryResult(providerQueryString)
	if err != nil {
		return nil, fmt.Errorf("failed to query providers: %v", err)
	}
	defer providerResultsIterator.Close()

	// Collect provider IDs
	providerIDs := make([]string, 0)
	for providerResultsIterator.HasNext() {
		queryResponse, err := providerResultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate provider results: %v", err)
		}

		var provider Provider
		err = json.Unmarshal(queryResponse.Value, &provider)
		if err != nil {
			continue
		}
		providerIDs = append(providerIDs, provider.ID)
	}

	// If no providers found, return empty list
	if len(providerIDs) == 0 {
		return []*Ticket{}, nil
	}

	// Build query for tickets from these providers
	providerConditions := make([]string, len(providerIDs))
	for i, id := range providerIDs {
		providerConditions[i] = fmt.Sprintf(`"serviceProvider":"%s"`, id)
	}
	queryString := fmt.Sprintf(`{"selector":{"$or":[%s]}}`, 
		strings.Join(providerConditions, ","))
	
	return s.queryTickets(ctx, queryString)
}

// QueryAvailableSeats queries available seats for a ticket
func (s *SmartContract) QueryAvailableSeats(ctx contractapi.TransactionContextInterface,
	ticketID string) ([]*Seat, error) {
	
	ticket, err := s.GetTicket(ctx, ticketID)
	if err != nil {
		return nil, err
	}

	availableSeats := make([]*Seat, 0)
	for i := range ticket.Seats {
		if ticket.Seats[i].Status == Vacant {
			availableSeats = append(availableSeats, &ticket.Seats[i])
		}
	}

	return availableSeats, nil
}

// QueryCustomerBookings returns all bookings for a customer
func (s *SmartContract) QueryCustomerBookings(ctx contractapi.TransactionContextInterface, customerId string) ([]*Booking, error) {
	queryString := fmt.Sprintf(`{"selector":{"userId":"%s"}}`, customerId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var bookings []*Booking
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var booking Booking
		err = json.Unmarshal(queryResult.Value, &booking)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, &booking)
	}

	return bookings, nil
}

// queryTickets is a helper function to query tickets using a query string
func (s *SmartContract) queryTickets(ctx contractapi.TransactionContextInterface,
	queryString string) ([]*Ticket, error) {
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to query tickets: %v", err)
	}
	defer resultsIterator.Close()

	var tickets []*Ticket
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate ticket results: %v", err)
		}

		var ticket Ticket
		err = json.Unmarshal(queryResponse.Value, &ticket)
		if err != nil {
			continue
		}
		tickets = append(tickets, &ticket)
	}

	return tickets, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		fmt.Printf("Error creating MyTravel chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting MyTravel chaincode: %s", err.Error())
	}
}

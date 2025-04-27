package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing travel records
type SmartContract struct {
	contractapi.Contract
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
	ID              string  `json:"id"`
	Origin          string  `json:"origin"`
	Destination     string  `json:"destination"`
	DepartureTime   string  `json:"departureTime"`
	ArrivalTime     string  `json:"arrivalTime"`
	Price           float64 `json:"price"`
	AvailableSeats  int     `json:"availableSeats"`
	TotalSeats      int     `json:"totalSeats"`
	ServiceProvider string  `json:"serviceProvider"`
	Status          string  `json:"status"` // Available, Booked, Cancelled
}

// Booking represents a ticket booking
type Booking struct {
	ID            string  `json:"id"`
	TicketID      string  `json:"ticketId"`
	UserID        string  `json:"userId"`
	NumberOfSeats int     `json:"numberOfSeats"`
	TotalPrice    float64 `json:"totalPrice"`
	Status        string  `json:"status"` // Pending, Confirmed, Cancelled
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
func (s *SmartContract) CreateUser(ctx contractapi.TransactionContextInterface, userJSON string) error {
	var user map[string]interface{}
	if err := json.Unmarshal([]byte(userJSON), &user); err != nil {
		return fmt.Errorf("failed to unmarshal user data: %v", err)
	}

	email, ok := user["email"].(string)
	if !ok || email == "" {
		return fmt.Errorf("invalid or missing email field")
	}

	userKey := "USER_" + email

	existing, err := ctx.GetStub().GetState(userKey)
	if err != nil {
		return fmt.Errorf("failed to check user existence: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("user already exists with email %s", email)
	}

	userBytes, err := json.Marshal(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user: %v", err)
	}

	return ctx.GetStub().PutState(userKey, userBytes)
}
func (s *SmartContract) CreateServiceProvider(ctx contractapi.TransactionContextInterface, providerJSON string) error {
	var provider map[string]interface{}
	if err := json.Unmarshal([]byte(providerJSON), &provider); err != nil {
		return fmt.Errorf("failed to unmarshal provider data: %v", err)
	}

	email, ok := provider["email"].(string)
	if !ok || email == "" {
		return fmt.Errorf("invalid or missing email field")
	}

	providerKey := "PROVIDER_" + email

	existing, err := ctx.GetStub().GetState(providerKey)
	if err != nil {
		return fmt.Errorf("failed to check provider existence: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("provider already exists with email %s", email)
	}

	providerBytes, err := json.Marshal(provider)
	if err != nil {
		return fmt.Errorf("failed to marshal provider: %v", err)
	}

	return ctx.GetStub().PutState(providerKey, providerBytes)
}

// CreateTicket creates a new ticket
func (s *SmartContract) CreateTicket(ctx contractapi.TransactionContextInterface,
	id string, origin string, destination string, departureTime string,
	arrivalTime string, price string, totalSeats string, serviceProvider string) error {

	priceFloat, err := strconv.ParseFloat(price, 64)
	if err != nil {
		return fmt.Errorf("failed to parse price: %v", err)
	}

	totalSeatsInt, err := strconv.Atoi(totalSeats)
	if err != nil {
		return fmt.Errorf("failed to parse total seats: %v", err)
	}

	ticket := Ticket{
		ID:              id,
		Origin:          origin,
		Destination:     destination,
		DepartureTime:   departureTime,
		ArrivalTime:     arrivalTime,
		Price:           priceFloat,
		AvailableSeats:  totalSeatsInt,
		TotalSeats:      totalSeatsInt,
		ServiceProvider: serviceProvider,
		Status:          "Available",
	}

	ticketJSON, err := json.Marshal(ticket)
	if err != nil {
		return fmt.Errorf("failed to marshal ticket: %v", err)
	}

	return ctx.GetStub().PutState(id, ticketJSON)
}

// BookTicket creates a new booking
func (s *SmartContract) BookTicket(ctx contractapi.TransactionContextInterface,
	bookingID string, ticketID string, userID string, numberOfSeats string) error {

	// Get the ticket
	ticketJSON, err := ctx.GetStub().GetState(ticketID)
	if err != nil {
		return fmt.Errorf("failed to read ticket: %v", err)
	}
	if ticketJSON == nil {
		return fmt.Errorf("ticket %s does not exist", ticketID)
	}

	var ticket Ticket
	err = json.Unmarshal(ticketJSON, &ticket)
	if err != nil {
		return fmt.Errorf("failed to unmarshal ticket: %v", err)
	}

	// Check if ticket is available
	if ticket.Status != "Available" {
		return fmt.Errorf("ticket %s is not available for booking", ticketID)
	}

	numberOfSeatsInt, err := strconv.Atoi(numberOfSeats)
	if err != nil {
		return fmt.Errorf("failed to parse number of seats: %v", err)
	}

	// Check if enough seats are available
	if ticket.AvailableSeats < numberOfSeatsInt {
		return fmt.Errorf("not enough seats available. Requested: %d, Available: %d", numberOfSeatsInt, ticket.AvailableSeats)
	}

	// Calculate total price
	totalPrice := ticket.Price * float64(numberOfSeatsInt)

	// Create a booking
	booking := Booking{
		ID:            bookingID,
		TicketID:      ticketID,
		UserID:        userID,
		NumberOfSeats: numberOfSeatsInt,
		TotalPrice:    totalPrice,
		Status:        "Pending",
	}

	bookingJSON, err := json.Marshal(booking)
	if err != nil {
		return fmt.Errorf("failed to marshal booking: %v", err)
	}

	// Update ticket
	ticket.AvailableSeats -= numberOfSeatsInt
	if ticket.AvailableSeats == 0 {
		ticket.Status = "Booked"
	}

	updatedTicketJSON, err := json.Marshal(ticket)
	if err != nil {
		return fmt.Errorf("failed to marshal updated ticket: %v", err)
	}

	// Store booking and updated ticket
	err = ctx.GetStub().PutState(bookingID, bookingJSON)
	if err != nil {
		return fmt.Errorf("failed to put booking: %v", err)
	}

	err = ctx.GetStub().PutState(ticketID, updatedTicketJSON)
	if err != nil {
		return fmt.Errorf("failed to update ticket: %v", err)
	}

	return nil
}

// ConfirmBooking confirms a booking
func (s *SmartContract) ConfirmBooking(ctx contractapi.TransactionContextInterface, bookingID string) error {
	bookingJSON, err := ctx.GetStub().GetState(bookingID)
	if err != nil {
		return fmt.Errorf("failed to read booking: %v", err)
	}
	if bookingJSON == nil {
		return fmt.Errorf("booking %s does not exist", bookingID)
	}

	var booking Booking
	err = json.Unmarshal(bookingJSON, &booking)
	if err != nil {
		return fmt.Errorf("failed to unmarshal booking: %v", err)
	}

	booking.Status = "Confirmed"
	updatedBookingJSON, err := json.Marshal(booking)
	if err != nil {
		return fmt.Errorf("failed to marshal updated booking: %v", err)
	}

	return ctx.GetStub().PutState(bookingID, updatedBookingJSON)
}

// CancelBooking cancels a booking
func (s *SmartContract) CancelBooking(ctx contractapi.TransactionContextInterface, bookingID string) error {
	bookingJSON, err := ctx.GetStub().GetState(bookingID)
	if err != nil {
		return fmt.Errorf("failed to read booking: %v", err)
	}
	if bookingJSON == nil {
		return fmt.Errorf("booking %s does not exist", bookingID)
	}

	var booking Booking
	err = json.Unmarshal(bookingJSON, &booking)
	if err != nil {
		return fmt.Errorf("failed to unmarshal booking: %v", err)
	}

	// Get the ticket
	ticketJSON, err := ctx.GetStub().GetState(booking.TicketID)
	if err != nil {
		return fmt.Errorf("failed to read ticket: %v", err)
	}
	if ticketJSON == nil {
		return fmt.Errorf("ticket %s does not exist", booking.TicketID)
	}

	var ticket Ticket
	err = json.Unmarshal(ticketJSON, &ticket)
	if err != nil {
		return fmt.Errorf("failed to unmarshal ticket: %v", err)
	}

	// Update booking status
	booking.Status = "Cancelled"
	updatedBookingJSON, err := json.Marshal(booking)
	if err != nil {
		return fmt.Errorf("failed to marshal updated booking: %v", err)
	}

	// Update ticket
	ticket.AvailableSeats += booking.NumberOfSeats
	ticket.Status = "Available"
	updatedTicketJSON, err := json.Marshal(ticket)
	if err != nil {
		return fmt.Errorf("failed to marshal updated ticket: %v", err)
	}

	// Store updated booking and ticket
	err = ctx.GetStub().PutState(bookingID, updatedBookingJSON)
	if err != nil {
		return fmt.Errorf("failed to update booking: %v", err)
	}

	err = ctx.GetStub().PutState(booking.TicketID, updatedTicketJSON)
	if err != nil {
		return fmt.Errorf("failed to update ticket: %v", err)
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

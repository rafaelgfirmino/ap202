package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	_ "github.com/joho/godotenv/autoload"

	httpAdapter "ap202/internal/adapters/input/http"
	"ap202/internal/ports/output"
)

func gracefulShutdown(apiServer *http.Server, done chan bool) {
	// Create context that listens for the interrupt signal from the OS.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Listen for the interrupt signal.
	<-ctx.Done()

	log.Println("shutting down gracefully, press Ctrl+C again to force")
	stop() // Allow Ctrl+C to force shutdown

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := apiServer.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown with error: %v", err)
	}

	log.Println("Server exiting")

	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func main() {
	port, _ := strconv.Atoi(os.Getenv("PORT"))

	dbConfig := output.DatabaseConfig{
		Database: os.Getenv("BLUEPRINT_DB_DATABASE"),
		Password: os.Getenv("BLUEPRINT_DB_PASSWORD"),
		Username: os.Getenv("BLUEPRINT_DB_USERNAME"),
		Port:     os.Getenv("BLUEPRINT_DB_PORT"),
		Host:     os.Getenv("BLUEPRINT_DB_HOST"),
		Schema:   os.Getenv("BLUEPRINT_DB_SCHEMA"),
	}

	server, cleanup, err := httpAdapter.NewServer(port, dbConfig)
	if err != nil {
		log.Fatalf("Failed to create HTTP server: %v", err)
	}
	defer func() {
		if err := cleanup(); err != nil {
			log.Printf("Failed to close HTTP server dependencies: %v", err)
		}
	}()

	log.Printf("HTTP server starting on port %d", port)

	done := make(chan bool, 1)

	go gracefulShutdown(server, done)

	err = server.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		panic(fmt.Sprintf("http server error: %s", err))
	}

	<-done
	log.Println("Graceful shutdown complete.")
}

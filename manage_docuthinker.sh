#!/bin/bash

# Define the docker-compose file location
COMPOSE_FILE="docker-compose.yml"

# Display help message
function show_help() {
    echo "Usage: $0 [option]"
    echo "Options:"
    echo "  build         Build the backend and frontend Docker images"
    echo "  start         Start all services (backend, frontend, firebase)"
    echo "  stop          Stop all services"
    echo "  restart       Restart all services"
    echo "  logs          Show logs for all services"
    echo "  logs-backend  Show logs for the backend service"
    echo "  logs-frontend Show logs for the frontend service"
    echo "  logs-firebase Show logs for the firebase service"
    echo "  clean         Stop and remove all containers, networks, and volumes"
    echo "  help          Display this help message"
}

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Error: $COMPOSE_FILE not found!"
    exit 1
fi

# Handle script arguments
case "$1" in
    build)
        echo "Building Docker images for backend and frontend..."
        docker-compose -f $COMPOSE_FILE build
        ;;
    start)
        echo "Starting all services..."
        docker-compose -f $COMPOSE_FILE up -d
        ;;
    stop)
        echo "Stopping all services..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    restart)
        echo "Restarting all services..."
        docker-compose -f $COMPOSE_FILE down
        docker-compose -f $COMPOSE_FILE up -d
        ;;
    logs)
        echo "Displaying logs for all services..."
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    logs-backend)
        echo "Displaying logs for the backend service..."
        docker-compose -f $COMPOSE_FILE logs -f backend
        ;;
    logs-frontend)
        echo "Displaying logs for the frontend service..."
        docker-compose -f $COMPOSE_FILE logs -f frontend
        ;;
    logs-firebase)
        echo "Displaying logs for the firebase service..."
        docker-compose -f $COMPOSE_FILE logs -f firebase
        ;;
    clean)
        echo "Cleaning up: stopping and removing all containers, networks, and volumes..."
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        ;;
    help)
        show_help
        ;;
    *)
        echo "Invalid option!"
        show_help
        ;;
esac

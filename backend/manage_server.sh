#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print stages
function print_stage() {
    echo -e "${GREEN}--- $1 ---${NC}"
}

# Function to display help message
function show_help() {
    echo "Usage: $0 [option]"
    echo "Options:"
    echo "  install       Install necessary dependencies"
    echo "  start         Start the Express server"
    echo "  check         Check for syntax errors in server code"
    echo "  logs          Show logs from the running server"
    echo "  stop          Stop the server"
    echo "  help          Display this help message"
}

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}NPM is not installed. Please install it first.${NC}"
    exit 1
fi

# Handle script arguments
case "$1" in
    install)
        print_stage "Installing dependencies"
        npm install
        ;;
    start)
        print_stage "Starting the Express server"
        node index.js
        ;;
    check)
        print_stage "Checking for syntax errors in server code"
        npx eslint index.js controllers/*.js
        ;;
    logs)
        print_stage "Displaying server logs"
        tail -f logs/server.log
        ;;
    stop)
        print_stage "Stopping the server"
        pkill -f "node index.js"
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Invalid option!${NC}"
        show_help
        ;;
esac

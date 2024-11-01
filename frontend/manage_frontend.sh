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
    echo "  install       Install dependencies for the frontend"
    echo "  start         Start the frontend development server"
    echo "  build         Build the frontend for production"
    echo "  test          Run tests"
    echo "  eject         Eject the frontend (if necessary)"
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
        print_stage "Installing frontend dependencies"
        npm install
        ;;
    start)
        print_stage "Starting frontend development server"
        npm run start
        ;;
    build)
        print_stage "Building frontend for production"
        npm run build
        ;;
    test)
        print_stage "Running frontend tests"
        npm run test
        ;;
    eject)
        print_stage "Ejecting the frontend"
        npm run eject
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Invalid option!${NC}"
        show_help
        ;;
esac

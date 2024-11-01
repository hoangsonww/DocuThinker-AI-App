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
    echo "  install       Install dependencies"
    echo "  start         Start the Expo development server"
    echo "  build-web     Build the app for web"
    echo "  build-android Build the app for Android"
    echo "  build-ios     Build the app for iOS"
    echo "  help          Display this help message"
}

# Check for necessary tools (node, yarn, and expo-cli)
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo -e "${RED}Yarn is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v expo &> /dev/null; then
    echo -e "${RED}Expo CLI is not installed. Installing it now...${NC}"
    yarn global add expo-cli
fi

# Handle script arguments
case "$1" in
    install)
        print_stage "Installing dependencies"
        yarn install
        ;;
    start)
        print_stage "Starting Expo development server"
        expo start
        ;;
    build-web)
        print_stage "Building app for web"
        expo export:web
        ;;
    build-android)
        print_stage "Building app for Android"
        expo build:android
        ;;
    build-ios)
        print_stage "Building app for iOS"
        expo build:ios
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Invalid option!${NC}"
        show_help
        ;;
esac

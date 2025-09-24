#!/bin/bash

# --- Start Backend Services ---
echo "Starting backend services..."

# Gateway Service
echo "Starting gateway-service..."
cd Veyoo/backend/gateway-service
python3 -m venv venv
source venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8003 &
cd ../../..

# --- Start Frontend ---
echo "Starting frontend development server..."
cd Veyoo/frontend
kill_process_on_port 3000
npm install
npm start
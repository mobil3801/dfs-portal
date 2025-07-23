@echo off
REM Batch script to start the supabase-mcp-server MCP server with debug logging enabled

REM Set the path to the MCP server executable
set MCP_SERVER_PATH="C:\Users\MOBIN (Work)\pipx\venvs\supabase-mcp-server\Scripts\supabase-mcp-server.exe"

REM Set environment variables required by the MCP server
set QUERY_API_KEY=qry_v1_BEcbRGx4BvycZjNzJItdzPdoT-wvbDf3PXlxGuQULDQ
set SUPABASE_PROJECT_REF=nehhjsiuhthflfwkfequ
set SUPABASE_DB_PASSWORD=Dreamframe123@
set SUPABASE_REGION=us-east-2
set SUPABASE_ACCESS_TOKEN=sbp_961724e0e401652259e990f85a5bcada6c0df481
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxMzE3NSwiZXhwIjoyMDY4NTg5MTc1fQ.7naT6l_oNH8VI5MaEKgJ19PoYw1EErv6-ftkEin12wE

REM Start the MCP server with verbose debug logging
%MCP_SERVER_PATH% --log-level debug

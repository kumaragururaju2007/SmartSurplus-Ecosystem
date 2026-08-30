-- Create SmartSurplus PostgreSQL Database
-- Execute with: psql -U postgres -f database/createDatabase.sql

SELECT 'CREATE DATABASE smart_surplus'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'smart_surplus')\gexec

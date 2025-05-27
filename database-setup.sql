-- PostgreSQL Database Setup for Critter Chat Agent
-- Run these commands in your PostgreSQL database

-- Create the database (if it doesn't exist)
-- CREATE DATABASE critter_chat;

-- Connect to the database and create the table
CREATE TABLE IF NOT EXISTS chat_agents (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    webhook_url TEXT NOT NULL,
    position VARCHAR(50) DEFAULT 'bottom-right',
    primary_color VARCHAR(7) DEFAULT '#e75837',
    secondary_color VARCHAR(7) DEFAULT '#745e25',
    welcome_message TEXT DEFAULT 'Welcome! How can I help you today?',
    width INTEGER DEFAULT 350,
    height INTEGER DEFAULT 500,
    show_timestamp BOOLEAN DEFAULT true,
    enable_typing_indicator BOOLEAN DEFAULT true,
    max_messages INTEGER,
    api_key VARCHAR(255),
    agent_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_agents_business_id ON chat_agents(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_agents_is_active ON chat_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_agents_created_at ON chat_agents(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_chat_agents_updated_at ON chat_agents;
CREATE TRIGGER update_chat_agents_updated_at
    BEFORE UPDATE ON chat_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample agent (optional)
INSERT INTO chat_agents (
    business_id,
    business_name,
    webhook_url,
    welcome_message
) VALUES (
    'demo-pet-services',
    'Critter Pet Services',
    'https://jleib03.app.n8n.cloud/webhook-test/803d260b-1b17-4abf-8079-2d40225c29b0',
    'Welcome to Critter Pet Services! How can I help you today?'
) ON CONFLICT (business_id) DO NOTHING;

-- Verify the setup
SELECT 
    business_id,
    business_name,
    created_at
FROM chat_agents 
WHERE is_active = true;

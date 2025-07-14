-- Auto Audit Pro - Website Monitoring System Database Schema
-- "Check Engine Light" for Dealership Websites

-- Drop existing tables if needed (for development)
DROP TABLE IF EXISTS alert_history CASCADE;
DROP TABLE IF EXISTS monitoring_results CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;
DROP TABLE IF EXISTS monitoring_profiles CASCADE;

-- Monitoring Profiles - Each dealership we're monitoring
CREATE TABLE monitoring_profiles (
    id SERIAL PRIMARY KEY,
    dealer_id VARCHAR(255) NOT NULL UNIQUE,
    dealer_name VARCHAR(255) NOT NULL,
    website_url VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    monitoring_enabled BOOLEAN DEFAULT true,
    check_frequency INTEGER DEFAULT 30, -- minutes between checks
    alert_email VARCHAR(255),
    alert_phone VARCHAR(50),
    alert_preferences JSONB DEFAULT '{"email": true, "sms": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring Results - Store each check result
CREATE TABLE monitoring_results (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES monitoring_profiles(id) ON DELETE CASCADE,
    check_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_status VARCHAR(20) CHECK (overall_status IN ('GREEN', 'YELLOW', 'RED')),
    
    -- Core metrics
    is_reachable BOOLEAN DEFAULT true,
    response_time_ms INTEGER,
    http_status_code INTEGER,
    ssl_valid BOOLEAN,
    ssl_expiry_days INTEGER,
    
    -- Content checks
    forms_working BOOLEAN,
    phone_numbers_valid BOOLEAN,
    inventory_count INTEGER,
    
    -- Performance metrics
    page_size_kb INTEGER,
    load_time_seconds NUMERIC(5,2),
    mobile_score INTEGER,
    desktop_score INTEGER,
    
    -- Detailed results
    issues_found JSONB DEFAULT '[]',
    metrics JSONB DEFAULT '{}',
    error_details TEXT,
    
    INDEX idx_profile_timestamp (profile_id, check_timestamp DESC)
);

-- Alert Rules - Define what triggers alerts
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_category VARCHAR(50), -- uptime, performance, content, security
    check_type VARCHAR(100) NOT NULL,
    condition VARCHAR(20), -- equals, greater_than, less_than, contains
    threshold_value JSONB,
    alert_level VARCHAR(20) CHECK (alert_level IN ('RED', 'YELLOW')),
    alert_message_template TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert History - Track all alerts sent
CREATE TABLE alert_history (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES monitoring_profiles(id) ON DELETE CASCADE,
    result_id INTEGER REFERENCES monitoring_results(id) ON DELETE CASCADE,
    rule_id INTEGER REFERENCES alert_rules(id),
    alert_level VARCHAR(20) CHECK (alert_level IN ('RED', 'YELLOW')),
    alert_type VARCHAR(100),
    alert_message TEXT,
    notification_sent BOOLEAN DEFAULT false,
    notification_method VARCHAR(50), -- email, sms, dashboard
    notification_sent_at TIMESTAMP,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_profile_alerts (profile_id, created_at DESC),
    INDEX idx_unresolved_alerts (profile_id, resolved, alert_level)
);

-- Insert default alert rules
INSERT INTO alert_rules (rule_name, rule_category, check_type, condition, threshold_value, alert_level, alert_message_template) VALUES
-- RED Alerts - Critical Issues
('Website Down', 'uptime', 'is_reachable', 'equals', 'false', 'RED', 'CRITICAL: Website is unreachable - customers cannot access your site!'),
('SSL Certificate Invalid', 'security', 'ssl_valid', 'equals', 'false', 'RED', 'CRITICAL: SSL certificate is invalid - browsers showing security warnings!'),
('Forms Not Working', 'content', 'forms_working', 'equals', 'false', 'RED', 'CRITICAL: Contact forms not working - losing potential leads!'),
('No Inventory', 'content', 'inventory_count', 'equals', '0', 'RED', 'CRITICAL: No inventory showing on website!'),
('Server Error', 'uptime', 'http_status_code', 'greater_than', '499', 'RED', 'CRITICAL: Website returning server errors!'),
('Extremely Slow', 'performance', 'load_time_seconds', 'greater_than', '10', 'RED', 'CRITICAL: Website taking over 10 seconds to load!'),

-- YELLOW Alerts - Warning Issues
('SSL Expiring Soon', 'security', 'ssl_expiry_days', 'less_than', '30', 'YELLOW', 'WARNING: SSL certificate expires in {ssl_expiry_days} days'),
('Slow Response', 'performance', 'response_time_ms', 'greater_than', '3000', 'YELLOW', 'WARNING: Website response time over 3 seconds'),
('Low Inventory', 'content', 'inventory_count', 'less_than', '50', 'YELLOW', 'WARNING: Low inventory count ({inventory_count} vehicles)'),
('Poor Mobile Score', 'performance', 'mobile_score', 'less_than', '70', 'YELLOW', 'WARNING: Mobile performance score is {mobile_score}/100'),
('Large Page Size', 'performance', 'page_size_kb', 'greater_than', '5000', 'YELLOW', 'WARNING: Homepage is {page_size_kb}KB - may load slowly');

-- Create indexes for performance
CREATE INDEX idx_monitoring_results_status ON monitoring_results(overall_status);
CREATE INDEX idx_alert_history_unacknowledged ON alert_history(acknowledged, created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to monitoring_profiles
CREATE TRIGGER update_monitoring_profiles_updated_at BEFORE UPDATE
    ON monitoring_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
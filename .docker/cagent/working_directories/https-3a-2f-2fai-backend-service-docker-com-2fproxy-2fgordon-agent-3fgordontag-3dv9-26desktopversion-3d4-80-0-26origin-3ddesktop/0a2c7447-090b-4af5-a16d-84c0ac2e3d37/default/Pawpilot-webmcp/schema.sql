-- PawPilot PostgreSQL Schema

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  breed VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  weight_lbs DECIMAL NOT NULL,
  health_notes TEXT,
  vaccinations_current BOOLEAN DEFAULT TRUE,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily needs table
CREATE TABLE IF NOT EXISTS daily_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  needs TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pet_id, date)
);

-- Pet services table
CREATE TABLE IF NOT EXISTS pet_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  rating DECIMAL(2,1),
  price VARCHAR(100),
  available BOOLEAN DEFAULT TRUE,
  contact_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pet products table
CREATE TABLE IF NOT EXISTS pet_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  product_type VARCHAR(100) NOT NULL,
  price VARCHAR(100),
  rating DECIMAL(2,1),
  availability BOOLEAN DEFAULT TRUE,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Care plans table
CREATE TABLE IF NOT EXISTS care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  activities TEXT[] NOT NULL,
  recommended_services UUID[] DEFAULT '{}',
  recommended_products UUID[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  completion_percentage INT DEFAULT 0,
  ai_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI agent calls logging table
CREATE TABLE IF NOT EXISTS agent_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  tool_name VARCHAR(255) NOT NULL,
  input_params JSONB NOT NULL,
  output_result JSONB,
  execution_time_ms INT,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_daily_needs_pet ON daily_needs(pet_id);
CREATE INDEX IF NOT EXISTS idx_daily_needs_date ON daily_needs(date);
CREATE INDEX IF NOT EXISTS idx_services_type ON pet_services(service_type);
CREATE INDEX IF NOT EXISTS idx_products_type ON pet_products(product_type);
CREATE INDEX IF NOT EXISTS idx_care_plans_pet ON care_plans(pet_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_date ON care_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_agent_calls_pet ON agent_calls(pet_id);

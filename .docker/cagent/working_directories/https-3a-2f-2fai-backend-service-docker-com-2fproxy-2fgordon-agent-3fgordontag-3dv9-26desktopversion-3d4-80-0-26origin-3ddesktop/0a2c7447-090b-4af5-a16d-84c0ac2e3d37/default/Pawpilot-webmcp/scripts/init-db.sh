#!/bin/bash
# Database initialization and migration script

set -e

echo "🗄️  PawPilot Database Setup"
echo "============================"

# Wait for postgres to be ready
echo "Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -c "\q" 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "✅ PostgreSQL is ready"

# Check if schema already exists
TABLE_COUNT=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -eq 0 ]; then
  echo "Creating database schema..."
  PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB < /docker-entrypoint-initdb.d/01-schema.sql
  echo "✅ Database schema created"
else
  echo "✅ Database schema already exists"
fi

# Seed initial data (optional)
echo "Seeding initial pet data..."

PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB << EOF
-- Insert sample pet if not exists
INSERT INTO pets (id, name, breed, age, weight_lbs, health_notes, vaccinations_current, owner_id)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Milo',
  'Golden Retriever',
  3,
  68.0,
  'Seasonal allergies, active lifestyle',
  true,
  'owner-001'
) ON CONFLICT DO NOTHING;

-- Insert sample services if not exist
INSERT INTO pet_services (service_id, name, service_type, rating, price)
VALUES 
  ('groom_01', 'Paw Spa', 'grooming', 4.8, '$45'),
  ('groom_02', 'Golden Coat Care', 'grooming', 4.9, '$55'),
  ('train_01', 'Happy Paws Academy', 'training', 4.7, '$80/session'),
  ('train_02', 'Pro Dog Training', 'training', 4.9, '$100/session')
ON CONFLICT (service_id) DO NOTHING;

-- Insert sample products if not exist
INSERT INTO pet_products (product_id, name, product_type, price, rating)
VALUES 
  ('food_01', 'Premium Golden Retriever Formula', 'food', '$45', 4.8),
  ('food_02', 'Organic Grain-Free Kibble', 'food', '$55', 4.7),
  ('toy_01', 'Durable Fetch Ball Set', 'toys', '$15', 4.9),
  ('bed_01', 'Orthopedic Dog Bed (Large)', 'bedding', '$85', 4.9)
ON CONFLICT (product_id) DO NOTHING;

SELECT 'Database seeding completed' as status;
EOF

echo "✅ Database seeded with initial data"

# Verify data
PETS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT COUNT(*) FROM pets" 2>/dev/null || echo "0")
SERVICES=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT COUNT(*) FROM pet_services" 2>/dev/null || echo "0")

echo ""
echo "Database Status:"
echo "  - Pets: $PETS"
echo "  - Services: $SERVICES"
echo ""
echo "✅ Database initialization complete!"

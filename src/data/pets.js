// Mock pet data - Milo's profile
export const miloProfile = {
  id: 'milo-001',
  name: 'Milo',
  breed: 'Golden Retriever',
  age: 3,
  weight: 65,
  lastVetVisit: '2026-08-15',
  medications: [],
  allergies: ['chicken'],
  notes: 'Loves fetch, needs regular exercise'
};

// Mock daily needs
export const dailyNeeds = {
  petId: 'milo-001',
  date: new Date().toISOString().split('T')[0],
  tasks: [
    { id: 1, name: 'Morning walk', completed: false, time: '08:00' },
    { id: 2, name: 'Breakfast', completed: false, time: '08:30' },
    { id: 3, name: 'Midday playtime', completed: false, time: '12:00' },
    { id: 4, name: 'Lunch', completed: false, time: '12:30' },
    { id: 5, name: 'Evening walk', completed: false, time: '18:00' },
    { id: 6, name: 'Dinner', completed: false, time: '18:30' },
    { id: 7, name: 'Playtime/training', completed: false, time: '19:00' }
  ]
};

// Mock pet services
export const petServices = [
  {
    id: 'vet-001',
    name: 'Happy Paws Veterinary Clinic',
    type: 'veterinary',
    address: '123 Pet St, Animal City',
    phone: '555-VETS-01',
    rating: 4.8,
    availability: 'Available tomorrow'
  },
  {
    id: 'grooming-001',
    name: 'Fluffy Grooming Spa',
    type: 'grooming',
    address: '456 Clean Ave, Animal City',
    phone: '555-GROOM-1',
    rating: 4.9,
    availability: 'Available in 2 days'
  },
  {
    id: 'training-001',
    name: 'Smart Paws Training Academy',
    type: 'training',
    address: '789 Smart Ln, Animal City',
    phone: '555-TRAIN-1',
    rating: 4.7,
    availability: 'Available next week'
  },
  {
    id: 'boarding-001',
    name: 'Paws Paradise Boarding',
    type: 'boarding',
    address: '321 Safe St, Animal City',
    phone: '555-BOARD-1',
    rating: 4.6,
    availability: 'Available anytime'
  }
];

// Mock pet products
export const petProducts = [
  {
    id: 'prod-001',
    name: 'Salmon Dog Food (Grain-Free)',
    category: 'food',
    price: 45.99,
    inStock: true,
    link: 'https://example.com/salmon-food'
  },
  {
    id: 'prod-002',
    name: 'Dental Chew Sticks',
    category: 'treats',
    price: 12.99,
    inStock: true,
    link: 'https://example.com/dental-chews'
  },
  {
    id: 'prod-003',
    name: 'Interactive Fetch Toy',
    category: 'toys',
    price: 24.99,
    inStock: true,
    link: 'https://example.com/fetch-toy'
  },
  {
    id: 'prod-004',
    name: 'Orthopedic Dog Bed',
    category: 'bedding',
    price: 89.99,
    inStock: false,
    link: 'https://example.com/dog-bed'
  }
];

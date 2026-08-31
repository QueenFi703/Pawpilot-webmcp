import { miloProfile, dailyNeeds, petServices, petProducts } from '../data/pets.js';

// Tool definitions for WebMCP
export const tools = [
  {
    name: 'get_pet_profile',
    description: 'Retrieve the current pet profile with basic info, medical history, and preferences',
    parameters: {
      type: 'object',
      properties: {
        petId: {
          type: 'string',
          description: 'The pet ID to retrieve'
        }
      },
      required: ['petId']
    }
  },
  {
    name: 'get_daily_needs',
    description: 'Get today\'s care checklist derived from the pet\'s profile',
    parameters: {
      type: 'object',
      properties: {
        petId: {
          type: 'string',
          description: 'The pet ID'
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (defaults to today)'
        }
      },
      required: ['petId']
    }
  },
  {
    name: 'find_pet_services',
    description: 'Find available pet services (veterinary, grooming, training, boarding, etc.)',
    parameters: {
      type: 'object',
      properties: {
        serviceType: {
          type: 'string',
          description: 'Type of service: veterinary, grooming, training, boarding',
          enum: ['veterinary', 'grooming', 'training', 'boarding']
        }
      },
      required: ['serviceType']
    }
  },
  {
    name: 'find_pet_products',
    description: 'Find pet products and supplies',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Product category: food, treats, toys, bedding',
          enum: ['food', 'treats', 'toys', 'bedding']
        }
      },
      required: ['category']
    }
  },
  {
    name: 'save_care_plan',
    description: 'Save a generated care plan after user confirmation',
    parameters: {
      type: 'object',
      properties: {
        petId: {
          type: 'string',
          description: 'The pet ID'
        },
        plan: {
          type: 'object',
          description: 'The care plan object',
          properties: {
            title: { type: 'string' },
            tasks: { type: 'array' },
            services: { type: 'array' },
            products: { type: 'array' }
          }
        }
      },
      required: ['petId', 'plan']
    }
  }
];

// Tool execution functions
export const executeTool = async (toolName, params) => {
  switch (toolName) {
    case 'get_pet_profile':
      return getPetProfile(params.petId);
    case 'get_daily_needs':
      return getDailyNeeds(params.petId, params.date);
    case 'find_pet_services':
      return findPetServices(params.serviceType);
    case 'find_pet_products':
      return findPetProducts(params.category);
    case 'save_care_plan':
      return saveCarePlan(params.petId, params.plan);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

// Tool implementations
function getPetProfile(petId) {
  if (petId === 'milo-001') {
    return { success: true, data: miloProfile };
  }
  return { success: false, error: 'Pet not found' };
}

function getDailyNeeds(petId, date) {
  if (petId === 'milo-001') {
    return { success: true, data: dailyNeeds };
  }
  return { success: false, error: 'Pet not found' };
}

function findPetServices(serviceType) {
  const filtered = petServices.filter(s => s.type === serviceType);
  return { success: true, data: filtered };
}

function findPetProducts(category) {
  const filtered = petProducts.filter(p => p.category === category);
  return { success: true, data: filtered };
}

function saveCarePlan(petId, plan) {
  // In production, this would save to a database
  return {
    success: true,
    data: {
      id: `plan-${Date.now()}`,
      petId,
      ...plan,
      savedAt: new Date().toISOString()
    }
  };
}

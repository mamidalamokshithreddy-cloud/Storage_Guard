/* eslint-disable no-unused-vars */

export enum UserRole {
  VENDOR = 'vendor',
  FARMER = 'farmer',
  BUYER = 'buyer',
  ADMIN = 'admin',
  AGRI_COPILOT = 'agri_copilot',
  LANDOWNER = 'landowner'
}

export enum ServiceType {
  SEED_SUPPLY = 'seed_supply',
  DRONE_SPRAYING = 'drone_spraying',
  SOIL_TESTING = 'soil_testing',
  TRACTOR_RENTAL = 'tractor_rental',
  LOGISTICS = 'logistics', 
  STORAGE = 'storage',
  INPUT_SUPPLY = 'input_supply',
  OTHER = 'other'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved', 
  REJECTED = 'rejected',
  MODIFIED = 'modified'
}
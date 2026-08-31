-- Supabase Migration: Initialize Database Schema for SAHEL OXYGENE
-- This migration creates all tables required for the application

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types safely if they do not exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM ('administrateur', 'gestionnaire', 'livreur', 'vendeur_gaz');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'livraison_statut_enum') THEN
    CREATE TYPE livraison_statut_enum AS ENUM ('en_attente', 'en_cours', 'livree', 'annulee');
  END IF;
END $$;

-- =====================================
-- PROFILES TABLE (Users)
-- =====================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);

-- =====================================
-- USER ROLES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- =====================================
-- GAS VENDORS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS gas_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  description TEXT,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  disponible BOOLEAN DEFAULT FALSE,
  actif BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gas_vendors_user_id ON gas_vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_gas_vendors_actif ON gas_vendors(actif);
CREATE INDEX IF NOT EXISTS idx_gas_vendors_disponible ON gas_vendors(disponible);
CREATE INDEX IF NOT EXISTS idx_gas_vendors_location ON gas_vendors(lat, lng);

-- =====================================
-- LIVRAISONS TABLE (Deliveries)
-- =====================================
CREATE TABLE IF NOT EXISTS livraisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(255) NOT NULL UNIQUE,
  client_nom VARCHAR(255),
  client_telephone VARCHAR(20) NOT NULL,
  client_telephone_normalise VARCHAR(20) NOT NULL,
  adresse_depart TEXT NOT NULL,
  adresse_destination TEXT NOT NULL,
  depart_lat DECIMAL(10, 7),
  depart_lng DECIMAL(10, 7),
  destination_lat DECIMAL(10, 7),
  destination_lng DECIMAL(10, 7),
  distance_km DECIMAL(6, 2),
  duree_minutes INTEGER,
  montant INTEGER NOT NULL,
  statut livraison_statut_enum DEFAULT 'en_attente',
  livreur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cree_par_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  signature_data_url TEXT,
  qr_token VARCHAR(255) NOT NULL UNIQUE,
  notes TEXT,
  assigned_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_livraisons_numero ON livraisons(numero);
CREATE INDEX IF NOT EXISTS idx_livraisons_statut ON livraisons(statut);
CREATE INDEX IF NOT EXISTS idx_livraisons_livreur_id ON livraisons(livreur_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_cree_par_id ON livraisons(cree_par_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_qr_token ON livraisons(qr_token);
CREATE INDEX IF NOT EXISTS idx_livraisons_client_telephone_normalise ON livraisons(client_telephone_normalise);
CREATE INDEX IF NOT EXISTS idx_livraisons_created_at ON livraisons(created_at DESC);

-- =====================================
-- GPS POSITIONS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS gps_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livraison_id UUID NOT NULL REFERENCES livraisons(id) ON DELETE CASCADE,
  livreur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gps_positions_livraison_id ON gps_positions(livraison_id);
CREATE INDEX IF NOT EXISTS idx_gps_positions_livreur_id ON gps_positions(livreur_id);
CREATE INDEX IF NOT EXISTS idx_gps_positions_recorded_at ON gps_positions(recorded_at DESC);

-- =====================================
-- ACTION LOGS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livraison_id UUID NOT NULL REFERENCES livraisons(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  acteur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message VARCHAR(255),
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_action_logs_livraison_id ON action_logs(livraison_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_type ON action_logs(type);
CREATE INDEX IF NOT EXISTS idx_action_logs_acteur_id ON action_logs(acteur_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at DESC);

-- =====================================
-- SETTINGS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- ADMIN WHATSAPP TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS admin_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL UNIQUE,
  label VARCHAR(255),
  principal BOOLEAN DEFAULT FALSE,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_whatsapp_principal ON admin_whatsapp(principal);
CREATE INDEX IF NOT EXISTS idx_admin_whatsapp_actif ON admin_whatsapp(actif);

-- =====================================
-- RLS POLICIES (Row Level Security)
-- =====================================

-- Enable RLS on sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE livraisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies depend on your auth implementation
-- Update these policies based on your application's access control requirements

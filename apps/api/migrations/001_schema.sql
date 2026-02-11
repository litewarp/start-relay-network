-- Star Wars schema (SWAPI) for PostGraphile
-- Uses SQL conventions: snake_case, singular table names

CREATE SCHEMA IF NOT EXISTS app_public;

-------------------------------------------------------------------------------
-- Entity tables
-------------------------------------------------------------------------------

CREATE TABLE app_public.planet (
  id integer PRIMARY KEY,
  name text NOT NULL,
  diameter integer,
  rotation_period integer,
  orbital_period integer,
  gravity text,
  population bigint,
  climate text[],
  terrain text[],
  surface_water numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_public.species (
  id integer PRIMARY KEY,
  name text NOT NULL,
  classification text,
  designation text,
  average_height numeric,
  average_lifespan integer,
  eye_color text[],
  hair_color text[],
  skin_color text[],
  language text,
  homeworld_id integer REFERENCES app_public.planet(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_public.film (
  id integer PRIMARY KEY,
  title text NOT NULL,
  episode_id integer NOT NULL UNIQUE,
  opening_crawl text,
  director text NOT NULL,
  producer text[],
  release_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_public.person (
  id integer PRIMARY KEY,
  name text NOT NULL,
  birth_year text,
  eye_color text,
  gender text,
  hair_color text,
  height integer,
  mass numeric,
  skin_color text,
  homeworld_id integer REFERENCES app_public.planet(id),
  species_id integer REFERENCES app_public.species(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_public.starship (
  id integer PRIMARY KEY,
  name text NOT NULL,
  model text,
  starship_class text,
  manufacturer text[],
  cost_in_credits numeric,
  length numeric,
  crew text,
  passengers text,
  max_atmosphering_speed integer,
  hyperdrive_rating numeric,
  mglt integer,
  cargo_capacity numeric,
  consumables text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_public.vehicle (
  id integer PRIMARY KEY,
  name text NOT NULL,
  model text,
  vehicle_class text,
  manufacturer text[],
  cost_in_credits numeric,
  length numeric,
  crew text,
  passengers text,
  max_atmosphering_speed integer,
  cargo_capacity numeric,
  consumables text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-------------------------------------------------------------------------------
-- Join tables (many-to-many relationships)
-------------------------------------------------------------------------------

CREATE TABLE app_public.film_person (
  film_id integer NOT NULL REFERENCES app_public.film(id),
  person_id integer NOT NULL REFERENCES app_public.person(id),
  PRIMARY KEY (film_id, person_id)
);

CREATE TABLE app_public.film_planet (
  film_id integer NOT NULL REFERENCES app_public.film(id),
  planet_id integer NOT NULL REFERENCES app_public.planet(id),
  PRIMARY KEY (film_id, planet_id)
);

CREATE TABLE app_public.film_species (
  film_id integer NOT NULL REFERENCES app_public.film(id),
  species_id integer NOT NULL REFERENCES app_public.species(id),
  PRIMARY KEY (film_id, species_id)
);

CREATE TABLE app_public.film_starship (
  film_id integer NOT NULL REFERENCES app_public.film(id),
  starship_id integer NOT NULL REFERENCES app_public.starship(id),
  PRIMARY KEY (film_id, starship_id)
);

CREATE TABLE app_public.film_vehicle (
  film_id integer NOT NULL REFERENCES app_public.film(id),
  vehicle_id integer NOT NULL REFERENCES app_public.vehicle(id),
  PRIMARY KEY (film_id, vehicle_id)
);

CREATE TABLE app_public.person_starship (
  person_id integer NOT NULL REFERENCES app_public.person(id),
  starship_id integer NOT NULL REFERENCES app_public.starship(id),
  PRIMARY KEY (person_id, starship_id)
);

CREATE TABLE app_public.person_vehicle (
  person_id integer NOT NULL REFERENCES app_public.person(id),
  vehicle_id integer NOT NULL REFERENCES app_public.vehicle(id),
  PRIMARY KEY (person_id, vehicle_id)
);

-------------------------------------------------------------------------------
-- Indexes on foreign key columns for efficient backward lookups
-------------------------------------------------------------------------------

CREATE INDEX idx_species_homeworld ON app_public.species(homeworld_id);
CREATE INDEX idx_person_homeworld ON app_public.person(homeworld_id);
CREATE INDEX idx_person_species ON app_public.person(species_id);

-- Join table reverse-direction indexes (PK covers the first column already)
CREATE INDEX idx_film_person_person ON app_public.film_person(person_id);
CREATE INDEX idx_film_planet_planet ON app_public.film_planet(planet_id);
CREATE INDEX idx_film_species_species ON app_public.film_species(species_id);
CREATE INDEX idx_film_starship_starship ON app_public.film_starship(starship_id);
CREATE INDEX idx_film_vehicle_vehicle ON app_public.film_vehicle(vehicle_id);
CREATE INDEX idx_person_starship_starship ON app_public.person_starship(starship_id);
CREATE INDEX idx_person_vehicle_vehicle ON app_public.person_vehicle(vehicle_id);

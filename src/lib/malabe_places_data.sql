-- Populate places table with public places near Malabe area, Sri Lanka
-- Note: Run update_places_schema.sql first to add opening_hours, phone, and website columns

-- Clear existing sample data (optional)
-- DELETE FROM places WHERE name LIKE '%Malabe%' OR address LIKE '%Malabe%';

-- Insert public places near Malabe area
-- Coordinates are approximately centered around Malabe (latitude: 6.9063, longitude: 79.9738)

-- Educational Institutions
INSERT INTO places (
  name, 
  category, 
  description, 
  address, 
  latitude, 
  longitude, 
  opening_hours, 
  phone, 
  website,
  accessibility_features, 
  verified, 
  images,
  created_by
) VALUES 
(
  'Sri Lanka Institute of Information Technology (SLIIT)',
  'education',
  'Premier private higher education institution offering IT and engineering programs with modern facilities.',
  'New Kandy Rd, Malabe, Sri Lanka',
  6.9146,
  79.9730,
  '{"monday": "8:00 AM - 5:00 PM", "tuesday": "8:00 AM - 5:00 PM", "wednesday": "8:00 AM - 5:00 PM", "thursday": "8:00 AM - 5:00 PM", "friday": "8:00 AM - 5:00 PM", "saturday": "8:00 AM - 12:00 PM", "sunday": "Closed"}'::jsonb,
  '+94 11 241 3900',
  'https://www.sliit.lk',
  ARRAY['Wheelchair accessible entrance', 'Accessible parking', 'Elevator access', 'Accessible restrooms', 'Ramps'],
  true,
  ARRAY['/public/sliit-building.jpg'],
  (SELECT id FROM users LIMIT 1)
),
(
  'Horizon Campus',
  'education',
  'Modern university campus offering undergraduate and postgraduate programs in various disciplines.',
  'No.12, Thalapathpitiya Road, Malabe, Sri Lanka',
  6.9093,
  79.9740,
  '{"monday": "8:00 AM - 4:30 PM", "tuesday": "8:00 AM - 4:30 PM", "wednesday": "8:00 AM - 4:30 PM", "thursday": "8:00 AM - 4:30 PM", "friday": "8:00 AM - 4:30 PM", "saturday": "Closed", "sunday": "Closed"}'::jsonb,
  '+94 11 243 1999',
  'https://www.horizoncampus.edu.lk',
  ARRAY['Wheelchair accessible entrance', 'Elevator access', 'Accessible parking', 'Accessible restrooms'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
);

-- Shopping Malls & Centers
INSERT INTO places (
  name, 
  category, 
  description, 
  address, 
  latitude, 
  longitude, 
  opening_hours, 
  phone, 
  website,
  accessibility_features, 
  verified, 
  images,
  created_by
) VALUES 
(
  'Malabe Junction Shopping Complex',
  'shopping',
  'Local shopping complex with supermarket, retail stores, and dining options.',
  'Kaduwela Road, Malabe, Sri Lanka',
  6.9063,
  79.9738,
  '{"monday": "9:00 AM - 9:00 PM", "tuesday": "9:00 AM - 9:00 PM", "wednesday": "9:00 AM - 9:00 PM", "thursday": "9:00 AM - 9:00 PM", "friday": "9:00 AM - 9:00 PM", "saturday": "9:00 AM - 9:00 PM", "sunday": "9:00 AM - 9:00 PM"}'::jsonb,
  '+94 11 241 5678',
  '',
  ARRAY['Wheelchair accessible entrance', 'Accessible parking', 'Wide aisles', 'Elevator access'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
),
(
  'Keells Super - Malabe',
  'shopping',
  'Modern supermarket chain offering groceries, fresh produce, and household items.',
  'New Kandy Road, Malabe, Sri Lanka',
  6.9125,
  79.9710,
  '{"monday": "8:00 AM - 10:00 PM", "tuesday": "8:00 AM - 10:00 PM", "wednesday": "8:00 AM - 10:00 PM", "thursday": "8:00 AM - 10:00 PM", "friday": "8:00 AM - 10:00 PM", "saturday": "8:00 AM - 10:00 PM", "sunday": "8:00 AM - 10:00 PM"}'::jsonb,
  '+94 11 241 2345',
  'https://www.keellssuper.com',
  ARRAY['Wheelchair accessible entrance', 'Accessible parking', 'Wide aisles', 'Accessible checkout counters'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
);

-- Parks & Recreation
INSERT INTO places (
  name, 
  category, 
  description, 
  address, 
  latitude, 
  longitude, 
  opening_hours, 
  phone, 
  website,
  accessibility_features, 
  verified, 
  images,
  created_by
) VALUES 
(
  'Malabe Park',
  'parks',
  'Community park with walking paths, playground, and green spaces for relaxation.',
  'Robert Gunawardena Mawatha, Malabe, Sri Lanka',
  6.9050,
  79.9720,
  '{"monday": "6:00 AM - 6:00 PM", "tuesday": "6:00 AM - 6:00 PM", "wednesday": "6:00 AM - 6:00 PM", "thursday": "6:00 AM - 6:00 PM", "friday": "6:00 AM - 6:00 PM", "saturday": "6:00 AM - 6:00 PM", "sunday": "6:00 AM - 6:00 PM"}'::jsonb,
  '',
  '',
  ARRAY['Paved pathways', 'Accessible parking', 'Benches with back support', 'Accessible restrooms'],
  true,
  ARRAY['/public/green-park-ocean-view.jpg'],
  (SELECT id FROM users LIMIT 1)
);

-- Restaurants & Cafes
INSERT INTO places (
  name, 
  category, 
  description, 
  address, 
  latitude, 
  longitude, 
  opening_hours, 
  phone, 
  website,
  accessibility_features, 
  verified, 
  images,
  created_by
) VALUES 
(
  'Burger King Malabe',
  'restaurants',
  'Fast food restaurant chain serving burgers, fries, and beverages.',
  'New Kandy Road, Malabe, Sri Lanka',
  6.9140,
  79.9725,
  '{"monday": "10:00 AM - 10:00 PM", "tuesday": "10:00 AM - 10:00 PM", "wednesday": "10:00 AM - 10:00 PM", "thursday": "10:00 AM - 10:00 PM", "friday": "10:00 AM - 11:00 PM", "saturday": "10:00 AM - 11:00 PM", "sunday": "10:00 AM - 10:00 PM"}'::jsonb,
  '+94 11 241 3456',
  'https://www.burgerking.lk',
  ARRAY['Wheelchair accessible entrance', 'Accessible parking', 'Accessible seating', 'Accessible restrooms'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
),
(
  'KFC Malabe',
  'restaurants',
  'Popular fast food chain specializing in fried chicken and sides.',
  'Kaduwela Road, Malabe, Sri Lanka',
  6.9070,
  79.9750,
  '{"monday": "10:00 AM - 10:00 PM", "tuesday": "10:00 AM - 10:00 PM", "wednesday": "10:00 AM - 10:00 PM", "thursday": "10:00 AM - 10:00 PM", "friday": "10:00 AM - 11:00 PM", "saturday": "10:00 AM - 11:00 PM", "sunday": "10:00 AM - 10:00 PM"}'::jsonb,
  '+94 11 241 4567',
  'https://www.kfc.lk',
  ARRAY['Wheelchair accessible entrance', 'Accessible parking', 'Accessible seating'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
),
(
  'Coffee Bean Malabe',
  'restaurants',
  'Cozy cafe serving coffee, tea, pastries, and light meals.',
  'SLIIT Campus, New Kandy Road, Malabe, Sri Lanka',
  6.9148,
  79.9728,
  '{"monday": "7:00 AM - 8:00 PM", "tuesday": "7:00 AM - 8:00 PM", "wednesday": "7:00 AM - 8:00 PM", "thursday": "7:00 AM - 8:00 PM", "friday": "7:00 AM - 8:00 PM", "saturday": "8:00 AM - 6:00 PM", "sunday": "8:00 AM - 6:00 PM"}'::jsonb,
  '+94 11 241 5678',
  '',
  ARRAY['Wheelchair accessible entrance', 'Accessible seating', 'Wide doorways'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
);

-- Healthcare
INSERT INTO places (
  name, 
  category, 
  description, 
  address, 
  latitude, 
  longitude, 
  opening_hours, 
  phone, 
  website,
  accessibility_features, 
  verified, 
  images,
  created_by
) VALUES 
(
  'Malabe Medicare Hospital',
  'healthcare',
  'Private healthcare facility providing medical services, diagnostics, and emergency care.',
  'Robert Gunawardena Mawatha, Malabe, Sri Lanka',
  6.9080,
  79.9745,
  '{"monday": "Open 24 hours", "tuesday": "Open 24 hours", "wednesday": "Open 24 hours", "thursday": "Open 24 hours", "friday": "Open 24 hours", "saturday": "Open 24 hours", "sunday": "Open 24 hours"}'::jsonb,
  '+94 11 241 6789',
  '',
  ARRAY['Wheelchair accessible entrance', 'Accessible parking', 'Elevator access', 'Accessible restrooms', 'Ramps', 'Accessible examination rooms'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
),
(
  'Malabe Pharmacy',
  'healthcare',
  'Community pharmacy providing prescription medications and health products.',
  'New Kandy Road, Malabe, Sri Lanka',
  6.9100,
  79.9715,
  '{"monday": "8:00 AM - 9:00 PM", "tuesday": "8:00 AM - 9:00 PM", "wednesday": "8:00 AM - 9:00 PM", "thursday": "8:00 AM - 9:00 PM", "friday": "8:00 AM - 9:00 PM", "saturday": "8:00 AM - 9:00 PM", "sunday": "9:00 AM - 6:00 PM"}'::jsonb,
  '+94 11 241 7890',
  '',
  ARRAY['Wheelchair accessible entrance', 'Wide aisles', 'Accessible service counter'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
);

-- Religious Sites
INSERT INTO places (
  name, 
  category, 
  description, 
  address, 
  latitude, 
  longitude, 
  opening_hours, 
  phone, 
  website,
  accessibility_features, 
  verified, 
  images,
  created_by
) VALUES 
(
  'Malabe Buddhist Temple',
  'temple',
  'Historic Buddhist temple serving the local community with daily worship and ceremonies.',
  'Temple Road, Malabe, Sri Lanka',
  6.9040,
  79.9700,
  '{"monday": "6:00 AM - 7:00 PM", "tuesday": "6:00 AM - 7:00 PM", "wednesday": "6:00 AM - 7:00 PM", "thursday": "6:00 AM - 7:00 PM", "friday": "6:00 AM - 7:00 PM", "saturday": "6:00 AM - 7:00 PM", "sunday": "6:00 AM - 7:00 PM"}'::jsonb,
  '+94 11 241 8901',
  '',
  ARRAY['Ramps available', 'Accessible parking', 'Ground level access to main shrine'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
);

-- Banks & Financial Services
INSERT INTO places (
  name, 
  category, 
  description, 
  address, 
  latitude, 
  longitude, 
  opening_hours, 
  phone, 
  website,
  accessibility_features, 
  verified, 
  images,
  created_by
) VALUES 
(
  'Commercial Bank - Malabe Branch',
  'government',
  'Full-service bank branch with ATM facilities and customer service.',
  'New Kandy Road, Malabe, Sri Lanka',
  6.9110,
  79.9735,
  '{"monday": "9:00 AM - 3:00 PM", "tuesday": "9:00 AM - 3:00 PM", "wednesday": "9:00 AM - 3:00 PM", "thursday": "9:00 AM - 3:00 PM", "friday": "9:00 AM - 3:00 PM", "saturday": "Closed", "sunday": "Closed"}'::jsonb,
  '+94 11 241 9012',
  'https://www.combank.lk',
  ARRAY['Wheelchair accessible entrance', 'Accessible parking', 'Ramps', 'Accessible ATM', 'Accessible counters'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
),
(
  'People\'s Bank - Malabe',
  'government',
  'Government bank providing banking services to individuals and businesses.',
  'Kaduwela Road, Malabe, Sri Lanka',
  6.9060,
  79.9760,
  '{"monday": "9:00 AM - 3:00 PM", "tuesday": "9:00 AM - 3:00 PM", "wednesday": "9:00 AM - 3:00 PM", "thursday": "9:00 AM - 3:00 PM", "friday": "9:00 AM - 3:00 PM", "saturday": "Closed", "sunday": "Closed"}'::jsonb,
  '+94 11 241 0123',
  'https://www.peoplesbank.lk',
  ARRAY['Wheelchair accessible entrance', 'Ramps', 'Accessible ATM'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
);

-- Post Office
INSERT INTO places (
  name, 
  category, 
  description, 
  address, 
  latitude, 
  longitude, 
  opening_hours, 
  phone, 
  website,
  accessibility_features, 
  verified, 
  images,
  created_by
) VALUES 
(
  'Malabe Post Office',
  'government',
  'Local post office providing postal services, money orders, and courier services.',
  'Malabe Town, Kaduwela Road, Malabe, Sri Lanka',
  6.9055,
  79.9742,
  '{"monday": "8:00 AM - 4:00 PM", "tuesday": "8:00 AM - 4:00 PM", "wednesday": "8:00 AM - 4:00 PM", "thursday": "8:00 AM - 4:00 PM", "friday": "8:00 AM - 4:00 PM", "saturday": "8:00 AM - 12:00 PM", "sunday": "Closed"}'::jsonb,
  '+94 11 241 1234',
  '',
  ARRAY['Wheelchair accessible entrance', 'Ramps', 'Accessible service counter'],
  true,
  ARRAY[],
  (SELECT id FROM users LIMIT 1)
);

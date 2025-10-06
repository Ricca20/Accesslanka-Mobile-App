-- Simple sample data insertion for AccessLanka app

-- Create sample users first
INSERT INTO users (id, email, full_name, phone, date_of_birth, preferences, email_verified, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', 'john.doe@example.com', 'John Doe', '+94771234567', '1990-05-15', '{"theme": "light", "notifications": true}', true, NOW() - INTERVAL '30 days'),
  ('550e8400-e29b-41d4-a716-446655440011', 'priya.silva@example.com', 'Priya Silva', '+94777654321', '1985-08-22', '{"theme": "dark", "notifications": true}', true, NOW() - INTERVAL '25 days'),
  ('550e8400-e29b-41d4-a716-446655440012', 'kamal.perera@example.com', 'Kamal Perera', '+94712345678', '1992-03-10', '{"theme": "light", "notifications": false}', false, NOW() - INTERVAL '20 days'),
  ('550e8400-e29b-41d4-a716-446655440013', 'sara.fernando@example.com', 'Sara Fernando', '+94773456789', '1988-11-30', '{"theme": "system", "notifications": true}', true, NOW() - INTERVAL '15 days'),
  ('550e8400-e29b-41d4-a716-446655440014', 'ravi.mendis@example.com', 'Ravi Mendis', '+94765432109', '1995-07-18', '{"theme": "light", "notifications": true}', true, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Create sample places
INSERT INTO places (id, name, category, description, address, latitude, longitude, accessibility_features, verified, created_by)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Colombo National Museum', 'museums', 'Sri Lanka''s largest museum showcasing the island''s cultural heritage', 'Sir Marcus Fernando Mawatha, Colombo 07', 6.9147, 79.8612, ARRAY['wheelchair_accessible', 'audio_guides', 'tactile_exhibits'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Galle Face Green', 'parks', 'A large urban park stretching along the coast in the heart of Colombo', 'Galle Face Green, Colombo 03', 6.9244, 79.8450, ARRAY['wide_pathways', 'accessible_restrooms', 'level_ground'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Independence Memorial Hall', 'government', 'A national monument built for commemoration of the independence of Sri Lanka', 'Independence Avenue, Colombo 07', 6.9065, 79.8695, ARRAY['ramp_access', 'accessible_parking', 'wide_pathways'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Viharamahadevi Park', 'parks', 'The oldest and largest park in Colombo located in front of the Town Hall', 'Ananda Coomaraswamy Mawatha, Colombo 07', 6.9176, 79.8606, ARRAY['paved_paths', 'accessible_playground', 'braille_signs'], true, '550e8400-e29b-41d4-a716-446655440010')
ON CONFLICT (id) DO NOTHING;

-- Create sample businesses
INSERT INTO businesses (id, name, category, description, address, latitude, longitude, phone, website, accessibility_features, verified, created_by)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440005', 'Ministry of Crab', 'restaurants', 'Award-winning seafood restaurant in a restored Dutch hospital', '2nd Floor, Dutch Hospital Shopping Precinct, Colombo 01', 6.9354, 79.8438, '+94112342200', 'https://ministryofcrab.com', ARRAY['wheelchair_accessible', 'accessible_restrooms', 'elevator_access'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Shangri-La Hotel Colombo', 'hotels', 'Luxury hotel with ocean views and premium amenities', '1 Galle Face Green, Colombo 02', 6.9238, 79.8439, '+94112376111', 'https://shangri-la.com', ARRAY['wheelchair_accessible', 'accessible_rooms', 'elevator_access', 'pool_lift'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Odel', 'shopping', 'Popular department store with multiple floors of fashion and lifestyle products', '5 Alexandra Place, Colombo 07', 6.9138, 79.8567, '+94112682712', 'https://odel.lk', ARRAY['elevator_access', 'wide_aisles', 'accessible_restrooms'], true, '550e8400-e29b-41d4-a716-446655440010')
ON CONFLICT (id) DO NOTHING;

-- Create sample reviews
INSERT INTO reviews (id, place_id, business_id, user_id, overall_rating, accessibility_ratings, title, content, helpful_count, verified, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', NULL, '550e8400-e29b-41d4-a716-446655440010', 4, '{"mobility": 4, "visual": 3, "hearing": 5, "cognitive": 4}', 'Great accessibility features', 'The museum has excellent wheelchair access and audio guides available. Some exhibits could use better lighting for people with visual impairments, but overall very accessible. The staff is helpful and knowledgeable about accessibility features.', 3, true, NOW() - INTERVAL '5 days'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', NULL, '550e8400-e29b-41d4-a716-446655440011', 5, '{"mobility": 5, "visual": 4, "hearing": 4, "cognitive": 5}', 'Perfect for wheelchair users', 'Wide open spaces and level ground make this perfect for wheelchair users. The pathways are well-maintained and there are accessible restrooms. Beautiful sunset views and very peaceful environment.', 2, false, NOW() - INTERVAL '4 days'),
  ('550e8400-e29b-41d4-a716-446655440022', NULL, '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440012', 4, '{"mobility": 4, "visual": 4, "hearing": 3, "cognitive": 4}', 'Excellent food, good accessibility', 'Amazing seafood and the restaurant is mostly accessible. There is elevator access to the second floor and accessible restrooms. Can get quite noisy during peak hours which might be challenging for people with hearing sensitivities.', 2, true, NOW() - INTERVAL '3 days'),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', NULL, '550e8400-e29b-41d4-a716-446655440013', 3, '{"mobility": 3, "visual": 2, "hearing": 4, "cognitive": 3}', 'Historical but needs improvement', 'Beautiful historical site but accessibility could be better. There are some ramps but the signage is not very clear. The grounds are mostly accessible but some areas are challenging for people with mobility issues.', 2, false, NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440024', NULL, '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440014', 5, '{"mobility": 5, "visual": 5, "hearing": 5, "cognitive": 5}', 'Outstanding accessibility', 'This hotel sets the standard for accessibility. Wheelchair accessible rooms, pool lift, excellent lighting, clear signage, and very helpful staff. They clearly understand accessibility needs and cater to them excellently.', 0, true, NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440025', NULL, '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440011', 4, '{"mobility": 4, "visual": 4, "hearing": 4, "cognitive": 3}', 'Good shopping experience', 'Nice department store with elevator access and wide aisles. The layout can be a bit confusing on upper floors but staff are helpful. Good selection of products and accessible facilities throughout.', 1, false, NOW() - INTERVAL '6 hours'),
  ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440004', NULL, '550e8400-e29b-41d4-a716-446655440012', 4, '{"mobility": 4, "visual": 5, "hearing": 4, "cognitive": 4}', 'Great park for families', 'Lovely park with paved paths and an accessible playground. The braille signs are a nice touch. Good seating areas and the playground equipment is designed to be inclusive. Perfect for families with diverse accessibility needs.', 1, true, NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Create sample helpful votes
INSERT INTO review_helpful (review_id, user_id, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '4 days'),
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '3 days'),
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440011', NOW()),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440010', NOW()),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440012', NOW()),
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '2 hours'),
  ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '1 hour')
ON CONFLICT (review_id, user_id) DO NOTHING;

-- Create sample review replies
INSERT INTO review_replies (id, review_id, user_id, content, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', 'Thank you for the detailed review! I had a similar experience with the lighting. Have you tried visiting during afternoon hours when there''s more natural light?', NOW() - INTERVAL '4 days'),
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012', 'Completely agree! The sunset views are amazing and it''s one of the most accessible parks in Colombo.', NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', 'Great review! Did you try their crab curry? Also wondering if they have high chairs that are accessible?', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440014', 'Thanks for mentioning the noise level - that''s really helpful for people with hearing sensitivities.', NOW()),
  ('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440010', 'I visited last week and noticed they''ve added some new signage. Still not perfect but it''s improving!', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;
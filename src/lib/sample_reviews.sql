-- Insert sample review data for AccessLanka app

-- First, let's create some sample places and businesses (if they don't exist)
INSERT INTO places (id, name, category, description, address, latitude, longitude, accessibility_features, verified, created_by)
SELECT * FROM (VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Colombo National Museum', 'museums', 'Sri Lanka''s largest museum showcasing the island''s cultural heritage', 'Sir Marcus Fernando Mawatha, Colombo 07', 6.9147, 79.8612, ARRAY['wheelchair_accessible', 'audio_guides', 'tactile_exhibits'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Galle Face Green', 'parks', 'A large urban park stretching along the coast in the heart of Colombo', 'Galle Face Green, Colombo 03', 6.9244, 79.8450, ARRAY['wide_pathways', 'accessible_restrooms', 'level_ground'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Independence Memorial Hall', 'government', 'A national monument built for commemoration of the independence of Sri Lanka', 'Independence Avenue, Colombo 07', 6.9065, 79.8695, ARRAY['ramp_access', 'accessible_parking', 'wide_pathways'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Viharamahadevi Park', 'parks', 'The oldest and largest park in Colombo located in front of the Town Hall', 'Ananda Coomaraswamy Mawatha, Colombo 07', 6.9176, 79.8606, ARRAY['paved_paths', 'accessible_playground', 'braille_signs'], true, '550e8400-e29b-41d4-a716-446655440010')
) AS new_places(id, name, category, description, address, latitude, longitude, accessibility_features, verified, created_by)
WHERE NOT EXISTS (SELECT 1 FROM places WHERE places.id = new_places.id);

INSERT INTO businesses (id, name, category, description, address, latitude, longitude, phone, website, accessibility_features, verified, created_by)
SELECT * FROM (VALUES 
  ('550e8400-e29b-41d4-a716-446655440005', 'Ministry of Crab', 'restaurants', 'Award-winning seafood restaurant in a restored Dutch hospital', '2nd Floor, Dutch Hospital Shopping Precinct, Colombo 01', 6.9354, 79.8438, '+94112342200', 'https://ministryofcrab.com', ARRAY['wheelchair_accessible', 'accessible_restrooms', 'elevator_access'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Shangri-La Hotel Colombo', 'hotels', 'Luxury hotel with ocean views and premium amenities', '1 Galle Face Green, Colombo 02', 6.9238, 79.8439, '+94112376111', 'https://shangri-la.com', ARRAY['wheelchair_accessible', 'accessible_rooms', 'elevator_access', 'pool_lift'], true, '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Odel', 'shopping', 'Popular department store with multiple floors of fashion and lifestyle products', '5 Alexandra Place, Colombo 07', 6.9138, 79.8567, '+94112682712', 'https://odel.lk', ARRAY['elevator_access', 'wide_aisles', 'accessible_restrooms'], true, '550e8400-e29b-41d4-a716-446655440010')
) AS new_businesses(id, name, category, description, address, latitude, longitude, phone, website, accessibility_features, verified, created_by)
WHERE NOT EXISTS (SELECT 1 FROM businesses WHERE businesses.id = new_businesses.id);

-- Create sample users for reviews (if they don't exist)
-- Note: In a real app, these would be created through the auth system
INSERT INTO users (id, email, full_name, verified)
SELECT * FROM (VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', 'priya.silva@email.com', 'Priya Silva', true),
  ('550e8400-e29b-41d4-a716-446655440011', 'kamal.perera@email.com', 'Kamal Perera', false),
  ('550e8400-e29b-41d4-a716-446655440012', 'nisali.fernando@email.com', 'Nisali Fernando', true),
  ('550e8400-e29b-41d4-a716-446655440013', 'rajith.kumar@email.com', 'Rajith Kumar', false),
  ('550e8400-e29b-41d4-a716-446655440014', 'amara.jayasinghe@email.com', 'Amara Jayasinghe', true)
) AS new_users(id, email, full_name, verified)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.id = new_users.id);

-- Insert sample reviews
INSERT INTO reviews (id, place_id, business_id, user_id, overall_rating, accessibility_ratings, title, content, helpful_count, verified, created_at)
SELECT * FROM (VALUES 
  -- Museum review
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', NULL, '550e8400-e29b-41d4-a716-446655440010', 4, '{"mobility": 4, "visual": 3, "hearing": 5, "cognitive": 4}'::jsonb, 'Great accessibility features', 'The museum has excellent wheelchair access and audio guides available. Some exhibits could use better lighting for people with visual impairments, but overall very accessible. The staff is helpful and knowledgeable about accessibility features.', 12, true, NOW() - INTERVAL '5 days'),
  
  -- Galle Face Green review
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', NULL, '550e8400-e29b-41d4-a716-446655440011', 5, '{"mobility": 5, "visual": 4, "hearing": 4, "cognitive": 5}'::jsonb, 'Perfect for wheelchair users', 'Wide open spaces, easy to navigate. Perfect for wheelchair users. Beautiful sunset views and the pathways are well-maintained. Great place for families with accessibility needs.', 8, false, NOW() - INTERVAL '3 days'),
  
  -- Ministry of Crab review
  ('550e8400-e29b-41d4-a716-446655440022', NULL, '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440012', 4, '{"mobility": 4, "visual": 4, "hearing": 3, "cognitive": 4}'::jsonb, 'Excellent food, good accessibility', 'Amazing seafood and the restaurant is wheelchair accessible. The elevator works well and staff is accommodating. However, it can get quite noisy during peak hours which might be challenging for those with hearing sensitivity.', 15, true, NOW() - INTERVAL '1 day'),
  
  -- Shangri-La Hotel review
  ('550e8400-e29b-41d4-a716-446655440023', NULL, '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440013', 5, '{"mobility": 5, "visual": 4, "hearing": 4, "cognitive": 5}'::jsonb, 'Outstanding accessibility standards', 'This hotel sets the standard for accessibility in Colombo. Multiple accessible rooms, pool lift available, and staff trained in disability awareness. Highly recommend for travelers with mobility needs.', 20, false, NOW() - INTERVAL '2 days'),
  
  -- Independence Memorial Hall review
  ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', NULL, '550e8400-e29b-41d4-a716-446655440014', 3, '{"mobility": 3, "visual": 2, "hearing": 4, "cognitive": 3}'::jsonb, 'Historic site with some limitations', 'Beautiful historic monument but accessibility could be improved. There are ramps but they are quite steep. Limited signage for people with visual impairments. Still worth a visit for the historical significance.', 6, true, NOW() - INTERVAL '4 days'),
  
  -- Viharamahadevi Park review
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440004', NULL, '550e8400-e29b-41d4-a716-446655440010', 4, '{"mobility": 4, "visual": 4, "hearing": 4, "cognitive": 4}'::jsonb, 'Family-friendly and accessible', 'Great park for families with children who have disabilities. The playground has accessible equipment and the paths are well-paved. Some areas have braille signs which is excellent. Clean accessible restrooms available.', 10, true, NOW() - INTERVAL '6 days'),
  
  -- Odel review
  ('550e8400-e29b-41d4-a716-446655440026', NULL, '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440011', 4, '{"mobility": 4, "visual": 3, "hearing": 4, "cognitive": 3}'::jsonb, 'Good shopping accessibility', 'Multiple floors accessible by elevator, wide aisles for wheelchairs. Could improve lighting in some sections and reduce background music volume. Staff is helpful when asked for assistance.', 7, false, NOW() - INTERVAL '7 days')
) AS new_reviews(id, place_id, business_id, user_id, overall_rating, accessibility_ratings, title, content, helpful_count, verified, created_at)
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE reviews.id = new_reviews.id);

-- Insert sample review helpful votes
INSERT INTO review_helpful (review_id, user_id, created_at)
SELECT * FROM (VALUES 
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '4 days'),
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '3 days'),
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440011', NOW()),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440010', NOW()),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440012', NOW())
) AS new_helpful(review_id, user_id, created_at)
WHERE NOT EXISTS (SELECT 1 FROM review_helpful WHERE review_helpful.review_id = new_helpful.review_id AND review_helpful.user_id = new_helpful.user_id);

-- Insert sample review replies
INSERT INTO review_replies (id, review_id, user_id, content, created_at)
SELECT * FROM (VALUES 
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', 'Thank you for the detailed review! I had a similar experience with the lighting. Have you tried visiting during afternoon hours when there''s more natural light?', NOW() - INTERVAL '4 days'),
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012', 'Completely agree! The sunset views are amazing and it''s one of the most accessible parks in Colombo.', NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', 'Great review! Did you try their crab curry? Also wondering if they have high chairs that are accessible?', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'Thanks for mentioning the noise level - that''s really helpful for people with hearing sensitivities.', NOW()),
  ('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440010', 'I visited last week and noticed they''ve added some new signage. Still not perfect but it''s improving!', NOW() - INTERVAL '3 days')
) AS new_replies(id, review_id, user_id, content, created_at)
WHERE NOT EXISTS (SELECT 1 FROM review_replies WHERE review_replies.id = new_replies.id);
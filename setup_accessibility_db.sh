#!/bin/bash

# Accessibility Contributions Database Setup Script
# Run this script to set up the accessibility contributions tables in your Supabase project

echo "Setting up accessibility contributions database tables..."

# Check if we have the necessary environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    echo "Example:"
    echo "export SUPABASE_URL=https://your-project-ref.supabase.co"
    echo "export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    exit 1
fi

# Run the SQL setup file
echo "Creating accessibility contribution tables..."
psql "$SUPABASE_URL" -c "$(cat src/lib/setup_accessibility_tables.sql)"

if [ $? -eq 0 ]; then
    echo "✅ Accessibility contribution tables created successfully!"
    echo ""
    echo "The following tables are now available:"
    echo "- accessibility_photos"
    echo "- accessibility_reviews" 
    echo "- accessibility_ratings"
    echo ""
    echo "You can now use the accessibility contribution features in your app!"
else
    echo "❌ Error creating tables. Please check your database connection and permissions."
    exit 1
fi
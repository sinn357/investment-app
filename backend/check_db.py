#!/usr/bin/env python3
"""Database migration check script"""

import os
from dotenv import load_dotenv
from services.postgres_database_service import PostgresDatabaseService

# Load environment variables
load_dotenv()

print('=== Database Migration Check ===')
db_url = os.getenv('DATABASE_URL', 'Not found')
print(f'DATABASE_URL: {db_url[:60]}...')

# Initialize database service
db_service = PostgresDatabaseService()
print(f'\nDatabase service initialized successfully')
print(f'Using: PostgreSQL')

# Test connection
print('\nTesting database connection...')
try:
    result = db_service.get_all_rawdata()
    print(f'Connection successful! Found {len(result)} indicators in database')

    # Show sample data
    if result:
        print('\nSample data (first 3 indicators):')
        for i, indicator in enumerate(result[:3]):
            print(f"{i+1}. {indicator.get('indicator', 'Unknown')}: {indicator.get('latest_release', {}).get('date', 'N/A')}")
except Exception as e:
    print(f'Error: {e}')

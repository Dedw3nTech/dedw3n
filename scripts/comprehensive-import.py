#!/usr/bin/env python3
"""
Comprehensive import - systematic batch processing
"""
import pandas as pd
import psycopg2
import os
from urllib.parse import urlparse
import time

def connect_to_database():
    database_url = os.environ.get('DATABASE_URL')
    url_parts = urlparse(database_url)
    return psycopg2.connect(
        host=url_parts.hostname,
        port=url_parts.port,
        database=url_parts.path[1:],
        user=url_parts.username,
        password=url_parts.password
    )

def map_regions(country):
    mapping = {
        'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
        'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
        'United Kingdom': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe',
        'Russian Federation': 'Europe', 'Netherlands': 'Europe', 'Belgium': 'Europe',
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'Philippines': 'Asia',
        'Indonesia': 'Asia', 'Pakistan': 'Asia', 'Bangladesh': 'Asia', 'Vietnam': 'Asia',
        'Thailand': 'Asia', 'Myanmar': 'Asia', 'South Korea': 'Asia', 'Malaysia': 'Asia',
        'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
        'Peru': 'South America', 'Venezuela': 'South America', 'Chile': 'South America',
        'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa',
        'Kenya': 'Africa', 'Tanzania': 'Africa', 'Morocco': 'Africa', 'Algeria': 'Africa',
        'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Papua New Guinea': 'Oceania'
    }
    return mapping.get(country, 'Other')

# Comprehensive processing
excel_file = "attached_assets/geonames-all-cities-with-a-population-1000_1756233947555.xlsx"
df = pd.read_excel(excel_file)

conn = connect_to_database()
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM cities")
start_count = cursor.fetchone()[0]
print(f"Starting comprehensive import with {start_count:,} cities")

# Process from row 115,000 onwards
start_row = 115000
batch_size = 1500  # Larger batches for efficiency
max_batches = 10   # 15,000 rows

total_added = 0
for batch in range(max_batches):
    row_start = start_row + (batch * batch_size)
    row_end = min(row_start + batch_size, len(df))
    
    if row_start >= len(df):
        print(f"Reached end of dataset at row {row_start:,}")
        break
        
    chunk = df.iloc[row_start:row_end]
    print(f"Processing batch {batch+1}/10: rows {row_start:,}-{row_end:,}")
    
    cities_data = []
    processed = 0
    
    for _, row in chunk.iterrows():
        try:
            name = str(row['Name']).strip() if pd.notna(row['Name']) else None
            country = str(row['Country name EN']).strip() if pd.notna(row['Country name EN']) else None
            
            if not name or not country:
                continue
                
            pop = None
            if pd.notna(row['Population']):
                try:
                    pop = int(float(row['Population']))
                    if pop < 1000:  # Only cities with 1000+ population
                        continue
                except:
                    continue
            
            lat = lng = None
            if pd.notna(row['Coordinates']):
                try:
                    coords = str(row['Coordinates']).strip()
                    if ',' in coords:
                        lat_str, lng_str = coords.split(',', 1)
                        lat = float(lat_str.strip())
                        lng = float(lng_str.strip())
                except:
                    pass
            
            region = map_regions(country)
            cities_data.append((name, country, region, pop, lat, lng, None, False))
            processed += 1
            
        except:
            continue
    
    # Bulk insert
    if cities_data:
        cursor.executemany("""
            INSERT INTO cities (name, country, region, population, latitude, longitude, timezone, is_capital)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, cities_data)
        conn.commit()
        
        total_added += len(cities_data)
        print(f"  → Added {len(cities_data):,} cities")
    
    time.sleep(0.1)

# Final statistics
cursor.execute("SELECT COUNT(*) FROM cities")
final_count = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(DISTINCT country) FROM cities")
countries = cursor.fetchone()[0]

end_row = start_row + (max_batches * batch_size)
progress = (min(end_row, len(df)) / len(df)) * 100

print(f"\n🚀 COMPREHENSIVE IMPORT COMPLETE!")
print(f"Cities added this session: {total_added:,}")
print(f"Total cities in database: {final_count:,}")
print(f"Countries represented: {countries}")
print(f"Dataset progress: {progress:.1f}% ({min(end_row, len(df)):,}/{len(df):,})")

conn.close()
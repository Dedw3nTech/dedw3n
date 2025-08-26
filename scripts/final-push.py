#!/usr/bin/env python3
"""
Final push - continue from row 28,000 with optimized processing
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
    return {
        'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
        'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
        'United Kingdom': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe',
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'Philippines': 'Asia',
        'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
        'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa',
        'Australia': 'Oceania', 'New Zealand': 'Oceania'
    }.get(country, 'Other')

# Continue from row 28,000
excel_file = "attached_assets/geonames-all-cities-with-a-population-1000_1756233947555.xlsx"
df = pd.read_excel(excel_file)

conn = connect_to_database()
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM cities")
current_count = cursor.fetchone()[0]
print(f"Starting with: {current_count:,} cities")

# Process from 28,000 onwards
start_row = 28000
batch_size = 3000  # Even larger batches
max_batches = 40   # Process 120,000 rows

total_added = 0
for batch in range(max_batches):
    row_start = start_row + (batch * batch_size)
    row_end = min(row_start + batch_size, len(df))
    
    if row_start >= len(df):
        break
        
    chunk = df.iloc[row_start:row_end]
    print(f"Batch {batch+1}: rows {row_start:,}-{row_end:,}")
    
    cities_data = []
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
                    if pop < 1000:
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
            
        except:
            continue
    
    if cities_data:
        cursor.executemany("""
            INSERT INTO cities (name, country, region, population, latitude, longitude, timezone, is_capital)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, cities_data)
        conn.commit()
        
        total_added += len(cities_data)
        print(f"  → Added {len(cities_data):,} cities")
    
    if (batch + 1) % 10 == 0:
        cursor.execute("SELECT COUNT(*) FROM cities")
        current = cursor.fetchone()[0]
        progress = ((row_end) / len(df)) * 100
        print(f"  📈 Milestone: {current:,} total cities ({progress:.1f}% complete)")

cursor.execute("SELECT COUNT(*) FROM cities")
final_count = cursor.fetchone()[0]

print(f"\n🚀 SESSION COMPLETE!")
print(f"Added this session: {total_added:,}")
print(f"Total cities: {final_count:,}")

# Show progress
end_row = start_row + (max_batches * batch_size)
progress_pct = (min(end_row, len(df)) / len(df)) * 100
print(f"Dataset progress: {progress_pct:.1f}% ({min(end_row, len(df)):,}/{len(df):,})")

conn.close()
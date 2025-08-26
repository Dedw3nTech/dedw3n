#!/usr/bin/env python3
"""
Continue importing more batches from where we left off
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
    region_mapping = {
        'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
        'United Kingdom': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe', 'Netherlands': 'Europe',
        'Russian Federation': 'Europe', 'Ukraine': 'Europe', 'Turkey': 'Asia',
        'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'Philippines': 'Asia',
        'Indonesia': 'Asia', 'Pakistan': 'Asia', 'Bangladesh': 'Asia', 'Vietnam': 'Asia',
        'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
        'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa',
        'Australia': 'Oceania', 'New Zealand': 'Oceania'
    }
    return region_mapping.get(country, 'Other')

# Continue from batch 11 (row 12,000)
excel_file = "attached_assets/geonames-all-cities-with-a-population-1000_1756233947555.xlsx"
df = pd.read_excel(excel_file)

conn = connect_to_database()
cursor = conn.cursor()

# Get current count
cursor.execute("SELECT COUNT(*) FROM cities")
current_count = cursor.fetchone()[0]
print(f"Current cities in database: {current_count:,}")

# Continue from batch 11 (row 12,000) and process 40 more batches
batch_size = 1000
start_row = 12000
end_row = min(start_row + (40 * batch_size), len(df))  # Process 40,000 more rows

print(f"Processing rows {start_row:,} to {end_row:,}")

batch_num = 11
total_inserted = 0

for i in range(start_row, end_row, batch_size):
    chunk = df.iloc[i:i+batch_size]
    
    print(f"Batch {batch_num} (rows {i:,}-{min(i+batch_size, len(df)):,})...")
    
    cities_data = []
    for _, row in chunk.iterrows():
        try:
            city_name = str(row['Name']).strip() if pd.notna(row['Name']) else None
            country = str(row['Country name EN']).strip() if pd.notna(row['Country name EN']) else None
            
            if not city_name or not country:
                continue
            
            population = None
            if pd.notna(row['Population']):
                try:
                    population = int(float(row['Population']))
                    if population < 1000:
                        continue
                except:
                    pass
            
            latitude = longitude = None
            if pd.notna(row['Coordinates']):
                try:
                    coords = str(row['Coordinates']).strip()
                    if ',' in coords:
                        lat_str, lng_str = coords.split(',', 1)
                        latitude = float(lat_str.strip())
                        longitude = float(lng_str.strip())
                except:
                    pass
            
            region = map_regions(country)
            
            cities_data.append((
                city_name, country, region, population, latitude, longitude, None, False
            ))
            
        except Exception:
            continue
    
    if cities_data:
        insert_sql = """
        INSERT INTO cities (name, country, region, population, latitude, longitude, timezone, is_capital)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
        """
        cursor.executemany(insert_sql, cities_data)
        conn.commit()
        
        total_inserted += len(cities_data)
        print(f"  → Inserted {len(cities_data):,} cities")
    
    batch_num += 1
    
    # Progress update every 10 batches
    if (batch_num - 11) % 10 == 0:
        cursor.execute("SELECT COUNT(*) FROM cities")
        current_total = cursor.fetchone()[0]
        print(f"Progress: {batch_num - 11} batches completed, {current_total:,} total cities")
    
    time.sleep(0.1)

# Final update
cursor.execute("SELECT COUNT(*) FROM cities")
final_count = cursor.fetchone()[0]

print(f"\nSession complete!")
print(f"Cities inserted this session: {total_inserted:,}")
print(f"Total cities now: {final_count:,}")
print(f"Progress: {end_row:,}/{len(df):,} rows processed ({(end_row/len(df)*100):.1f}%)")

conn.close()
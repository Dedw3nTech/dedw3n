#!/usr/bin/env python3
"""
Continue city import from where we left off
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
        # Major mappings
        'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
        'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
        'United Kingdom': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe',
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'Philippines': 'Asia',
        'Russian Federation': 'Europe', 'Ukraine': 'Europe',
        'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
        'Nigeria': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa',
        'Australia': 'Oceania', 'New Zealand': 'Oceania'
    }
    return region_mapping.get(country, 'Other')

# Read Excel and continue from batch 11
excel_file = "attached_assets/geonames-all-cities-with-a-population-1000_1756233947555.xlsx"
df = pd.read_excel(excel_file)

conn = connect_to_database()
cursor = conn.cursor()

# Process batches 11-20 (5000 more cities)
batch_size = 500
start_batch = 11
end_batch = 21

for batch_num in range(start_batch, end_batch):
    start_idx = (batch_num - 1) * batch_size
    end_idx = start_idx + batch_size
    
    if start_idx >= len(df):
        break
        
    chunk = df.iloc[start_idx:end_idx]
    print(f"Processing batch {batch_num} ({start_idx}-{end_idx})...")
    
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
                    if population < 1000:  # Skip very small cities
                        continue
                except:
                    pass
            
            # Parse coordinates
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
        print(f"Batch {batch_num}: Inserted {len(cities_data)} cities")
    
    time.sleep(0.3)  # Small delay

# Final stats
cursor.execute("SELECT COUNT(*) FROM cities")
total = cursor.fetchone()[0]
print(f"Total cities in database: {total}")

conn.close()
print("Additional import completed!")
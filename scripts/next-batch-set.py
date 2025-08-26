#!/usr/bin/env python3
"""
Continue importing next set of batches
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
        'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
        'United Kingdom': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe', 'Netherlands': 'Europe',
        'Russian Federation': 'Europe', 'Ukraine': 'Europe', 'Turkey': 'Asia',
        'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'Philippines': 'Asia',
        'Indonesia': 'Asia', 'Pakistan': 'Asia', 'Bangladesh': 'Asia', 'Vietnam': 'Asia',
        'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
        'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa',
        'Australia': 'Oceania', 'New Zealand': 'Oceania'
    }.get(country, 'Other')

# Continue from row 17,000 (where we likely left off)
excel_file = "attached_assets/geonames-all-cities-with-a-population-1000_1756233947555.xlsx"
df = pd.read_excel(excel_file)

conn = connect_to_database()
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM cities")
current_count = cursor.fetchone()[0]
print(f"Current cities: {current_count:,}")

# Process next 30 batches (30,000 rows)
batch_size = 1000
start_row = 17000
end_row = min(start_row + (30 * batch_size), len(df))

print(f"Processing rows {start_row:,} to {end_row:,}")

batch_num = 18
for i in range(start_row, end_row, batch_size):
    chunk = df.iloc[i:i+batch_size]
    
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
            cities_data.append((city_name, country, region, population, latitude, longitude, None, False))
            
        except:
            continue
    
    if cities_data:
        insert_sql = """
        INSERT INTO cities (name, country, region, population, latitude, longitude, timezone, is_capital)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
        """
        cursor.executemany(insert_sql, cities_data)
        conn.commit()
        print(f"Batch {batch_num} → {len(cities_data):,} cities")
    
    batch_num += 1
    
    if batch_num % 10 == 0:
        cursor.execute("SELECT COUNT(*) FROM cities")
        current_total = cursor.fetchone()[0]
        print(f"Milestone: {current_total:,} total cities")
    
    time.sleep(0.05)

cursor.execute("SELECT COUNT(*) FROM cities")
final_count = cursor.fetchone()[0]

print(f"\nUpdate: {final_count:,} total cities")
print(f"Progress: {end_row:,}/{len(df):,} ({(end_row/len(df)*100):.1f}%)")
conn.close()
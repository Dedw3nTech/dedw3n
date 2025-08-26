#!/usr/bin/env python3
"""
Massive batch import - process large chunks efficiently
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
        'United Kingdom': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe', 'Netherlands': 'Europe',
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'Philippines': 'Asia', 'Indonesia': 'Asia',
        'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
        'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa',
        'Australia': 'Oceania', 'New Zealand': 'Oceania'
    }
    return mapping.get(country, 'Other')

# Load dataset
excel_file = "attached_assets/geonames-all-cities-with-a-population-1000_1756233947555.xlsx"
print("Loading Excel...")
df = pd.read_excel(excel_file)
print(f"Dataset: {len(df):,} rows")

conn = connect_to_database()
cursor = conn.cursor()

# Get current progress
cursor.execute("SELECT COUNT(*) FROM cities")
current_count = cursor.fetchone()[0]
print(f"Current cities: {current_count:,}")

# Process from row 20,000 onwards in large batches
batch_size = 2000  # Larger batches for efficiency
start_row = 20000
max_batches = 50   # Process 100,000 rows (50 x 2000)

total_inserted = 0
batch_num = 1

for i in range(start_row, min(start_row + (max_batches * batch_size), len(df)), batch_size):
    chunk = df.iloc[i:i+batch_size]
    
    print(f"Batch {batch_num}: rows {i:,}-{min(i+batch_size, len(df)):,}")
    
    cities_data = []
    processed = 0
    
    for _, row in chunk.iterrows():
        try:
            city_name = str(row['Name']).strip() if pd.notna(row['Name']) else None
            country = str(row['Country name EN']).strip() if pd.notna(row['Country name EN']) else None
            
            if not city_name or not country:
                continue
            
            population = None
            if pd.notna(row['Population']):
                try:
                    pop = int(float(row['Population']))
                    if pop >= 1000:  # Only cities with 1000+ population
                        population = pop
                    else:
                        continue
                except:
                    continue
            
            latitude = longitude = None
            if pd.notna(row['Coordinates']):
                try:
                    coords = str(row['Coordinates']).strip()
                    if ',' in coords:
                        parts = coords.split(',', 1)
                        latitude = float(parts[0].strip())
                        longitude = float(parts[1].strip())
                except:
                    pass
            
            region = map_regions(country)
            cities_data.append((city_name, country, region, population, latitude, longitude, None, False))
            processed += 1
            
        except:
            continue
    
    # Bulk insert
    if cities_data:
        insert_sql = """
        INSERT INTO cities (name, country, region, population, latitude, longitude, timezone, is_capital)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
        """
        cursor.executemany(insert_sql, cities_data)
        conn.commit()
        
        total_inserted += len(cities_data)
        print(f"  ✓ Inserted {len(cities_data):,} cities")
    
    batch_num += 1
    
    # Progress check every 10 batches
    if batch_num % 10 == 0:
        cursor.execute("SELECT COUNT(*) FROM cities")
        current_total = cursor.fetchone()[0]
        progress_pct = ((start_row + (batch_num * batch_size)) / len(df)) * 100
        print(f"  📊 Progress: {current_total:,} total cities, {progress_pct:.1f}% of dataset")
    
    time.sleep(0.02)  # Minimal delay

# Final statistics
cursor.execute("SELECT COUNT(*) FROM cities")
final_total = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(DISTINCT country) FROM cities")
countries = cursor.fetchone()[0]

print(f"\n🎉 BATCH SESSION COMPLETE!")
print(f"Cities added this session: {total_inserted:,}")
print(f"Total cities in database: {final_total:,}")
print(f"Countries represented: {countries}")

# Show largest countries by city count
print(f"\nTop countries by city count:")
cursor.execute("""
    SELECT country, COUNT(*) as count 
    FROM cities 
    GROUP BY country 
    ORDER BY count DESC 
    LIMIT 8
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]:,}")

conn.close()
print(f"\nDataset progress: {(start_row + (max_batches * batch_size)):,}/{len(df):,} rows processed")
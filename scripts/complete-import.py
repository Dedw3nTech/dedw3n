#!/usr/bin/env python3
"""
Complete City Import - Process all remaining batches
"""
import pandas as pd
import psycopg2
import os
from urllib.parse import urlparse
import time
import sys

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
    """Enhanced region mapping for all countries"""
    region_mapping = {
        # Europe
        'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
        'United Kingdom': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe', 'Netherlands': 'Europe',
        'Belgium': 'Europe', 'Greece': 'Europe', 'Portugal': 'Europe', 'Czech Republic': 'Europe',
        'Hungary': 'Europe', 'Sweden': 'Europe', 'Austria': 'Europe', 'Bulgaria': 'Europe',
        'Croatia': 'Europe', 'Denmark': 'Europe', 'Finland': 'Europe', 'Slovakia': 'Europe',
        'Norway': 'Europe', 'Ireland': 'Europe', 'Lithuania': 'Europe', 'Slovenia': 'Europe',
        'Latvia': 'Europe', 'Estonia': 'Europe', 'Malta': 'Europe', 'Luxembourg': 'Europe',
        'Switzerland': 'Europe', 'Iceland': 'Europe', 'Albania': 'Europe', 'Serbia': 'Europe',
        'Russian Federation': 'Europe', 'Ukraine': 'Europe', 'Belarus': 'Europe',
        'Bosnia and Herzegovina': 'Europe', 'Montenegro': 'Europe', 'Macedonia': 'Europe',
        
        # North America
        'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
        'Guatemala': 'North America', 'Cuba': 'North America', 'Haiti': 'North America',
        'Dominican Republic': 'North America', 'Honduras': 'North America', 'Nicaragua': 'North America',
        'Costa Rica': 'North America', 'Panama': 'North America', 'Jamaica': 'North America',
        'El Salvador': 'North America', 'Belize': 'North America', 'Bahamas': 'North America',
        
        # Asia
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia',
        'Indonesia': 'Asia', 'Pakistan': 'Asia', 'Bangladesh': 'Asia', 'Philippines': 'Asia',
        'Vietnam': 'Asia', 'Turkey': 'Asia', 'Iran, Islamic Rep. of': 'Asia', 'Iraq': 'Asia',
        'Thailand': 'Asia', 'Myanmar': 'Asia', 'North Korea': 'Asia', 'Afghanistan': 'Asia',
        'Saudi Arabia': 'Asia', 'Malaysia': 'Asia', 'Syria': 'Asia', 'Sri Lanka': 'Asia',
        'Cambodia': 'Asia', 'Jordan': 'Asia', 'Azerbaijan': 'Asia', 'Nepal': 'Asia',
        'Yemen': 'Asia', 'Lebanon': 'Asia', 'Singapore': 'Asia', 'Mongolia': 'Asia',
        
        # Africa
        'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa',
        'Kenya': 'Africa', 'Tanzania': 'Africa', 'Algeria': 'Africa', 'Morocco': 'Africa',
        'Angola': 'Africa', 'Ghana': 'Africa', 'Mozambique': 'Africa', 'Madagascar': 'Africa',
        'Cameroon': 'Africa', 'Ivory Coast': 'Africa', 'Niger': 'Africa', 'Burkina Faso': 'Africa',
        'Mali': 'Africa', 'Malawi': 'Africa', 'Zambia': 'Africa', 'Senegal': 'Africa',
        'Chad': 'Africa', 'Somalia': 'Africa', 'Zimbabwe': 'Africa', 'Guinea': 'Africa',
        'Rwanda': 'Africa', 'Benin': 'Africa', 'Tunisia': 'Africa', 'Burundi': 'Africa',
        'South Sudan': 'Africa', 'Togo': 'Africa', 'Sierra Leone': 'Africa', 'Libya': 'Africa',
        
        # South America
        'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
        'Peru': 'South America', 'Venezuela': 'South America', 'Chile': 'South America',
        'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
        'Uruguay': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
        
        # Oceania
        'Australia': 'Oceania', 'Papua New Guinea': 'Oceania', 'New Zealand': 'Oceania',
        'Fiji': 'Oceania', 'Solomon Islands': 'Oceania', 'Vanuatu': 'Oceania',
        'New Caledonia': 'Oceania', 'French Polynesia': 'Oceania', 'Samoa': 'Oceania',
    }
    
    return region_mapping.get(country, 'Other')

def process_full_dataset():
    """Process the complete Excel dataset"""
    excel_file = "attached_assets/geonames-all-cities-with-a-population-1000_1756233947555.xlsx"
    
    print("Loading complete Excel dataset...")
    df = pd.read_excel(excel_file)
    print(f"Total rows: {len(df):,}")
    
    conn = connect_to_database()
    cursor = conn.cursor()
    
    # Get current count
    cursor.execute("SELECT COUNT(*) FROM cities")
    current_count = cursor.fetchone()[0]
    print(f"Current cities in database: {current_count:,}")
    
    # Process in larger batches for efficiency
    batch_size = 1000
    total_processed = 0
    total_inserted = 0
    batch_num = 1
    
    # Start from where we left off (skip first ~2000 already processed)
    start_idx = 2000
    
    for i in range(start_idx, len(df), batch_size):
        chunk = df.iloc[i:i+batch_size]
        
        print(f"Processing batch {batch_num} (rows {i:,}-{min(i+batch_size, len(df)):,})...")
        
        cities_data = []
        processed = 0
        
        for _, row in chunk.iterrows():
            try:
                # Extract data from Excel columns
                city_name = str(row['Name']).strip() if pd.notna(row['Name']) else None
                country = str(row['Country name EN']).strip() if pd.notna(row['Country name EN']) else None
                
                if not city_name or not country:
                    continue
                
                # Get population (filter out very small cities)
                population = None
                if pd.notna(row['Population']):
                    try:
                        population = int(float(row['Population']))
                        # Skip cities with population < 1000 to keep database manageable
                        if population < 1000:
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
                processed += 1
                
            except Exception:
                continue
        
        # Batch insert
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
        
        total_processed += processed
        batch_num += 1
        
        # Progress update every 10 batches
        if batch_num % 10 == 0:
            cursor.execute("SELECT COUNT(*) FROM cities")
            current_total = cursor.fetchone()[0]
            print(f"Progress: {batch_num} batches completed, {current_total:,} total cities in database")
        
        # Small delay to prevent overwhelming the database
        time.sleep(0.2)
        
        # Limit to prevent timeout (process 100 batches = ~100K cities)
        if batch_num > 100:
            print("Reached batch limit for this session...")
            break
    
    # Final statistics
    cursor.execute("SELECT COUNT(*) FROM cities")
    final_total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT country) FROM cities")
    total_countries = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT region) FROM cities")
    total_regions = cursor.fetchone()[0]
    
    print(f"\n=== IMPORT COMPLETED ===")
    print(f"Cities processed this session: {total_processed:,}")
    print(f"Cities inserted this session: {total_inserted:,}")
    print(f"Total cities in database: {final_total:,}")
    print(f"Total countries: {total_countries}")
    print(f"Total regions: {total_regions}")
    
    # Show top countries by city count
    print(f"\nTop 10 countries by city count:")
    cursor.execute("""
        SELECT country, COUNT(*) as city_count 
        FROM cities 
        GROUP BY country 
        ORDER BY city_count DESC 
        LIMIT 10
    """)
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]:,} cities")
    
    # Show largest cities
    print(f"\nLargest cities by population:")
    cursor.execute("""
        SELECT name, country, population 
        FROM cities 
        WHERE population IS NOT NULL 
        ORDER BY population DESC 
        LIMIT 10
    """)
    for row in cursor.fetchall():
        print(f"  {row[0]}, {row[1]}: {row[2]:,}")
    
    conn.close()
    print("\nImport session completed successfully!")

if __name__ == "__main__":
    try:
        process_full_dataset()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
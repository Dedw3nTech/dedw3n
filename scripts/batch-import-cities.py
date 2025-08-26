#!/usr/bin/env python3
"""
Batch City Data Import Script
Processes Excel file in smaller chunks to avoid timeouts
"""

import pandas as pd
import psycopg2
import os
from urllib.parse import urlparse
import sys
import time

def connect_to_database():
    """Connect to PostgreSQL database using DATABASE_URL"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not found")
    
    url_parts = urlparse(database_url)
    
    conn = psycopg2.connect(
        host=url_parts.hostname,
        port=url_parts.port,
        database=url_parts.path[1:],
        user=url_parts.username,
        password=url_parts.password
    )
    return conn

def map_regions(country):
    """Map countries to regions"""
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
        
        # North America
        'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
        'Guatemala': 'North America', 'Cuba': 'North America', 'Haiti': 'North America',
        'Dominican Republic': 'North America', 'Honduras': 'North America', 'Nicaragua': 'North America',
        'Costa Rica': 'North America', 'Panama': 'North America', 'Jamaica': 'North America',
        
        # Asia
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia',
        'Indonesia': 'Asia', 'Pakistan': 'Asia', 'Bangladesh': 'Asia', 'Philippines': 'Asia',
        'Vietnam': 'Asia', 'Turkey': 'Asia', 'Iran': 'Asia', 'Iraq': 'Asia',
        'Thailand': 'Asia', 'Myanmar': 'Asia', 'South Korea': 'Asia', 'North Korea': 'Asia',
        'Afghanistan': 'Asia', 'Saudi Arabia': 'Asia', 'Malaysia': 'Asia', 'Syria': 'Asia',
        'Sri Lanka': 'Asia', 'Cambodia': 'Asia', 'Jordan': 'Asia', 'Azerbaijan': 'Asia',
        
        # Africa
        'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa',
        'Kenya': 'Africa', 'Tanzania': 'Africa', 'Algeria': 'Africa', 'Morocco': 'Africa',
        'Angola': 'Africa', 'Ghana': 'Africa', 'Mozambique': 'Africa', 'Madagascar': 'Africa',
        'Cameroon': 'Africa', 'Ivory Coast': 'Africa', 'Niger': 'Africa', 'Burkina Faso': 'Africa',
        'Mali': 'Africa', 'Malawi': 'Africa', 'Zambia': 'Africa', 'Senegal': 'Africa',
        
        # South America
        'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
        'Peru': 'South America', 'Venezuela': 'South America', 'Chile': 'South America',
        'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
        'Uruguay': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
        
        # Oceania
        'Australia': 'Oceania', 'Papua New Guinea': 'Oceania', 'New Zealand': 'Oceania',
        'Fiji': 'Oceania', 'Solomon Islands': 'Oceania', 'Vanuatu': 'Oceania',
    }
    
    return region_mapping.get(country, 'Other')

def process_batch(conn, df_batch, batch_num):
    """Process a single batch of data"""
    cursor = conn.cursor()
    
    print(f"Processing batch {batch_num} with {len(df_batch)} rows...")
    
    cities_data = []
    processed = 0
    skipped = 0
    
    for _, row in df_batch.iterrows():
        try:
            # Try different possible column names for city data
            city_name = None
            country = None
            population = None
            latitude = None
            longitude = None
            
            # Map actual Excel columns
            city_name = str(row['Name']).strip() if pd.notna(row['Name']) else None
            country = str(row['Country name EN']).strip() if pd.notna(row['Country name EN']) else None
            
            # Get population
            if pd.notna(row['Population']):
                try:
                    population = int(float(row['Population']))
                except (ValueError, TypeError):
                    population = None
            else:
                population = None
            
            # Parse coordinates from 'Coordinates' column (format: "lat,lng")
            if pd.notna(row['Coordinates']):
                try:
                    coords = str(row['Coordinates']).strip()
                    if ',' in coords:
                        lat_str, lng_str = coords.split(',', 1)
                        latitude = float(lat_str.strip())
                        longitude = float(lng_str.strip())
                    else:
                        latitude = None
                        longitude = None
                except (ValueError, TypeError):
                    latitude = None
                    longitude = None
            else:
                latitude = None
                longitude = None
            
            # Skip if essential data is missing
            if not city_name or not country:
                skipped += 1
                continue
            
            # Skip very small cities (population < 1000) to keep database manageable
            if population and population < 1000:
                skipped += 1
                continue
                
            region = map_regions(country)
            
            cities_data.append((
                city_name,
                country,
                region,
                population,
                latitude,
                longitude,
                None,  # timezone
                False  # is_capital
            ))
            processed += 1
            
        except Exception as e:
            skipped += 1
            continue
    
    if cities_data:
        # Batch insert
        insert_sql = """
        INSERT INTO cities (name, country, region, population, latitude, longitude, timezone, is_capital)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
        """
        
        cursor.executemany(insert_sql, cities_data)
        conn.commit()
        
        print(f"Batch {batch_num}: Inserted {len(cities_data)} cities, skipped {skipped}")
    
    return processed, skipped

def main():
    excel_file = "attached_assets/geonames-all-cities-with-a-population-1000_1756233947555.xlsx"
    batch_size = 500  # Process 500 rows at a time
    
    if not os.path.exists(excel_file):
        print(f"Excel file not found: {excel_file}")
        sys.exit(1)
    
    try:
        # Connect to database
        conn = connect_to_database()
        print("Connected to database")
        
        # Clear existing sample data (keep the structure)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cities WHERE population > 0")
        conn.commit()
        print("Cleared existing test data")
        
        # Read Excel file and process in batches
        print(f"Reading Excel file...")
        df = pd.read_excel(excel_file)
        print(f"Loaded {len(df)} rows")
        print(f"Columns: {list(df.columns)}")
        
        # Process in batches
        total_processed = 0
        total_skipped = 0
        batch_num = 1
        
        for i in range(0, len(df), batch_size):
            chunk = df.iloc[i:i+batch_size]
            processed, skipped = process_batch(conn, chunk, batch_num)
            total_processed += processed
            total_skipped += skipped
            batch_num += 1
            
            # Add small delay to prevent overwhelming the system
            time.sleep(0.5)
            
            # Stop after 10 batches for initial test (5000 cities)
            if batch_num > 10:
                print("Stopping after 10 batches for testing...")
                break
        
        # Final statistics
        cursor.execute("SELECT COUNT(*) FROM cities")
        total_cities = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT country) FROM cities")
        total_countries = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT region) FROM cities")
        total_regions = cursor.fetchone()[0]
        
        print(f"\nImport completed!")
        print(f"- Total processed: {total_processed}")
        print(f"- Total skipped: {total_skipped}")
        print(f"- Cities in database: {total_cities}")
        print(f"- Countries: {total_countries}")
        print(f"- Regions: {total_regions}")
        
        # Show sample data
        print(f"\nSample cities:")
        cursor.execute("SELECT name, country, region, population FROM cities ORDER BY population DESC LIMIT 10")
        for row in cursor.fetchall():
            print(f"- {row[0]}, {row[1]} ({row[2]}) - Pop: {row[3]:,}" if row[3] else f"- {row[0]}, {row[1]} ({row[2]})")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
City Data Import Script
Reads the Excel file and imports city data into PostgreSQL database
"""

import pandas as pd
import psycopg2
import os
from urllib.parse import urlparse
import sys

def connect_to_database():
    """Connect to PostgreSQL database using DATABASE_URL"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not found")
    
    # Parse the database URL
    url_parts = urlparse(database_url)
    
    conn = psycopg2.connect(
        host=url_parts.hostname,
        port=url_parts.port,
        database=url_parts.path[1:],  # Remove leading slash
        user=url_parts.username,
        password=url_parts.password
    )
    return conn

def read_excel_data(file_path):
    """Read and process the Excel file"""
    print(f"Reading Excel file: {file_path}")
    
    # Try different methods to read the Excel file
    try:
        df = pd.read_excel(file_path)
        print(f"Successfully read {len(df)} rows")
        print(f"Columns: {list(df.columns)}")
        return df
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return None

def create_cities_table(conn):
    """Create the cities table if it doesn't exist"""
    cursor = conn.cursor()
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        region TEXT NOT NULL,
        population INTEGER,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        timezone TEXT,
        is_capital BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS country_idx ON cities(country);
    CREATE INDEX IF NOT EXISTS region_idx ON cities(region);
    CREATE INDEX IF NOT EXISTS name_idx ON cities(name);
    CREATE INDEX IF NOT EXISTS population_idx ON cities(population);
    """
    
    cursor.execute(create_table_sql)
    conn.commit()
    print("Cities table created/verified")

def map_regions(country):
    """Map countries to regions"""
    region_mapping = {
        # North America
        'Canada': 'North America', 'United States': 'North America', 'Mexico': 'North America',
        'Guatemala': 'North America', 'Belize': 'North America', 'El Salvador': 'North America',
        
        # Europe
        'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
        'United Kingdom': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe', 'Netherlands': 'Europe',
        
        # Asia
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia',
        'Indonesia': 'Asia', 'Pakistan': 'Asia', 'Bangladesh': 'Asia', 'Philippines': 'Asia',
        
        # Africa
        'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa',
        'Kenya': 'Africa', 'Tanzania': 'Africa', 'Algeria': 'Africa', 'Morocco': 'Africa',
        
        # South America
        'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
        'Peru': 'South America', 'Venezuela': 'South America', 'Chile': 'South America',
        
        # Oceania
        'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Papua New Guinea': 'Oceania',
        'Fiji': 'Oceania', 'Solomon Islands': 'Oceania'
    }
    
    return region_mapping.get(country, 'Other')

def import_cities_data(conn, df):
    """Import cities data into database"""
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM cities")
    print("Cleared existing cities data")
    
    # Prepare data for insertion
    cities_data = []
    
    for _, row in df.iterrows():
        # Map column names (adjust based on actual Excel structure)
        # Common column names in geonames data: name, country, population, latitude, longitude
        city_name = row.get('name', row.get('Name', row.get('city', str(row.iloc[0]))))
        country = row.get('country', row.get('Country', row.get('country_name', str(row.iloc[1]))))
        population = row.get('population', row.get('Population', None))
        latitude = row.get('latitude', row.get('Latitude', row.get('lat', None)))
        longitude = row.get('longitude', row.get('Longitude', row.get('lng', row.get('lon', None))))
        
        # Skip if essential data is missing
        if pd.isna(city_name) or pd.isna(country):
            continue
            
        # Clean and prepare data
        city_name = str(city_name).strip()
        country = str(country).strip()
        region = map_regions(country)
        
        # Handle population
        if pd.isna(population):
            population = None
        else:
            try:
                population = int(float(population))
            except (ValueError, TypeError):
                population = None
        
        # Handle coordinates
        if pd.isna(latitude):
            latitude = None
        else:
            try:
                latitude = float(latitude)
            except (ValueError, TypeError):
                latitude = None
                
        if pd.isna(longitude):
            longitude = None
        else:
            try:
                longitude = float(longitude)
            except (ValueError, TypeError):
                longitude = None
        
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
    
    # Batch insert
    insert_sql = """
    INSERT INTO cities (name, country, region, population, latitude, longitude, timezone, is_capital)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    cursor.executemany(insert_sql, cities_data)
    conn.commit()
    
    print(f"Imported {len(cities_data)} cities")
    
    # Show statistics
    cursor.execute("SELECT COUNT(*) FROM cities")
    total_cities = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT country) FROM cities")
    total_countries = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT region) FROM cities")
    total_regions = cursor.fetchone()[0]
    
    print(f"Database statistics:")
    print(f"- Total cities: {total_cities}")
    print(f"- Total countries: {total_countries}")
    print(f"- Total regions: {total_regions}")

def main():
    excel_file = "attached_assets/geonames-all-cities-with-a-population-1000_1756233947555.xlsx"
    
    if not os.path.exists(excel_file):
        print(f"Excel file not found: {excel_file}")
        sys.exit(1)
    
    # Read Excel data
    df = read_excel_data(excel_file)
    if df is None:
        print("Failed to read Excel file")
        sys.exit(1)
    
    # Connect to database
    try:
        conn = connect_to_database()
        print("Connected to database")
        
        # Create table
        create_cities_table(conn)
        
        # Import data
        import_cities_data(conn, df)
        
        conn.close()
        print("City data import completed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
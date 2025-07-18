import pandas as pd
import json

def read_excel_shipping_methods():
    try:
        # Read the Excel file
        df = pd.read_excel('attached_assets/Shipping fee_1752848039793.xlsx')
        
        # Print column names to understand structure
        print("Column names:")
        print(df.columns.tolist())
        
        # Show first few rows
        print("\nFirst 5 rows:")
        print(df.head())
        
        # Group by destination and show available shipping methods
        print("\nAvailable shipping methods by destination:")
        
        # Find unique combinations of destination and shipping method
        if 'Buyer Location' in df.columns and 'Shipping types' in df.columns:
            shipping_methods = df.groupby(['Buyer Location', 'Shipping types']).size().reset_index(name='count')
            
            # Group by destination
            destinations = {}
            for _, row in shipping_methods.iterrows():
                destination = row['Buyer Location']
                shipping_type = row['Shipping types']
                
                if pd.notna(destination) and pd.notna(shipping_type):
                    if destination not in destinations:
                        destinations[destination] = []
                    destinations[destination].append(shipping_type)
            
            # Print results
            for dest, methods in destinations.items():
                print(f"{dest}: {methods}")
            
            # Save to JSON file
            with open('shipping_methods_by_destination.json', 'w') as f:
                json.dump(destinations, f, indent=2)
            
            print("\nSaved shipping methods by destination to shipping_methods_by_destination.json")
            
        else:
            print("Could not find expected columns")
            
    except Exception as e:
        print(f"Error reading Excel file: {e}")

if __name__ == "__main__":
    read_excel_shipping_methods()
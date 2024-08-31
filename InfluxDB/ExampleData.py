from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import pandas as pd
import argparse

# Prompt the user to input InfluxDB credentials and settings
parser = argparse.ArgumentParser(description='Upload CSV data to InfluxDB.')
parser.add_argument('token', type=str, help='Your InfluxDB token')
parser.add_argument('org', type=str, help='Your InfluxDB organization')
parser.add_argument('bucket', type=str, help='Your InfluxDB bucket')
parser.add_argument('url', type=str, help='Your InfluxDB URL')

args = parser.parse_args()
# Initialize the InfluxDB client
client = InfluxDBClient(url=args.url, token=args.token, org=args.org)
write_api = client.write_api(write_options=SYNCHRONOUS)

# Read the CSV file into a pandas DataFrame
csv_file_path = "Sleep.csv"
df = pd.read_csv(csv_file_path)

# Generate a synthetic timestamp based on index
df['timestamp'] = pd.date_range(start='2024-01-01', periods=len(df), freq='H')

# Write DataFrame to InfluxDB
for index, row in df.iterrows():
    point = (
        Point("sleep_data")
        .field("Heart_Rate_Variability", row["Heart_Rate_Variability"])
        .field("Body_Temperature", row["Body_Temperature"])
        .field("Movement_During_Sleep", row["Movement_During_Sleep"])
        .field("Sleep_Duration_Hours", row["Sleep_Duration_Hours"])
        .field("Sleep_Quality_Score", row["Sleep_Quality_Score"])
        .field("Caffeine_Intake_mg", row["Caffeine_Intake_mg"])
        .field("Stress_Level", row["Stress_Level"])
        .field("Bedtime_Consistency", row["Bedtime_Consistency"])
        .field("Light_Exposure_hours", row["Light_Exposure_hours"])
        .time(row["timestamp"], WritePrecision.NS)
    )
    
    # Write the point to InfluxDB
    write_api.write(bucket=args.bucket, org=args.org, record=point)

# Close the client
client.close()

print("CSV data has been written to InfluxDB successfully.")
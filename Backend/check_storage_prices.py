import sys
sys.path.append('.')

from app.connections.postgres_connection import SessionLocal
from app.schemas import postgres_base as models

db = SessionLocal()

locations = db.query(models.StorageLocation).all()
print(f"\n📦 Found {len(locations)} storage locations:\n")

for loc in locations:
    price_text = getattr(loc, 'price_text', 'MISSING')
    print(f"  {loc.name}")
    print(f"    Type: {loc.type}")
    print(f"    Price Text: {price_text}")
    print()

db.close()

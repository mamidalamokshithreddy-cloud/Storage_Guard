"""
Fix storage location prices to match agricultural standards
Current: ₹2.5-7/kg/day (unrealistic, leads to ₹450,000 for 2000kg)
Target: ₹0.1-0.13/kg/day (realistic, leads to ₹18,000-24,000 for 2000kg)

Conversion:
- Dry Storage: ₹300/quintal/month = ₹300/(100kg × 30 days) = ₹0.1/kg/day
- Cold Storage: ₹400/quintal/month = ₹400/(100kg × 30 days) = ₹0.133/kg/day
"""

import sys
sys.path.append('.')

from app.connections.postgres_connection import SessionLocal
from app.schemas import postgres_base as models

db = SessionLocal()

print("\n🔧 Updating storage location prices to agricultural standards...\n")

locations = db.query(models.StorageLocation).all()

for loc in locations:
    old_price = loc.price_text
    
    # Update based on storage type
    if 'cold' in loc.type.lower():
        # Cold storage: ₹400/quintal/month = ₹0.133/kg/day
        loc.price_text = '₹0.133/kg/day'
        new_converted = 0.133 * 100 * 30  # = ₹400/quintal/month
    else:
        # Dry/warehouse storage: ₹300/quintal/month = ₹0.1/kg/day
        loc.price_text = '₹0.1/kg/day'
        new_converted = 0.1 * 100 * 30  # = ₹300/quintal/month
    
    print(f"✅ {loc.name}")
    print(f"   Type: {loc.type}")
    print(f"   Old: {old_price}")
    print(f"   New: {loc.price_text} (= ₹{new_converted}/quintal/month)")
    print()

db.commit()
print("✅ All prices updated successfully!")
print("\n📊 Example calculation (Wheat 2000kg, 90 days, Dry Storage):")
print("   ₹0.1/kg/day × 100 kg/quintal × 30 days/month = ₹300/quintal/month")
print("   20 quintals × ₹300 × 3 months = ₹18,000")
print("   With 20% RFQ buffer: ₹18,000 × 1.2 = ₹21,600\n")

db.close()

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        db = client[settings.MONGODB_DB]
        # Ping the server to verify connection
        await client.admin.command('ping')
        # Create indexes
        await db.incidents.create_index("timestamp")
        await db.incidents.create_index("platform")
        await db.incidents.create_index("severity")
        await db.offenders.create_index("username", unique=True)
        await db.evidence.create_index("evidence_hash")
        print(f"✅ Connected to MongoDB: {settings.MONGODB_DB}")
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {e}")
        print("💡 SentinelAI will run in demo/simulation mode (data will not persist in MongoDB)")
        db = None

async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

def get_db():
    return db

# MongoDB Setup Guide - Fatsoma Clone

## Quick Start

### 1. Choose Your MongoDB Option

#### Option A: MongoDB Atlas (Cloud - Free Tier)
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Sandbox - FREE)
4. Wait for cluster deployment (~5 minutes)

#### Option B: Local MongoDB
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Windows
# Download from: https://www.mongodb.com/try/download/community
# Install and run MongoDB as a service

# Linux (Ubuntu/Debian)
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Get Connection String

#### For MongoDB Atlas:
1. Click "Connect" on your cluster
2. Select "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<database>` with `fatsoma-clone`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fatsoma-clone?retryWrites=true&w=majority
```

#### For Local MongoDB:
```
mongodb://localhost:27017/fatsoma-clone
```

### 3. Configure Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your connection string:
   ```env
   MONGODB_URI=your-connection-string-here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

### 4. Start Development Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
```

## Database Schema

### Event Collection

The application will automatically create:
- Collection: `events`
- Indexes on: `eventName`, `eventCategory`, `venueName`, `city`, `country`, `eventDate`, `status`, `createdAt`

### Sample Event Structure

```json
{
  "_id": "ObjectId",
  "eventName": "Electric Nights Showcase",
  "eventDescription": "...",
  "eventCategory": "Concert",
  "eventImage": "placeholder-event.jpg",
  "venueName": "The Skyline Hall",
  "addressLine": "123 Regent Street",
  "city": "London",
  "postcode": "W1A 1HQ",
  "country": "United Kingdom",
  "eventDate": "2026-03-15T00:00:00.000Z",
  "startTime": "20:00",
  "endTime": "23:00",
  "totalTickets": 500,
  "ticketBatches": [
    {
      "name": "Early Bird",
      "quantity": 150,
      "basePrice": 18,
      "minPrice": 15,
      "maxPrice": 24
    }
  ],
  "dynamicPricing": true,
  "bookingFee": 5,
  "allowResale": false,
  "platformCommission": 8,
  "status": "published",
  "createdAt": "2026-02-16T10:00:00.000Z",
  "updatedAt": "2026-02-16T10:00:00.000Z"
}
```

## Troubleshooting

### Connection Issues

**Error: "MongoServerError: bad auth"**
- Check username and password in connection string
- Ensure database user has correct permissions in Atlas

**Error: "MongooseServerSelectionError"**
- Check if IP address is whitelisted in Atlas (Network Access)
- Try whitelisting `0.0.0.0/0` for testing
- Verify cluster is running and accessible

**Error: "MONGODB_URI not defined"**
- Ensure `.env.local` exists in project root
- Restart development server after adding environment variables

### Performance Tips

1. **Connection Pooling** - Already configured in `src/lib/mongodb.ts`
   - minPoolSize: 2
   - maxPoolSize: 10

2. **Indexes** - Automatically created on:
   - Single fields: eventDate, status, city, category
   - Compound: (eventDate + status), (city + status)

3. **Lean Queries** - Always using `.lean()` for read operations

## Production Deployment

### Environment Variables (Required)

```env
MONGODB_URI=mongodb+srv://prod-user:password@prod-cluster.mongodb.net/fatsoma-clone?retryWrites=true&w=majority
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### MongoDB Atlas Production Setup

1. **Upgrade Cluster**: Consider M2+ for production workloads
2. **Enable Backups**: Atlas > Backup > Enable Cloud Backup
3. **Set Up Alerts**: Configure email alerts for cluster metrics
4. **Network Security**: Restrict IP access to your server IPs only
5. **Database Users**: Create separate user for production with minimal permissions

### Vercel/Netlify Deployment

1. Add `MONGODB_URI` to environment variables in platform settings
2. MongoDB Atlas automatically handles serverless connections
3. Connection pooling is optimized for serverless in `src/lib/mongodb.ts`

## Monitoring

### Check Database Size

```javascript
// Connect to MongoDB and run:
db.events.stats()
```

### View Indexes

```javascript
db.events.getIndexes()
```

### Check Connection Status

The application logs connection status:
- ✅ Success: "MongoDB connected successfully"
- ❌ Error: Check terminal for detailed error messages

## Next Steps

1. ✅ MongoDB setup complete
2. Create your first event at [http://localhost:3000](http://localhost:3000)
3. View all events at [http://localhost:3000/events](http://localhost:3000/events)
4. Integrate file upload service (AWS S3, Cloudinary)
5. Add authentication for organizers
6. Set up automated backups

## Support

- MongoDB Docs: https://docs.mongodb.com
- Mongoose Docs: https://mongoosejs.com/docs
- Next.js Docs: https://nextjs.org/docs

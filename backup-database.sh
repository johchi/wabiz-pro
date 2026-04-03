#!/bin/bash

# Configuration
BACKUP_DIR="/Users/johnchihule/Desktop/backups/wabiz"
DB_NAME="wabiz_db"
DB_USER="johnchihule"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
echo "📦 Creating database backup..."
pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/wabiz_backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/wabiz_backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup completed: wabiz_backup_$DATE.sql.gz"
echo "📁 Location: $BACKUP_DIR"
#!/usr/bin/env python3
"""
SQLite → PostgreSQL 数据库迁移脚本
用法: python3 migrate_sqlite_to_postgres.py <POSTGRES_URL>
示例: python3 migrate_sqlite_to_postgres.py postgresql://user:pass@localhost:5432/baochihanrenliang
"""
import sys
import os
import json

# 添加 backend 到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sqlite3

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "dashboard.db")

def migrate(postgres_url):
    # 1. 连接 SQLite
    print(f"📂 连接 SQLite: {SQLITE_PATH}")
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    
    # 2. 连接 PostgreSQL
    print(f"🐘 连接 PostgreSQL")
    pg_engine = create_engine(postgres_url)
    pg_session = sessionmaker(bind=pg_engine)()
    
    # 3. 创建表（用 SQLAlchemy models）
    from app.models import Base
    print("🏗️  创建 PostgreSQL 表结构...")
    Base.metadata.create_all(bind=pg_engine)
    
    # 4. 获取所有表
    sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in sqlite_cursor.fetchall()]
    print(f"📋 发现 {len(tables)} 个表: {', '.join(tables)}")
    
    total_rows = 0
    
    for table in tables:
        # 获取列信息
        sqlite_cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in sqlite_cursor.fetchall()]
        
        # 读取数据
        sqlite_cursor.execute(f"SELECT * FROM {table}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"  ⏭️  {table}: 空表，跳过")
            continue
        
        # 构建 INSERT 语句
        col_str = ", ".join(columns)
        placeholders = ", ".join([f":{c}" for c in columns])
        
        # 清空 PostgreSQL 表（避免重复迁移）
        pg_session.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
        
        # 插入数据
        for row in rows:
            row_dict = {col: row[idx] for idx, col in enumerate(columns)}
            # JSON 字段特殊处理
            for col in columns:
                if col == "full_retention_data" and row_dict[col]:
                    if isinstance(row_dict[col], str):
                        try:
                            row_dict[col] = json.dumps(json.loads(row_dict[col]))
                        except:
                            row_dict[col] = json.dumps(row_dict[col])
                    elif isinstance(row_dict[col], list):
                        row_dict[col] = json.dumps(row_dict[col])
            
            pg_session.execute(
                text(f"INSERT INTO {table} ({col_str}) VALUES ({placeholders})"),
                row_dict
            )
        
        pg_session.commit()
        total_rows += len(rows)
        print(f"  ✅ {table}: {len(rows)} 行已迁移")
    
    sqlite_conn.close()
    pg_session.close()
    
    print(f"\n🎉 迁移完成！共 {len(tables)} 个表，{total_rows} 行数据")
    print(f"   SQLite → PostgreSQL: {postgres_url}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python3 migrate_sqlite_to_postgres.py <POSTGRES_URL>")
        print("示例: python3 migrate_sqlite_to_postgres.py postgresql://user:pass@localhost:5432/baochihanrenliang")
        sys.exit(1)
    
    postgres_url = sys.argv[1]
    migrate(postgres_url)

#!/usr/bin/env python3
import json, hashlib
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CAL=ROOT/"assets/data/calendar.json"
SRC=ROOT/"assets/data/auction-sources.json"
OUT=ROOT/"assets/data/auction-alerts.json"

def parse_date(s):
    try:return datetime.strptime(s,"%Y-%m-%d").replace(tzinfo=timezone.utc)
    except:return None

calendar=json.loads(CAL.read_text())
sources=json.loads(SRC.read_text())
house_meta={h["house"]:h for h in sources.get("houses",[])}

today=datetime.now(timezone.utc)
alerts=[]
seen=set()

for sale in calendar.get("sales",[]):
    key="|".join([sale.get("house",""),sale.get("sale",""),sale.get("date",""),sale.get("city","")])
    uid=hashlib.sha1(key.encode()).hexdigest()[:12]
    if uid in seen: continue
    seen.add(uid)
    dt=parse_date(sale.get("date",""))
    days=None if not dt else (dt.date()-today.date()).days
    if days is None: urgency="unknown"
    elif days < 0: urgency="past"
    elif days <= 2: urgency="critical"
    elif days <= 7: urgency="soon"
    else: urgency="upcoming"

    meta=house_meta.get(sale.get("house"),{})
    alerts.append({
      "id":uid,
      "house":sale.get("house"),
      "houseCode":meta.get("code") or "".join(x[0] for x in sale.get("house","").split()[:3]).upper(),
      "logo":meta.get("logo"),
      "logoStatus":meta.get("logoStatus","not_configured"),
      "sale":sale.get("sale"),
      "city":sale.get("city"),
      "saleDate":sale.get("date"),
      "dateLabel":sale.get("dateLabel") or sale.get("date"),
      "url":sale.get("url"),
      "note":sale.get("note"),
      "buyerAlert":sale.get("flag"),
      "urgent":bool(sale.get("flagUrgent")),
      "urgency":urgency,
      "daysToSale":days,
      "lots":sale.get("lots",[]),
      "sourceMode":"editorial",
      "lastBuilt":today.isoformat().replace("+00:00","Z")
    })

alerts.sort(key=lambda x:(x["saleDate"] or "9999-99-99",x["house"] or ""))
OUT.write_text(json.dumps({
  "_readme":"Generated from calendar.json by scripts/build_auction_alerts.py. Do not edit manually.",
  "updated":today.isoformat().replace("+00:00","Z"),
  "count":len(alerts),
  "alerts":alerts
},indent=2,ensure_ascii=False)+"\n")
print(f"Built {len(alerts)} auction alerts")

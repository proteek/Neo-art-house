#!/usr/bin/env python3
import json, hashlib, urllib.request, xml.etree.ElementTree as ET
from html.parser import HTMLParser
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CAL=ROOT/"assets/data/calendar.json"
SRC=ROOT/"assets/data/auction-sources.json"
OUT=ROOT/"assets/data/auction-alerts.json"

def parse_date(s):
    for fmt in ("%Y-%m-%d","%Y%m%d"):
        try:return datetime.strptime(str(s)[:10 if "-" in str(s) else 8],fmt).replace(tzinfo=timezone.utc)
        except:pass
    return None

def remote_text(url):
    req=urllib.request.Request(url,headers={"User-Agent":"TheNeoArtHouse-AlertBuilder/1.0"})
    with urllib.request.urlopen(req,timeout=20) as r:return r.read().decode("utf-8","replace")

def read_ics(text,house):
    out=[]
    for block in text.split("BEGIN:VEVENT")[1:]:
        body=block.split("END:VEVENT")[0]
        vals={}
        for line in body.splitlines():
            if ":" not in line:continue
            k,v=line.split(":",1); vals[k.split(";",1)[0]]=v.strip()
        if vals.get("DTSTART") and vals.get("SUMMARY"):
            dt=parse_date(vals["DTSTART"])
            out.append({"date":dt.strftime("%Y-%m-%d") if dt else vals["DTSTART"],"dateLabel":dt.strftime("%-d %B") if dt else vals["DTSTART"],"sale":vals["SUMMARY"],"house":house,"city":vals.get("LOCATION",""),"url":vals.get("URL",""),"note":"Imported from a permitted official calendar feed.","flag":"","flagUrgent":False})
    return out

def read_rss(text,house):
    out=[]
    root=ET.fromstring(text)
    for item in root.findall(".//item"):
        title=(item.findtext("title") or "").strip()
        link=(item.findtext("link") or "").strip()
        date=(item.findtext("date") or item.findtext("pubDate") or "").strip()
        dt=parse_date(date)
        if title and dt: out.append({"date":dt.strftime("%Y-%m-%d"),"dateLabel":dt.strftime("%-d %B"),"sale":title,"house":house,"city":"","url":link,"note":"Imported from a permitted official feed.","flag":"","flagUrgent":False})
    return out


class JsonLdParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_jsonld=False
        self.parts=[]
        self.blocks=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower()=="script":
            a=dict(attrs)
            if a.get("type","").lower()=="application/ld+json":
                self.in_jsonld=True
                self.parts=[]
    def handle_endtag(self,tag):
        if tag.lower()=="script" and self.in_jsonld:
            self.blocks.append("".join(self.parts))
            self.in_jsonld=False
            self.parts=[]
    def handle_data(self,data):
        if self.in_jsonld:self.parts.append(data)

def _walk_jsonld(node):
    if isinstance(node,dict):
        yield node
        for v in node.values():
            yield from _walk_jsonld(v)
    elif isinstance(node,list):
        for v in node:
            yield from _walk_jsonld(v)

def read_html_jsonld(text,house,source_url):
    parser=JsonLdParser()
    parser.feed(text)
    out=[]
    for block in parser.blocks:
        try: payload=json.loads(block)
        except: continue
        for obj in _walk_jsonld(payload):
            typ=obj.get("@type")
            types=typ if isinstance(typ,list) else [typ]
            if not any(t in ("Event","SaleEvent","AuctionEvent") for t in types): continue
            name=(obj.get("name") or obj.get("headline") or "").strip()
            start=obj.get("startDate") or obj.get("endDate") or ""
            dt=parse_date(start)
            if not name or not dt: continue
            loc=obj.get("location","")
            city=""
            if isinstance(loc,dict):
                addr=loc.get("address",{})
                if isinstance(addr,dict): city=addr.get("addressLocality") or addr.get("addressRegion") or ""
                else: city=str(addr or "")
            elif isinstance(loc,str): city=loc
            url=obj.get("url") or source_url
            out.append({
              "date":dt.strftime("%Y-%m-%d"),
              "dateLabel":dt.strftime("%-d %B"),
              "sale":name,
              "house":house,
              "city":city,
              "url":url,
              "note":"Imported from structured data on an official auction calendar.",
              "flag":"",
              "flagUrgent":False
            })
    return out

def permitted_feed_sales(sources):
    sales=[]
    for s in sources.get("houses",[]):
        if not s.get("enabled") or s.get("mode") not in ("ics","rss","json","html_jsonld") or not s.get("feedUrl"):continue
        try:
            text=remote_text(s["feedUrl"])
            if s["mode"]=="ics": sales.extend(read_ics(text,s["house"]))
            elif s["mode"]=="rss": sales.extend(read_rss(text,s["house"]))
            elif s["mode"]=="html_jsonld":
                sales.extend(read_html_jsonld(text,s["house"],s["feedUrl"]))
            elif s["mode"]=="json":
                payload=json.loads(text)
                fmap=s.get("fieldMap",{})
                for item in payload.get(s.get("itemsKey","items"),[]):
                    def get(k,default=""): return item.get(fmap.get(k,k),default)
                    sales.append({"date":get("date"),"dateLabel":get("dateLabel",get("date")),"sale":get("sale"),"house":s["house"],"city":get("city"),"url":get("url"),"note":"Imported from a permitted official JSON feed.","flag":get("flag"),"flagUrgent":bool(get("flagUrgent",False))})
        except Exception as e:
            print(f"Feed skipped for {s.get('house')}: {e}")
    return sales


SOURCE_HEALTH=ROOT/"assets/data/auction-source-health.json"

def build_source_health(sources):
    rows=[]
    for s in sources.get("houses",[]):
        if s.get("adapterTier")!="Tier 1": continue
        row={"house":s.get("house"),"mode":s.get("mode"),"enabled":bool(s.get("enabled")),"calendarUrl":s.get("calendarUrl"),"status":s.get("monitoringStatus")}
        if s.get("enabled") and s.get("feedUrl"):
            try:
                text=remote_text(s["feedUrl"])
                row["reachable"]=True
                if s.get("mode")=="html_jsonld":
                    row["recordsFound"]=len(read_html_jsonld(text,s["house"],s["feedUrl"]))
                elif s.get("mode")=="ics":
                    row["recordsFound"]=len(read_ics(text,s["house"]))
                elif s.get("mode")=="rss":
                    row["recordsFound"]=len(read_rss(text,s["house"]))
                else:
                    row["recordsFound"]=None
            except Exception as e:
                row["reachable"]=False
                row["error"]=str(e)[:240]
        rows.append(row)
    SOURCE_HEALTH.write_text(json.dumps({"updated":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),"sources":rows},indent=2,ensure_ascii=False)+"\n")
    return rows

calendar=json.loads(CAL.read_text())
sources=json.loads(SRC.read_text())
build_source_health(sources)
house_meta={h["house"]:h for h in sources.get("houses",[])}
all_sales=list(calendar.get("sales",[]))+permitted_feed_sales(sources)

today=datetime.now(timezone.utc)
alerts=[]; seen=set()
for sale in all_sales:
    key="|".join([sale.get("house",""),sale.get("sale",""),sale.get("date",""),sale.get("city","")])
    uid=hashlib.sha1(key.encode()).hexdigest()[:12]
    if uid in seen:continue
    seen.add(uid)
    dt=parse_date(sale.get("date",""))
    days=None if not dt else (dt.date()-today.date()).days
    urgency="unknown" if days is None else "past" if days<0 else "critical" if days<=2 else "soon" if days<=7 else "upcoming"
    meta=house_meta.get(sale.get("house",""),{})
    alerts.append({
      "id":uid,"house":sale.get("house"),"houseCode":meta.get("code") or "".join(x[0] for x in sale.get("house","").split()[:3]).upper(),
      "logo":meta.get("logo"),"logoStatus":meta.get("logoStatus","not_configured"),"sale":sale.get("sale"),"city":sale.get("city"),
      "saleDate":sale.get("date"),"dateLabel":sale.get("dateLabel") or sale.get("date"),"url":sale.get("url"),"note":sale.get("note"),
      "buyerAlert":sale.get("flag"),"urgent":bool(sale.get("flagUrgent")),"urgency":urgency,"daysToSale":days,"lots":sale.get("lots",[]),
      "sourceMode":"feed" if sale.get("note","").startswith("Imported from") else "editorial","lastBuilt":today.isoformat().replace("+00:00","Z")
    })

alerts.sort(key=lambda x:(x["saleDate"] or "9999-99-99",x["house"] or ""))

upcoming=[a for a in alerts if a["daysToSale"] is None or a["daysToSale"]>=0]
past=[a for a in alerts if a["daysToSale"] is not None and a["daysToSale"]<0]

# Keep the public file clean: upcoming sales only.
source_counts={}
for a in upcoming:
    source_counts[a["sourceMode"]]=source_counts.get(a["sourceMode"],0)+1

OUT.write_text(json.dumps({
  "_readme":"Generated every 6 hours. Public dataset contains upcoming sales only, from the editorial calendar plus explicitly permitted official feeds.",
  "updated":today.isoformat().replace("+00:00","Z"),
  "count":len(upcoming),
  "sourceCounts":source_counts,
  "windows":{
    "7":sum(1 for a in upcoming if a["daysToSale"] is not None and a["daysToSale"]<=7),
    "30":sum(1 for a in upcoming if a["daysToSale"] is not None and a["daysToSale"]<=30),
    "90":sum(1 for a in upcoming if a["daysToSale"] is not None and a["daysToSale"]<=90)
  },
  "alerts":upcoming
},indent=2,ensure_ascii=False)+"\n")

ARCHIVE=ROOT/"assets/data/auction-alerts-archive.json"
ARCHIVE.write_text(json.dumps({
  "_readme":"Historical auction alerts archived automatically by the six-hour builder.",
  "updated":today.isoformat().replace("+00:00","Z"),
  "count":len(past),
  "alerts":past
},indent=2,ensure_ascii=False)+"\n")

print(f"Built {len(upcoming)} upcoming alerts; archived {len(past)} past sales")

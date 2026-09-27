#!/usr/bin/env python3
import json, hashlib, urllib.request, xml.etree.ElementTree as ET, re
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


class VisibleTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip=0
        self.lines=[]
        self.buf=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower() in ("script","style","noscript","svg"):
            self.skip+=1
        elif not self.skip and tag.lower() in ("br","p","div","h1","h2","h3","h4","li","section","article"):
            self._flush()
    def handle_endtag(self,tag):
        if tag.lower() in ("script","style","noscript","svg"):
            self.skip=max(0,self.skip-1)
        elif not self.skip and tag.lower() in ("p","div","h1","h2","h3","h4","li","section","article","a"):
            self._flush()
    def handle_data(self,data):
        if not self.skip:
            t=" ".join(data.split())
            if t:self.buf.append(t)
    def _flush(self):
        if self.buf:
            t=" ".join(self.buf).strip()
            if t and (not self.lines or self.lines[-1]!=t): self.lines.append(t)
            self.buf=[]
    def close(self):
        self._flush()
        super().close()

MONTHS={m.lower():i for i,m in enumerate(("January","February","March","April","May","June","July","August","September","October","November","December"),1)}
MONTHS.update({m[:3].lower():i for m,i in list(MONTHS.items()) if len(m)>3})

def parse_human_date(text):
    t=re.sub(r"[,|]"," ",str(text))
    # single date: 29 September 2026 / 29 SEP 2026
    m=re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b",t,re.I)
    if m:
        mon=MONTHS.get(m.group(2).lower()[:3])
        if mon:
            return datetime(int(m.group(3)),mon,int(m.group(1)),tzinfo=timezone.utc)
    # range: 28 Sep - 30 Sep, 2026 / 21 - 22 October 2026 -> use closing/end date
    m=re.search(r"\b\d{1,2}\s*(?:[A-Za-z]{3,9})?\s*[-–]\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b",t,re.I)
    if m:
        mon=MONTHS.get(m.group(2).lower()[:3])
        if mon:
            return datetime(int(m.group(3)),mon,int(m.group(1)),tzinfo=timezone.utc)
    return None

def visible_lines(text):
    p=VisibleTextParser()
    p.feed(text)
    p.close()
    return p.lines

def _sale_record(house,title,dt,label,city,url,note):
    return {"date":dt.strftime("%Y-%m-%d"),"dateLabel":label or dt.strftime("%-d %B"),"sale":title.strip(),"house":house,"city":city.strip(),"url":url,"note":note,"flag":"","flagUrgent":False}

def read_html_astaguru(text,house,source_url):
    lines=visible_lines(text)
    out=[]
    stop={"live & upcoming auctions","past auctions","view catalogue","show interest","explore","upcoming"}
    for i,line in enumerate(lines):
        dt=parse_human_date(line)
        if not dt: continue
        # nearest useful preceding line is the sale title
        title=""
        for j in range(i-1,max(-1,i-5),-1):
            cand=lines[j].strip()
            low=cand.lower()
            if low and low not in stop and not parse_human_date(cand) and len(cand)<140:
                title=cand;break
        if title:
            out.append(_sale_record(house,title,dt,line,"",source_url,"Imported from AstaGuru’s official upcoming-auctions page."))
    # dedupe
    uniq={}
    for x in out: uniq[(x["sale"],x["date"])]=x
    return list(uniq.values())

def read_html_saffronart(text,house,source_url):
    lines=visible_lines(text)
    out=[]
    for line in lines:
        # Homepage entries typically carry title | date | status.
        if "|" not in line: continue
        dt=parse_human_date(line)
        if not dt: continue
        title=line.split("|",1)[0].strip()
        if len(title)<4 or any(k in title.lower() for k in ("view results","press release")): continue
        out.append(_sale_record(house,title,dt,line.split("|",1)[1].strip(),"",source_url,"Imported from Saffronart’s official public auction page."))
    uniq={}
    for x in out: uniq[(x["sale"],x["date"])]=x
    return list(uniq.values())

def read_html_christies(text,house,source_url):
    lines=visible_lines(text)
    out=[]
    auction_types=("Live Auction","Online Auction")
    # Christie’s calendar is structured as type/id, date, sale title, location.
    for i,line in enumerate(lines):
        if not any(line.startswith(t) for t in auction_types): continue
        dt=None; date_label=""; title=""; city=""
        for j in range(i+1,min(len(lines),i+8)):
            if not dt:
                dt=parse_human_date(lines[j])
                if dt:
                    date_label=lines[j]
                    continue
            elif not title:
                cand=lines[j].strip()
                if cand and not parse_human_date(cand) and not cand.lower().startswith(("viewing","browse","explore")):
                    title=cand
                    continue
            elif not city:
                cand=lines[j].strip()
                if cand and len(cand)<80 and not cand.lower().startswith(("viewing","browse","explore")):
                    city=cand
                    break
        if dt and title:
            out.append(_sale_record(house,title,dt,date_label,city,source_url,"Imported from Christie’s official auction calendar."))
    uniq={}
    for x in out: uniq[(x["sale"],x["date"],x["city"])]=x
    return list(uniq.values())

def permitted_feed_sales(sources):
    sales=[]
    for s in sources.get("houses",[]):
        if not s.get("enabled") or s.get("mode") not in ("ics","rss","json","html_jsonld","html_christies","html_astaguru","html_saffronart") or not s.get("feedUrl"):continue
        try:
            text=remote_text(s["feedUrl"])
            if s["mode"]=="ics": sales.extend(read_ics(text,s["house"]))
            elif s["mode"]=="rss": sales.extend(read_rss(text,s["house"]))
            elif s["mode"]=="html_jsonld":
                sales.extend(read_html_jsonld(text,s["house"],s["feedUrl"]))
            elif s["mode"]=="html_christies":
                sales.extend(read_html_christies(text,s["house"],s["feedUrl"]))
            elif s["mode"]=="html_astaguru":
                sales.extend(read_html_astaguru(text,s["house"],s["feedUrl"]))
            elif s["mode"]=="html_saffronart":
                sales.extend(read_html_saffronart(text,s["house"],s["feedUrl"]))
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
                elif s.get("mode")=="html_christies":
                    row["recordsFound"]=len(read_html_christies(text,s["house"],s["feedUrl"]))
                elif s.get("mode")=="html_astaguru":
                    row["recordsFound"]=len(read_html_astaguru(text,s["house"],s["feedUrl"]))
                elif s.get("mode")=="html_saffronart":
                    row["recordsFound"]=len(read_html_saffronart(text,s["house"],s["feedUrl"]))
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

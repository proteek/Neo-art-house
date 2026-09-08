#!/usr/bin/env python3
"""Generates the inner pages from one shell so the chrome stays identical.
Run:  python3 build.py     (from the site root)"""

import pathlib, html

ROOT = pathlib.Path(__file__).parent

LOGO = '''<svg viewBox="0 0 1000 1000" role="img" aria-hidden="true" focusable="false">
      <rect width="1000" height="1000" fill="#E8481F"/>
      <path d="M236 688 L236 282 L474 149 L792 410 L792 688 Z" fill="#212120"/>
      <path d="M474 149 L684 324 L684 688 L474 688 Z" fill="#D2D0C8"/>
      <rect x="508" y="492" width="102" height="196" fill="#E8481F"/>
      <text x="500" y="800" font-size="72" font-weight="700" letter-spacing="9" fill="#212120" text-anchor="middle" font-family="Archivo, sans-serif">THE NEO ART</text>
      <text x="500" y="885" font-size="72" font-weight="700" letter-spacing="9" fill="#212120" text-anchor="middle" font-family="Archivo, sans-serif">HOUSE</text>
    </svg>'''

FOOT_MARK = '''<svg viewBox="0 0 1000 700" aria-hidden="true" focusable="false">
        <path d="M236 688 L236 282 L474 149 L792 410 L792 688 Z" fill="#E8481F"/>
        <path d="M474 149 L684 324 L684 688 L474 688 Z" fill="#D2D0C8"/>
        <rect x="508" y="492" width="102" height="196" fill="#121211"/>
      </svg>'''

SHELL = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{b}assets/css/site.css">
</head>
<body data-base="{b}">
<a class="skip" href="#main">Skip to content</a>

<header class="masthead">
  <a class="mark" href="{b}index.html" aria-label="The Neo Art House, home">{logo}</a>
  <div class="masthead__bar">
    <nav class="nav" aria-label="Main">
      <a href="{b}index.html"{c_adv}>Advisory</a>
      <a href="{b}calendar.html"{c_cal}>Calendar</a>
      <a href="{b}houses.html"{c_hou}>Houses</a>
      <a href="{b}index.html#magazine">Magazine</a>
    </nav>
    <p class="masthead__note">Cross-border auction advice</p>
  </div>
</header>

<main id="main">
{body}
</main>

<footer class="wrap">
  <div class="foot">
    <div class="foot__id">
      {footmark}
      <div><b>The Neo Art House</b><span>Advisory, magazine, events</span></div>
    </div>
    <nav aria-label="Footer">
      <a href="{b}independence.html">Independence policy</a>
      <a href="{b}houses.html">Houses</a>
      <a href="mailto:connect@theneoarthouse.com">Contact</a>
    </nav>
  </div>
  <p class="legal">The Neo Art House publishes research and guidance. We are not a valuation, authentication, customs, tax or legal service. Rules and rates change. Confirm anything material with a qualified professional in the relevant jurisdiction before you bid or pay.</p>
</footer>

<script src="{b}assets/js/site.js"></script>
</body>
</html>
'''


def page(path, title, desc, body, depth=0, current=None):
    b = '../' * depth
    out = SHELL.format(
        title=title, desc=desc, body=body, b=b, logo=LOGO, footmark=FOOT_MARK,
        c_adv=' aria-current="page"' if current == 'advisory' else '',
        c_cal=' aria-current="page"' if current == 'calendar' else '',
        c_hou=' aria-current="page"' if current == 'houses' else '')
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(out, encoding='utf-8')
    print('wrote', path)


# ----------------------------------------------------------------- brief 01
page('briefs/uae-to-india.html',
     'United Arab Emirates to India — The Neo Art House',
     'You can win the lot at an Indian sale and still not be allowed to take it home. What the Antiquities and Art Treasures Act means for Gulf buyers.',
     '''
<section class="wrap">
  <div class="article">
    <h1 style="font-size:clamp(1.9rem,5vw,3rem)">United Arab Emirates to India</h1>
    <p class="lede" style="margin:1rem 0 1.5rem">You can win the lot and still not be allowed to take it home.</p>
    <p class="stamp">Last verified: not yet published. Rates box below is incomplete.</p>

    <table class="glance">
      <caption class="small dim" style="text-align:left;padding-bottom:.5rem">At a glance</caption>
      <tbody>
        <tr><th scope="row">Money out</th><td>No exchange controls. No remittance cap, no tax at source.</td></tr>
        <tr><th scope="row">At the sale</th><td>Buyer's premium plus tax. See the rates box.</td></tr>
        <tr><th scope="row">Getting it out</th><td>The binding constraint. Some works may never leave India.</td></tr>
        <tr><th scope="row">Getting it in</th><td>UAE customs and VAT on arrival. See the rates box.</td></tr>
      </tbody>
    </table>

    <p>If you are resident in the Emirates and bidding at an Indian sale, the money side is the easy part. Nothing restricts what you can send to Mumbai. The problem is at the other end, and it is the reason this brief exists.</p>

    <h2>The constraint nobody warns you about</h2>
    <p>India restricts what art may leave the country under the Antiquities and Art Treasures Act, 1972. The Act does two separate things, and buyers confuse them constantly.</p>
    <p><strong>Antiquities.</strong> Broadly, objects more than one hundred years old, with a shorter threshold of seventy-five years for certain manuscripts and records of historical or scientific interest. These cannot be exported.</p>
    <p><strong>Art treasures.</strong> Works of art that are not antiquities, but which the Central Government has declared to be art treasures on grounds of artistic value. Only the work of a deceased artist can be declared.</p>
    <p>Two notifications did most of the work. In December 1976, GSR 904(E) declared the paintings and objects of art of Rabindranath Tagore, Amrita Sher-Gil, Jamini Roy and Nandalal Bose to be art treasures. In August 1979, GSR 477(E) added Raja Ravi Varma, Gaganendranath Tagore, Abanindranath Tagore, Sailoz Mookerjee and Nicholas Roerich. These nine are known as the Navratnas, the nine jewels.</p>

    <h2>What is and isn't restricted</h2>
    <p>The Act does not stop you buying. It does not stop you owning. It does not stop you selling.</p>
    <p>A resident of Dubai can bid at a Mumbai sale, win a Jamini Roy, pay for it and hold clear title. What you cannot do is put it on a plane. Export requires permission from the Director General of the Archaeological Survey of India, and for the Navratnas that permission is not a formality. Plan on the answer being no.</p>
    <p><strong>One exception matters.</strong> Works that were already outside India before the relevant notification took effect are not caught. A Sher-Gil that has been in a London collection since the 1960s is not affected by the 1976 notification. If you are buying Indian material at a London or New York sale, that is a different situation and a different brief.</p>

    <h2>The trap on works that aren't restricted at all</h2>
    <p>Even when you buy something with no restriction, a living artist, a work made last year, you may still need to prove it is not an antiquity before it can be exported. In practice, exporting art from India usually means producing documentation establishing the work's age. Indian auction houses handle this routinely for overseas buyers, but it takes time and it is not automatic.</p>
    <div class="callout">
      <p><strong>Ask the house in writing before you bid:</strong> is this lot exportable, and who obtains the documentation? Do not accept a verbal assurance from the saleroom floor.</p>
    </div>

    <h2>If you buy a restricted work anyway</h2>
    <p>Sometimes it is the right decision. A Navratna work at a good price is still a good work, and there is a real domestic market for it.</p>
    <p>But be clear about what you own. Your future buyer must also be someone willing to keep the work in India. That shrinks your resale pool substantially, and it means the price you should pay is not the price an Indian resident should pay for the same lot. Bid accordingly. The restriction is a discount, not a footnote.</p>
    <p>You will also need custody: storage, climate control, insurance and someone to check on it. Price ten years of that into the purchase before you bid, not after.</p>

    <h2>Getting the work to the Emirates</h2>
    <p>Once you have confirmed the work is exportable and the documentation is in hand, the mechanics are ordinary: crated freight, transit insurance at declared value, customs clearance in the UAE.</p>
    <p>Two things to settle before the sale rather than after. Freight for a stretched canvas is very different from a work on paper, and crating is quoted on dimensions rather than value, so a large low-value canvas can cost more to move than a small expensive one. And your insurance should cover the work from the moment of the hammer, not from the moment it is collected.</p>

    <h2>Deadlines</h2>
    <p>Indian houses generally require registration before bidding opens, and overseas bidders are asked for identification and sometimes a deposit against high-value lots. Registration is not instant. Settlement windows are short, typically days rather than weeks. Since you have no remittance restriction this is manageable, but only if your bank knows the payment is coming.</p>

    <h2>Current rates</h2>
    <div class="callout">
      <p><strong>To confirm before this brief is published.</strong></p>
      <ul>
        <li>Buyer's premium bands at Saffronart, AstaGuru, Pundole's and Prinseps, taken from the conditions of sale of the specific auction rather than the general terms page.</li>
        <li>Tax on the artwork and tax on the buyer's premium as a service. These are different rates on different bases. Source: CBIC, confirmed with a practising chartered accountant.</li>
        <li>UAE customs treatment of chapter 97 goods under the GCC common tariff, and UAE VAT on import. Source: Dubai Customs and the Federal Tax Authority.</li>
      </ul>
      <p class="small dim" style="margin-bottom:0">Rates last checked: not yet.</p>
    </div>

    <h2>Before you bid</h2>
    <ul>
      <li>Ask in writing whether the lot is exportable.</li>
      <li>Ask who obtains the export documentation, and how long it takes.</li>
      <li>If the work is by one of the nine, decide whether you want an asset you can only hold and resell inside India.</li>
      <li>Get a freight quote on dimensions before the sale, not after.</li>
      <li>Confirm your insurance attaches at the hammer.</li>
    </ul>

    <p style="margin-top:2.5rem"><a class="btn" href="../commission.html">Ask about a lot review</a></p>
  </div>
</section>
''', depth=1, current='advisory')

# ----------------------------------------------------------------- brief 02
page('briefs/india-domestic.html',
     'Buying inside India — The Neo Art House',
     'The route with no corridor cost at all. No remittance, no customs, no export licence.',
     '''
<section class="wrap">
  <div class="article">
    <h1 style="font-size:clamp(1.9rem,5vw,3rem)">Buying inside India</h1>
    <p class="lede" style="margin:1rem 0 1.5rem">The route with no corridor cost at all.</p>
    <p class="stamp">Last verified: not yet published. Rates box below is incomplete.</p>

    <table class="glance">
      <caption class="small dim" style="text-align:left;padding-bottom:.5rem">At a glance</caption>
      <tbody>
        <tr><th scope="row">Money out</th><td>None. Domestic payment in rupees.</td></tr>
        <tr><th scope="row">At the sale</th><td>Buyer's premium plus tax. See the rates box.</td></tr>
        <tr><th scope="row">Getting it out</th><td>Not applicable. The work stays in India.</td></tr>
        <tr><th scope="row">Getting it in</th><td>No customs, no import duty, no clearance.</td></tr>
      </tbody>
    </table>

    <p>If you are resident in India and buying at an Indian sale, none of the machinery this site exists to explain applies to you. No remittance ceiling. No tax collected at source. No export licence. No customs entry. No currency risk between the hammer and settlement.</p>
    <p>We publish this brief because it is true, and because most people arrive here assuming that buying art is complicated everywhere. For Indian modern and contemporary material bought domestically, it is not. It is the cheapest and simplest way into the category, and if you are new to bidding it is where to start.</p>

    <h2>What you actually pay</h2>
    <p>Two things sit on top of the hammer price: the auction house's buyer's premium, and tax.</p>
    <p><strong>Buyer's premium</strong> is a percentage added to the hammer, paid to the house. It varies between houses and usually steps down at higher price bands. It is set out in the conditions of sale for each individual auction, not on the house's general terms page, and it does change. Look it up for the specific sale, every time.</p>
    <p><strong>Tax</strong> applies both to the artwork and, separately, to the premium as a service. These are two different rates on two different bases. Get both from your accountant rather than assuming.</p>
    <p>Then the ordinary costs: transport, insurance in transit, and framing or conservation if the work needs it. Domestic freight within India is inexpensive relative to anything crossing a border, but the condition report should tell you whether the work needs anything doing to it before you budget.</p>

    <h2>The one thing to check even domestically</h2>
    <p>Whether the lot is a non-exportable national art treasure does not stop you buying it, and it does not affect your use of it. But it does affect what it is worth later.</p>
    <p>If a work by one of the nine Navratna artists, or an antiquity over a hundred years old, comes up, understand that its future buyer pool excludes anyone who wants to take it out of the country. That means no Gulf buyer, no diaspora buyer in London or New York, no international institution.</p>
    <p>Domestic demand for these artists is real and deep. But the restriction narrows the market, and a work that cannot leave should not carry the same price as one that can.</p>

    <h2>What to look at instead of the estimate</h2>
    <p>The estimate is the house's view of what the work will fetch. It is not a valuation, and low estimates are frequently set to attract bidding.</p>
    <p>More useful: what comparable works by the same artist, of similar size, medium and period, have actually sold for, and how often works by that artist fail to sell at all. A high unsold rate tells you the market is thin, and a thin market is one you may struggle to exit.</p>

    <h2>Deadlines</h2>
    <p>Registration closes before bidding opens, and Indian houses commonly ask for identification and, for higher value lots, a deposit. Do it a week ahead rather than on the day. Settlement is usually due within days of the sale. Have the funds available before you bid, not after you win.</p>

    <h2>Current rates</h2>
    <div class="callout">
      <p><strong>To confirm before this brief is published.</strong></p>
      <ul>
        <li>Buyer's premium bands at Saffronart, AstaGuru, Pundole's, Prinseps and DAG, from the conditions of sale of the specific auction.</li>
        <li>Tax on original paintings and sculptures under HSN chapter 97, and tax on the buyer's premium. Source: CBIC, confirmed with a practising chartered accountant. Rates were revised in the September 2025 reform and published summaries disagree, so do not rely on a secondary source for this.</li>
      </ul>
      <p class="small dim" style="margin-bottom:0">Rates last checked: not yet.</p>
    </div>

    <h2>Before you bid</h2>
    <ul>
      <li>Read the conditions of sale for that specific auction.</li>
      <li>Request the condition report and read it in full.</li>
      <li>Check whether the lot is a national art treasure and price the restriction in.</li>
      <li>Look at unsold rates for the artist, not just achieved prices.</li>
      <li>Register early.</li>
      <li>Set your walk-away number before the sale opens, and hold it.</li>
    </ul>

    <p style="margin-top:2.5rem"><a class="btn" href="../commission.html">Ask about a lot review</a></p>
  </div>
</section>
''', depth=1, current='advisory')

# ----------------------------------------------------------------- brief 03
page('briefs/cites.html',
     'Materials that cannot cross any border — The Neo Art House',
     'CITES, ivory, tortoiseshell and rosewood. Restrictions that apply in every corridor regardless of a work\'s value or importance.',
     '''
<section class="wrap">
  <div class="article">
    <h1 style="font-size:clamp(1.9rem,5vw,3rem)">Materials that cannot cross any border</h1>
    <p class="lede" style="margin:1rem 0 1.5rem">The works that get seized at customs are rarely the expensive ones.</p>
    <p class="stamp">Applies to every corridor, in both directions, regardless of value, age or artistic importance.</p>

    <h2>Why this catches people</h2>
    <p>Most buyers think about restrictions in terms of value and importance. Is this work significant enough that a government will stop it leaving? That is the export licensing question, and it is real.</p>
    <p>This is a different question, and it has nothing to do with importance. It is about what the object is made of.</p>
    <p>International trade in endangered species is governed by CITES, the Convention on International Trade in Endangered Species of Wild Fauna and Flora. Its restrictions attach to materials. A modest decorative object worth a few thousand can be seized where a major painting worth millions passes without comment.</p>

    <h2>The materials that appear in art and decorative arts</h2>
    <p><strong>Elephant ivory.</strong> By far the most common problem. It appears in sculpture, inlay, netsuke, miniature portraits, instrument fittings, cane and fan handles, chess sets and cabinet detailing.</p>
    <p><strong>Marine turtle shell</strong>, usually called tortoiseshell. Boxes, combs, inlay, and veneer on furniture and small objects.</p>
    <p><strong>Rhinoceros horn.</strong> Carvings, particularly libation cups.</p>
    <p><strong>Certain corals</strong>, including black and red coral, in jewellery and decorative objects.</p>
    <p><strong>Rosewoods.</strong> Brazilian rosewood is the most restricted, and other Dalbergia species carry controls. This affects furniture, frames, instruments and boxes, and it is the one people almost never think about, because it looks like ordinary wood.</p>
    <p><strong>Whale products</strong>, including scrimshaw and baleen. Some feathers, skins and shells also carry controls.</p>

    <h2>What the rules actually do</h2>
    <p>CITES sorts species into appendices. For the most restricted, commercial international trade is generally prohibited outright. For others, trade is permitted but requires permits issued before the object moves.</p>
    <p>There are exemptions for genuinely antique worked specimens in some jurisdictions, but they are narrower than people assume, they vary by country, and they require documentation you must obtain in advance.</p>
    <p><strong>Several countries go further than CITES.</strong> The United Kingdom's ivory legislation imposes near-total restrictions with only narrow exemptions, stricter than the Convention requires. India prohibits domestic ivory trade under its own wildlife legislation. Checking CITES alone is not enough. You must check the national law at both ends of the corridor.</p>

    <h2>The part that costs people their purchase</h2>
    <div class="callout">
      <p><strong>Permits cannot be obtained retrospectively.</strong> If the object ships without the right documentation and is intercepted, the usual outcome is seizure. Not a fine and release. Seizure.</p>
      <p>You will have paid the hammer price and the premium. You may have no recourse against the auction house, because conditions of sale typically place responsibility for export and import compliance on the buyer.</p>
      <p style="margin-bottom:0">That is the whole risk in one sentence: you can lose both the object and the money.</p>
    </div>

    <h2>What the auction house does and doesn't tell you</h2>
    <p>Reputable houses flag restricted materials in the catalogue, often with a symbol and a note. Read those notes. They are easy to scroll past.</p>
    <p>But a flag is not clearance. The note tells you a restriction may apply. It does not tell you whether a permit will be granted for your particular corridor, how long it takes, or whether your destination country has its own stricter rules. That is your problem to solve, before you bid. Be aware too that a house may decline to ship a flagged lot internationally at all, leaving you to arrange it yourself.</p>

    <h2>Before you bid</h2>
    <ul>
      <li>Read the full lot description and every symbol in the catalogue key.</li>
      <li>If any restricted material is present or possible, ask the specialist directly and in writing what it is.</li>
      <li>Check the rules at both ends, origin and destination, and check national law rather than CITES alone.</li>
      <li>Confirm whether a permit is obtainable for your route, and how long it takes, before the sale.</li>
      <li>If a work is unattributed as to material and you cannot get a straight answer, treat that as a no.</li>
      <li>Never ship first and resolve documentation later.</li>
    </ul>

    <h2>Where to check</h2>
    <div class="callout">
      <p><strong>To confirm before this brief is published.</strong></p>
      <ul>
        <li>Current CITES appendices and the listing status of each material above. Source: the CITES Secretariat.</li>
        <li>The management authority in each country you deal with, meaning the body that issues export and import permits.</li>
        <li>National legislation stricter than CITES in your main corridors, in particular the UK ivory regime, EU rules on worked specimens, United States wildlife import requirements, Indian wildlife legislation, and UAE requirements.</li>
      </ul>
      <p class="small dim" style="margin-bottom:0">Sources last checked: not yet.</p>
    </div>

    <p style="margin-top:2.5rem"><a class="btn" href="../commission.html">Ask about a lot review</a></p>
  </div>
</section>
''', depth=1, current='advisory')

# ----------------------------------------------------------------- calendar
page('calendar.html',
     'Curated auction calendar — The Neo Art House',
     'Selected upcoming sales relevant to cross-border buyers, with registration deadlines and corridor notes.',
     '''
<section class="wrap">
  <h1 style="font-size:clamp(1.9rem,5vw,3rem);max-width:16ch">Sales we're watching</h1>
  <p class="lede" style="margin:1rem 0 0">Selected, not scraped. Twenty or so sales a month that matter to cross-border buyers, with the deadline that catches people out.</p>
</section>

<section class="wrap rule-top" style="padding-top:2rem">
  <div class="rows" data-calendar="0"></div>
  <p class="small dim" style="margin-top:1.5rem">Up08-09-2026d in the first week of each month. Registration deadlines are the field to watch: most first-time cross-border bids fail here rather than on price.</p>
</section>
''', depth=0, current='calendar')

# ----------------------------------------------------------------- houses
page('houses.html',
     'Auction houses we track — The Neo Art House',
     'Forty-seven auction houses across fourteen countries, searchable by city and country.',
     '''
<section class="wrap">
  <h1 style="font-size:clamp(1.9rem,5vw,3rem);max-width:16ch">Auction houses we track</h1>
  <p class="lede" style="margin:1rem 0 0">Forty-seven houses across fourteen countries. These are the salerooms our corridor briefs and calendar are built around.</p>
</section>

<section class="wrap rule-top" style="padding-top:2rem">
  <div class="filters">
    <label class="small dim" style="display:flex;flex-direction:column;gap:.35rem">Search
      <input type="search" data-dir-search placeholder="House, city or country">
    </label>
    <label class="small dim" style="display:flex;flex-direction:column;gap:.35rem">Country
      <select data-dir-country><option value="">All countries</option></select>
    </label>
  </div>
  <p class="count" data-dir-count></p>
  <div class="dir" data-directory></div>
  <p class="small dim" style="margin-top:1.5rem">Listing a house is not a recommendation and implies no relationship. We take no payment from any auction house.</p>
</section>
''', depth=0, current='houses')

# ----------------------------------------------------------------- commission
page('commission.html',
     'Commission a corridor brief — The Neo Art House',
     'Bidding on a route we have not published yet? We will research your pair of countries and write it up.',
     '''
<section class="wrap">
  <h1 style="font-size:clamp(1.9rem,5vw,3rem);max-width:18ch">We haven't published <span data-corridor-name>this corridor</span> yet</h1>
  <p class="lede" style="margin:1rem 0 0">Three corridors are live so far. This one isn't among them, and we would rather say so than give you a generic answer about a route we have not researched.</p>
</section>

<section class="wrap rule-top" style="padding-top:2.5rem">
  <h2>What still applies to you</h2>
  <div class="services" style="margin-top:1.5rem">
    <article class="service">
      <h3><a href="briefs/cites.html" style="text-decoration:none">Restricted materials</a></h3>
      <p>Ivory, tortoiseshell and rosewood carry restrictions in every corridor, both directions.</p>
    </article>
    <article class="service">
      <h3><a href="calendar.html" style="text-decoration:none">The calendar</a></h3>
      <p>Selected sales with registration deadlines, whatever your route.</p>
    </article>
    <article class="service">
      <h3><a href="houses.html" style="text-decoration:none">The houses</a></h3>
      <p>Who sells what, and where, across fourteen countries.</p>
    </article>
  </div>
</section>

<section class="wrap rule-top" style="padding-top:2.5rem">
  <h2>We'll research this corridor for you</h2>
  <p class="measure dim" style="margin-top:1rem">A written brief on your route specifically: how money leaves your country, export licensing where the sale is, duty and tax on arrival, and the deadlines that apply to your sale. Ten working days, or five if you are bidding sooner.</p>
  <p style="margin-top:1.5rem"><a class="btn" href="mailto:connect@theneoarthouse.com?subject=Corridor%20research">Commission a corridor brief, from $450</a></p>
  <p class="small dim" style="margin-top:1rem">Prefer to wait? Tell us the corridor and we will let you know when it is published.</p>
</section>
''', depth=0, current='advisory')

# ----------------------------------------------------------------- policy
page('independence.html',
     'How we are paid, and what we will not take — The Neo Art House',
     'Our independence policy: what we sell, what we refuse, and how the magazine and the advisory are kept apart.',
     '''
<section class="wrap">
  <div class="article">
    <h1 style="font-size:clamp(1.9rem,5vw,3rem)">How we're paid, and what we won't take</h1>
    <p class="stamp">In effect from [08-09-2026]. Adopted before we had any advertisers or sponsors.</p>
    <p>Most people in the art world are paid by someone other than the person they are advising. You should be able to see exactly where our money comes from, so this page sets it out. It is deliberately specific, because the phrase "independent advisory" on its own means nothing.</p>

    <h2>What we sell</h2>
    <p>Documents. That is the whole business. A corridor brief explains what it costs to move money and art between two countries. A lot review is a written opinion on one work you are already considering. Corridor research is a brief commissioned for a route we have not published yet. You pay a fixed fee for a piece of written work, and that fee is the same whatever you decide afterwards.</p>

    <h2>What we don't do</h2>
    <p>We do not bid on your behalf. We do not hold or handle client funds. We do not take a commission, a share of the hammer price, or any fee that varies with what you spend. We do not tell you what to buy; you choose the work, and we assess what buying it actually involves. We do not receive a placement fee, introduction fee or any other payment from a gallery, dealer or auction house.</p>
    <p>When we advise you to walk away from a purchase, nothing changes for us financially. That is the point.</p>

    <h2>Advertising in The Neo Art Magazine</h2>
    <p>The magazine is published bi-monthly and carries advertising. We restrict who can buy it.</p>
    <p><strong>We do not accept advertising from</strong> galleries and dealers, auction houses, commercial exhibitor programmes at art fairs, art financiers and lenders, shippers and customs brokers, insurers, or framers, conservators and storage providers.</p>
    <p>The first four are excluded because they sit on the sell side of a purchase we might be advising on. The last three are excluded because they are services a client may need to arrange, and we would rather never be in a position where our advice about them could be questioned.</p>
    <p><strong>We do accept advertising from</strong> museums and public institutions, art schools and academic programmes, publishers and booksellers, materials manufacturers and suppliers, and non-commercial public programmes at art fairs.</p>

    <h2>We never name a vendor in a client document</h2>
    <p>Our documents describe what you will need to arrange, such as crated freight, transit insurance at declared value, or a customs broker licensed in the destination country, and how to judge whether a provider is suitable. They do not name specific companies. If you ask us directly for names, we will give you several, tell you if we have any relationship with any of them, and take nothing for the referral.</p>

    <h2>The magazine and the advisory</h2>
    <p>They share a name and an owner. They do different things, and we keep them apart. The magazine covers the primary market: artists, galleries, exhibitions and ideas. It is editorial work, and commercial considerations do not shape it. The advisory works on the secondary market and is procedural.</p>
    <p>Where the two touch, we disclose. If a lot review concerns an artist the magazine has covered in the previous twelve months, that is stated in the document itself. Access we are given as a publication, such as studio visits, previews and embargoed information, is not used to source opportunities for advisory clients.</p>

    <h2>What we are not</h2>
    <p>We are not a valuation service, an authentication service, a tax adviser, a customs broker or a law firm. Our documents are research and guidance. Tax and duty rates change, and treatment varies by circumstance. Confirm anything with a qualified professional in your own jurisdiction before you bid or pay.</p>

    <h2>If something looks wrong</h2>
    <p>If you think we have breached this policy, write to us. Tell us what you saw. We will respond within five working days and, where we got it wrong, say so publicly.</p>

    <h2>Changes</h2>
    <p>If we change this policy we will 08-09-2026 the change and keep the previous version accessible on this page. We will not quietly edit it.</p>
  </div>
</section>
''', depth=0, current=None)

print('done')

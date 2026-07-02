// ─── Types ───────────────────────────────────────────────────────────────────

export interface SpecField {
  label: string;
  options: string[];
  icon: string;
  multiple?: boolean;
  allowCustom?: boolean;
}

export interface Subcategory {
  name: string;
  icon: string;
  specs: Record<string, SpecField>;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  subcategories: Record<string, Subcategory>;
}

// ─── CATEGORY DATA ────────────────────────────────────────────────────────────

const categoryData: Record<string, Category> = {
  electronics: {
    id: "electronics",
    name: "Electronics & Mobile",
    icon: "📱",
    description: "Phones, laptops, TVs, audio, tech accessories",
    subcategories: {
      smartphones: {
        name: "Smartphones",
        icon: "fa-mobile-alt",
        specs: {
          brand: { label: "Brand", options: ["Samsung", "Apple", "Xiaomi", "Oppo", "Realme", "Infinix", "Tecno", "Nokia", "Huawei", "Google Pixel", "OnePlus", "Other"], icon: "fa-tag", allowCustom: true },
          storage: { label: "Storage", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"], icon: "fa-hdd" },
          ram: { label: "RAM", options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"], icon: "fa-memory" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Refurbished", "Used - Like New", "Used - Good", "For Parts"], icon: "fa-star" },
          color: { label: "Color", options: ["Black", "White", "Blue", "Red", "Gold", "Silver", "Green", "Purple"], icon: "fa-palette", allowCustom: true },
        }
      },
      laptops_computers: {
        name: "Laptops & Computers",
        icon: "fa-laptop",
        specs: {
          brand: { label: "Brand", options: ["HP", "Dell", "Lenovo", "Apple", "Asus", "Acer", "Microsoft", "MSI", "Samsung", "Other"], icon: "fa-tag", allowCustom: true },
          processor: { label: "Processor", options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M1", "Apple M2", "Apple M3"], icon: "fa-microchip" },
          ram: { label: "RAM", options: ["4GB", "8GB", "16GB", "32GB", "64GB"], icon: "fa-memory" },
          storage: { label: "Storage", options: ["128GB", "256GB", "512GB", "1TB", "2TB"], icon: "fa-hdd" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Refurbished", "Used - Like New", "Used - Good"], icon: "fa-star" },
          os: { label: "Operating System", options: ["Windows 11", "Windows 10", "macOS", "Linux", "Chrome OS", "No OS"], icon: "fa-desktop" },
        }
      },
      tablets: {
        name: "Tablets & iPads",
        icon: "fa-tablet-alt",
        specs: {
          brand: { label: "Brand", options: ["Apple iPad", "Samsung Galaxy Tab", "Huawei MatePad", "Lenovo Tab", "Amazon Fire", "Xiaomi Pad", "Other"], icon: "fa-tag", allowCustom: true },
          storage: { label: "Storage", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"], icon: "fa-hdd" },
          connectivity: { label: "Connectivity", options: ["Wi-Fi Only", "Wi-Fi + Cellular", "5G Ready"], icon: "fa-wifi" },
          condition: { label: "Condition", options: ["Brand New", "Refurbished", "Used"], icon: "fa-star" },
        }
      },
      smartwatches: {
        name: "Smart Watches & Wearables",
        icon: "fa-clock",
        specs: {
          brand: { label: "Brand", options: ["Apple Watch", "Samsung Galaxy Watch", "Garmin", "Fitbit", "Xiaomi", "Amazfit", "Other"], icon: "fa-tag", allowCustom: true },
          connectivity: { label: "Connectivity", options: ["GPS Only", "GPS + Cellular", "Bluetooth Only"], icon: "fa-wifi" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Used"], icon: "fa-star" },
        }
      },
      home_entertainment: {
        name: "Home Entertainment",
        icon: "fa-tv",
        specs: {
          type: { label: "Type", options: ["Smart TV", "LED TV", "4K Ultra HD TV", "Android TV", "Soundbar", "Projector"], icon: "fa-tv" },
          brand: { label: "Brand", options: ["Samsung", "LG", "Sony", "Hisense", "TCL", "Skyworth", "Generic"], icon: "fa-tag", allowCustom: true },
          screen_size: { label: "Screen Size", options: ['24"', '32"', '40"', '43"', '50"', '55"', '65"', '75"', '85"'], icon: "fa-expand" },
          condition: { label: "Condition", options: ["Brand New", "Refurbished", "Used"], icon: "fa-star" },
        }
      },
      mobile_accessories: {
        name: "Mobile Accessories",
        icon: "fa-charging-station",
        specs: {
          type: { label: "Type", options: ["Power Bank", "Charging Cable", "Wall Adapter", "Phone Case", "Screen Protector", "Memory Card", "USB Flash Drive"], icon: "fa-plug" },
          brand: { label: "Brand", options: ["Oraimo", "Anker", "Xiaomi", "Samsung", "Apple", "Baseus", "Generic"], icon: "fa-tag", allowCustom: true },
        }
      },
      audio_equipment: {
        name: "Audio & Speakers",
        icon: "fa-volume-up",
        specs: {
          type: { label: "Type", options: ["Bluetooth Speaker", "Wireless Earbuds", "Headset/Headphones", "Soundbar", "Home Theater", "Subwoofer", "PA System"], icon: "fa-music" },
          brand: { label: "Brand", options: ["Sony", "JBL", "Samsung", "Oraimo", "Anker", "Generic"], icon: "fa-tag", allowCustom: true },
          connectivity: { label: "Connectivity", options: ["Bluetooth", "Wired", "USB/SD Card", "FM Radio"], icon: "fa-wifi", multiple: true },
        }
      },
      gaming: {
        name: "Gaming",
        icon: "fa-gamepad",
        specs: {
          platform: { label: "Platform", options: ["PlayStation 5", "PlayStation 4", "Xbox Series X/S", "Xbox One", "Nintendo Switch", "PC", "Steam Deck"], icon: "fa-gamepad" },
          type: { label: "Product Type", options: ["Console", "Game (Physical)", "Game (Digital Code)", "Controller", "Headset", "Gaming Keyboard", "Gaming Mouse"], icon: "fa-puzzle-piece" },
          condition: { label: "Condition", options: ["Brand New", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      },
      cameras: {
        name: "Cameras & Photography",
        icon: "fa-camera",
        specs: {
          brand: { label: "Brand", options: ["Canon", "Nikon", "Sony", "Fujifilm", "GoPro", "DJI", "Panasonic", "Other"], icon: "fa-tag", allowCustom: true },
          type: { label: "Camera Type", options: ["DSLR", "Mirrorless", "Point & Shoot", "Action Camera", "Drone", "Instant Camera"], icon: "fa-camera-retro" },
          condition: { label: "Condition", options: ["Brand New", "Used - Like New", "Used - Good", "For Parts"], icon: "fa-star" },
        }
      },
      networking: {
        name: "Networking Equipment",
        icon: "fa-network-wired",
        specs: {
          type: { label: "Device Type", options: ["Router", "Switch", "Modem", "Access Point", "Range Extender", "Mesh System", "Network Card"], icon: "fa-network-wired" },
          brand: { label: "Brand", options: ["TP-Link", "D-Link", "Cisco", "Netgear", "Ubiquiti", "Asus", "Tenda", "MikroTik"], icon: "fa-tag" },
          condition: { label: "Condition", options: ["Brand New", "Used", "Refurbished"], icon: "fa-star" },
        }
      },
      printers: {
        name: "Printers & Scanners",
        icon: "fa-print",
        specs: {
          type: { label: "Device Type", options: ["Printer", "Scanner", "All-in-One", "3D Printer"], icon: "fa-print" },
          brand: { label: "Brand", options: ["HP", "Canon", "Epson", "Brother", "Xerox", "Other"], icon: "fa-tag", allowCustom: true },
          technology: { label: "Print Technology", options: ["Inkjet", "Laser", "Thermal", "Dot Matrix"], icon: "fa-microchip" },
          condition: { label: "Condition", options: ["Brand New", "Refurbished", "Used"], icon: "fa-star" },
        }
      },
      solar_energy: {
        name: "Solar & Power Backup",
        icon: "fa-sun",
        specs: {
          type: { label: "Type", options: ["Solar Panel", "Solar Battery", "Solar Inverter", "Charge Controller", "Solar Floodlight", "UPS (Backup)", "Power Inverter"], icon: "fa-sun" },
          capacity: { label: "Capacity", options: ["10W-50W", "100W-200W", "300W-500W", "100Ah", "200Ah", "1kVA", "3kVA", "5kVA+"], icon: "fa-bolt" },
        }
      },
    }
  },
  fashion: {
    id: "fashion",
    name: "Fashion & Apparel",
    icon: "👗",
    description: "Clothing, shoes, bags, watches, jewelry, and accessories",
    subcategories: {
      men_clothing: {
        name: "Men's Clothing",
        icon: "fa-tshirt",
        specs: {
          type: { label: "Clothing Type", options: ["T-Shirts", "Shirts (Formal)", "Shirts (Casual)", "Trousers/Slacks", "Jeans", "Shorts", "Suits", "Blazers", "Jackets", "Coats", "Sweaters", "Hoodies", "Sportswear", "Traditional (Kanzu)", "Traditional (Dashiki)", "Swimwear", "Underwear", "Socks"], icon: "fa-tshirt" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "28 Waist", "30 Waist", "32 Waist", "34 Waist", "36 Waist", "38 Waist", "40 Waist"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Cotton", "Polyester", "Linen", "Denim", "Wool", "Silk", "Nylon", "Leather", "Rayon", "Blend"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Black", "White", "Navy Blue", "Gray", "Khaki", "Brown", "Red", "Blue", "Green", "Maroon"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New with Tag", "Brand New without Tag", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      },
      women_clothing: {
        name: "Women's Clothing",
        icon: "fa-female",
        specs: {
          type: { label: "Clothing Type", options: ["Dresses", "Skirts", "Tops/Blouses", "T-Shirts", "Trousers/Pants", "Jeans", "Shorts", "Jackets", "Coats", "Hoodies", "Suits/Blazers", "Jumpsuits", "Rompers", "Sportswear", "Swimwear", "Lingerie", "Sleepwear", "Traditional (Kitenge)", "Traditional (Kanga)", "Maxi Dresses", "Midi Dresses", "Mini Dresses"], icon: "fa-female" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "Plus Size 1X", "Plus Size 2X", "Plus Size 3X", "Plus Size 4X", "26 Waist", "28 Waist", "30 Waist", "32 Waist", "34 Waist"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Cotton", "Polyester", "Linen", "Silk", "Satin", "Lace", "Denim", "Wool", "Knit", "Chiffon", "Velvet", "Leather"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Black", "White", "Red", "Blue", "Pink", "Green", "Navy", "Purple", "Yellow", "Orange", "Gold", "Silver", "Rose Gold"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New with Tag", "Brand New without Tag", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      },
      shoes: {
        name: "Shoes & Footwear",
        icon: "fa-shoe-prints",
        specs: {
          type: { label: "Shoe Type", options: ["Sneakers", "Athletic/Running", "Formal Shoes", "Casual Shoes", "Boots", "Sandals", "Slippers", "Heels/Pumps", "Wedges", "Flats/Ballerinas", "Loafers", "Oxfords", "Hiking Boots", "School Shoes"], icon: "fa-shoe-prints" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex", "Kids"], icon: "fa-venus-mars" },
          size: { label: "Size (US/EU)", options: ["EU 36 (US 5.5)", "EU 37 (US 6.5)", "EU 38 (US 7.5)", "EU 39 (US 8.5)", "EU 40 (US 9)", "EU 41 (US 9.5)", "EU 42 (US 10)", "EU 43 (US 10.5)", "EU 44 (US 11)", "EU 45 (US 12)", "EU 46 (US 13)", "Kids EU 28-35"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Leather", "Synthetic Leather", "Canvas", "Mesh", "Rubber", "Suede", "Fabric"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Black", "White", "Brown", "Navy", "Gray", "Red", "Multi-Color"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Boxed)", "Brand New (No Box)", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      },
      bags_luggage: {
        name: "Bags & Luggage",
        icon: "fa-shopping-bag",
        specs: {
          type: { label: "Bag Type", options: ["Handbags", "Shoulder Bags", "Tote Bags", "Backpacks", "Clutches", "Crossbody Bags", "Duffel Bags", "Laptop Bags", "Travel Luggage", "Waist Bags/Fanny Packs", "Beach Bags", "Messenger Bags", "School Bags"], icon: "fa-shopping-bag" },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex"], icon: "fa-venus-mars" },
          material: { label: "Material", options: ["Leather", "Genuine Leather", "Synthetic Leather", "Canvas", "Nylon", "Polyester", "Raffia", "Straw", "Fabric", "PVC"], icon: "fa-layer-group" },
          size: { label: "Size", options: ["Small (Clutch/Mini)", "Medium (Everyday)", "Large (Travel)", "Extra Large (Luggage)"], icon: "fa-expand" },
          color: { label: "Color", options: ["Black", "Brown", "White", "Navy", "Beige", "Red", "Gold", "Silver", "Pink", "Multi-Color"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Tagged)", "Brand New (No Tag)", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      },
      watches: {
        name: "Watches & Timepieces",
        icon: "fa-clock",
        specs: {
          brand: { label: "Brand", options: ["Rolex", "Omega", "Seiko", "Citizen", "Casio", "Fossil", "Daniel Wellington", "Timex", "Invicta", "Tissot", "Tag Heuer", "Apple Watch", "Samsung Watch", "Fitness Tracker", "Generic/No Name", "Other Luxury"], icon: "fa-tag", allowCustom: true },
          type: { label: "Watch Type", options: ["Analog", "Digital", "Analog-Digital", "Smart Watch", "Automatic", "Mechanical", "Quartz", "Chronograph", "Diver's Watch", "Dress Watch", "Sport Watch", "Fitness Tracker/Band"], icon: "fa-clock" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex", "Kids"], icon: "fa-venus-mars" },
          case_material: { label: "Case Material", options: ["Stainless Steel", "Gold Plated", "Rose Gold", "Titanium", "Aluminum", "Resin/Plastic", "Ceramic", "Carbon Fiber"], icon: "fa-circle" },
          band_material: { label: "Band Material", options: ["Stainless Steel Bracelet", "Leather Strap", "Rubber/Silicone", "Nylon/Fabric", "Mesh/Milanese", "Resin", "Gold/Plated Bracelet"], icon: "fa-link" },
          movement: { label: "Movement", options: ["Quartz (Battery)", "Automatic (Self-Winding)", "Mechanical (Manual)", "Solar (Eco-Drive)", "Kinetic", "Digital (Smart)"], icon: "fa-cog" },
          condition: { label: "Condition", options: ["Brand New (Box & Papers)", "Brand New (Watch Only)", "Pre-owned - Like New", "Pre-owned - Good", "Pre-owned - Fair", "For Parts/Repair"], icon: "fa-star" },
        }
      },
      jewelry: {
        name: "Jewelry & Accessories",
        icon: "fa-gem",
        specs: {
          type: { label: "Jewelry Type", options: ["Necklaces", "Chains", "Pendants", "Earrings (Studs)", "Earrings (Hoop)", "Earrings (Dangle)", "Rings (Engagement)", "Rings (Wedding Band)", "Rings (Fashion)", "Bracelets", "Bangles", "Anklets", "Brooches/Pins", "Body Jewelry", "Nose Rings", "Toe Rings", "Cufflinks", "Tie Clips/Pins", "Hair Accessories", "Hair Clips", "Hair Bands", "Tiaras/Crowns"], icon: "fa-gem" },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex", "Kids"], icon: "fa-venus-mars" },
          material: { label: "Material", options: ["Gold (24K)", "Gold (18K)", "Gold (14K)", "Gold (9K)", "Gold Plated", "Silver (Sterling 925)", "Silver Plated", "Rose Gold", "Stainless Steel", "Titanium", "Tungsten", "Brass", "Copper", "Beaded", "Resin", "Wood", "Leather", "Fabric/Thread"], icon: "fa-layer-group" },
          gemstone: { label: "Gemstone", options: ["Diamond", "Ruby", "Sapphire", "Emerald", "Pearl", "Opal", "Amethyst", "Topaz", "Garnet", "Turquoise", "Cubic Zirconia", "Moissanite", "Crystal", "No Gemstone"], icon: "fa-gem", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Certified)", "Brand New (No Certificate)", "Pre-owned - Like New", "Pre-owned - Good", "Vintage/Antique", "For Parts/Repair"], icon: "fa-star" },
        }
      },
      traditional: {
        name: "Traditional & Cultural Wear",
        icon: "fa-globe-africa",
        specs: {
          type: { label: "Type", options: ["Kitenge Dress", "Kanga (Leso)", "Dashiki (Shirt)", "Kanzu (Men's Robe)", "Boubou/Kaftan", "Agbada (Men's Gown)", "Kente Cloth (Stole)", "Ankara (African Print)", "Dashiki Suit (Set)", "Kitenge Skirt", "Kitenge Top", "Maasai Shuka (Blanket)", "Maasai Beaded Jewelry", "Maasai Sandals", "Kikoy (Kikoi)", "Muslim Hijab (Scarf)", "Muslim Abaya (Dress)", "Muslim Kaftan (Jalabiya)", "Muslim Thobe (Men)", "African Print Face Mask", "Traditional Headdress (Crown)", "Wedding Attire (African Traditional)"], icon: "fa-globe-africa" },
          origin: { label: "Cultural Origin", options: ["Kenyan (Kitenge/Kanga)", "Nigerian (Ankara/Dashiki)", "Ghanaian (Kente)", "West African (Boubou)", "East African (Kikoy/Kanzu)", "Maasai (Shuka/Beaded)", "Islamic (Hijab/Abaya)", "Southern African (Shweshwe)", "Ethiopian (Habesha Kemis)", "Pan-African (Mix)", "Custom Design"], icon: "fa-map-marker-alt", allowCustom: true },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex", "Kids", "Women + Men (Couple Set)"], icon: "fa-venus-mars" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "Free Size (One Size)", "Custom Made (Tailored)"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Cotton (Kitenge/Ankara)", "Polyester Blend", "Silk", "Lace", "Satin", "Linen", "Kente (Handwoven Silk)", "Cotton (Kikoy)", "Beaded (Maasai)", "Leather (Maasai Sandals)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New (Handmade)", "Brand New (Store Bought)", "Used - Like New", "Custom Order (Made to Order)"], icon: "fa-star" },
        }
      },
    }
  },
  home_living: {
    id: "home_living",
    name: "Home & Living",
    icon: "🏠",
    description: "Furniture, home decor, kitchen, bedding, and household items",
    subcategories: {
      furniture: {
        name: "Furniture",
        icon: "fa-couch",
        specs: {
          type: { label: "Furniture Type", options: ["Sofa Set (3+2+1)", "Sofa (L-Shape Sectional)", "Sofa (2-Seater)", "Sofa (3-Seater)", "Sofa (Single Seater)", "Recliner Chair", "Armchair", "Accent Chair", "Coffee Table", "Side Table", "End Table", "TV Stand/Media Unit", "TV Cabinet", "Console Table", "Bookshelf", "Wall Shelf (Floating)", "Wall Shelf (Corner)", "Cabinet (Display)", "Sideboard/Buffet", "Chest of Drawers", "Dressing Table", "Bed (Single 3x6ft)", "Bed (Double 4x6ft)", "Bed (Queen 5x6ft)", "Bed (King 6x6ft)", "Bed (Super King 6x6.6ft)", "Bunk Bed (Kids)", "Bed Frame (Metal)", "Bed Frame (Wooden)", "Bed Frame (Upholstered)", "Mattress (Single)", "Mattress (Double)", "Mattress (Queen)", "Mattress (King)", "Mattress Topper", "Nightstand/Bedside Table", "Wardrobe (2-Door)", "Wardrobe (3-Door)", "Wardrobe (Sliding Door)", "Wardrobe (Built-in)", "Shoe Rack/Cabinet", "Dining Table (4-Seater)", "Dining Table (6-Seater)", "Dining Table (8-Seater)", "Dining Chair (Set of 2)", "Dining Chair (Set of 4)", "Dining Chair (Set of 6)", "Bar Stool", "Kitchen Cabinet", "Kitchen Island/Cart", "Office Desk (Writing)", "Office Desk (Computer)", "Office Desk (Standing)", "Office Chair (Ergonomic)", "Office Chair (Basic)", "Office Chair (Executive)", "Filing Cabinet", "Bookcase (Office)", "Guest Chair (Office)", "Outdoor Patio Set", "Outdoor Bench", "Outdoor Lounge Chair", "Garden Table & Chairs", "Hammock", "Porch Swing", "Bean Bag", "Floor Cushion (Floor Seat)", "Ottoman (Storage)", "Footstool", "Folding Chair (Event)", "Folding Table (Event)"], icon: "fa-couch" },
          material: { label: "Material", options: ["Solid Wood (Mahogany)", "Solid Wood (Oak)", "Solid Wood (Pine)", "Solid Wood (Mango Wood)", "MDF (Medium Density Fiberboard)", "Plywood", "Particle Board (Melamine)", "Metal (Steel/Aluminum)", "Rattan/Wicker", "Bamboo", "Leather (Genuine)", "Leather (Faux/Synthetic)", "Fabric (Velvet)", "Fabric (Linen)", "Fabric (Cotton)", "Microfiber", "Plastic (Polypropylene)", "Glass (Tempered)"], icon: "fa-layer-group" },
          color: { label: "Color/Finish", options: ["Brown (Wood)", "Walnut", "Oak", "White", "Black", "Gray", "Beige/Cream", "Navy Blue", "Green", "Red/Maroon", "Gold/Champagne", "Silver/Metallic", "Multi-Color"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Assembled)", "Brand New (Flat Pack - DIY)", "Brand New (Boxed)", "Used - Like New", "Used - Good (Minor wear)", "Used - Fair (Scratches/damage)", "Vintage/Antique", "Custom Order (Made to Order)"], icon: "fa-star" },
        }
      },
      home_decor: {
        name: "Home Decor",
        icon: "fa-paint-roller",
        specs: {
          type: { label: "Decor Type", options: ["Wall Art (Canvas Print)", "Wall Art (Framed Poster)", "Wall Art (Metal Print)", "Painting (Original Art)", "Painting (Print on Canvas)", "Wall Clock", "Wall Mirror", "Floor Mirror", "Decorative Vase", "Sculpture/Figurine", "Sculpture (Wooden)", "Sculpture (Metal)", "Candle Holder (Metal)", "Candle Holder (Glass)", "Scented Candle (Jar)", "Scented Candle (Pillar)", "Scented Candle (Tealight Set)", "Artificial Flowers (Bouquet)", "Artificial Plant (Potted)", "Photo Frame (Tabletop)", "Photo Frame (Wall Collage)", "Throw Pillow (Cushion Cover)", "Throw Pillow (With Insert)", "Throw Blanket (Fleece)", "Throw Blanket (Knit)", "Rug (Living Room - Large)", "Rug (Bedroom - Medium)", "Rug (Runner - Hallway)", "Rug (Doormat - Outdoor)", "Curtains/Drapes (Pair)", "Curtains (Blackout)", "Sheer Curtains (Voile)", "Curtain Rod (Metal)", "Blinds (Vertical)", "Blinds (Roller)", "Tapestry (Wall Hanging)", "Macrame Wall Hanging", "Room Divider (Folding Screen)", "Room Divider (Beaded Curtain)", "Decorative Tray (Table Centerpiece)", "Decorative Bowl (Centerpiece)", "Table Runner (Decorative)", "String Lights (Fairy/Curtain)", "LED Strip Lights (Room Decor)", "Night Light (LED)", "Oil Diffuser (Essential Oil)", "Incense Stick Holder", "Incense Burner (Backflow)", "Terrarium (Glass)", "Succulent Plant (Live)"], icon: "fa-paint-roller" },
          style: { label: "Style/Theme", options: ["Modern/Contemporary", "Minimalist", "Scandinavian", "Bohemian (Boho)", "Rustic/Farmhouse", "Industrial", "Mid-Century Modern", "Classic/Traditional", "African/Ethnic", "Coastal/Nautical", "Art Deco", "Vintage/Retro", "Eclectic", "Kids/Playful", "Luxury/Glam"], icon: "fa-palette" },
          color: { label: "Primary Color", options: ["White", "Black", "Gray", "Beige/Cream", "Brown", "Navy", "Green (Sage/Olive)", "Pink (Blush)", "Blue", "Yellow/Mustard", "Orange/Coral", "Purple/Lavender", "Red/Burgundy", "Gold", "Silver", "Rainbow/Multi", "Neutral/Earth Tones"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Wood", "Metal", "Glass", "Ceramic", "Canvas", "Cotton", "Polyester", "Wool", "Jute/Sisal", "Plastic/Acrylic", "Resin", "Stone/Marble", "Leather", "Paper"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New (Tagged)", "Brand New (Boxed)", "Handmade (New)", "Used - Like New", "Used - Good", "Vintage/Antique"], icon: "fa-star" },
        }
      },
      kitchen_dining: {
        name: "Kitchen & Dining",
        icon: "fa-utensils",
        specs: {
          type: { label: "Item Type", options: ["Cookware Set (Pot/Pan Set)", "Frying Pan (Non-Stick)", "Saucepan Set", "Pressure Cooker", "Stock Pot (Large)", "Sufuria (Aluminum)", "Baking Dish (Pyrex)", "Baking Tray (Oven)", "Cake Pan (Round)", "Muffin/Cupcake Pan", "Roasting Pan", "Mixing Bowls (Set)", "Measuring Cups Set", "Measuring Spoons Set", "Cutting Board (Wood)", "Cutting Board (Plastic)", "Knife Set (Kitchen)", "Chef's Knife (8-inch)", "Paring Knife (Small)", "Bread Knife (Serrated)", "Peeler (Vegetable)", "Grater (Box)", "Vegetable Chopper", "Garlic Press", "Can Opener", "Bottle Opener", "Corkscrew (Wine)", "Colander/Strainer", "Sieve (Fine Mesh)", "Whisk (Metal)", "Spatula (Silicone)", "Spatula (Metal)", "Ladle (Soup)", "Tongs (Kitchen)", "Potato Masher", "Rolling Pin", "Pizza Cutter", "Kitchen Shears (Scissors)", "Mortar and Pestle", "Food Storage Container (Set)", "Mason Jar (Set)", "Lunch Box (Bento)", "Water Bottle (Insulated)", "Vacuum Flask (Thermos)", "Ice Cube Tray (Silicone)", "Ice Cream Scoop", "Pitcher (Water/Juice)", "Decanter (Wine/Whiskey)", "Mug (Ceramic - Set of 4)", "Coffee Mug (Travel)", "Tea Pot (Ceramic)", "Coffee Maker (Drip)", "Coffee Maker (French Press)", "Coffee Maker (Espresso Machine)", "Kettle (Electric)", "Kettle (Stovetop)", "Toaster (2-Slice)", "Toaster (4-Slice)", "Blender (Countertop)", "Blender (Immersion/Hand)", "Food Processor", "Stand Mixer", "Hand Mixer (Electric)", "Rice Cooker", "Slow Cooker (Crockpot)", "Air Fryer", "Deep Fryer", "Instant Pot (Multi-Cooker)", "Electric Grill (Griddle)", "Panini Press (Sandwich Maker)", "Waffle Maker", "Yogurt Maker", "Bread Maker", "Juicer (Citrus)", "Juicer (Masticating/Centrifugal)", "Dinner Set (Stoneware - 16pc)", "Dinner Plate (10.5 inch)", "Salad Plate (8 inch)", "Soup Bowl", "Pasta Bowl (Deep)", "Glass Tumbler (Set of 6)", "Wine Glass (Set of 4)", "Whiskey Glass (Tumbler)", "Champagne Flute (Set of 4)", "Shot Glass (Set of 6)", "Tablecloth (Kitchen)", "Placemat (Set of 6)", "Napkin (Cloth - Set of 6)", "Napkin Ring (Set of 6)", "Salt & Pepper Shaker Set", "Oil & Vinegar Cruet Set", "Butter Dish (Covered)", "Sugar Bowl with Lid", "Tea Infuser (Stainless Steel)", "Coffee Filter (Reusable)"], icon: "fa-utensils" },
          material: { label: "Material", options: ["Stainless Steel", "Cast Iron", "Aluminum (Non-Stick)", "Aluminum (Hard Anodized)", "Ceramic (Non-Stick)", "Glass (Pyrex/Borosilicate)", "Stoneware", "Porcelain", "Melamine", "Wood", "Silicone", "Plastic (BPA Free)", "Copper", "Carbon Steel"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["White", "Black", "Red", "Blue", "Green", "Gray", "Stainless Steel (Silver)", "Copper", "Gold", "Rose Gold", "Clear/Transparent", "Multi-Color/Pattern"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Boxed)", "Brand New (Unused)", "Used - Like New", "Used - Good (Normal wear)"], icon: "fa-star" },
        }
      },
      bedding: {
        name: "Bedding & Linens",
        icon: "fa-bed",
        specs: {
          type: { label: "Bedding Type", options: ["Bed Sheet Set (Fitted + Flat + Pillowcases)", "Fitted Sheet Only", "Flat Sheet Only", "Pillowcase (Standard)", "Pillowcase (Queen)", "Pillowcase (King)", "Duvet Cover Set (Duvet + 2 Pillowcases)", "Duvet/Comforter (Insert - All Seasons)", "Duvet/Comforter (Insert - Winter Warm)", "Duvet/Comforter (Insert - Summer Light)", "Quilt (Lightweight - Decorative)", "Blanket (Fleece/Throw)", "Blanket (Knit/Woven)", "Blanket (Weighted)", "Electric Blanket (Heated)", "Mattress Protector (Waterproof)", "Mattress Topper (Memory Foam)", "Mattress Pad (Quilted)", "Pillow (Memory Foam)", "Pillow (Down/Feather)", "Pillow (Polyester Fiber)", "Pillow (Cooling Gel)", "Pillow (Body Pillow)", "Pillow (Neck/Cervical)", "Pillow (Throw/Decorative)", "Bed Skirt/Dust Ruffle", "Cushion (Seat/Back)", "Floor Mattress (Tatami - Kids)", "Mosquito Net (Canopy - Bed)", "Mosquito Net (Flat - Single/Double)"], icon: "fa-bed" },
          size: { label: "Bed Size", options: ["Single/Twin (36x75 inch)", "Twin XL (38x80 inch)", "Full/Double (54x75 inch)", "Queen (60x80 inch)", "King (76x80 inch)", "Super King (80x80 inch)", "California King (72x84 inch)", "Custom Size"], icon: "fa-expand" },
          thread_count: { label: "Thread Count", options: ["Under 200 (Basic)", "200-300 TC (Standard)", "300-400 TC (Soft)", "400-600 TC (Premium)", "600-800 TC (Luxury)", "800-1000 TC (Ultra Luxury)", "1000+ TC (Hotel Quality)", "Not Applicable (Non-Cotton)"], icon: "fa-hashtag" },
          material: { label: "Material", options: ["Cotton (Egyptian)", "Cotton (Premium)", "Cotton (Standard)", "Cotton/Polyester Blend", "Microfiber (Polyester)", "Flannel (Cotton)", "Jersey (Cotton Knit)", "Linen (Flax)", "Bamboo (Rayon)", "Silk (Mulberry)", "Satin (Weave)", "Tencel/Lyocell (Eucalyptus)", "Down (Duck/Goose)", "Memory Foam", "Cooling Gel (Pillow)", "Polyester Fiber (Pillow)"], icon: "fa-layer-group" },
          pattern: { label: "Pattern/Design", options: ["Solid Color", "Striped", "Printed (Floral)", "Printed (Geometric)", "Printed (Abstract)", "Ditsy Print (Small pattern)", "Damask (Woven Pattern)", "Jacquard (Woven Design)", "Embroidered", "Lace Trim", "Ruffle Edge", "Reversible (Two Sides)"], icon: "fa-palette" },
          color: { label: "Color", options: ["White", "Ivory/Cream", "Gray", "Navy", "Black", "Beige/Tan", "Blush/Pink", "Sage/Green", "Blue/Light Blue", "Lavender/Purple", "Burgundy/Maroon", "Gold/Yellow", "Multi-Color"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Brand New (Washed)", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      },
    }
  },
  beauty: {
    id: "beauty",
    name: "Beauty & Personal Care",
    icon: "💄",
    description: "Skincare, makeup, haircare, fragrances, and personal care",
    subcategories: {
      skincare: {
        name: "Skincare",
        icon: "fa-spa",
        specs: {
          type: { label: "Product Type", options: ["Face Moisturizer", "Body Lotion", "Face Serum", "Face Oil", "Face Cream (Day)", "Face Cream (Night)", "Eye Cream", "Sunscreen (SPF)", "Face Wash/Cleanser", "Body Wash/Shower Gel", "Toner", "Face Mist", "Face Mask (Sheet)", "Face Mask (Clay)", "Face Mask (Sleeping)", "Exfoliator/Scrub", "Lip Balm", "Lip Treatment", "Hand Cream", "Foot Cream", "Anti-Aging Treatment", "Acne Treatment", "Vitamin C Serum", "Retinol Serum", "Hyaluronic Acid", "Niacinamide Serum", "Makeup Remover", "Micellar Water", "Cleansing Balm", "Cleansing Oil", "Facial Wipes", "Facial Roller (Jade/Rose Quartz)", "Gua Sha (Tool)", "Facial Steamer", "Eye Mask (Gel)", "Spot Treatment", "Face Mist (Setting)"], icon: "fa-spa" },
          skin_type: { label: "Skin Type", options: ["All Skin Types", "Normal", "Dry", "Oily", "Combination", "Sensitive", "Mature/Aging", "Acne-Prone"], icon: "fa-smile" },
          size: { label: "Size/Volume", options: ["Sample/Travel (Under 15ml)", "30ml (1 oz)", "50ml (1.7 oz)", "100ml (3.4 oz)", "150ml (5 oz)", "200ml (6.8 oz)", "250ml (8.5 oz)", "500ml (16.9 oz)", "1 Liter (33.8 oz)"], icon: "fa-flask" },
          brand: { label: "Brand", options: ["Neutrogena", "CeraVe", "The Ordinary", "Cetaphil", "L'Oreal Paris", "Nivea", "Garnier", "Olay", "Clinique", "Estée Lauder", "Kiehl's", "La Roche-Posay", "Avene", "Dermalogica", "African Natural (Shea Butter)", "Black Soap (Original)", "KNC Beauty", "Other"], icon: "fa-tag", allowCustom: true },
          ingredients: { label: "Key Ingredients", options: ["Vitamin C", "Hyaluronic Acid", "Retinol", "Niacinamide", "Salicylic Acid", "Glycolic Acid", "Lactic Acid", "Ceramides", "Peptides", "Collagen", "Shea Butter", "Coconut Oil", "Aloe Vera", "Tea Tree Oil", "Argan Oil", "Jojoba Oil", "Rose Hip Oil", "Squalane", "Benzoyl Peroxide"], icon: "fa-leaf", multiple: true },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Brand New (Unopened)", "New (Box Opened - Unused)", "Used - Lightly Used"], icon: "fa-star" },
        }
      },
      makeup: {
        name: "Makeup & Cosmetics",
        icon: "fa-eye",
        specs: {
          type: { label: "Product Type", options: ["Foundation (Liquid)", "Foundation (Powder)", "Foundation (Cream/Stick)", "Concealer", "Primer", "Setting Powder (Loose)", "Setting Powder (Pressed)", "Setting Spray", "BB Cream/CC Cream", "Tinted Moisturizer", "Blush (Powder)", "Blush (Cream/Liquid)", "Bronzer (Powder)", "Bronzer (Stick/Liquid)", "Highlighter (Powder)", "Highlighter (Stick/Liquid)", "Contour (Powder)", "Contour (Cream/Stick)", "Eyeshadow Palette", "Eyeshadow (Single)", "Eye Primer", "Eyeliner (Pencil)", "Eyeliner (Liquid)", "Eyeliner (Gel)", "Mascara (Black)", "Mascara (Brown)", "Mascara (Waterproof)", "Eyebrow Pencil", "Eyebrow Gel", "Eyebrow Powder", "Eyebrow Kit (Stencil)", "Lipstick (Matte)", "Lipstick (Satin/Cream)", "Lipstick (Liquid Matte)", "Lip Gloss", "Lip Liner (Pencil)", "Lip Stain/Tint", "Lip Oil", "Lip Balm (Tinted)", "Lip Kit (Set)", "Makeup Sponge (Beauty Blender)", "Makeup Brush Set", "Makeup Brush (Foundation)", "Makeup Brush (Eyeshadow)", "Makeup Brush (Blush/Blending)", "Makeup Brush (Lip)", "Makeup Bag/Cosmetic Pouch", "Makeup Organizer", "Makeup Mirror (Lighted)", "Makeup Remover Wipes", "False Eyelashes (Strip)", "False Eyelashes (Individual)", "Lash Glue/Adhesive", "Eyelash Curler", "Face Powder Puff", "Makeup Fixing Spray", "Setting Spray (Dewy)", "Setting Spray (Matte)"], icon: "fa-eye" },
          shade: { label: "Shade/Color", options: ["Fair/Light", "Light Medium", "Medium", "Tan", "Olive", "Caramel", "Dark/Tan Deep", "Dark/Deep", "Deep/Dark", "Rich/Dark", "Ebony", "Universal (Clear/Neutral)", "Pink", "Red", "Nude", "Brown", "Purple", "Berry", "Orange/Coral", "Gold/Champagne", "Silver", "Multi-Color (Palette)", "Black", "White"], icon: "fa-palette", allowCustom: true },
          finish: { label: "Finish", options: ["Matte", "Dewy/Glowing", "Satin/Natural", "Shimmer/Glitter", "Sheer/Lightweight", "Full Coverage", "Medium Coverage", "Buildable", "Creamy", "Powder (Velvet)"], icon: "fa-star" },
          brand: { label: "Brand", options: ["MAC", "Fenty Beauty", "Too Faced", "Urban Decay", "NYX", "Maybelline", "L'Oreal", "Revlon", "Kylie Cosmetics", "Huda Beauty", "Anastasia Beverly Hills", "Tarte", "NARS", "Clinique", "Estée Lauder", "Charlotte Tilbury", "Pat McGrath Labs", "Juvia's Place", "African Beauty (House of Tara)", "Zaron", "Other"], icon: "fa-tag", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Brand New (Unopened)", "New (Swatched - Tested)", "Used - Lightly Used", "Used - Good"], icon: "fa-star" },
        }
      },
      haircare: {
        name: "Hair Care & Styling",
        icon: "fa-cut",
        specs: {
          type: { label: "Product Type", options: ["Shampoo", "Conditioner", "Leave-in Conditioner", "Hair Mask/Treatment", "Hair Oil (Argan/Coconut)", "Hair Serum", "Hair Spray (Hold)", "Hair Gel", "Hair Mousse", "Hair Wax/Pomade", "Hair Cream (Styling)", "Hair Butter (Natural)", "Hair Milk", "Scalp Treatment", "Dry Shampoo", "Hair Color (Permanent)", "Hair Color (Semi-Permanent)", "Hair Dye (Temporary)", "Bleach Kit (Lightening)", "Hair Relaxer (Chemical)", "Hair Perm (Curly/Wavy)", "Heat Protectant (Spray)", "Hair Straightening Brush", "Hair Dryer (Blow Dryer)", "Hair Straightener (Flat Iron)", "Hair Curler (Curling Iron)", "Hair Curling Wand", "Hot Comb (Pressing)", "Hair Rollers (Foam)", "Hair Brush (Detangling)", "Hair Brush (Round)", "Hair Brush (Paddle)", "Hair Comb (Wide Tooth)", "Hair Pick (Afro)", "Hair Clips/Sectioning Clips", "Hair Ties/Elastics (Bands)", "Scrunchies (Fabric)", "Headband (Wide)", "Hair Scarf/Wrap (Satin)", "Bonnet (Satin/Silk)", "Wig (Lace Front)", "Wig (Full Lace)", "Wig (U-Part)", "Wig (Frontal)", "Hair Weave/Extensions (Clip-in)", "Hair Weave/Extensions (Sew-in)", "Hair Weave/Extensions (Tape-in)", "Hair Weave/Extensions (Fusion/Keratin)", "Braiding Hair (Kanekalon)", "Braiding Hair (Marley/Twist)", "Crochet Hair (Pre-looped)", "Locs (Faux Locs)", "Ponytail (Drawstring)", "Bun (Hair Piece)", "Edge Control (Gel/Wax)", "Edge Brush (Toothbrush style)", "Silk/Satin Pillowcase (Hair)", "Shower Cap (Reusable)"], icon: "fa-cut" },
          hair_type: { label: "Hair Type", options: ["All Hair Types", "Straight (Type 1)", "Wavy (Type 2)", "Curly (Type 3a-3c)", "Coily (Type 4a-4c)", "Natural/Afro (4c)", "Relaxed/Straightened", "Color-Treated", "Damaged/Dry"], icon: "fa-star" },
          size: { label: "Size/Volume", options: ["Sample/Travel (Under 50ml)", "100ml (3.4 oz)", "200ml (6.8 oz)", "250ml (8.5 oz)", "350ml (12 oz)", "500ml (16.9 oz)", "750ml (25 oz)", "1 Liter (33.8 oz)", "1 oz (Hair Oil)", "2 oz", "4 oz", "8 oz", "16 oz (1 lb)"], icon: "fa-flask" },
          brand: { label: "Brand", options: ["SheaMoisture", "Cantu", "ORS (Organic Root Stimulator)", "Dark & Lovely", "Mielle Organics", "Olaplex", "Pantene", "Head & Shoulders", "Dove", "L'Oreal", "TREsemme", "Aveda", "Redken", "Kérastase", "Paul Mitchell", "African Pride", "Carol's Daughter", "Ecostyle (Gel)", "Ampro (Gel)", "Other"], icon: "fa-tag", allowCustom: true },
          ingredients: { label: "Key Ingredients", options: ["Shea Butter", "Coconut Oil", "Argan Oil", "Jojoba Oil", "Olive Oil", "Vitamin E", "Biotin", "Keratin", "Aloe Vera", "Tea Tree Oil", "Peppermint Oil", "Avocado Oil", "Castor Oil (Jamaican Black)", "Almond Oil (Sweet)", "Sulfate-Free", "Paraben-Free"], icon: "fa-leaf", multiple: true },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Brand New (Unopened)", "New (Box opened)", "Used - Lightly Used", "Used (Good)"], icon: "fa-star" },
        }
      },
      fragrances: {
        name: "Fragrances & Perfumes",
        icon: "fa-wine-bottle",
        specs: {
          type: { label: "Fragrance Type", options: ["Eau de Parfum (EDP)", "Eau de Toilette (EDT)", "Eau de Cologne", "Perfume Oil (Concentrated)", "Body Spray", "Rollerball (Travel)", "Perfume Sample (Vial)", "Perfume Gift Set", "Home Fragrance (Room Spray)", "Home Fragrance (Candle)", "Home Fragrance (Diffuser)"], icon: "fa-wine-bottle" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          size: { label: "Size", options: ["5ml (Sample/Vial)", "10ml (Rollerball)", "15ml (Travel)", "30ml (1 oz)", "50ml (1.7 oz)", "75ml (2.5 oz)", "100ml (3.4 oz)", "125ml (4.2 oz)", "150ml (5 oz)", "200ml (6.8 oz)"], icon: "fa-flask" },
          brand: { label: "Brand", options: ["Channel", "Dior", "Tom Ford", "Creed", "Jo Malone", "Yves Saint Laurent", "Versace", "Dolce & Gabbana", "Armani", "Prada", "Gucci", "Burberry", "Ralph Lauren", "Calvin Klein", "Paco Rabanne", "Jean Paul Gaultier", "Carolina Herrera", "Viktor & Rolf", "Kenya/Niche (Local Brand)", "Designer (Other)", "Designer Inspired (Clone)", "Generic/No Name"], icon: "fa-tag", allowCustom: true },
          scent_family: { label: "Scent Family", options: ["Floral", "Citrus/Fresh", "Woody (Sandalwood/Cedar)", "Oriental/Spicy (Vanilla/Amber)", "Oud (Woody/Bakhoor)", "Musk (Clean/Warm)", "Gourmand (Sweet/Edible)", "Aquatic/Oceanic", "Green/Herbal", "Fruity", "Leather/Warm"], icon: "fa-leaf" },
          concentration: { label: "Concentration", options: ["Perfume Oil (No Alcohol)", "Eau de Parfum (15-20%)", "Eau de Toilette (5-15%)", "Eau de Cologne (2-5%)", "Body Spray (1-3%)"], icon: "fa-percent" },
          condition: { label: "Condition", options: ["Brand New (Sealed Box)", "Brand New (Cellophane Broken)", "Brand New (No Box)", "Used - Lightly Used (90%+ Full)", "Used - Good (70-90% Full)", "Used - Fair (Under 70% Full)", "Tested (Original Cap)"], icon: "fa-star" },
        }
      },
      personal_care: {
        name: "Personal Care & Hygiene",
        icon: "fa-hand-holding-heart",
        specs: {
          type: { label: "Product Type", options: ["Deodorant (Stick)", "Deodorant (Roll-on)", "Deodorant (Spray)", "Antiperspirant", "Body Spray (Fragrance)", "Body Powder (Talcum)", "Hand Sanitizer (Gel)", "Hand Sanitizer (Spray)", "Hand Soap (Liquid)", "Hand Soap (Bar)", "Body Wash/Shower Gel", "Bar Soap (Body)", "Moisturizing Body Wash", "Exfoliating Body Scrub", "Body Lotion (Moisturizer)", "Body Butter (Rich)", "Body Oil (Massage/Dry)", "Sunscreen (Body SPF)", "Sunscreen (Face SPF)", "After Sun (Aloe Vera Gel)", "Lip Balm (Protective)", "Oral Care (Toothbrush)", "Oral Care (Toothpaste)", "Oral Care (Mouthwash)", "Oral Care (Floss)", "Shaving Cream/Gel", "Shaving Foam", "Razor (Disposable)", "Razor (Cartridge Refill)", "After Shave (Lotion/Balm)", "Waxing Kit (Home)", "Wax Strips (Hair Removal)", "Epilator (Electric)", "Hair Removal Cream", "Menstrual (Pads)", "Menstrual (Tampons)", "Menstrual (Pantyliners)", "Menstrual (Menstrual Cup)", "Feminine Wash (Intimate)", "Feminine Wipes", "Condoms (Protection)", "Lubricant (Personal)", "Sexual Wellness (Supplement)", "Pregnancy Test Kit", "First Aid (Band-Aids)", "First Aid (Antiseptic)", "First Aid Kit (Home)", "Nail Care (Nail Polish)", "Nail Care (Polish Remover)", "Nail Care (Nail File)", "Nail Care (Cuticle Oil)", "Ear Care (Cotton Swabs)", "Face Tissue (Box)", "Baby Care (Diapers)", "Baby Care (Baby Wipes)", "Baby Care (Baby Oil)", "Baby Care (Baby Powder)", "Baby Care (Diaper Cream)", "Foot Care (Callus Remover)", "Foot Care (Foot Mask)"], icon: "fa-hand-holding-heart" },
          brand: { label: "Brand", options: ["Venus (Gillette)", "Nivea", "Dove", "Rexona/Sure", "Axe/Lynx", "Old Spice", "Secret", "Degree", "Speed Stick", "Colgate", "Oral-B", "Sensodyne", "Listerine", "Crest", "Always", "Stayfree", "Kotex", "Tena", "Tampax", "Playtex", "Durex", "Trojan", "Lifebuoy", "Detol", "Savlon", "Johnson & Johnson", "Huggies", "Pampers", "Generic/Store Brand (Other)"], icon: "fa-tag", allowCustom: true },
          size: { label: "Size/Volume", options: ["Travel (Under 50ml)", "Standard (50ml-150ml)", "Family (200ml-500ml)", "Bulk (500ml+)"], icon: "fa-flask" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Brand New (Unopened)", "Multi-pack (Unopened)"], icon: "fa-star" },
        }
      },
    }
  },
  sports: {
    id: "sports",
    name: "Sports & Outdoors",
    icon: "⚽",
    description: "Sports equipment, fitness gear, camping, and outdoor recreation",
    subcategories: {
      fitness: {
        name: "Fitness & Exercise Equipment",
        icon: "fa-dumbbell",
        specs: {
          type: { label: "Equipment Type", options: ["Yoga Mat (Premium)", "Exercise Mat (Thick)", "Dumbbell Set (Fixed)", "Dumbbell Set (Adjustable)", "Barbell (Standard 1 inch)", "Barbell (Olympic 2 inch)", "Weight Plate Set (Cast Iron)", "Weight Plate Set (Bumper)", "Kettlebell (Single)", "Kettlebell (Set)", "Resistance Bands (Set of 5)", "Resistance Band (Loop/Glute)", "Pull-up Bar (Door Frame)", "Push-up Stand (Parallettes)", "Jump Rope (Speed)", "Jump Rope (Weighted)", "Ab Roller (Wheel)", "Foam Roller (Muscle Recovery)", "Massage Gun (Percussion)", "Exercise Ball (Swiss Ball)", "Balance Board (Wobble)", "Step Platform (Aerobic)", "Medicine Ball (Weighted)", "Slam Ball (Wall Ball)", "Suspension Trainer (TRX Style)", "Weight Bench (Flat)", "Weight Bench (Adjustable)", "Squat Rack (Power Cage)", "Squat Stand (Half Rack)", "Cardio Machine (Treadmill)", "Cardio Machine (Exercise Bike)", "Cardio Machine (Elliptical)", "Cardio Machine (Rowing Machine)", "Cardio Machine (Stair Climber)", "Cardio Machine (Spin Bike)", "Gym Bag (Duffel)", "Gym Gloves (Lifting)", "Weight Lifting Belt (Leather/Nylon)", "Wrist Wraps (Lifting Straps)", "Knee Sleeves (Lifting)", "Headband (Sweatband)", "Water Bottle (Gym)", "Shaker Bottle (Protein)", "Gym Towel (Microfiber)", "Locker Lock (Combination)"], icon: "fa-dumbbell" },
          weight: { label: "Weight Range", options: ["Under 5 kg", "5-10 kg", "10-20 kg", "20-40 kg", "40-60 kg", "60-100 kg", "100+ kg", "Not Applicable (Mat/Recovery)"], icon: "fa-weight" },
          material: { label: "Material", options: ["Cast Iron (Weight)", "Rubber (Coated/Bumper)", "Steel (Chrome/Painted)", "PVC (Mat)", "TPE (Mat - Eco)", "Nylon (Strap)", "Latex (Band)", "Fabric (Bag)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New (Boxed)", "Brand New (Open Box)", "Used - Like New", "Used - Good (Normal wear)", "Used - Fair (Scratches)"], icon: "fa-star" },
        }
      },
      team_sports: {
        name: "Team Sports",
        icon: "fa-futbol",
        specs: {
          sport: { label: "Sport", options: ["Football/Soccer", "Basketball", "Volleyball", "Rugby", "Netball", "Handball", "Hockey", "Baseball", "Cricket", "Badminton", "Tennis", "Table Tennis", "Lawn Tennis"], icon: "fa-futbol" },
          type: { label: "Product Type", options: ["Ball (Match)", "Ball (Training)", "Jersey (Home)", "Jersey (Away)", "Jersey (Training)", "Shorts (Match)", "Socks (Performance)", "Shin Guards (Football)", "Football Boots (Cleats)", "Goalkeeper Gloves", "Team Bag (Kit)", "Captain Armband", "Pump (Ball Pump)", "Referee Whistle", "Referee Cards (Set)", "Bibs/Scrimmage Vests (Set)", "Training Cones (Set)", "Agility Ladder (Speed Training)", "Resistance Parachute (Speed)", "Corner Flags (Set)", "Goal Net (Football)", "Basketball Net", "Volleyball Net/Set", "Badminton Net/Set", "Badminton Racket", "Shuttlecock (Set)", "Table Tennis Table", "Table Tennis Paddle (Set)", "Table Tennis Balls (Set)", "Tennis Racket", "Tennis Balls (Can)", "Cricket Bat (Full Size)", "Cricket Ball (Leather)", "Cricket Pads/Protectors", "Rugby Ball"], icon: "fa-futbol" },
          brand: { label: "Brand", options: ["Nike", "Adidas", "Puma", "New Balance", "Under Armour", "Reebok", "Umbro", "Mitre", "Spalding", "Wilson", "Yonex", "Kipsta (Decathlon)", "Generic/Other"], icon: "fa-tag", allowCustom: true },
          size: { label: "Size", options: ["Size 1 (Mini)", "Size 2 (Kids)", "Size 3 (Youth)", "Size 4 (Junior)", "Size 5 (Adult)", "XS", "S", "M", "L", "XL", "2XL", "3XL", "One Size"], icon: "fa-ruler" },
          condition: { label: "Condition", options: ["Brand New (Tagged)", "Brand New (No Tag)", "Used - Like New", "Used - Good", "Used - Fair"], icon: "fa-star" },
        }
      },
    }
  },
  toys: {
    id: "toys",
    name: "Toys & Games",
    icon: "🧸",
    description: "Toys, board games, educational toys, and collectibles",
    subcategories: {
      toys_games: {
        name: "Toys & Games",
        icon: "fa-puzzle-piece",
        specs: {
          type: { label: "Product Type", options: ["Building Blocks", "Action Figures", "Dolls & Playsets", "Board Games", "Card Games", "Puzzles", "Remote Control Toys", "Educational Toys", "Outdoor Play"], icon: "fa-puzzle-piece" },
          age_group: { label: "Age Group", options: ["0-2 years", "3-5 years", "6-8 years", "9-12 years", "13+ years", "Adult"], icon: "fa-child" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Brand New (Box Opened)", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      },
    }
  },
  automotive: {
    id: "automotive",
    name: "Automotive & Parts",
    icon: "🚗",
    description: "Car parts, accessories, tools, and automotive care",
    subcategories: {
      car_parts: {
        name: "Car Parts & Spares",
        icon: "fa-car",
        specs: {
          type: { label: "Part Type", options: ["Engine Parts", "Brake System", "Suspension", "Exhaust", "Electrical Parts", "Body Parts", "Transmission", "Cooling System", "Filters", "Belts & Hoses"], icon: "fa-car" },
          brand: { label: "Brand", options: ["Toyota", "Honda", "Nissan", "Mitsubishi", "Subaru", "Volkswagen", "BMW", "Mercedes", "Hyundai", "Generic/Aftermarket"], icon: "fa-tag", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (OEM)", "Brand New (Aftermarket)", "Used - Genuine", "Used - Good", "Reconditioned"], icon: "fa-star" },
        }
      },
      car_accessories: {
        name: "Car Accessories",
        icon: "fa-car-side",
        specs: {
          type: { label: "Accessory Type", options: ["Car Audio/Radio", "Speakers/Subwoofers", "Floor Mats", "Seat Covers", "Steering Wheel Cover", "Phone Mount", "Dash Cam", "GPS Tracker", "LED Lights", "Car Charger", "Car Perfume/Air Freshener", "Car Cover", "Roof Rack/Carrier", "Window Visors", "Sun Shade", "Tow Bar/Hitch", "Tool Kit (Emergency)", "Car Jack", "Jump Starter (Battery)", "Tire Inflator", "Jumper Cables", "First Aid Kit (Car)", "Fire Extinguisher (Car)", "Warning Triangle", "Safety Vest", "Snow Chains", "Car Care Kit (Wax/Cleaner)"], icon: "fa-car-side" },
          condition: { label: "Condition", options: ["Brand New (Boxed)", "Brand New (Open Box)", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      },
    }
  },
  books: {
    id: "books",
    name: "Books & Media",
    icon: "📚",
    description: "Books, stationery, magazines, and educational materials",
    subcategories: {
      books: {
        name: "Books",
        icon: "fa-book",
        specs: {
          genre: { label: "Genre", options: ["Fiction", "Non-Fiction", "Self-Help", "Business & Finance", "Science & Technology", "History", "Biography", "Romance", "Thriller/Mystery", "Fantasy/Sci-Fi", "Children's Books", "Academic/Textbook", "Religious/Spiritual", "Art & Photography", "Cooking & Food", "Health & Fitness", "Travel", "Comics/Manga"], icon: "fa-book" },
          format: { label: "Format", options: ["Paperback", "Hardcover", "Spiral Bound", "Audio Book (CD/MP3)", "eBook (Digital Download)"], icon: "fa-book-open" },
          language: { label: "Language", options: ["English", "Swahili", "French", "Arabic", "Other"], icon: "fa-language", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Brand New (Unread)", "Used - Like New", "Used - Good", "Used - Fair (Highlighting/Writing)", "Used - Acceptable (Damaged)"], icon: "fa-star" },
        }
      },
      stationery: {
        name: "Stationery & Office Supplies",
        icon: "fa-pen",
        specs: {
          type: { label: "Product Type", options: ["Notebook (A4)", "Notebook (A5)", "Notebook (Spiral)", "Notebook (Hardcover)", "Pen (Ballpoint)", "Pen (Gel)", "Pen (Fountain)", "Pencil (Graphite)", "Pencil (Mechanical)", "Colored Pencils (Set)", "Marker (Permanent)", "Highlighter (Set)", "Eraser (Block)", "Ruler (30cm)", "Sharpener (Manual)", "Stapler (Desktop)", "Staples (Box)", "Paper Clip (Box)", "Binder Clip (Assorted)", "Rubber Band (Assorted)", "Tape (Clear)", "Tape (Double Sided)", "Glue Stick", "Liquid Glue (PVA)", "Scissors (Office)", "Cutter/Knife (Utility)", "Cutting Mat (A3)", "Calculator (Scientific)", "Calculator (Basic)", "Whiteboard (Magnetic)", "Whiteboard Markers (Set)", "Whiteboard Eraser", "Bulletin Board (Cork)", "Push Pins (Thumbtacks)", "Sticky Notes (Post-it)", "Index Cards (Flashcards)", "File Folder (Manila)", "Hanging File Folder", "Document Binder (Ring)", "Sheet Protectors (Sleeves)", "Laminator (Machine)", "Laminating Pouches (Set)", "Paper Shredder", "Paper (A4 Ream)", "Cardstock (Colored)", "Envelope (Business #10)", "Envelope (A4)", "Shipping Box (Small)", "Shipping Box (Medium)", "Bubble Wrap (Roll)", "Packing Tape (Clear)", "Packing Tape Dispenser", "Stamps (Postage)", "Stamp Pad (Ink)"], icon: "fa-pen" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Brand New (Unopened)", "New"], icon: "fa-star" },
        }
      },
    }
  },
  food: {
    id: "food",
    name: "Food & Groceries",
    icon: "🍎",
    description: "Fresh produce, packaged foods, beverages, and organic products",
    subcategories: {
      groceries: {
        name: "Groceries & Food Items",
        icon: "fa-shopping-basket",
        specs: {
          type: { label: "Food Type", options: ["Fresh Fruits", "Fresh Vegetables", "Meat/Poultry", "Fish/Seafood", "Dairy Products", "Bread/Bakery", "Rice/Grains", "Cooking Oil", "Spices/Seasonings", "Beverages (Soda/Juice)", "Snacks", "Organic Produce", "Honey", "Cereals"], icon: "fa-shopping-basket" },
          size: { label: "Size/Weight", options: ["250g", "500g", "1kg", "2kg", "5kg", "1 Liter", "2 Liters", "5 Liters", "Per Piece", "Per Bunch", "Per Crate"], icon: "fa-weight" },
          condition: { label: "Condition", options: ["Fresh", "Packaged/Sealed", "Frozen", "Perishable (Consume within days)"], icon: "fa-star" },
        }
      },
    }
  },
};

export default categoryData;

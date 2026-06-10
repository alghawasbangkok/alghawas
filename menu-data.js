/* Al Ghawas — DEFAULT menu seed (data only).
   The live menu is served from localStorage via menu-store.js; this object is
   the fallback/seed used the first time, and the "Reset to defaults" target. */
window.GHAWAS_DEFAULT = {
  brand: {
    name: "AL GHAWAS",
    ar: "الغوّاص",
    tagline: "Restaurant & Kitchen",
    arTagline: "مطعم و مطبخ",
    blurb: "Authentic Emirati & Khaleeji kitchen.",
    hours: { days: "Open daily", open: "8:00 AM", close: "2:00 AM", open24: "08:00", close24: "02:00" },
    announcement: "",
    minOrder: 0,
    deliveryFee: 0,
    vatPercent: 0,
    home: {
      tagline: "Authentic Emirati & Khaleeji kitchen.",
      prompt: "How would you like to dine?",
      deliveryTitle: "Delivery & Pickup",
      deliverySub: "Order on WhatsApp · we deliver or you collect",
      dineTitle: "Dine-In Menu",
      dineSub: "Browse the full menu at your table",
      foot: "Halal · Nana, Sukhumvit · Bangkok"
    },
    googleReview: "https://search.google.com/local/writereview?placeid=ChIJ7V6v-B-f4jAR-E6LBLf_pU4",
    locations: [
      {
        name: "Sukhumvit 3 · Main Branch",
        address: "79/2-5 Sukhumvit Rd, Khlong Toei Nuea, Watthana, Bangkok 10110",
        mapsQuery: "Al Ghawas Restaurant Sukhumvit 3 Nana Bangkok 10110",
        mapsUrl: "https://maps.app.goo.gl/sey4oH3JtqX5rhRH6",
        placeId: "ChIJ7V6v-B-f4jAR-E6LBLf_pU4",
        googleReview: "https://search.google.com/local/writereview?placeid=ChIJ7V6v-B-f4jAR-E6LBLf_pU4",
        phones: [
          { label: "Landline", num: "+6626557145", disp: "+66 2 655 7145" },
          { label: "Landline", num: "+6626557146", disp: "+66 2 655 7146" },
          { label: "Mobile", num: "+66903838381", disp: "+66 90 383 8381" },
          { label: "Mobile", num: "+66803381899", disp: "+66 80 338 1899" }
        ]
      },
      {
        name: "Sukhumvit 5 · Nana",
        address: "Grand 5, Sukhumvit 5 Alley, Khwaeng Khlong Toei Nuea, Khlong Toei, Bangkok 10110",
        mapsQuery: "Al Ghawas Restaurant Sukhumvit Soi 5 Nana Bangkok 10110",
        mapsUrl: "https://maps.app.goo.gl/SUPSQERsqDK7tHvL9",
        placeId: "ChIJwUpPby6f4jAR66P_VbWTzTM",
        googleReview: "https://search.google.com/local/writereview?placeid=ChIJwUpPby6f4jAR66P_VbWTzTM",
        phones: [
          { label: "Landline", num: "+6621610446", disp: "+66 2 161 0446" },
          { label: "Mobile", num: "+66611967555", disp: "+66 61 196 7555" },
          { label: "Mobile", num: "+66611967666", disp: "+66 61 196 7666" }
        ]
      }
    ],
    whatsapp: [
      { num: "66903838381", disp: "+66 90 383 8381", label: "Sukhumvit 3" },
      { num: "66611967555", disp: "+66 61 196 7555", label: "Sukhumvit 5" },
      { num: "66611967666", disp: "+66 61 196 7666", label: "Sukhumvit 5" }
    ],
    line: { num: "66803381899", disp: "+66 80 338 1899", label: "Sukhumvit 3" },
    instagram: "alghawasbkk",
    facebook: { handle: "Ghawas Thai", url: "https://www.facebook.com/alghawasbkk" },
    snapchat: { handle: "alghawasbkk", url: "https://www.snapchat.com/add/alghawasbkk" },
    talabat: "Al Ghawas Kitchen & Restaurant LLC",
    web: "www.alghawasrestaurant.com",
    cloudUrl: "https://alghawasbkk-default-rtdb.firebaseio.com/menu.json"
  },
  categories: [
    {
      id: "breakfast", en: "Breakfast", ar: "إفطار",
      note: "Traditional Gulf mornings — served daily",
      items: [
        { en: "Breakfast Meal for 4", ar: "وجبة إفطار ٤ أشخاص", price: 250, tag: "Sharing" },
        { en: "Asida", ar: "عصيدة", price: 250 },
        { en: "Balaleet — plain / mix / egg", ar: "بلاليط — سادة / ميكس / بيض", price: 200 },
        { en: "Loqimat — honey or date dibs", ar: "لقيمات بالعسل أو بالديبس", price: 200 },
        { en: "Khanfaroosh", ar: "خنفروش", price: 200 },
        { en: "Hummus & Meat", ar: "حمص لحم", price: 200 },
        { en: "Hummus & Chicken", ar: "حمص دجاج", price: 180 },
        { en: "Khabis", ar: "خبيص", price: 150 },
        { en: "Bajela", ar: "باجيال", price: 150 },
        { en: "Nakhee (Dango)", ar: "نخي (دنغو)", price: 150 },
        { en: "Boiled Eggs & Cheese", ar: "بيض مع الجبن", price: 150 },
        { en: "Butter, Honey & Jam", ar: "زبدة و عسل و مربى", price: 150 },
        { en: "Foul & Garlic", ar: "فول بالثوم", price: 140 },
        { en: "Saqoo", ar: "ساقو", price: 130 },
        { en: "Keema", ar: "كيما", price: 130 },
        { en: "Boiled Eggs with Sauce", ar: "بيض مسلوق مع الصلصة", price: 130 },
        { en: "Feta or Cream Cheese", ar: "جبن بيضاء أو سايلة", price: 130 },
        { en: "Foul — plain or with tahini", ar: "فول سادة أو بالطحينة", price: 120 },
        { en: "Falafel Plate", ar: "صحن فالفل", price: 120 },
        { en: "Shakshouka", ar: "شكشوكة", price: 120 },
        { en: "Fried Eggs", ar: "بيض عيون", price: 120 },
        { en: "Omelette", ar: "أومليت", price: 120 },
        { en: "Tomato Eggs", ar: "بيض طماط", price: 120 },
        { en: "Boiled Eggs", ar: "بيض مسلوق", price: 120 },
        { en: "Green / Black Olives", ar: "زيتون أخضر / أسود", price: 120 }
      ]
    },
    {
      id: "breads", en: "Breads", ar: "الخبز",
      note: "From the tannour & saj",
      items: [
        { en: "Reqaq egg & cheese", ar: "خبز رقاق بيض مع جبن", price: 120 },
        { en: "Reqaq with egg / cheese / zaatar / honey / mehyawah", ar: "خبز رقاق — بيض / جبن / زعتر / عسل / مهياوة", price: 100 },
        { en: "Khamir bread — honey / cheese / dibs", ar: "خبز خمير — عسل / جبن / دبس", price: 90 },
        { en: "Jebab — honey / cheese / dibs", ar: "جباب — عسل / جبن / دبس", price: 90 },
        { en: "Mohala Zayd", ar: "محاله زايد", price: 90 },
        { en: "Reqaq plain", ar: "خبز رقاق سادة", price: 60 },
        { en: "Brata Bread", ar: "خبز براتا", price: 50 },
        { en: "Tannour bread — butter or zaatar", ar: "خبز تنور بالزبدة أو الزعتر", price: 50 },
        { en: "Tannour bread plain", ar: "خبز تنور سادة", price: 30 }
      ]
    },
    {
      id: "appetizers", en: "Appetizers", ar: "المقبّلات",
      note: "Mezze, salads & cold plates",
      items: [
        { en: "Al Ghawas Mixed Mezze", ar: "مقبّلات الغوّاص", price: 350, tag: "Signature" },
        { en: "Dolma (stuffed grape leaves)", ar: "دولمة", price: 250 },
        { en: "Shrimp (Rubayn) Salad", ar: "سلطة روبيان", price: 200 },
        { en: "Grape Leaves Salad", ar: "ورق عنب", price: 200 },
        { en: "Tuna Salad", ar: "سلطة تونة", price: 150 },
        { en: "Mixed Salad", ar: "سلطة مشكل", price: 150 },
        { en: "Hummus Beiruti", ar: "حمص بيروتي", price: 130 },
        { en: "Tabbouleh", ar: "تبولة", price: 130 },
        { en: "Soft Arabic Salad", ar: "سلطة عربية ناعمة", price: 130 },
        { en: "Cucumber Slices", ar: "شرائح خيار", price: 130 },
        { en: "Tomato Slices", ar: "شرائح طماطم", price: 120 },
        { en: "Hummus", ar: "حمص", price: 120 },
        { en: "Fattoush", ar: "فتوش", price: 120 },
        { en: "Motabal", ar: "متبل", price: 120 },
        { en: "Baba Ghanouj", ar: "بابا غنوج", price: 120 },
        { en: "Arabic Salad", ar: "سلطة عربية", price: 120 },
        { en: "Slice Salad", ar: "سلطة شرائح", price: 120 },
        { en: "Arugula (Jarjeer)", ar: "جرجير", price: 120 },
        { en: "Cucumber Yogurt", ar: "خيار روب", price: 120 },
        { en: "French Fries", ar: "بطاطا مقلية", price: 120 },
        { en: "Plain Yogurt", ar: "روب سادة", price: 100 }
      ]
    },
    {
      id: "soup", en: "Soup", ar: "الشوربات",
      items: [
        { en: "Seafood Cream Soup", ar: "شوربة كريمة سي فود", price: 280 },
        { en: "Tom Yum Seafood Soup", ar: "شوربة توم يم بحرية", price: 250 },
        { en: "Chicken Mushroom Cream Soup", ar: "شوربة دجاج مشروم كريمة", price: 250 },
        { en: "Naghar Soup", ar: "شوربة نغر", price: 200 },
        { en: "Plain Shrimp Soup", ar: "شوربة روبيان سادة", price: 200 },
        { en: "Shrimp Cream Soup", ar: "شوربة روبيان كريمة", price: 200 },
        { en: "Mutton Soup", ar: "شوربة لحم", price: 150 },
        { en: "Tom Yum Chicken Soup", ar: "شوربة توم يم دجاج", price: 150 },
        { en: "Corn Cream Soup", ar: "شوربة ذرة كريمة", price: 130 },
        { en: "Corn Soup", ar: "شوربة ذرة", price: 130 },
        { en: "Chicken Noodle Soup", ar: "شوربة دجاج شعرية", price: 120 },
        { en: "Lentil Soup", ar: "شوربة عدس", price: 120 },
        { en: "Mushroom Soup", ar: "شوربة مشروم", price: 120 },
        { en: "Chicken Cream Soup", ar: "شوربة دجاج كريمة", price: 120 },
        { en: "Mushroom Cream Soup", ar: "شوربة مشروم كريمة", price: 120 },
        { en: "Plain Chicken Soup", ar: "شوربة دجاج سادة", price: 120 },
        { en: "Vegetable Soup", ar: "شوربة خضار", price: 120 }
      ]
    },
    {
      id: "stew", en: "Stew (Nashef)", ar: "النواشف",
      items: [
        { en: "Mutton Stew", ar: "ناشف لحم", price: 300 },
        { en: "Shrimp (Rubyan) Stew", ar: "ناشف روبيان", price: 300 },
        { en: "Mutton Liver Stew", ar: "ناشف كبدة لحم", price: 300 },
        { en: "Chicken Stew", ar: "ناشف دجاج", price: 250 },
        { en: "Haboul Stew", ar: "ناشف حبول", price: 250 },
        { en: "Naghar Stew", ar: "ناشف نغر", price: 200 },
        { en: "Tuna Stew", ar: "ناشف تونة", price: 150 },
        { en: "Vegetable Stew", ar: "ناشف خضار", price: 150 }
      ]
    },
    {
      id: "seafood", en: "Sea Foods", ar: "أسماك",
      note: "Grilled, fried or BBQ — caught for the Gulf table",
      items: [
        { en: "Lobster", ar: "أم الروبيان", price: 3000, tag: "Signature" },
        { en: "Grilled Hamour — Large", ar: "هامور مشوي كبير", price: 1700 },
        { en: "Seafood Basket with Rice — Large", ar: "سطل مشكل مأكولات بحرية مع رز", price: 1000 },
        { en: "Grilled Hamour — Medium", ar: "هامور مشوي وسط", price: 900 },
        { en: "Grilled Salmon — 2 pcs", ar: "سالمون مشوي قطعتين", price: 900 },
        { en: "Seafood Basket — Medium", ar: "سطل مشكل بحري وسط", price: 900 },
        { en: "Shrimp BBQ", ar: "روبيان مشوي", price: 500 },
        { en: "Shrimp — fried", ar: "روبيان مقلي", price: 500 },
        { en: "Grilled Shrimp Plate", ar: "صحن روبيان مشوي", price: 500 },
        { en: "Safee Fish & Rice", ar: "سمك صافي مع العيش", price: 500 },
        { en: "Seafood Basket — Small", ar: "سطل مشكل بحري صغير", price: 500 },
        { en: "Grilled Salmon — 1 pc", ar: "سالمون مشوي قطعة", price: 480 },
        { en: "Kanad — grilled or fried, 2 pcs", ar: "كنعد مشوي أو مقلي قطعتين", price: 400 },
        { en: "Safee Fish — fried or BBQ", ar: "سمك صافي مشوي أو مقلي", price: 390 },
        { en: "Roasted Shari — grilled or fried", ar: "شعري مشوي أو مقلي", price: 350 },
        { en: "Maleh Mowagar", ar: "مالح موغر", price: 350 },
        { en: "Grilled Harid", ar: "حريد مشوي", price: 350 },
        { en: "Jasheed (plain)", ar: "جشيد سادة", price: 350 },
        { en: "Fried or BBQ Zbedi", ar: "زبيدي مقلي أو مشوي", price: 350 },
        { en: "Naghar Grill", ar: "نغر مشوي", price: 300 },
        { en: "Maleh — plain", ar: "مالح سادة", price: 300 },
        { en: "Mamosh Zebedi — fried or grilled", ar: "مموش زبيدي مقلي أو مشوي", price: 250 },
        { en: "Grilled Squid", ar: "حبار مشوي", price: 250 },
        { en: "Kanad — grilled or fried, 1 pc", ar: "كنعد مشوي أو مقلي قطعة", price: 220 }
      ]
    },
    {
      id: "grills", en: "Grills", ar: "مشاوي",
      note: "Over charcoal",
      items: [
        { en: "Sinya Mixed Grill — Large", ar: "صينية مشاوي مشكل كبير", price: 2500, tag: "Sharing" },
        { en: "1 Kilo Mutton BBQ", ar: "كيلو مشاوي لحم", price: 2000 },
        { en: "Sinya Mixed Grill — Medium", ar: "صينية مشاوي مشكل متوسط", price: 1600, tag: "Sharing" },
        { en: "1 Kilo Chicken BBQ", ar: "كيلو مشاوي دجاج", price: 1600 },
        { en: "Half Kilo Mutton BBQ", ar: "نصف كيلو مشاوي لحم", price: 1000 },
        { en: "Half Kilo Chicken BBQ", ar: "نصف كيلو مشاوي دجاج", price: 800 },
        { en: "Half Kilo Mixed Grill", ar: "نصف كيلو مشكل", price: 800 },
        { en: "Full Chicken Grill", ar: "دجاج مشوي على الفحم", price: 480 },
        { en: "Plate — Mixed Grilled Chicken", ar: "صحن مشكل مشاوي دجاج", price: 380 },
        { en: "Lamb Chops (Riyash)", ar: "ريش لحم", price: 350 },
        { en: "Plate — Mixed Grilled Mutton", ar: "صحن مشكل مشاوي لحم", price: 350 },
        { en: "Meat Kebab", ar: "كباب لحم", price: 350 },
        { en: "Tikka Chicken with Yogurt", ar: "تكة دجاج بالروب", price: 350 },
        { en: "Jolo Kebab Chicken", ar: "جلو كباب دجاج", price: 320 },
        { en: "Mutton Tikka", ar: "تكة لحم", price: 300 },
        { en: "Tikka Chicken", ar: "تكة دجاج", price: 280 },
        { en: "Shish Tawook", ar: "شيش طاووق", price: 280 },
        { en: "Half Chicken Grill", ar: "نصف دجاج مشوي", price: 260 },
        { en: "Mashab Chicken", ar: "دجاج مسحب", price: 250 },
        { en: "Chicken Kebab", ar: "كباب دجاج", price: 240 },
        { en: "Grilled Wings", ar: "جوانح مشوية", price: 220 },
        { en: "Mutton Arayes", ar: "عرايس لحم", price: 200 },
        { en: "Chicken Arayes", ar: "عرايس دجاج", price: 150 }
      ]
    },
    {
      id: "mains-mutton", en: "Main Course — Mutton", ar: "الوجبات الرئيسية — لحم",
      note: "Harara (spice level) prepared on demand",
      items: [
        { en: "Mutton Thareed", ar: "ثريد لحم", price: 480 },
        { en: "Mutton Mazbi", ar: "مظبي لحم", price: 450 },
        { en: "Mutton Biryani", ar: "عيش و لحم", price: 450 },
        { en: "Mutton Guzy", ar: "غوزي لحم", price: 450 },
        { en: "Mutton Makboos", ar: "مكبوس لحم", price: 450 },
        { en: "Indian Mutton Biryani", ar: "برياني هندي لحم", price: 450 },
        { en: "Mutton Maqlooba", ar: "مقلوبة لحم", price: 400 },
        { en: "Mutton Madfoon", ar: "مدفون لحم", price: 400 },
        { en: "Mutton Harees", ar: "هريس لحم", price: 400 },
        { en: "Mutton Mandi", ar: "مندي لحم", price: 400 }
      ]
    },
    {
      id: "mains-chicken", en: "Main Course — Chicken", ar: "الوجبات الرئيسية — دجاج",
      items: [
        { en: "Chicken Thareed", ar: "ثريد دجاج", price: 400 },
        { en: "Indian Chicken Biryani", ar: "برياني هندي دجاج", price: 350 },
        { en: "Chicken Harees", ar: "هريس دجاج", price: 350 },
        { en: "Chicken Madfoon", ar: "مدفون دجاج", price: 320 },
        { en: "Chicken Guzy", ar: "غوزي دجاج", price: 320 },
        { en: "Chicken Maqlooba", ar: "مقلوبة دجاج", price: 320 },
        { en: "Chicken Madroba", ar: "مضروبة دجاج", price: 300 },
        { en: "Chicken Mandi", ar: "مندي دجاج", price: 295 },
        { en: "Chicken Makboos", ar: "مكبوس دجاج", price: 295 },
        { en: "Chicken Biryani", ar: "عيش و دجاج", price: 295 },
        { en: "Chicken Mazbi", ar: "مظبي دجاج", price: 295 }
      ]
    },
    {
      id: "mains-seafood", en: "Main Course — Seafood", ar: "الوجبات الرئيسية — بحري",
      items: [
        { en: "Hamour Makboos", ar: "مكبوس هامور", price: 400 },
        { en: "Fish Mandi", ar: "مندي سمك", price: 400 },
        { en: "Fish Biryani", ar: "برياني سمك", price: 400 },
        { en: "Shrimp Biryani", ar: "برياني روبيان", price: 400 },
        { en: "Shrimp Makboos", ar: "مكبوس روبيان", price: 400 },
        { en: "Maleh Biryani", ar: "برياني مالح", price: 350 },
        { en: "Naghar Biryani", ar: "برياني نغر", price: 300 },
        { en: "Naghar Makboos", ar: "مكبوس نغر", price: 300 },
        { en: "Jasheed", ar: "جشيد", price: 300 },
        { en: "Maleh with White Rice", ar: "مالح مع عيش أبيض", price: 300 }
      ]
    },
    {
      id: "salona", en: "Salona", ar: "صالونات",
      note: "Slow-cooked Gulf gravy",
      items: [
        { en: "Hamour Salona & Rice", ar: "صالونة هامور مع عيش", price: 480 },
        { en: "Shrimp Salona & Rice", ar: "صالونة روبيان مع عيش", price: 450 },
        { en: "Mutton Salona & Rice", ar: "صالونة لحم مع عيش", price: 440 },
        { en: "Mutton Okra Salona & Rice", ar: "صالونة بامية باللحم مع عيش", price: 440 },
        { en: "Kanad Fish Salona & Rice", ar: "صالونة كنعد مع عيش", price: 440 },
        { en: "Naghar Salona & Rice", ar: "صالونة نغر مع عيش", price: 380 },
        { en: "Hamour Salona", ar: "صالونة هامور", price: 380 },
        { en: "Chicken Salona & Rice", ar: "صالونة دجاج مع عيش", price: 370 },
        { en: "Mutton Okra Salona", ar: "صالونة بامية باللحم", price: 320 },
        { en: "Kanad Fish Salona", ar: "صالونة كنعد", price: 320 },
        { en: "Mutton Vegetable Salona", ar: "صالونة خضار باللحم", price: 320 },
        { en: "Shrimp Salona", ar: "صالونة روبيان", price: 320 },
        { en: "Naghar Salona", ar: "صالونة نغر", price: 300 },
        { en: "Chicken Salona", ar: "صالونة دجاج", price: 250 },
        { en: "Chicken Okra Salona", ar: "صالونة بامية بالدجاج", price: 230 },
        { en: "Thareed Vegetable", ar: "ثريد خضار", price: 200 },
        { en: "Okra Salona — plain", ar: "صالونة بامية سادة", price: 140 },
        { en: "Vegetable Salona", ar: "صالونة خضروات", price: 140 },
        { en: "Potato Salona", ar: "صالونة بطاطا", price: 140 }
      ]
    },
    {
      id: "trays", en: "Trays", ar: "الصواني",
      note: "Priced per number of guests — please ask",
      items: [
        { en: "Sinya Mandi — 5 persons", ar: "صينية مندي ٥ أشخاص", price: 1600, tag: "Sharing" },
        { en: "Guzy Mutton Mahali", ar: "غوزي لحم محلي", price: "Ask" },
        { en: "Chicken & Rice Tray", ar: "صينية عيش و دجاج", price: "Ask" },
        { en: "Sinya Mixed Seafood", ar: "صينية بحريات مشكلة", price: "Ask" }
      ]
    },
    {
      id: "sandwiches", en: "Sandwiches", ar: "الساندويشات",
      note: "Saj, tannour bread, wraps & burgers",
      items: [
        { en: "Shrimp Sandwich", ar: "سندوتش روبيان", price: 300 },
        { en: "Fajita Sandwich", ar: "سندوتش فاهيتا", price: 260 },
        { en: "Hummus Shawarma with Meat", ar: "شاورما حمص باللحم", price: 260 },
        { en: "Chicken Hummus Shawarma", ar: "شاورما حمص بالدجاج", price: 220 },
        { en: "Arabic Beef Shawarma", ar: "شاورما عربي لحم", price: 220 },
        { en: "Shish Tawook Sandwich", ar: "سندوتش شيش طاووق", price: 180 },
        { en: "Falafel Sandwich — tannour", ar: "سندوتش فالفل التنور", price: 160 },
        { en: "Tikka Mutton Sandwich", ar: "سندوتش تكة لحم", price: 160 },
        { en: "Kebab Mutton Sandwich", ar: "سندوتش كباب لحم", price: 160 },
        { en: "Beef Burger", ar: "سندوتش برجر لحم", price: 160 },
        { en: "Kabab Chicken Sandwich", ar: "سندوتش كباب دجاج", price: 150 },
        { en: "Chicken Burger", ar: "سندوتش برجر دجاج", price: 150 },
        { en: "Shakshouka Sandwich", ar: "سندوتش شكشوكة", price: 150 },
        { en: "Tikka Chicken Sandwich", ar: "سندوتش تكة دجاج", price: 150 },
        { en: "Egg & Cheese Sandwich", ar: "سندوتش بيض جبن", price: 140 },
        { en: "Mixed Sandwich", ar: "سندوتش مشكل", price: 120 },
        { en: "Omelette Sandwich", ar: "سندوتش بيض أومليت", price: 120 },
        { en: "Boiled Egg Sandwich", ar: "سندوتش بيض مسلوق", price: 120 },
        { en: "Philadelphia Sandwich", ar: "سندوتش فيلادلفيا", price: 100 },
        { en: "Royal Steak Sandwich", ar: "سندوتش رويال ستيك", price: 100 },
        { en: "Crispy Sandwich / Burger", ar: "كرسبي سندوتش / برغر", price: 100 },
        { en: "Zinger Sandwich / Burger", ar: "زنجر سندوتش / برغر", price: 100 },
        { en: "Mutton Saj Shawarma", ar: "شاورما لحم بالصاج", price: 100 },
        { en: "Cheese Sandwich", ar: "سندوتش جبن", price: 100 },
        { en: "Chicken Arabic Shawarma", ar: "شاورما عربي دجاج", price: 100 },
        { en: "Scallop Sandwich / Burger", ar: "سكالوب سندوتش / برغر", price: 100 },
        { en: "Falafel Sandwich — saj", ar: "سندوتش فالفل بالصاج", price: 80 },
        { en: "Chicken Saj Shawarma", ar: "شاورما دجاج بالصاج", price: 80 }
      ]
    },
    {
      id: "macaroni", en: "Macaroni & Pasta", ar: "المعكرونة",
      items: [
        { en: "Seafood Spaghetti", ar: "سباجتي سي فود", price: 400 },
        { en: "Shrimp Spaghetti", ar: "سباجتي روبيان", price: 300 },
        { en: "Mutton Spaghetti", ar: "سباجتي لحم", price: 250 },
        { en: "Chicken Spaghetti", ar: "سباجتي دجاج", price: 200 },
        { en: "Plain Macaroni", ar: "معكرونة سادة", price: 140 },
        { en: "Plain Spaghetti", ar: "سباجتي سادة", price: 140 }
      ]
    },
    {
      id: "rice", en: "Rice & Sides", ar: "الأرز و الإضافات",
      items: [
        { en: "Mamosh Mutton", ar: "مموش لحم", price: 400 },
        { en: "Mamosh Chicken", ar: "مموش دجاج", price: 350 },
        { en: "Sambosa Mutton — 8 pcs", ar: "سمبوسة لحم ٨ قطع", price: 220 },
        { en: "Sambosa Cheese", ar: "سمبوسة جبن", price: 220 },
        { en: "Sambosa Chicken — 8 pcs", ar: "سمبوسة دجاج ٨ قطع", price: 200 },
        { en: "Sambosa Vegetable — 8 pcs", ar: "سمبوسة خضار ٨ قطع", price: 180 },
        { en: "Colored Biryani Rice", ar: "عيش برياني ملون", price: 170 },
        { en: "White Rice with Dill", ar: "عيش أبيض بالشبت", price: 150 },
        { en: "White Rice with Pomegranate", ar: "عيش أبيض بالرمان", price: 150 },
        { en: "Mandi Rice", ar: "عيش مندي", price: 150 },
        { en: "Biryani Rice", ar: "عيش برياني", price: 150 },
        { en: "Kabsa Rice", ar: "عيش مكبوس", price: 150 },
        { en: "Plain White Rice", ar: "عيش سادة", price: 120 },
        { en: "Butter", ar: "زبدة", price: 100 },
        { en: "Hashwa", ar: "الحشوة", price: 100 },
        { en: "Honey or Jam", ar: "عسل / مربى", price: 50 },
        { en: "Date Dibs / Pomegranate Dibs", ar: "دبس التمر / دبس الرمان", price: 50 },
        { en: "Arabic Oil / Olive Oil", ar: "دهن عربي / زيت زيتون", price: 50 },
        { en: "1 Egg", ar: "بيضة", price: 50 }
      ]
    },
    {
      id: "sweets", en: "Sweets", ar: "الحلويات",
      items: [
        { en: "Mixed Fruit Plate", ar: "صحن فواكه", price: 200 },
        { en: "Um Ali", ar: "أم علي", price: 150 },
        { en: "Rice & Milk", ar: "رز بلبن", price: 150 },
        { en: "Cream Caramel", ar: "كريم كراميل", price: 150 },
        { en: "Backora", ar: "باكورة", price: 100 }
      ]
    },
    {
      id: "hot-drinks", en: "Hot Drinks", ar: "المشروبات الساخنة",
      items: [
        { en: "Arabic Coffee with Dates — Large", ar: "قهوة عربية مع تمر — كبير", price: 500, tag: "Signature" },
        { en: "Arabic Coffee with Dates — Medium", ar: "قهوة عربية مع تمر — وسط", price: 200 },
        { en: "Karak Pot", ar: "إبريق شاي كرك", price: 200 },
        { en: "Tea Pot", ar: "إبريق شاي", price: 180 },
        { en: "Cappuccino", ar: "كابتشينو", price: 100 },
        { en: "Ginger Milk", ar: "حليب زنجبيل", price: 100 },
        { en: "Tea & Milk", ar: "شاي حليب", price: 70 },
        { en: "Karak Tea", ar: "شاي كرك", price: 70 },
        { en: "Green Tea", ar: "شاي أخضر", price: 60 },
        { en: "Nescafe", ar: "نسكافيه", price: 50 },
        { en: "Red Tea", ar: "شاي أحمر", price: 50 },
        { en: "Kishri Tea", ar: "شاي كشري", price: 50 }
      ]
    },
    {
      id: "cold-drinks", en: "Cold Drinks", ar: "المشروبات الباردة",
      items: [
        { en: "Fruit Salad Cocktail", ar: "كوكتيل سلطة فواكه", price: 250 },
        { en: "Avocado & Nuts Juice", ar: "عصير أفوكادو بالمكسرات", price: 200 },
        { en: "Orange Juice", ar: "عصير برتقال", price: 200 },
        { en: "Cocktail Juice", ar: "عصير كوكتيل", price: 160 },
        { en: "Pomegranate Juice", ar: "عصير رمان", price: 160 },
        { en: "Strawberry Juice", ar: "عصير فراولة", price: 150 },
        { en: "Watermelon Juice", ar: "عصير بطيخ", price: 120 },
        { en: "Mango Juice", ar: "عصير مانجو", price: 120 },
        { en: "Pineapple Juice", ar: "عصير أناناس", price: 120 },
        { en: "Apple Juice", ar: "عصير تفاح", price: 120 },
        { en: "Lemon Mint Juice", ar: "عصير ليمون نعناع", price: 120 },
        { en: "Banana & Milk Juice", ar: "عصير موز حليب", price: 120 },
        { en: "Lemon Juice", ar: "عصير ليمون", price: 120 },
        { en: "Laban", ar: "لبن", price: 120 },
        { en: "Citrus Soda", ar: "مشروب حمضيات", price: 100 },
        { en: "Dew", ar: "ديو", price: 100 },
        { en: "Soft Drink", ar: "مشروبات غازية", price: 50 },
        { en: "Mineral Water", ar: "مياه معدنية", price: 20 }
      ]
    }
  ]
};
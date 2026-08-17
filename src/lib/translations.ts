export type Language = 'en' | 'ja';

export interface Translations {
  nav: {
    logoSubtitle: string;
    home: string;
    inventory: string;
    about: string;
    process: string;
    contact: string;
    admin: string;
    enquire: string;
  };
  hero: {
    since: string;
    titlePart1: string;
    titlePart2: string;
    titleHighlight: string;
    description: string;
    browseInventory: string;
    facebook: string;
    yearsExporting: string;
    carsDelivered: string;
    auctionAccess: string;
    primaryMarkets: string;
    scroll: string;
  };
  inventorySection: {
    sectionTag: string;
    sectionHeading: string;
    sectionHeadingHighlight: string;
    sectionDescription: string;
    priceApprox: string;
    price: string;
    viewDetails: string;
    sold: string;
    enquire: string;
    currencyDisclaimer: string;
    seeAllVehicles: string;
    auctionGrade: string;
    stock: string;
  };
  about: {
    tag: string;
    heading: string;
    headingHighlight: string;
    p1: string;
    p2: string;
    statUkDelivery: string;
    statUkDeliveryVal: string;
    statCompliance: string;
    statComplianceVal: string;
  };
  process: {
    tag: string;
    heading: string;
    headingHighlight: string;
    description: string;
    steps: Array<{
      n: string;
      title: string;
      body: string;
    }>;
    features: Array<{
      title: string;
      body: string;
    }>;
  };
  testimonials: {
    tag: string;
    heading: string;
    items: Array<{
      car: string;
      quote: string;
      author: string;
      country: string;
      flagCode: string;
      image: string;
    }>;
  };
  contact: {
    tag: string;
    heading: string;
    headingHighlight: string;
    description: string;
    hours: string;
    followFb: string;
    phone: string;
    form: {
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      subject: string;
      subjectPlaceholder: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
      submitting: string;
      toastSuccessTitle: string;
      toastSuccessDesc: string;
      toastErrorTitle: string;
      validationName: string;
      validationEmail: string;
      validationMessage: string;
    };
  };
  inventoryPage: {
    tag: string;
    title: string;
    titleHighlight: string;
    description: string;
    filterBy: string;
    sortBy: string;
    stockAz: string;
    stockZa: string;
    featured: string;
    yearNewest: string;
    yearOldest: string;
    priceSort: string;
    priceHighLow: string;
    priceLowHigh: string;
    dispSort: string;
    dispHighLow: string;
    dispLowHigh: string;
    inStockOnly: string;
    searchPlaceholder: string;
    showing: string;
    vehicles: string;
    noMatch: string;
  };
  vehicleOverlay: {
    price: string;
    year: string;
    mileage: string;
    displacement: string;
    transmission: string;
    color: string;
    repaired: string;
    seating: string;
    grade: string;
    drive: string;
    defaultDesc: string;
    onRequest: string;
    noRepair: string;
    closeMobile: string;
    closeDesktop: string;
    stock: string;
  };
  footer: {
    tagline: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      logoSubtitle: "Est. Japan · British-Owned",
      home: "Home",
      inventory: "Inventory",
      about: "About",
      process: "Process",
      contact: "Contact",
      admin: "Admin",
      enquire: "Enquire",
    },
    hero: {
      since: "Since 1994 · Nagoya, Japan",
      titlePart1: "30+ Years Inside",
      titlePart2: "Japan's Auctions.",
      titleHighlight: "Shipped to your driveway.",
      description: "British-run, Japan-based. We hand-source legendary JDM classics from USS, JU and TAA — translated, inspected and exported to the UK, Australia and beyond.",
      browseInventory: "Browse Inventory",
      facebook: "Facebook",
      yearsExporting: "Years exporting",
      carsDelivered: "Cars delivered",
      auctionAccess: "Auction access",
      primaryMarkets: "Primary markets",
      scroll: "Scroll",
    },
    inventorySection: {
      sectionTag: "Current Inventory",
      sectionHeading: "On the floor",
      sectionHeadingHighlight: "in Nagoya.",
      sectionDescription: "A live, hand-picked selection. Every car personally inspected, with full auction sheets and translated reports available on request.",
      priceApprox: "· Approx",
      price: "Price",
      viewDetails: "View Details",
      sold: "Sold",
      enquire: "Enquire",
      currencyDisclaimer: "*Converted prices are estimates based on daily rates. Final transaction in JPY.",
      seeAllVehicles: "See all vehicles",
      auctionGrade: "Auction Grade",
      stock: "Stock",
    },
    about: {
      tag: "About · Since 1994",
      heading: "A British specialist,",
      headingHighlight: "rooted in Japan.",
      p1: "We've been exporting cars from Japan since 1994. British-owned and based at the auction floor, our access is what three decades of reputation buys: full membership across USS, TAA, CAA, JU and more — and the relationships that get the right car, at the right price, shipped on the right date.",
      p2: "We don't stock a huge yard. We buy to order — because the best cars for our clients rarely sit on forecourts. Every vehicle is supplied with auction report, service history and a landed-cost quote in GBP or AUD. No surprises.",
      statUkDelivery: "UK DELIVERY",
      statUkDeliveryVal: "Full RORO & container",
      statCompliance: "COMPLIANCE",
      statComplianceVal: "Guided end-to-end",
    },
    process: {
      tag: "The Process",
      heading: "From a Tokyo lane",
      headingHighlight: "to your garage.",
      description: "You're not buying off a forecourt. You're hiring 30 years of Japanese-market expertise to find, vet and ship the right car — without the guesswork.",
      steps: [
        {
          n: "01",
          title: "Tell us what you want",
          body: "Send your wish-list — chassis, year, budget. We confirm what's realistic and what to expect on the lanes.",
        },
        {
          n: "02",
          title: "We bid at the auctions",
          body: "Our team is on the floor at USS, JU and TAA every week. Auction sheets translated, every car inspected in person.",
        },
        {
          n: "03",
          title: "Compliance & prep",
          body: "Deregistration, export documents, JEVIC inspection, shipping — handled. You receive weekly photo updates.",
        },
        {
          n: "04",
          title: "Delivered to your door",
          body: "RoRo or container to UK, Australia or your nearest port. We stay with the car until the keys are in your hand.",
        },
      ],
      features: [
        {
          title: "On the ground in Japan",
          body: "Office in Nagoya. We attend auctions in person — no remote middlemen.",
        },
        {
          title: "Translated auction sheets",
          body: "Every grade, every note. You see what we see, in plain English.",
        },
        {
          title: "Door-to-door logistics",
          body: "Compliance, shipping and delivery handled end-to-end.",
        },
      ],
    },
    testimonials: {
      tag: "Client Words",
      heading: "Thirty years of driveways.",
      items: [
        {
          car: "1989 Skyline GT-R",
          quote: '"Seamless. They found a Grade 4.5 R32 that exceeded my expectations. Communication through shipping was top-notch."',
          author: "Marcus Thorne",
          country: "United States",
          flagCode: "us",
          image: "assets/1989-Nissan-GTR-wht.jpg",
        },
        {
          car: "1994 Honda Beat",
          quote: '"My first import. Detailed auction reports and all logistics in Japan handled for me — on the driveway in Manchester without a hitch."',
          author: "Elena Rodriguez",
          country: "United Kingdom",
          flagCode: "gb",
          image: "assets/1994-Honda-Beat-red.jpg",
        },
        {
          car: "2018 WRX STI",
          quote: '"Pristine STI via their auction access. Arrived in Melbourne exactly as described. Professional from first email to delivery."',
          author: "James Chen",
          country: "Australia",
          flagCode: "au",
          image: "assets/2018 Impressa WRX Sti blue.jpg",
        },
      ],
    },
    contact: {
      tag: "Contact Us",
      heading: "Got a car",
      headingHighlight: "in mind?",
      description: "Tell us the chassis code and your budget. We'll come back within 24 hours with what's on the lanes this week.",
      hours: "JST 09:00 — 18:00 · Replies in English",
      followFb: "Follow us on Facebook",
      phone: "+81 (0) 52-XXX-XXXX",
      form: {
        name: "Full Name",
        namePlaceholder: "John Doe",
        email: "Email Address",
        emailPlaceholder: "john@example.com",
        subject: "Interested Vehicle / Subject",
        subjectPlaceholder: "e.g. 1992 Nissan Skyline R32",
        message: "Your Message",
        messagePlaceholder: "Tell us chassis code, budget and timeframe...",
        submit: "Send Enquiry",
        submitting: "Sending...",
        toastSuccessTitle: "Message sent",
        toastSuccessDesc: "We'll reply within 24 hours.",
        toastErrorTitle: "Please check the form",
        validationName: "Name is required",
        validationEmail: "Invalid email",
        validationMessage: "Message is required",
      },
    },
    inventoryPage: {
      tag: "Vehicles",
      title: "Current & Past",
      titleHighlight: "Inventory",
      description: "Hand-picked from USS, JU and TAA auctions across Japan. Every vehicle inspected on the lane. Translated auction sheets available on request.",
      filterBy: "Filter by:",
      sortBy: "Sort By",
      stockAz: "Stock # (A-Z)",
      stockZa: "Stock # (Z-A)",
      featured: "Featured",
      yearNewest: "Year (Newest)",
      yearOldest: "Year (Oldest)",
      priceSort: "Price (Sort)",
      priceHighLow: "Price (High to Low)",
      priceLowHigh: "Price (Low to High)",
      dispSort: "Displacement (Sort)",
      dispHighLow: "Displacement (High to Low)",
      dispLowHigh: "Displacement (Low to High)",
      inStockOnly: "In stock only",
      searchPlaceholder: "Search chassis or model...",
      showing: "Showing",
      vehicles: "vehicles",
      noMatch: "No vehicles match your filters.",
    },
    vehicleOverlay: {
      price: "Price",
      year: "Year",
      mileage: "Mileage",
      displacement: "Displacement",
      transmission: "Transmission",
      color: "Color",
      repaired: "Repaired",
      seating: "Seating",
      grade: "Grade",
      drive: "Drive",
      defaultDesc: "A pristine example of Japanese domestic market engineering. Contact us for the full auction sheet and detailed inspection report.",
      onRequest: "Available on request",
      noRepair: "No repair history",
      closeMobile: "Click [X] to close details",
      closeDesktop: "CLICK [X] OR HIT ESC TO CLOSE DETAILS",
      stock: "Stock",
    },
    footer: {
      tagline: "Nagoya · Japan · British-Owned · Est. 1994",
    },
  },
  ja: {
    nav: {
      logoSubtitle: "1994年創業 · 英国人オーナー直営",
      home: "ホーム",
      inventory: "在庫車両",
      about: "当社について",
      process: "購入の流れ",
      contact: "お問い合わせ",
      admin: "管理者",
      enquire: "お問い合わせ",
    },
    hero: {
      since: "1994年創業 · 愛知県名古屋市",
      titlePart1: "30年以上の実績を誇る",
      titlePart2: "日本オークション直結輸出。",
      titleHighlight: "世界中のお客様のガレージへ。",
      description: "名古屋を拠点とする英国人スペシャリスト。USS、JU、TAAをはじめとする全国の主要オートオークションから選りすぐりの名車・JDMクラシックを直接下見・査定し、イギリス、オーストラリアをはじめ世界各国へ確実に輸出・お届けいたします。",
      browseInventory: "在庫車両を見る",
      facebook: "Facebook",
      yearsExporting: "輸出実績（年）",
      carsDelivered: "累計成約台数",
      auctionAccess: "主要オークション会員",
      primaryMarkets: "主要輸出先国",
      scroll: "スクロール",
    },
    inventorySection: {
      sectionTag: "現地在庫・仕入れ車両",
      sectionHeading: "名古屋ヤード",
      sectionHeadingHighlight: "現地厳選ストック",
      sectionDescription: "専任スタッフが1台ずつ現車確認・査定を行った厳選車両。出品票の日本語・英語解説や詳細な状態確認レポートもご案内いたします。",
      priceApprox: "· 概算",
      price: "参考価格",
      viewDetails: "詳細を見る",
      sold: "売約済",
      enquire: "お問い合わせ",
      currencyDisclaimer: "※外貨換算価格は日次為替レートに基づく参考目安です。最終的なご請求・決済は日本円（JPY）にて行われます。",
      seeAllVehicles: "全ての在庫車両を見る",
      auctionGrade: "評価点",
      stock: "車両ID",
    },
    about: {
      tag: "当社について · 1994年創業",
      heading: "日本に根差した、",
      headingHighlight: "英国人JDMスペシャリスト。",
      p1: "1994年の創業以来、日本全国のオートオークションから世界各地へ高品質なJDMスポーツカー・名車を輸出し続けてきました。名古屋の自社拠点をベースに、USS、TAA、CAA、JUなど全国の主要オークション正規会員資格を保有。30年にわたり培った強固なネットワークと知見により、確かなコンディションの車両を適正価格で仕入れ、確実なスケジュールで手配いたします。",
      p2: "過剰な在庫を持たず、お客様一人ひとりのご要望に応じた「オーダーメイド買い付け」を主軸としています。真に状態の良いクラシックカーは、店頭に並ぶ前のオークション会場で見極める必要があるためです。すべての車両に出品票の正確な解説、整備履歴、現地諸費用を含めた明確なお見積りをご提示いたします。不透明な追加費用は一切ありません。",
      statUkDelivery: "世界各国への海上輸送",
      statUkDeliveryVal: "Ro-Ro船・海上コンテナ便対応",
      statCompliance: "輸出前点検・通関手続き",
      statComplianceVal: "書類作成から登録まで完全サポート",
    },
    process: {
      tag: "ご利用の流れ",
      heading: "オークション会場から",
      headingHighlight: "お客様のガレージまで。",
      description: "単なる中古車販売ではありません。30年にわたる日本市場での専門知識と現場ネットワークを駆使し、お客様にとって理想の1台を確実に仕入れ・お届けします。",
      steps: [
        {
          n: "01",
          title: "ご希望条件のご相談",
          body: "車種、型式、年式、ご予算などのご希望をお知らせください。現在のオークション相場や出品傾向を踏まえ、現実的な買い付けプランをご提案します。",
        },
        {
          n: "02",
          title: "現地オークション下見・応札",
          body: "専任スタッフが毎週USS、JU、TAAなどの会場へ直接足を運び、実車を入念にチェック。出品票の正確な解説とともに状態をご報告します。",
        },
        {
          n: "03",
          title: "輸出前整備・通関手続き",
          body: "一時抹消登録、各種輸出書類の作成、JEVIC等の輸出前検査、船腹の手配まで全て代行。写真付きで随時進捗をご報告します。",
        },
        {
          n: "04",
          title: "指定港・ご自宅への納車",
          body: "イギリス、オーストラリアをはじめ世界各国の主要仕向港へRo-Ro船またはコンテナ便で輸送。お客様の手元に鍵が届くまで責任を持って対応します。",
        },
      ],
      features: [
        {
          title: "日本国内に自社拠点を保有",
          body: "愛知県名古屋市に拠点を構え、会場へ直接足を運ぶため中間マージンや伝言ミスがありません。",
        },
        {
          title: "出品票の正確な解説",
          body: "評価点や展開図の記載事項、特記事項を正確にお伝えし、車両の状態を透明にご説明します。",
        },
        {
          title: "一貫したロジスティクス体制",
          body: "国内陸送、輸出通関、海上輸送から現地での納車までトータルで手配いたします。",
        },
      ],
    },
    testimonials: {
      tag: "お客様の声",
      heading: "30年間にわたり世界中でお届けした名車たち",
      items: [
        {
          car: "1989年式 スカイライン GT-R",
          quote: "「非常にスムーズな取引でした。希望以上の極上コンディション（評価点4.5）のR32を見つけていただき、船積みまでの進捗連絡も迅速で安心できました。」",
          author: "Marcus Thorne",
          country: "アメリカ",
          flagCode: "us",
          image: "assets/1989-Nissan-GTR-wht.jpg",
        },
        {
          car: "1994年式 ホンダ ビート",
          quote: "「初めての個人輸入でしたが、詳細な出品票の解説と日本側での手厚い手続き代行のおかげで、マンチェスターの自宅まで何の問題もなく届きました。」",
          author: "Elena Rodriguez",
          country: "イギリス",
          flagCode: "gb",
          image: "assets/1994-Honda-Beat-red.jpg",
        },
        {
          car: "2018年式 WRX STI",
          quote: "「オークションから極上のSTIを仕入れてもらいました。メルボルンに到着した車両は事前の説明通り完璧な状態。最初のご相談から納車までプロフェッショナルな対応でした。」",
          author: "James Chen",
          country: "オーストラリア",
          flagCode: "au",
          image: "assets/2018 Impressa WRX Sti blue.jpg",
        },
      ],
    },
    contact: {
      tag: "お問い合わせ",
      heading: "お探しの名車や",
      headingHighlight: "ご希望の条件はございますか？",
      description: "希望車種、型式、ご予算などをお気軽にお知らせください。今週のオークション出品予定や相場動向を確認し、24時間以内にご案内いたします。",
      hours: "日本時間 09:00 〜 18:00 · 日本語・英語対応",
      followFb: "Facebook公式ページ",
      phone: "+81 (0) 52-XXX-XXXX",
      form: {
        name: "お名前",
        namePlaceholder: "山田 太郎",
        email: "メールアドレス",
        emailPlaceholder: "info@example.com",
        subject: "ご希望の車種・型式・件名",
        subjectPlaceholder: "例: 1992年式 日産 スカイライン GT-R R32",
        message: "メッセージ内容",
        messagePlaceholder: "型式、年式、ご予算、納車希望時期などをご記入ください...",
        submit: "お問い合わせを送信",
        submitting: "送信中...",
        toastSuccessTitle: "送信完了",
        toastSuccessDesc: "24時間以内にご連絡いたします。",
        toastErrorTitle: "入力内容をご確認ください",
        validationName: "お名前を入力してください",
        validationEmail: "有効なメールアドレスを入力してください",
        validationMessage: "メッセージを入力してください",
      },
    },
    inventoryPage: {
      tag: "車両ラインナップ",
      title: "現地在庫・",
      titleHighlight: "取扱車両一覧",
      description: "USS、JU、TAAなど日本全国のオートオークションから厳選。全車両を会場で直接下見・査定しております。出品票の解説やコンディション確認もお気軽にご相談ください。",
      filterBy: "絞り込み:",
      sortBy: "並び順",
      stockAz: "車両ID (昇順)",
      stockZa: "車両ID (降順)",
      featured: "おすすめ順",
      yearNewest: "年式 (新しい順)",
      yearOldest: "年式 (古い順)",
      priceSort: "価格順",
      priceHighLow: "価格が高い順",
      priceLowHigh: "価格が安い順",
      dispSort: "排気量順",
      dispHighLow: "排気量が多い順",
      dispLowHigh: "排気量が少ない順",
      inStockOnly: "販売中のみ",
      searchPlaceholder: "型式・車種名で検索...",
      showing: "表示中:",
      vehicles: "台",
      noMatch: "条件に一致する車両が見つかりませんでした。",
    },
    vehicleOverlay: {
      price: "参考価格",
      year: "年式",
      mileage: "走行距離",
      displacement: "排気量",
      transmission: "ミッション",
      color: "ボディカラー",
      repaired: "修復歴",
      seating: "乗車定員",
      grade: "評価点",
      drive: "駆動方式",
      defaultDesc: "日本国内で大切に維持されてきた良質なJDMクラシックカーです。出品票の解説や詳細なコンディション確認もお気軽にお問い合わせください。",
      onRequest: "お問い合わせください",
      noRepair: "修復歴なし",
      closeMobile: "[×] をタップして閉じる",
      closeDesktop: "[×] または ESCキーで閉じる",
      stock: "車両ID",
    },
    footer: {
      tagline: "愛知県名古屋市 · 英国人オーナー直営 · 1994年創業",
    },
  },
};

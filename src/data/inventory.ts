import carSkyline from "@/assets/car-skyline.jpg";
import car240z from "@/assets/car-240z.jpg";
import carSupra from "@/assets/car-supra.jpg";
import carRx7 from "@/assets/car-rx7.jpg";
import carAe86 from "@/assets/car-ae86.png";

export const assetMap: Record<string, string> = {
  "car-skyline": carSkyline,
  "car-240z": car240z,
  "car-supra": carSupra,
  "car-rx7": carRx7,
  "car-ae86": carAe86,
};

export const resolveVehicleImage = (imgUrl: string): string => {
  if (!imgUrl) return "";
  
  // 1. Handle absolute URLs and data URIs
  if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://") || imgUrl.startsWith("data:")) {
    return imgUrl;
  }

  // 2. Handle asset map (imported images)
  for (const [key, importedPath] of Object.entries(assetMap)) {
    if (imgUrl.includes(key)) {
      return importedPath;
    }
  }

  // 3. Prevent double-resolving or clean any existing assets/ path to make it dynamic
  const assetsIndex = imgUrl.indexOf("assets/");
  if (assetsIndex !== -1) {
    const relativePath = imgUrl.substring(assetsIndex); // "assets/1999GTR-blue01.jpg"
    
    // Dynamically retrieve base path from window.location
    let base = "/";
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const cleanPath = pathname.endsWith("index.html")
        ? pathname.substring(0, pathname.lastIndexOf("/"))
        : pathname;
      base = cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`;
    }
    return `${base}${relativePath}`;
  }

  return imgUrl;
};

export const resolveVehicleData = (data: any): any => {
  if (!data) return data;
  
  let resolvedImages = data.images && data.images.length > 0 
    ? data.images.map(resolveVehicleImage) 
    : (data.img ? [resolveVehicleImage(data.img)] : []);
  
  if (data.chassis === "BNR34" || data.id === "bnr34-1999" || data.stockNumber === "J.6524") {
    if (resolvedImages.length <= 1 || resolvedImages.some((img: string) => img.includes("car-skyline"))) {
      resolvedImages = [
        "assets/1999GTR-blue01.jpg",
        "assets/1999GTR-blue02.jpg",
        "assets/1999GTR-blue03.jpg",
        "assets/1999GTR-blue04.jpg",
        "assets/1999GTR-blue05.jpg",
        "assets/1999GTR-blue06.jpg",
        "assets/1999GTR-blue07.jpg",
        "assets/1999GTR-blue08.jpg",
        "assets/1999GTR-blue09.jpg",
      ].map(resolveVehicleImage);
    }
  } else if (data.chassis === "S30 240Z" || data.id === "s30-1971" || data.stockNumber === "J.6511") {
    if (resolvedImages.length <= 1 || resolvedImages.some((img: string) => img.includes("car-240z"))) {
      resolvedImages = [
        "assets/1971-240Z01.jpg",
        "assets/1971-240Z02.jpg",
        "assets/1971-240Z03.jpg",
        "assets/1971-240Z04.jpg",
        "assets/1971-240Z05.jpg",
        "assets/1971-240Z06.jpg",
        "assets/1971-240Z07.jpg",
        "assets/1971-240Z08.jpg",
        "assets/1971-240Z09.jpg",
      ].map(resolveVehicleImage);
    }
  } else if (data.chassis === "JZA80 MK4" || data.id === "jza80-1997" || data.stockNumber === "J.6526") {
    if (resolvedImages.length <= 1 || resolvedImages.some((img: string) => img.includes("car-supra"))) {
      resolvedImages = [
        "assets/1997Supra-wht01.jpg",
        "assets/1997Supra-wht02.jpg",
        "assets/1997Supra-wht03.jpg",
        "assets/1997Supra-wht04.jpg",
        "assets/1997Supra-wht05.jpg",
        "assets/1997Supra-wht06.jpg",
        "assets/1997Supra-wht07.jpg",
        "assets/1997Supra-wht08.jpg",
        "assets/1997Supra-wht09.jpg",
      ].map(resolveVehicleImage);
    }
  } else if (data.chassis === "SW20" || data.id === "sw20-1996" || data.stockNumber === "J.6502") {
    if (resolvedImages.length <= 1 || resolvedImages.some((img: string) => img.includes("car-rx7"))) {
      resolvedImages = [
        "assets/1996-ToyotaMR201.jpg",
        "assets/1996-ToyotaMR202.jpg",
        "assets/1996-ToyotaMR203.jpg",
        "assets/1996-ToyotaMR204.jpg",
        "assets/1996-ToyotaMR205.jpg",
      ].map(resolveVehicleImage);
    }
  }

  return {
    ...data,
    img: data.img ? resolveVehicleImage(data.img) : "",
    images: resolvedImages
  };
};

export type VehicleStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export interface Vehicle {
  id: string;
  img: string;
  name: string;
  chassis: string;
  year: number;
  priceJPY: number;
  mileage: string;
  mileageKm: number;
  grade: string;
  transmission: string;
  displacementCc: number;
  displacementLabel: string;
  status: VehicleStatus;
  featured?: boolean;
  stockNumber?: string;
  dateAdded?: string;
  images?: string[];
  description?: string;
  color?: string;
  repaired?: string;
  seatingCapacity?: number;
  driveSystem?: string;
  featuredOrder?: number;
  isVisible?: boolean;
}

export const inventory: Vehicle[] = [
  {
    id: "bnr34-1999",
    img: resolveVehicleImage("assets/1999GTR-blue01.jpg"),
    name: "Nissan Skyline GTR R34 V-Spec II",
    chassis: "BNR34",
    year: 1999,
    priceJPY: 22500000,
    mileage: "42,000 km",
    mileageKm: 42000,
    grade: "Auction Grade 4.5",
    transmission: "MT",
    displacementCc: 2600,
    displacementLabel: "2.6L",
    status: "RESERVED",
    featured: true,
    featuredOrder: 1,
    stockNumber: "J.6524",
    description: "The legendary R34 GT-R V-Spec II in iconic Bayside Blue. This example is in exceptional condition, featuring the carbon fiber hood and upgraded suspension from the factory. A true collector's piece with low mileage and documented service history.",
    color: "Bayside Blue",
    repaired: "No repair history",
    seatingCapacity: 4,
    driveSystem: "AWD",
    images: [
      "assets/1999GTR-blue01.jpg",
      "assets/1999GTR-blue02.jpg",
      "assets/1999GTR-blue03.jpg",
      "assets/1999GTR-blue04.jpg",
      "assets/1999GTR-blue05.jpg",
      "assets/1999GTR-blue06.jpg",
      "assets/1999GTR-blue07.jpg",
      "assets/1999GTR-blue08.jpg",
      "assets/1999GTR-blue09.jpg",
    ].map(resolveVehicleImage)
  },
  {
    id: "s30-1971",
    img: resolveVehicleImage("assets/1971-240Z01.jpg"),
    name: "Nissan Fairlady Z",
    chassis: "S30 240Z",
    year: 1971,
    priceJPY: 8200000,
    mileage: "42,000 km",
    mileageKm: 42000,
    grade: "Auction Grade 4.0",
    transmission: "MT",
    displacementCc: 2400,
    displacementLabel: "2.4L",
    status: "AVAILABLE",
    featured: true,
    featuredOrder: 2,
    stockNumber: "J.6511",
    description: "A beautifully preserved 1971 S30 Fairlady Z. This vehicle features the original L24 engine and has undergone a sympathetic restoration to maintain its period-correct charm. Perfect for the enthusiast looking for a classic JDM driving experience.",
    color: "Maroon",
    repaired: "Fully restored",
    seatingCapacity: 2,
    driveSystem: "RWD",
    images: [
      "assets/1971-240Z01.jpg",
      "assets/1971-240Z02.jpg",
      "assets/1971-240Z03.jpg",
      "assets/1971-240Z04.jpg",
      "assets/1971-240Z05.jpg",
      "assets/1971-240Z06.jpg",
      "assets/1971-240Z07.jpg",
      "assets/1971-240Z08.jpg",
      "assets/1971-240Z09.jpg",
    ].map(resolveVehicleImage)
  },
  {
    id: "jza80-1997",
    img: resolveVehicleImage("assets/1997Supra-wht01.jpg"),
    name: "Toyota Supra RZ Turbo",
    chassis: "JZA80 MK4",
    year: 1997,
    priceJPY: 13900000,
    mileage: "102,500 km",
    mileageKm: 102500,
    grade: "Auction Grade 4.5",
    transmission: "MT",
    displacementCc: 3000,
    displacementLabel: "3.0L",
    status: "AVAILABLE",
    featured: true,
    featuredOrder: 3,
    stockNumber: "J.6526",
    description: "The ultimate 90s JDM icon. This Supra RZ Turbo comes with the legendary 2JZ-GTE engine and 6-speed Getrag manual transmission. Mostly stock with only tasteful reliability upgrades. A rare find in this condition.",
    color: "Super White II",
    repaired: "No repair history",
    seatingCapacity: 4,
    driveSystem: "RWD",
    images: [
      "assets/1997Supra-wht01.jpg",
      "assets/1997Supra-wht02.jpg",
      "assets/1997Supra-wht03.jpg",
      "assets/1997Supra-wht04.jpg",
      "assets/1997Supra-wht05.jpg",
      "assets/1997Supra-wht06.jpg",
      "assets/1997Supra-wht07.jpg",
      "assets/1997Supra-wht08.jpg",
      "assets/1997Supra-wht09.jpg",
    ].map(resolveVehicleImage)
  },
  {
    id: "sw20-1996",
    img: resolveVehicleImage("assets/1996-ToyotaMR201.jpg"),
    name: "Toyota MR2",
    chassis: "SW20",
    year: 1996,
    priceJPY: 2300000,
    mileage: "145,000 km",
    mileageKm: 145000,
    grade: "Auction Grade 4.0",
    transmission: "AT",
    displacementCc: 2000,
    displacementLabel: "2.0L",
    status: "SOLD",
    featured: true,
    featuredOrder: 4,
    stockNumber: "J.6502",
    description: "A fun and engaging mid-engine sports car. This MR2 (SW20) is the naturally aspirated version, offering balanced handling and great reliability. Recently serviced and ready for its next owner.",
    color: "Super Red II",
    repaired: "Minor panel repair",
    seatingCapacity: 2,
    driveSystem: "RWD",
    images: [
      "assets/1996-ToyotaMR201.jpg",
      "assets/1996-ToyotaMR202.jpg",
      "assets/1996-ToyotaMR203.jpg",
      "assets/1996-ToyotaMR204.jpg",
      "assets/1996-ToyotaMR205.jpg",
    ].map(resolveVehicleImage)
  },
  {
    id: "bnr32-1992",
    img: resolveVehicleImage("assets/1989-Nissan-GTR-wht.jpg"),
    name: "Nissan Skyline GT-R",
    chassis: "BNR32",
    year: 1992,
    priceJPY: 11000000,
    mileage: "78,400 km",
    mileageKm: 78400,
    grade: "Auction Grade 4",
    transmission: "5-Speed Manual",
    displacementCc: 2568,
    displacementLabel: "2.6L Twin-Turbo",
    status: "AVAILABLE",
    featured: true,
    stockNumber: "J.6529",
    description: "The BNR32 GT-R that earned the nickname 'Godzilla'. This white example is remarkably well-preserved with low mileage for its age. Features the legendary RB26DETT and ATTESA E-TS AWD system.",
    color: "Crystal White",
    repaired: "No repair history",
    seatingCapacity: 4,
    driveSystem: "AWD",
    images: ["assets/1989-Nissan-GTR-wht.jpg"].map(resolveVehicleImage)
  },
  {
    id: "beat-1994",
    img: resolveVehicleImage("assets/1994-Honda-Beat-red.jpg"),
    name: "Honda Beat",
    chassis: "PP1",
    year: 1994,
    priceJPY: 1250000,
    mileage: "88,200 km",
    mileageKm: 88200,
    grade: "Auction Grade 3.5",
    transmission: "5-Speed Manual",
    displacementCc: 660,
    displacementLabel: "0.66L",
    status: "AVAILABLE",
    featured: false,
    stockNumber: "J.6535",
    description: "A mid-engine, rear-wheel-drive kei sports car. The Honda Beat offers a unique high-revving 3-cylinder engine and incredible handling agility. This Festival Red example is perfect for weekend coastal drives.",
    color: "Festival Red",
    repaired: "No repair history",
    seatingCapacity: 2,
    driveSystem: "RWD",
    images: ["assets/1994-Honda-Beat-red.jpg"].map(resolveVehicleImage)
  },
  {
    id: "wrx-2018",
    img: resolveVehicleImage("assets/2018 Impressa WRX Sti blue.jpg"),
    name: "Subaru WRX STI",
    chassis: "VAB",
    year: 2018,
    priceJPY: 4800000,
    mileage: "52,400 km",
    mileageKm: 52400,
    grade: "Auction Grade 4.5",
    transmission: "6-Speed Manual",
    displacementCc: 2000,
    displacementLabel: "2.0L Turbo",
    status: "AVAILABLE",
    featured: false,
    stockNumber: "J.6540",
    description: "Modern performance meeting rally heritage. This 2018 WRX STI in World Rally Blue offers the raw engagement of a manual gearbox paired with Subaru's symmetrical AWD system. Impeccably maintained condition.",
    color: "World Rally Blue",
    repaired: "No repair history",
    seatingCapacity: 5,
    driveSystem: "AWD",
    images: ["assets/2018 Impressa WRX Sti blue.jpg"].map(resolveVehicleImage)
  },
  {
    id: "ae86-1985",
    img: resolveVehicleImage(carAe86),
    name: "Toyota Sprinter Trueno",
    chassis: "AE86",
    year: 1985,
    priceJPY: 6150000,
    mileage: "143,700 km",
    mileageKm: 143700,
    grade: "Auction Grade 3.5",
    transmission: "5-Speed Manual",
    displacementCc: 1587,
    displacementLabel: "1.6L Inline-4",
    status: "AVAILABLE",
    featured: true,
    stockNumber: "J.6532",
    description: "The legendary Hachi-Roku Trueno. This AE86 features the iconic pop-up headlights and the high-revving 4A-GE engine. Known for its perfect balance and drifting heritage, this example has been maintained to a high standard.",
    color: "White/Black Panda",
    repaired: "Minor panel repair",
    seatingCapacity: 4,
    driveSystem: "RWD",
    images: [resolveVehicleImage(carAe86)]
  },
];

export const statusStyles: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-success/15 text-success border-success/30",
  RESERVED: "bg-primary/15 text-bronze border-primary/40",
  SOLD: "bg-destructive/15 text-destructive border-destructive/40",
};

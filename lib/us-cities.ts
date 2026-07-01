import { cityNames } from "./neighborhoods";

// Cities we currently have real neighborhood data for (the "● live" ones).
export const LIVE_CITIES = new Set(cityNames);

export function hasLiveData(city: string): boolean {
  return LIVE_CITIES.has(city);
}

/**
 * Seed list of major US cities for the type-ahead. This covers essentially any
 * city a demo user would search for. For the full ~19k-place list, run
 * scripts/build-us-cities.mjs (Census gazetteer) and merge its output.
 */
const SEED: string[] = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
  "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC",
  "Boston, MA", "El Paso, TX", "Nashville, TN", "Oklahoma City, OK", "Las Vegas, NV",
  "Detroit, MI", "Portland, OR", "Memphis, TN", "Louisville, KY", "Milwaukee, WI",
  "Baltimore, MD", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Mesa, AZ",
  "Sacramento, CA", "Atlanta, GA", "Kansas City, MO", "Colorado Springs, CO", "Omaha, NE",
  "Raleigh, NC", "Miami, FL", "Long Beach, CA", "Virginia Beach, VA", "Oakland, CA",
  "Minneapolis, MN", "Tulsa, OK", "Tampa, FL", "Arlington, TX", "New Orleans, LA",
  "Wichita, KS", "Cleveland, OH", "Bakersfield, CA", "Aurora, CO", "Anaheim, CA",
  "Honolulu, HI", "Santa Ana, CA", "Riverside, CA", "Corpus Christi, TX", "Lexington, KY",
  "Henderson, NV", "Stockton, CA", "St. Paul, MN", "Cincinnati, OH", "St. Louis, MO",
  "Pittsburgh, PA", "Greensboro, NC", "Lincoln, NE", "Anchorage, AK", "Plano, TX",
  "Orlando, FL", "Irvine, CA", "Newark, NJ", "Durham, NC", "Chula Vista, CA",
  "Toledo, OH", "Fort Wayne, IN", "St. Petersburg, FL", "Laredo, TX", "Jersey City, NJ",
  "Chandler, AZ", "Madison, WI", "Lubbock, TX", "Scottsdale, AZ", "Reno, NV",
  "Buffalo, NY", "Gilbert, AZ", "Glendale, AZ", "North Las Vegas, NV", "Winston-Salem, NC",
  "Chesapeake, VA", "Norfolk, VA", "Fremont, CA", "Garland, TX", "Irving, TX",
  "Hialeah, FL", "Richmond, VA", "Boise, ID", "Spokane, WA", "Baton Rouge, LA",
  "Tacoma, WA", "San Bernardino, CA", "Modesto, CA", "Fontana, CA", "Des Moines, IA",
  "Moreno Valley, CA", "Santa Clarita, CA", "Fayetteville, NC", "Birmingham, AL", "Oxnard, CA",
  "Rochester, NY", "Port St. Lucie, FL", "Grand Rapids, MI", "Huntsville, AL", "Salt Lake City, UT",
  "Frisco, TX", "Yonkers, NY", "Amarillo, TX", "Glendale, CA", "Huntington Beach, CA",
  "McKinney, TX", "Montgomery, AL", "Augusta, GA", "Aurora, IL", "Akron, OH",
  "Little Rock, AR", "Tempe, AZ", "Columbus, GA", "Overland Park, KS", "Grand Prairie, TX",
  "Tallahassee, FL", "Cape Coral, FL", "Mobile, AL", "Knoxville, TN", "Shreveport, LA",
  "Worcester, MA", "Ontario, CA", "Vancouver, WA", "Sioux Falls, SD", "Chattanooga, TN",
  "Brownsville, TX", "Fort Lauderdale, FL", "Providence, RI", "Newport News, VA", "Rancho Cucamonga, CA",
  "Santa Rosa, CA", "Oceanside, CA", "Salem, OR", "Elk Grove, CA", "Garden Grove, CA",
  "Pembroke Pines, FL", "Peoria, AZ", "Eugene, OR", "Corona, CA", "Cary, NC",
  "Springfield, MO", "Fort Collins, CO", "Jackson, MS", "Alexandria, VA", "Hayward, CA",
  "Lancaster, CA", "Lakewood, CO", "Clarksville, TN", "Palmdale, CA", "Salinas, CA",
  "Springfield, MA", "Hollywood, FL", "Pasadena, TX", "Sunnyvale, CA", "Macon, GA",
  "Kansas City, KS", "Pomona, CA", "Escondido, CA", "Killeen, TX", "Naperville, IL",
  "Joliet, IL", "Bellevue, WA", "Rockford, IL", "Savannah, GA", "Paterson, NJ",
  "Torrance, CA", "Bridgeport, CT", "McAllen, TX", "Mesquite, TX", "Syracuse, NY",
  "Midland, TX", "Pasadena, CA", "Murfreesboro, TN", "Miramar, FL", "Dayton, OH",
  "Fullerton, CA", "Orange, CA", "Flint, MI", "Denton, TX", "Roseville, CA",
  "Charleston, SC", "Columbia, SC", "Hartford, CT", "Concord, CA", "Waco, TX",
  "Cedar Rapids, IA", "Elizabeth, NJ", "Gainesville, FL", "Carrollton, TX", "Ann Arbor, MI",
  "Berkeley, CA", "Provo, UT", "Round Rock, TX", "Norman, OK", "Athens, GA",
  "Wilmington, NC", "Boulder, CO", "Asheville, NC", "Sarasota, FL", "Bozeman, MT",
  "Burlington, VT", "Portland, ME", "Manchester, NH", "Fargo, ND", "Cheyenne, WY",
];

// Live-data cities always present; de-duped and alpha-sorted.
export const usCities: string[] = Array.from(
  new Set([...cityNames, ...SEED])
).sort((a, b) => a.localeCompare(b));

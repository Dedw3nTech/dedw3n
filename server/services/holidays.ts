import { db } from "../db";
import { globalHolidays, type InsertGlobalHoliday } from "@shared/schema";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";

interface NagerDateHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

const NAGER_DATE_API_BASE = "https://date.nager.at/api/v3";

const MAJOR_COUNTRIES = [
  "US", "GB", "CA", "AU", "DE", "FR", "ES", "IT", "JP", "CN",
  "IN", "BR", "MX", "RU", "ZA", "NG", "EG", "KE", "SA", "AE",
  "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI", "PL", "CZ",
  "PT", "GR", "TR", "IL", "SG", "MY", "TH", "VN", "ID", "PH",
  "KR", "TW", "HK", "NZ", "AR", "CL", "CO", "PE", "VE", "PK"
];

export class HolidaysService {
  private static cache: Map<string, NagerDateHoliday[]> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000;

  static async fetchHolidaysFromAPI(
    countryCode: string,
    year: number
  ): Promise<NagerDateHoliday[]> {
    const cacheKey = `${countryCode}-${year}`;
    const now = Date.now();

    if (
      this.cache.has(cacheKey) &&
      this.cacheExpiry.get(cacheKey)! > now
    ) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch(
        `${NAGER_DATE_API_BASE}/PublicHolidays/${year}/${countryCode}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[HOLIDAYS] No holidays found for ${countryCode} in ${year}`);
          return [];
        }
        throw new Error(`Nager.Date API error: ${response.status} ${response.statusText}`);
      }

      const holidays: NagerDateHoliday[] = await response.json();

      this.cache.set(cacheKey, holidays);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

      return holidays;
    } catch (error) {
      console.error(`[HOLIDAYS] Error fetching holidays for ${countryCode}:`, error);
      return [];
    }
  }

  static async getAvailableCountries(): Promise<{ countryCode: string; name: string }[]> {
    try {
      const response = await fetch(`${NAGER_DATE_API_BASE}/AvailableCountries`);
      if (!response.ok) {
        throw new Error(`Nager.Date API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("[HOLIDAYS] Error fetching available countries:", error);
      return [];
    }
  }

  static async populateHolidaysForCountry(
    countryCode: string,
    year: number
  ): Promise<number> {
    const holidays = await this.fetchHolidaysFromAPI(countryCode, year);

    if (holidays.length === 0) {
      return 0;
    }

    const holidayRecords: InsertGlobalHoliday[] = holidays.map((holiday) => ({
      date: holiday.date,
      name: holiday.name,
      localName: holiday.localName,
      countryCode: holiday.countryCode,
      fixed: holiday.fixed,
      global: holiday.global,
      counties: holiday.counties || [],
      launchYear: holiday.launchYear,
      types: holiday.types,
    }));

    try {
      await db
        .insert(globalHolidays)
        .values(holidayRecords)
        .onConflictDoNothing({
          target: [
            globalHolidays.date,
            globalHolidays.countryCode,
            globalHolidays.name,
          ],
        });

      console.log(`[HOLIDAYS] Populated ${holidays.length} holidays for ${countryCode} in ${year}`);
      return holidays.length;
    } catch (error) {
      console.error(`[HOLIDAYS] Error storing holidays for ${countryCode}:`, error);
      return 0;
    }
  }

  static async populateHolidaysForMajorCountries(years: number[]): Promise<void> {
    console.log(`[HOLIDAYS] Starting bulk population for ${MAJOR_COUNTRIES.length} countries and ${years.length} years`);

    let totalCount = 0;

    for (const year of years) {
      for (const countryCode of MAJOR_COUNTRIES) {
        const count = await this.populateHolidaysForCountry(countryCode, year);
        totalCount += count;

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`[HOLIDAYS] Completed bulk population: ${totalCount} total holidays stored`);
  }

  static async populateHolidaysForAllCountries(years: number[]): Promise<void> {
    console.log(`[HOLIDAYS] Fetching all available countries from Nager.Date API...`);
    
    const availableCountries = await this.getAvailableCountries();
    
    if (availableCountries.length === 0) {
      console.error('[HOLIDAYS] No countries available from API');
      return;
    }

    console.log(`[HOLIDAYS] Starting comprehensive population for ${availableCountries.length} countries and ${years.length} years`);

    let totalCount = 0;
    let successfulCountries = 0;
    let failedCountries = 0;

    for (const year of years) {
      console.log(`[HOLIDAYS] Processing year ${year}...`);
      
      for (const country of availableCountries) {
        try {
          const count = await this.populateHolidaysForCountry(country.countryCode, year);
          totalCount += count;
          
          if (count > 0) {
            successfulCountries++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`[HOLIDAYS] Failed to populate ${country.name} (${country.countryCode}):`, error);
          failedCountries++;
        }
      }
    }

    console.log(`[HOLIDAYS] ✅ Completed comprehensive population:`);
    console.log(`[HOLIDAYS]    - Total holidays stored: ${totalCount}`);
    console.log(`[HOLIDAYS]    - Successful countries: ${successfulCountries}`);
    console.log(`[HOLIDAYS]    - Failed countries: ${failedCountries}`);
  }

  static async getHolidaysByDateRange(
    startDate: string,
    endDate: string,
    countryCodes?: string[]
  ) {
    try {
      const conditions = [
        gte(globalHolidays.date, startDate),
        lte(globalHolidays.date, endDate)
      ];

      if (countryCodes && countryCodes.length > 0) {
        conditions.push(inArray(globalHolidays.countryCode, countryCodes));
      }

      return await db
        .select()
        .from(globalHolidays)
        .where(and(...conditions));
    } catch (error) {
      console.error("[HOLIDAYS] Error fetching holidays by date range:", error);
      return [];
    }
  }

  static async getHolidaysByCountry(
    countryCode: string,
    year: number
  ) {
    try {
      return await db
        .select()
        .from(globalHolidays)
        .where(
          and(
            eq(globalHolidays.countryCode, countryCode),
            sql`EXTRACT(YEAR FROM ${globalHolidays.date}) = ${year}`
          )
        );
    } catch (error) {
      console.error(`[HOLIDAYS] Error fetching holidays for ${countryCode}:`, error);
      return [];
    }
  }

  static async getStoredCountries() {
    try {
      const result = await db
        .selectDistinct({ countryCode: globalHolidays.countryCode })
        .from(globalHolidays);
      return result.map(r => r.countryCode);
    } catch (error) {
      console.error("[HOLIDAYS] Error fetching stored countries:", error);
      return [];
    }
  }
}

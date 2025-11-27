import { load } from "cheerio";
import { cleanTxt } from "../utils/normalize.js";
import { logger } from "../utils/logger.js";
import axios from "axios";

export interface ScheduleSlot {
  doctor_id: string;
  start_at: string;
  end_at: string | null;
  modality: "online" | "in_person";
}

export interface Treatment {
  name: string;
  price?: number | null;
  currency?: string | null;
  duration_minutes?: number | null;
}

export interface DoctorCard {
  full_name: string;
  specialty: string;
  treatments: Treatment[];
  city: string;
  address: string | null;
  source_profile_url: string;
  schedule_slots: ScheduleSlot[];
  doctor_id: number | null;
  address_id: number | null;
}

export interface ParseResult {
  doctors: DoctorCard[];
  nextPageUrl: string | null;
  finalUrl: string;
}

export async function scrapeListPage(
  url: string
): Promise<{ list: DoctorCard[]; nextPageUrl: string | null; finalUrl: string }> {
  logger.info("[LIST] Url: " + url);

  const response = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = response.data;
  const finalUrl = response.request?.res?.responseUrl || url;

  const $ = load(html);
  const cards = $("div.card.card-shadow-1.mb-1").toArray();

  const list: DoctorCard[] = [];
  const uniqueKeys = new Set<string>(); // evita duplicados
  logger.info("CCCCCCCCCCCCCC", cards.length)
  for (const card of cards) {
    const body = $(card).find("div.card-body.p-0");
    const details = body.find("[data-test-id='result-items-details']");

    // --- IDs ---
    const doctor_id = Number($(card).attr("data-result-id")) || null;
    const address_id = Number($(card).attr("data-address-id")) || null;

    // Evitar tarjetas duplicadas por responsive/duplicación del HTML
    const key = `${doctor_id}-${address_id}`;
    if (uniqueKeys.has(key)) continue;
    uniqueKeys.add(key);

    // --- Datos principales ---
    const full_name = cleanTxt(
      details.find('span[data-tracking-id="result-card-name"]').text()
    );

    const specialty = cleanTxt(
      details.find('span[data-test-id="doctor-specializations"]').text()
    );

    const treatments: Treatment[] = details
      .find("div.d-flex.align-items-center > div.m-0")
      .map((_, el) => ({ name: cleanTxt($(el).text()) }))
      .get();

    const addressText = cleanTxt(
      details
        .find('div.doctor-card-address p[itemprop="availableService"]')
        .text()
    );

    const city = addressText
      ? addressText.split(",").slice(-1)[0].trim()
      : "";

    let profileUrl = details.find("a").attr("href") || "";
    if (!profileUrl.startsWith("http")) {
      profileUrl = "https://www.doctoralia.pe" + profileUrl;
    }

    const schedule_slots: ScheduleSlot[] = [];

    list.push({
      full_name,
      specialty,
      treatments,
      city,
      address: addressText,
      source_profile_url: profileUrl,
      schedule_slots,
      doctor_id,
      address_id,
    });
  }

  const next = $("a[rel='next']").attr("href") || null;
  const nextPageUrl = next ? "https://www.doctoralia.pe" + next : null;

  return { list, nextPageUrl, finalUrl };
}

export async function scrapeDoctoraliaList(
  page: string, pag: number
): Promise<DoctorCard[]> {
  const { list } = await scrapeListPage(page);
  return list;
}

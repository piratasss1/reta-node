import { load, CheerioAPI } from "cheerio";
import { config } from "../config/index";
import { http } from "../http/client";
import { cleanTxt } from "../utils/normalize";
import { logger } from "../utils/logger";

export async function getSpecialtySeeds(): Promise<string[]> {
  const url = `${config.baseUrl}/especialidades-medicas?page=1`;
  logger.info("Loading specialty seeds:", url);
  const { data: html } = await http.get<string>(url);
  const $ = load(html);

  const links = new Set<string>();
  $("a").each((_, a) => {
    const href = $(a).attr("href") || "";
    const text = cleanTxt($(a).text());
    if (!text) return;
    if (href.startsWith("/")) {
      if (href.includes("especialidades") || href.split("/").length <= 3) {
        links.add(config.baseUrl + href);
      }
    }
  });

  return [...links];
}

export async function getServiceSeeds(): Promise<string[]> {
  const url = `${config.baseUrl}/tratamientos-servicios`;
  logger.info("Loading service seeds:", url);
  const { data: html } = await http.get<string>(url);
  const $ = load(html);

  const links = new Set<string>();
  $("a").each((_, a) => {
    const href = $(a).attr("href") || "";
    if (href.startsWith("/tratamientos-servicios/")) {
      links.add(config.baseUrl + href);
    }
  });

  return [...links];
}



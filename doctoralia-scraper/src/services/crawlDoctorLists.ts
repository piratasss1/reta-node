import PQueue from "p-queue";
import { http } from "../http/client";
import { config } from "../config/index";
import { scrapeListPage } from "../parsers/doctorList";
import { persistDoctorBundle } from "./persist";
import { fillSchedules } from "../client/doctorSlotsFetcher";
import { logger } from "../utils/logger";
import { sleep } from "../utils/sleep";

export async function crawlLists(seedUrls: string[]): Promise<void> {
  const queue = new PQueue({ concurrency: config.concurrency });
  for (const seed of seedUrls) queue.add(() => crawlOneSeed(seed));
  await queue.onIdle();
}

async function crawlOneSeed(seedUrl: string): Promise<void> {
  logger.info("Seed:", seedUrl);
  let pageUrl: string | null = seedUrl;
  let page = 1;

  while (pageUrl && page <= config.maxPagesPerSeed) {
    logger.info(`  Page ${page}:`, pageUrl);

    const { list: cards, nextPageUrl, finalUrl } = await scrapeListPage(pageUrl);
    const fullCards = await fillSchedules(cards);

    logger.info(JSON.stringify(fullCards, null, 2));
    logger.info("DOCTORES ENCONTRADOS:", fullCards.length);

    // Si estamos en una página > 1 y la url final es la misma que la seed (o página 1),
    // significa que nos redirigió al inicio -> fin de la paginación.
    if (page > 1 && finalUrl === seedUrl) {
      logger.info("Redirección al inicio detectada. Fin de la paginación.");
      break;
    }

    // Opcional: si la finalUrl no contiene "page=" y estamos en page > 1, también podría ser indicador.
    // Pero la comparación con seedUrl suele ser suficiente si seedUrl es la primera página.

    for (const d of fullCards) await persistDoctorBundle(d);

    if (!nextPageUrl) {
      logger.info("No hay siguiente página. Fin.");
      break;
    }

    pageUrl = nextPageUrl;
    page++;
    await sleep(config.delayMs);
  }
}



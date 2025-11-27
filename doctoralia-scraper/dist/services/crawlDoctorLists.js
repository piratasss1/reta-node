import PQueue from "p-queue";
import { http } from "../http/client";
import { config } from "../config/index";
import { parseDoctorList } from "../parsers/doctorList";
import { persistDoctorBundle } from "./persist";
import { logger } from "../utils/logger";
import { sleep } from "../utils/sleep";
export async function crawlLists(seedUrls) {
    const queue = new PQueue({ concurrency: config.concurrency });
    for (const seed of seedUrls)
        queue.add(() => crawlOneSeed(seed));
    await queue.onIdle();
}
async function crawlOneSeed(seedUrl) {
    logger.info("Seed:", seedUrl);
    let pageUrl = seedUrl;
    let page = 1;
    while (pageUrl && page <= config.maxPagesPerSeed) {
        logger.info(`  Page ${page}:`, pageUrl);
        const { data: html } = await http.get(pageUrl);
        const { doctors, nextPageUrl } = parseDoctorList(html, pageUrl);
        for (const d of doctors)
            await persistDoctorBundle(d);
        pageUrl = nextPageUrl;
        page++;
        await sleep(config.delayMs);
    }
}
//# sourceMappingURL=crawlDoctorLists.js.map
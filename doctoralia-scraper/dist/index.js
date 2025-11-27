import { getSpecialtySeeds, getServiceSeeds } from "./parsers/seeds";
import { crawlLists } from "./services/crawlDoctorLists";
import { logger } from "./utils/logger";
import { prisma } from "./db/prisma";
async function main() {
    logger.info("Starting Doctoralia scraper...");
    const specialtySeeds = await getSpecialtySeeds();
    const serviceSeeds = await getServiceSeeds();
    const seeds = [...new Set([...specialtySeeds, ...serviceSeeds])].slice(0, 1);
    logger.info("Total seeds:", seeds.length);
    logger.info("Finalizar");
    await crawlLists(seeds);
    logger.info("Done!");
}
main()
    .catch(e => {
    logger.error(e);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=index.js.map
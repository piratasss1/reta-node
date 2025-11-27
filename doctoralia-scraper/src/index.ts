import { getSpecialtySeeds, getServiceSeeds } from "./parsers/seeds";

import { crawlLists } from "./services/crawlDoctorLists";
import { logger } from "./utils/logger";
import { prisma } from "./db/prisma";
import { generatePatients } from "./services/generatePatients";


async function main(): Promise<void> {
  logger.info("Starting Doctoralia scraper...");

  const specialtySeeds = await getSpecialtySeeds();
  const serviceSeeds = await getServiceSeeds();
  logger.info("Total seeds:", specialtySeeds.length);
  logger.info("Total seeds:", serviceSeeds.length);
  const seeds = [...new Set([...specialtySeeds, ...serviceSeeds])];
  logger.info("Total seeds:", seeds.length);
  logger.info("Finalizar");

  await generatePatients();
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



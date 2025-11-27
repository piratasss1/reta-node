import { scrapeListPage } from "./parsers/doctorList";
import { logger } from "./utils/logger";

async function verify() {
    const baseUrl = "https://www.doctoralia.pe/alergista";

    logger.info("--- Prueba 1: Página válida (inicio) ---");
    try {
        const result1 = await scrapeListPage(baseUrl);
        logger.info(`Solicitado: ${baseUrl}`);
        logger.info(`Final: ${result1.finalUrl}`);

        if (result1.finalUrl === baseUrl) {
            logger.info("✅ OK: La URL final coincide con la solicitada.");
        } else {
            logger.warn("⚠️ Advertencia: La URL final es diferente (puede ser normal si hay redirección https/www).");
        }
    } catch (e) {
        logger.error("Error en prueba 1:", e);
    }

    logger.info("\n--- Prueba 2: Página inexistente (page=1000) ---");
    const invalidUrl = `${baseUrl}?page=1000`;
    try {
        const result2 = await scrapeListPage(invalidUrl);
        logger.info(`Solicitado: ${invalidUrl}`);
        logger.info(`Final: ${result2.finalUrl}`);

        if (result2.finalUrl === baseUrl || result2.finalUrl === baseUrl + "/") {
            logger.info("✅ OK: Redirección detectada correctamente hacia el inicio.");
        } else {
            logger.error(`❌ FALLO: No se detectó redirección al inicio. Final: ${result2.finalUrl}`);
        }
    } catch (e) {
        logger.error("Error en prueba 2:", e);
    }
}

verify();

import axios from "axios";
import { scrapeListPage } from "./parsers/doctorList";
import { logger } from "./utils/logger";

async function debugSlots() {
    const url = "https://www.doctoralia.pe/alergista";
    logger.info(`Scraping ${url} to find a doctor...`);

    const { list } = await scrapeListPage(url);

    if (list.length === 0) {
        logger.error("No doctors found to test.");
        return;
    }

    const doctor = list[0];
    logger.info(`Testing with doctor: ${doctor.full_name} (ID: ${doctor.doctor_id}, Address ID: ${doctor.address_id})`);

    if (!doctor.doctor_id || !doctor.address_id) {
        logger.error("Doctor missing ID or Address ID.");
        return;
    }

    const apiUrl = `https://www.doctoralia.pe/api/v3/doctors/${doctor.doctor_id}/addresses/${doctor.address_id}/slots`;
    const start = "2025-11-26T00:00:00-05:00";
    const end = "2025-11-30T23:59:59-05:00";

    logger.info(`Fetching slots from: ${apiUrl}`);

    try {
        const response = await axios.get(apiUrl, {
            params: {
                start,
                end,
                "with[]": [
                    "address.nearest_slot_after_end",
                    "slots.address_state",
                    "slot.doctor_id",
                    "slot.address_id",
                    "slot.with_booked",
                ],
                includingSaasOnlyCalendar: false,
            },
            headers: {
                accept: "application/json, text/plain, */*",
                authorization:
                    "Bearer NGU5ZTUwODg5MDE3MjRiNGNhNDY4ZmU0ZjI3YzMwNjEzZGFlZTc5MjhkYWJlZDk2YTYzNDAxYmVlY2ZiZDM0Yw",
                "user-agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            },
        });

        logger.info("--- API Response Status ---");
        logger.info(response.status);

        logger.info("--- API Response Data Keys ---");
        logger.info(Object.keys(response.data));

        if (response.data.data) {
            logger.info("--- response.data.data Keys ---");
            logger.info(Object.keys(response.data.data));

            if (response.data.data.slots) {
                logger.info("--- response.data.data.slots ---");
                logger.info(JSON.stringify(response.data.data.slots, null, 2));
            } else {
                logger.warn("response.data.data.slots is missing!");
            }
        } else {
            logger.warn("response.data.data is missing!");
            logger.info("Full response data:", JSON.stringify(response.data, null, 2));
        }

    } catch (error: any) {
        logger.error("Error fetching slots:", error.message);
        if (error.response) {
            logger.error("Response data:", error.response.data);
        }
    }
}

debugSlots();

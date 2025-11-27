import { fillSchedules } from "./client/doctorSlotsFetcher";
import { DoctorCard } from "./parsers/doctorList";
import { logger } from "./utils/logger";

async function verifySlots() {
    // Mock doctor card with known valid IDs (from previous debug run)
    const mockCard: DoctorCard = {
        full_name: "Dr. Edgar Matos Benavides",
        specialty: "Alergista",
        treatments: [],
        city: "Lima",
        address: "Av. Javier Prado Este 1066, Lima",
        source_profile_url: "https://www.doctoralia.pe/edgar-matos-benavides/alergista/lima",
        schedule_slots: [],
        doctor_id: 3248,
        address_id: 8266,
    };

    logger.info("Testing fillSchedules with mock card...");
    const result = await fillSchedules([mockCard]);
    const filledCard = result[0];

    logger.info(`Slots found: ${filledCard.schedule_slots.length}`);

    if (filledCard.schedule_slots.length > 0) {
        const firstSlot = filledCard.schedule_slots[0];
        logger.info("First slot sample:", JSON.stringify(firstSlot, null, 2));

        if (firstSlot.start_at) {
            logger.info("✅ Success: start_at is populated.");
        } else {
            logger.error("❌ Failure: start_at is undefined.");
        }
    } else {
        logger.error("❌ Failure: Slots are still empty.");
    }
}

verifySlots();

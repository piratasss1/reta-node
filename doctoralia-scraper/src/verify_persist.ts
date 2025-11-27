import { persistDoctorBundle } from "./services/persist";
import { DoctorCard } from "./parsers/doctorList";
import { prisma } from "./db/prisma";
import { logger } from "./utils/logger";

async function verifyPersist() {
    const mockCard: DoctorCard = {
        full_name: "Dr. Test Persistence",
        specialty: "Tester",
        treatments: [{ name: "Test Treatment", price: 100, currency: "PEN" }],
        city: "Lima",
        address: "Test Address 123",
        source_profile_url: "https://www.doctoralia.pe/test-persistence",
        schedule_slots: [
            {
                doctor_id: "99999",
                start_at: "2025-12-01T10:00:00-05:00",
                end_at: null,
                modality: "in_person"
            }
        ],
        doctor_id: 99999,
        address_id: 88888,
    };

    logger.info("Persisting mock doctor...");
    await persistDoctorBundle(mockCard);

    logger.info("Checking database...");
    const doctor = await prisma.doctors.findFirst({
        where: { source_profile_url: mockCard.source_profile_url },
        include: { treatments: true, availability: true }
    });

    if (doctor) {
        logger.info("✅ Doctor found in DB:", doctor.full_name);
        logger.info("Treatments:", doctor.treatments.length);
        logger.info("Availability:", doctor.availability.length);

        if (doctor.treatments.length === 1 && doctor.availability.length === 1) {
            logger.info("✅ Data integrity verified.");
        } else {
            logger.error("❌ Data integrity check failed.");
        }

        // Cleanup
        logger.info("Cleaning up test data...");
        await prisma.doctor_availability.deleteMany({ where: { doctor_id: doctor.id } });
        await prisma.treatments.deleteMany({ where: { doctor_id: doctor.id } });
        await prisma.doctors.delete({ where: { id: doctor.id } });
        logger.info("Cleanup done.");

    } else {
        logger.error("❌ Doctor not found in DB.");
    }
}

verifyPersist();

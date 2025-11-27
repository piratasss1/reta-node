import { prisma } from "../db/prisma";
import { logger } from "../utils/logger";
import { DoctorCard, ScheduleSlot } from "../parsers/doctorList";

type VisitModality = "in_person" | "online";

function buildAvailabilitiesFromSlots(
  doctorId: bigint,
  slots: ScheduleSlot[],
  lastSlotDurationMinutes = 30
) {
  const rows: {
    doctor_id: bigint;
    start_at: Date;
    end_at: Date;
    modality: VisitModality;
  }[] = [];

  for (const slot of slots) {
    if (!slot.start_at) continue;

    const start_at = new Date(slot.start_at);
    let end_at: Date;

    if (slot.end_at) {
      end_at = new Date(slot.end_at);
    } else {
      // Default duration if not provided
      end_at = new Date(start_at.getTime() + lastSlotDurationMinutes * 60_000);
    }

    rows.push({
      doctor_id: doctorId,
      start_at,
      end_at,
      modality: (slot.modality === "online" ? "online" : "in_person") as VisitModality,
    });
  }

  return rows;
}

export async function persistDoctorBundle(d: DoctorCard): Promise<void> {
  const existing = await prisma.doctors.findFirst({
    where: { source_profile_url: d.source_profile_url }
  });

  let doctorRow;

  const doctorData = {
    full_name: d.full_name,
    specialty: d.specialty,
    city: d.city,
    address: d.address,
    // Fields not currently scraped but present in DB
    phone_country_code: null,
    phone_number: null,
    rating: undefined,
    review_count: undefined,
    source_profile_url: d.source_profile_url
  };

  if (!existing) {
    doctorRow = await prisma.doctors.create({
      data: doctorData
    });
    logger.info("    + doctor created:", doctorRow.id, d.full_name);
  } else {
    doctorRow = await prisma.doctors.update({
      where: { id: existing.id },
      data: doctorData
    });
    logger.info("    ~ doctor updated:", doctorRow.id, d.full_name);
  }

  // Persist Treatments
  for (const t of d.treatments || []) {
    if (!t.name) continue;

    await prisma.treatments.upsert({
      where: {
        doctor_id_name: {
          doctor_id: doctorRow.id,
          name: t.name
        }
      },
      create: {
        doctor_id: doctorRow.id,
        name: t.name,
        price: t.price ?? null,
        currency: t.currency ?? null,
        duration_minutes: t.duration_minutes ?? null
      },
      update: {
        price: t.price ?? null,
        currency: t.currency ?? null,
        duration_minutes: t.duration_minutes ?? null
      }
    });
  }

  // Persist Availability
  if (d.schedule_slots && d.schedule_slots.length > 0) {
    // Clean up old availability for this doctor to avoid duplicates/stale data
    // Or we could try to upsert if we had unique IDs for slots, but we don't.
    // Deleting all future availability and re-inserting is a common strategy for scrapers.
    // However, be careful not to delete past appointments if that matters.
    // For now, we'll delete everything for this doctor to keep it simple and consistent with the snapshot.
    await prisma.doctor_availability.deleteMany({
      where: { doctor_id: doctorRow.id }
    });

    const rows = buildAvailabilitiesFromSlots(doctorRow.id, d.schedule_slots);

    if (rows.length > 0) {
      await prisma.doctor_availability.createMany({
        data: rows
      });
      logger.info(`    + availability: ${rows.length} slots saved.`);
    }
  }
}

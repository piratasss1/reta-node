import { prisma } from "../db/prisma";
import { logger } from "../utils/logger";
function parseDayLabelToDate(dayLabel) {
    const today = new Date();
    const lower = dayLabel.toLowerCase();
    if (lower.includes("hoy")) {
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
    if (lower.includes("mañana")) {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const m = dayLabel.match(/(\d{1,2})\s+([A-Za-zñÑáéíóú]+)/);
    if (!m)
        return null;
    const day = Number(m[1]);
    const monthName = m[2].toLowerCase();
    const monthMap = {
        ene: 0, enero: 0,
        feb: 1, febrero: 1,
        mar: 2, marzo: 2,
        abr: 3, abril: 3,
        may: 4, mayo: 4,
        jun: 5, junio: 5,
        jul: 6, julio: 6,
        ago: 7, agosto: 7,
        sep: 8, sept: 8, septiembre: 8,
        oct: 9, octubre: 9,
        nov: 10, noviembre: 10,
        dic: 11, diciembre: 11
    };
    const key = monthName.slice(0, 3); // "Nov" → "nov"
    const month = monthMap[key] ?? monthMap[monthName];
    if (month == null)
        return null;
    const year = today.getFullYear(); // asumes mismo año
    return new Date(year, month, day);
}
function combineDayTime(day, time) {
    const [hh, mm] = time.split(":").map(Number);
    const d = new Date(day);
    d.setHours(hh, mm, 0, 0);
    return d;
}
function buildAvailabilitiesFromSlots(doctorId, slots, lastSlotDurationMinutes = 60) {
    // Agrupar por day_label
    const byDay = new Map();
    for (const s of slots) {
        if (!byDay.has(s.day_label))
            byDay.set(s.day_label, []);
        byDay.get(s.day_label).push(s);
    }
    const rows = [];
    for (const [dayLabel, daySlots] of byDay) {
        const dayDate = parseDayLabelToDate(dayLabel);
        if (!dayDate)
            continue;
        // Ordenar por hora
        daySlots.sort((a, b) => a.time.localeCompare(b.time));
        for (let i = 0; i < daySlots.length; i++) {
            const current = daySlots[i];
            const start_at = combineDayTime(dayDate, current.time);
            let end_at;
            if (i < daySlots.length - 1) {
                const next = daySlots[i + 1];
                end_at = combineDayTime(dayDate, next.time);
            }
            else {
                end_at = new Date(start_at.getTime() + lastSlotDurationMinutes * 60_000);
            }
            rows.push({
                doctor_id: doctorId,
                start_at,
                end_at,
                modality: current.modality
            });
        }
    }
    return rows;
}
export async function persistDoctorBundle(d) {
    const existing = await prisma.doctors.findFirst({
        where: { source_profile_url: d.source_profile_url }
    });
    let doctorRow;
    if (!existing) {
        doctorRow = await prisma.doctors.create({
            data: {
                full_name: d.full_name,
                specialty: d.specialty,
                city: d.city,
                address: d.address,
                phone_country_code: d.phone_country_code,
                phone_number: d.phone_number,
                rating: d.rating ?? undefined,
                review_count: d.review_count ?? undefined,
                source_profile_url: d.source_profile_url
            }
        });
        logger.info("    + doctor created:", doctorRow.id, d.full_name);
    }
    else {
        doctorRow = await prisma.doctors.update({
            where: { id: existing.id },
            data: {
                full_name: d.full_name,
                specialty: d.specialty,
                city: d.city,
                address: d.address,
                phone_country_code: d.phone_country_code,
                phone_number: d.phone_number,
                rating: d.rating ?? undefined,
                review_count: d.review_count ?? undefined
            }
        });
        logger.info("    ~ doctor updated:", doctorRow.id, d.full_name);
    }
    for (const t of d.treatments || []) {
        if (!t.name)
            continue;
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
    if (d.schedule_slots && d.schedule_slots.length > 0) {
        // Opcional: limpiar disponibilidad anterior del doctor
        await prisma.doctor_availability.deleteMany({
            where: { doctor_id: doctorRow.id }
        });
        const rows = buildAvailabilitiesFromSlots(doctorRow.id, d.schedule_slots);
        if (rows.length > 0) {
            await prisma.doctor_availability.createMany({
                data: rows
            });
        }
    }
}
//# sourceMappingURL=persist.js.map
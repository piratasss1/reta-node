import axios from "axios";
import { DoctorCard, ScheduleSlot } from "../parsers/doctorList";
import { logger } from "../utils/logger";

export async function fillSchedules(cards: DoctorCard[]): Promise<DoctorCard[]> {
  const start = "2025-11-26T00:00:00-05:00";
  const end = "2025-11-30T23:59:59-05:00";

  for (const card of cards) {
    try {
      const url = `https://www.doctoralia.pe/api/v3/doctors/${card.doctor_id}/addresses/${card.address_id}/slots`;

      const response = await axios.get(url, {
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

      const rawSlots = response.data?._items;

      // 👉 Manejar caso sin horarios
      if (!Array.isArray(rawSlots) || rawSlots.length === 0) {
        card.schedule_slots = [];
        continue; // Pasar al siguiente doctor sin error
      }
      // logger.info(rawSlots)
      card.schedule_slots = rawSlots.map((slot: any): ScheduleSlot => ({
        doctor_id: slot.doctor_id,
        start_at: slot.start,
        end_at: null,
        modality: slot.type === "online" ? "online" : "in_person",
      }));

    } catch (err) {
      console.error("Error fetching schedule for:", card.full_name);
      // 👉 Evitar que el error bloquee el resto
      card.schedule_slots = [];
    }
  }

  return cards;
}

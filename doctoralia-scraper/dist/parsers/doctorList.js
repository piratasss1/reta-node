import { load } from "cheerio";
import { cleanTxt, toFloat, toInt } from "../utils/normalize";
import { config } from "../config/index";
import { logger } from "../utils/logger";
export function parseDoctorList(html, pageUrl) {
    const $ = load(html);
    const doctors = [];
    const cards = $("[data-qa*='doctor-card'], .card, .doctor-card").toArray();
    for (const el of cards) {
        const card = $(el);
        logger.info("=====> ANTES DE INGRESAR AL FOR ====");
        logger.info("¿Cuántas tarjetas encontró?: " + cards.length);
        const nameEl = card.find("h3 a, h2 a, a[data-qa*='doctor-name']").first();
        const fullName = cleanTxt(nameEl.text());
        const profileHref = nameEl.attr("href") ||
            card.find("a[href*='/doctor/'], a[href*='/medico/']").first().attr("href");
        const profileUrl = profileHref
            ? (profileHref.startsWith("http") ? profileHref : config.baseUrl + profileHref)
            : null;
        if (!fullName || !profileUrl)
            continue;
        const specialty = cleanTxt(card.find("[data-qa*='specialty'], .speciality, .specialty, h4, h5").first().text()) ||
            "No especificado";
        const city = cleanTxt(card.find("[data-qa*='city'], .city, .location, address").first().text()) ||
            "No especificado";
        const address = cleanTxt(card.find("[data-qa*='address'], .address, address").first().text()) || null;
        const ratingText = cleanTxt(card.find("[data-qa*='rating'], .rating").first().text());
        const rating = toFloat(ratingText);
        const reviewsText = cleanTxt(card.find("[data-qa*='reviews'], .reviews").first().text());
        const reviewCount = toInt(reviewsText);
        const phoneText = cleanTxt(card.find("a[href^='tel:']").first().text());
        let phoneCountryCode = null;
        let phoneNumber = null;
        if (phoneText) {
            const m = phoneText.match(/(\+\d{1,3})\s*(.*)/);
            if (m) {
                phoneCountryCode = m[1];
                phoneNumber = cleanTxt(m[2]).replace(/\s/g, "");
            }
            else {
                phoneNumber = phoneText.replace(/\s/g, "");
            }
        }
        logger.info("=====> ANTES DE INGRESAR AL FOR DE TREATMENTS ====");
        const treatments = [];
        card.find("ul li, [data-qa*='treatment'], .treatment").each((_, li) => {
            const t = cleanTxt($(li).text());
            if (t && t.length < 120)
                treatments.push({ name: t });
        });
        logger.info("=====> ANTES DE INGRESAR AL FOR DE TREATMENTS ====");
        const scheduleSlots = [];
        /* ============================================================
           DEBUG – PARA SABER QUÉ HTML REAL ESTÁ LLEGANDO
        ============================================================ */
        logger.info("=== DEBUG CALENDARIO ===");
        logger.info("¿Existe [data-id='search-calendar']?:", card.find("[data-id='search-calendar']").length);
        logger.info("Cantidad .calendar-day:", card.find("[data-id='search-calendar'] .calendar-day").length);
        logger.info("Cantidad .horario-item:", card.find(".horario-item").length);
        /* ============================================================
           CASO 1 — CSS CALENDAR NACIONAL DOCTORALIA/DOCTOLIB
        ============================================================ */
        card.find("[data-id='search-calendar'] .calendar-day").each((_, dayEl) => {
            const dayLabel = cleanTxt($(dayEl).find(".calendar-day-date").text());
            // Determinar si está dentro de una sección "solo online"
            const isOnlineSection = $(dayEl).closest("[data-is-online-only='true']").length > 0;
            $(dayEl).find("button.calendar-slot").each((_, btn) => {
                const slotText = cleanTxt($(btn).text());
                const isPlaceholder = $(btn).hasClass("calendar-slot-placeholder-text") ||
                    slotText === "-" ||
                    !slotText;
                if (isPlaceholder)
                    return;
                const isBooked = $(btn).hasClass("calendar-slot-booked");
                if (isBooked)
                    return;
                scheduleSlots.push({
                    day_label: dayLabel,
                    time: slotText,
                    modality: isOnlineSection ? "online" : "in_person"
                });
            });
        });
        /* ============================================================
           CASO 2 — TARJETAS PERSONALIZADAS ".horario-item"
           (EL QUE MOSTRASTE EN TU IMAGEN)
        ============================================================ */
        if (scheduleSlots.length === 0) {
            logger.info("Usando fallback: .horario-item");
            card.find(".horario-item").each((_, item) => {
                const dayLabel = cleanTxt($(item).find(".dia").text());
                const hourText = cleanTxt($(item).find(".hora").text());
                if (!dayLabel || !hourText)
                    return;
                // Ejemplo: "08:00 - 14:00"
                const [start, end] = hourText.split("-").map(s => cleanTxt(s));
                if (start) {
                    scheduleSlots.push({
                        day_label: dayLabel,
                        time: start,
                        modality: "in_person"
                    });
                }
                if (end) {
                    scheduleSlots.push({
                        day_label: dayLabel,
                        time: end,
                        modality: "in_person"
                    });
                }
            });
        }
        doctors.push({
            full_name: fullName,
            specialty,
            city,
            address,
            phone_country_code: phoneCountryCode,
            phone_number: phoneNumber,
            rating,
            review_count: reviewCount,
            source_profile_url: profileUrl,
            treatments: dedupeTreatments(treatments),
            schedule_slots: scheduleSlots
        });
    }
    return { doctors, nextPageUrl: findNextPage($, pageUrl) };
}
function dedupeTreatments(list) {
    const seen = new Set();
    const out = [];
    for (const t of list) {
        const k = t.name.toLowerCase();
        if (!seen.has(k)) {
            seen.add(k);
            out.push(t);
        }
    }
    return out;
}
function findNextPage($, pageUrl) {
    const next = $("a[rel='next']").attr("href") ||
        $("a:contains('Siguiente')").attr("href") ||
        $("a:contains('Next')").attr("href");
    if (!next)
        return null;
    if (next.startsWith("http"))
        return next;
    if (next.startsWith("/"))
        return config.baseUrl + next;
    const base = new URL(pageUrl);
    return new URL(next, base).toString();
}
//# sourceMappingURL=doctorList.js.map
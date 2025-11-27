interface Treatment {
    name: string;
    price?: number | null;
    currency?: string | null;
    duration_minutes?: number | null;
}
interface ScheduleSlot {
    day_label: string;
    time: string;
    modality: "online" | "in_person";
}
interface Doctor {
    full_name: string;
    specialty: string;
    city: string;
    address: string | null;
    phone_country_code: string | null;
    phone_number: string | null;
    rating: number | null;
    review_count: number | null;
    source_profile_url: string;
    treatments: Treatment[];
    schedule_slots: ScheduleSlot[];
}
interface ParseResult {
    doctors: Doctor[];
    nextPageUrl: string | null;
}
export declare function parseDoctorList(html: string, pageUrl: string): ParseResult;
export {};
//# sourceMappingURL=doctorList.d.ts.map
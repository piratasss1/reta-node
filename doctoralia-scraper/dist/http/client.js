import axios from "axios";
import { config } from "../config/index";
export const http = axios.create({
    headers: {
        "User-Agent": config.userAgent,
        "Accept-Language": "es-PE,es;q=0.9,en;q=0.8"
    },
    timeout: 30000
});
//# sourceMappingURL=client.js.map
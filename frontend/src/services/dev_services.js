import { SendFetchRequest } from "../api/client"

const BASE_URL=import.meta.env.VITE_API_BASE_URL

export async function get_all_user_credentials(dev_key){
    return await SendFetchRequest(
        BASE_URL, "/dev/allUsers",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Dev-Key":dev_key,
            }
        }
    )
}
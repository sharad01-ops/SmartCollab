import { SendFetchRequest } from "../api/client"


export async function get_all_user_credentials(dev_key){
    return await SendFetchRequest(
        "/dev/allUsers",
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
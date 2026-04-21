import { FetchRequest } from "../api/client";
import { translate, MessageArray_translate } from "./translation_service";

const BASE_URL=import.meta.env.VITE_API_BASE_URL

function sleep(ms) {
    console.log("sleeping")
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function get_channel_messages(communityId, channelId) {

    const data= await FetchRequest(
            BASE_URL, `/channels/${communityId}/${channelId}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
    
    return data
    
}


export async function search_channels(communityId, sub_str) {

    return await FetchRequest(
            BASE_URL, `/channels/${communityId}/search`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sub_str: sub_str })
            }
        )
}



export async function create_channel(communityId, name) {

    return await FetchRequest(
            BASE_URL, `/channels/${communityId}/create`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ channel_name: name })
            }
        )
}

export async function leave_channel(communityId, channelId) {

    return await FetchRequest(
            BASE_URL, `/channels/${communityId}/${channelId}/leave`,
            {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}


export async function join_channel(communityId, channelId) {

    return await FetchRequest(
            BASE_URL, `/channels/${communityId}/${channelId}/join`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}

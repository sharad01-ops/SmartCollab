import { FetchRequest } from "../api/client";

function sleep(ms) {
    console.log("sleeping")
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function get_channel_messages(communityId, channelId) {

    return await FetchRequest(
            `/channels/${communityId}/${channelId}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}


export async function search_channels(communityId, sub_str) {

    return await FetchRequest(
            `/channels/${communityId}/search`,
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
            `/channels/${communityId}/create`,
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
            `/channels/${communityId}/${channelId}/leave`,
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
            `/channels/${communityId}/${channelId}/join`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}

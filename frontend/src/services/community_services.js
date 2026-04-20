import { FetchRequest } from "../api/client";

const BASE_URL=import.meta.env.VITE_API_BASE_URL

function sleep(ms) {
    console.log("sleeping")

    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function get_community_channels(community_id){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            BASE_URL, `/communities/${community_id}/channels`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}



export async function search_communities(sub_str){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            BASE_URL, `/communities/search`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sub_str: `${sub_str}` }),
            }
        )
}



export async function create_community(name){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            BASE_URL, `/communities/create`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ community_name: name }),
            }
        )
}

export async function leave_community(community_id){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            BASE_URL, `/communities/${community_id}/leave`,
            {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}

export async function join_community(community_id){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            BASE_URL, `/communities/${community_id}/join`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}